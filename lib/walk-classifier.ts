import { WOOSOX_TEAM_ID } from "./constants";
import type { LiveFeed, LivePlay, PlayEvent } from "./mlb-api";
import type { WalkClassification } from "./types";

const BALL_CODES = new Set(["B", "*B", "BD", "BI", "BP", "IB", "PO", "VB"]);

function isBall(event: PlayEvent): boolean {
  if (event.details?.isBall === true) return true;
  const code = event.details?.call?.code;
  return code ? BALL_CODES.has(code) : false;
}

function pitchOnly(events: PlayEvent[]): PlayEvent[] {
  return events.filter((e) => e.isPitch === true);
}

function teamPitchingInHalf(
  feed: LiveFeed,
  halfInning: "top" | "bottom",
): number {
  return halfInning === "top" ? feed.homeTeamId : feed.awayTeamId;
}

function reached0_2(events: PlayEvent[]): boolean {
  const pitches = pitchOnly(events);
  let balls = 0;
  let strikes = 0;
  for (const p of pitches) {
    if (isBall(p)) {
      balls += 1;
    } else {
      strikes = Math.min(2, strikes + 1);
    }
    if (balls === 0 && strikes === 2) return true;
  }
  return false;
}

function isFourPitchWalk(play: LivePlay): boolean {
  const pitches = pitchOnly(play.playEvents);
  if (pitches.length !== 4) return false;
  return pitches.every(isBall);
}

function outsAtStart(play: LivePlay): number {
  const pitches = pitchOnly(play.playEvents);
  const first = pitches[0];
  if (first?.count) return first.count.outs;
  return play.count.outs;
}

export function classifyWooSoxWalks(
  feed: LiveFeed,
  gameDate: string,
): WalkClassification[] {
  const results: WalkClassification[] = [];
  const seenHalfInnings = new Set<string>();
  const firstPlayInHalf = new Map<string, number>();

  const playsSorted = [...feed.plays].sort(
    (a, b) => a.about.atBatIndex - b.about.atBatIndex,
  );

  for (const play of playsSorted) {
    const halfKey = `${play.about.inning}-${play.about.halfInning}`;
    if (!seenHalfInnings.has(halfKey)) {
      seenHalfInnings.add(halfKey);
      firstPlayInHalf.set(halfKey, play.about.atBatIndex);
    }
  }

  for (const play of playsSorted) {
    if (play.result.eventType !== "walk") continue;

    const pitchingTeamId = teamPitchingInHalf(feed, play.about.halfInning);
    if (pitchingTeamId !== WOOSOX_TEAM_ID) continue;

    const halfKey = `${play.about.inning}-${play.about.halfInning}`;
    const isLeadoff = firstPlayInHalf.get(halfKey) === play.about.atBatIndex;
    const startOuts = outsAtStart(play);

    results.push({
      pitcherId: play.matchup.pitcher.id,
      pitcherName: play.matchup.pitcher.fullName,
      date: gameDate,
      inning: play.about.inning,
      halfInning: play.about.halfInning,
      batterName: play.matchup.batter.fullName,
      finalCount: {
        balls: play.count.balls,
        strikes: play.count.strikes,
      },
      isFourPitch: isFourPitchWalk(play),
      isOhTwo: reached0_2(play.playEvents),
      isLeadoff,
      isTwoOut: startOuts === 2,
    });
  }

  return results;
}
