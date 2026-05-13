import { WOOSOX_TEAM_ID } from "./constants";
import type { LiveFeed, LivePlay, PlayEvent } from "./mlb-api";
import type { StrikeoutClassification, WalkClassification } from "./types";

const STRIKEOUT_EVENTS = new Set(["strikeout", "strikeout_double_play"]);

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

function pitchCount(play: LivePlay): number {
  return (play.playEvents ?? []).filter((e) => e.isPitch).length;
}

export type Classified = {
  walks: WalkClassification[];
  strikeouts: StrikeoutClassification[];
  outsByPitcher: Record<number, number>;
};

export function classifyWooSoxEvents(
  feed: LiveFeed,
  gameDate: string,
): Classified {
  const walks: WalkClassification[] = [];
  const strikeouts: StrikeoutClassification[] = [];
  const outsByPitcher: Record<number, number> = {};

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

  type PlayMeta = { play: LivePlay; outsAdded: number };
  const playsByHalf = new Map<string, PlayMeta[]>();
  let prevOuts = 0;
  let prevHalfKey: string | null = null;

  for (const play of playsSorted) {
    const halfKey = `${play.about.inning}-${play.about.halfInning}`;
    if (halfKey !== prevHalfKey) {
      prevOuts = 0;
      prevHalfKey = halfKey;
    }
    const outsAdded = Math.max(0, play.count.outs - prevOuts);
    if (!playsByHalf.has(halfKey)) playsByHalf.set(halfKey, []);
    playsByHalf.get(halfKey)!.push({ play, outsAdded });

    const pitchingTeamId = teamPitchingInHalf(feed, play.about.halfInning);
    if (pitchingTeamId === WOOSOX_TEAM_ID && outsAdded > 0) {
      const pid = play.matchup.pitcher.id;
      outsByPitcher[pid] = (outsByPitcher[pid] ?? 0) + outsAdded;
    }

    prevOuts = play.count.outs;
  }

  const sidePitcherByHalf = new Map<string, number>();
  for (const [halfKey, plays] of playsByHalf) {
    if (plays.length !== 3) continue;
    const pitcher = plays[0].play.matchup.pitcher.id;
    const sameP = plays.every((p) => p.play.matchup.pitcher.id === pitcher);
    if (!sameP) continue;
    const allK = plays.every((p) => p.play.result.eventType === "strikeout");
    if (!allK) continue;
    sidePitcherByHalf.set(halfKey, pitcher);
  }

  for (const play of playsSorted) {
    const pitchingTeamId = teamPitchingInHalf(feed, play.about.halfInning);
    if (pitchingTeamId !== WOOSOX_TEAM_ID) continue;

    const evType = play.result.eventType;
    const halfKey = `${play.about.inning}-${play.about.halfInning}`;

    if (evType === "walk") {
      const isLeadoff = firstPlayInHalf.get(halfKey) === play.about.atBatIndex;
      const startOuts = outsAtStart(play);
      walks.push({
        pitcherId: play.matchup.pitcher.id,
        pitcherName: play.matchup.pitcher.fullName,
        date: gameDate,
        inning: play.about.inning,
        halfInning: play.about.halfInning,
        batterName: play.matchup.batter.fullName,
        finalCount: { balls: play.count.balls, strikes: play.count.strikes },
        pitchesInPA: pitchCount(play),
        isFourPitch: play.count.strikes === 0,
        isOhTwo: reached0_2(play.playEvents ?? []),
        isLeadoff,
        isTwoOut: startOuts === 2,
      });
    } else if (STRIKEOUT_EVENTS.has(evType ?? "")) {
      const pitches = pitchCount(play);
      const isThreePitch = pitches === 3 && play.count.balls === 0;
      const sideOwner = sidePitcherByHalf.get(halfKey);
      const isSide = sideOwner === play.matchup.pitcher.id;
      strikeouts.push({
        pitcherId: play.matchup.pitcher.id,
        pitcherName: play.matchup.pitcher.fullName,
        date: gameDate,
        inning: play.about.inning,
        halfInning: play.about.halfInning,
        batterName: play.matchup.batter.fullName,
        pitchesInPA: pitches,
        isThreePitch,
        isSide,
      });
    }
  }

  return { walks, strikeouts, outsByPitcher };
}

export function classifyWooSoxWalks(
  feed: LiveFeed,
  gameDate: string,
): WalkClassification[] {
  return classifyWooSoxEvents(feed, gameDate).walks;
}
