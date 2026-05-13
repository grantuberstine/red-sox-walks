import { WOOSOX_TEAM_ID } from "./constants";
import type { LiveFeed, LivePlay, PlayEvent } from "./mlb-api";
import type { WalkClassification } from "./types";

function teamPitchingInHalf(
  feed: LiveFeed,
  halfInning: "top" | "bottom",
): number {
  return halfInning === "top" ? feed.homeTeamId : feed.awayTeamId;
}

function reached0_2(events: PlayEvent[]): boolean {
  for (const ev of events) {
    if (ev.count?.balls === 0 && ev.count?.strikes === 2) return true;
  }
  return false;
}

function outsAtStart(play: LivePlay): number {
  const firstPitch = (play.playEvents ?? []).find((e) => e.isPitch);
  if (firstPitch?.count) return firstPitch.count.outs;
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
    const pitches = (play.playEvents ?? []).filter((e) => e.isPitch).length;

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
      pitchesInPA: pitches,
      isFourPitch: play.count.strikes === 0,
      isOhTwo: reached0_2(play.playEvents ?? []),
      isLeadoff,
      isTwoOut: startOuts === 2,
    });
  }

  return results;
}
