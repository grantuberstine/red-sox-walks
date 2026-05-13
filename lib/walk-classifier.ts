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
};

export function classifyWooSoxEvents(
  feed: LiveFeed,
  gameDate: string,
): Classified {
  const walks: WalkClassification[] = [];
  const strikeouts: StrikeoutClassification[] = [];

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

  type HalfStat = {
    pitcherIds: Set<number>;
    kByPitcher: Map<number, number[]>;
    nonKOuts: number;
    finalOuts: number;
  };
  const halfStats = new Map<string, HalfStat>();

  let prevOuts = -1;
  let prevHalfKey: string | null = null;

  for (const play of playsSorted) {
    const halfKey = `${play.about.inning}-${play.about.halfInning}`;
    if (halfKey !== prevHalfKey) {
      prevOuts = 0;
      prevHalfKey = halfKey;
    }
    const outsAtEnd = play.count.outs;
    const outsAdded = Math.max(0, outsAtEnd - prevOuts);

    let stat = halfStats.get(halfKey);
    if (!stat) {
      stat = {
        pitcherIds: new Set(),
        kByPitcher: new Map(),
        nonKOuts: 0,
        finalOuts: 0,
      };
      halfStats.set(halfKey, stat);
    }
    stat.pitcherIds.add(play.matchup.pitcher.id);

    const evType = play.result.eventType;
    if (STRIKEOUT_EVENTS.has(evType ?? "")) {
      if (!stat.kByPitcher.has(play.matchup.pitcher.id)) {
        stat.kByPitcher.set(play.matchup.pitcher.id, []);
      }
      stat.kByPitcher.get(play.matchup.pitcher.id)!.push(play.about.atBatIndex);
      if (evType === "strikeout_double_play") {
        stat.nonKOuts += Math.max(0, outsAdded - 1);
      }
    } else if (outsAdded > 0) {
      stat.nonKOuts += outsAdded;
    }

    stat.finalOuts = outsAtEnd;
    prevOuts = outsAtEnd;
  }

  const sidePitcherByHalf = new Map<string, number>();
  for (const [key, stat] of halfStats) {
    for (const [pid, ks] of stat.kByPitcher) {
      if (ks.length === 3 && stat.nonKOuts === 0) {
        sidePitcherByHalf.set(key, pid);
      }
    }
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
        finalCount: {
          balls: play.count.balls,
          strikes: play.count.strikes,
        },
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

  return { walks, strikeouts };
}

export function classifyWooSoxWalks(
  feed: LiveFeed,
  gameDate: string,
): WalkClassification[] {
  return classifyWooSoxEvents(feed, gameDate).walks;
}
