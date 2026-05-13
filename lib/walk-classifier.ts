import { WOOSOX_TEAM_ID } from "./constants";
import type { LiveFeed, LivePlay, PlayEvent } from "./mlb-api";
import type {
  AppearanceVelo,
  PitchTypeStats,
  StrikeoutClassification,
  WalkClassification,
} from "./types";

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

const OCCUPIED_BASES = new Set(["1B", "2B", "3B"]);

function basesEmptyBeforePlay(play: LivePlay): boolean {
  for (const r of play.runners ?? []) {
    const start = r.movement?.start;
    if (start && OCCUPIED_BASES.has(start)) return false;
  }
  return true;
}

export type Classified = {
  walks: WalkClassification[];
  strikeouts: StrikeoutClassification[];
  outsByPitcher: Record<number, number>;
  veloByPitcher: Record<number, AppearanceVeloPartial>;
};

export type AppearanceVeloPartial = Omit<AppearanceVelo, "gamePk" | "date" | "opponent">;

export function classifyWooSoxEvents(
  feed: LiveFeed,
  gameDate: string,
): Classified {
  const walks: WalkClassification[] = [];
  const strikeouts: StrikeoutClassification[] = [];
  const outsByPitcher: Record<number, number> = {};
  const veloRaw: Record<
    number,
    { all: number[]; byType: Map<string, number[]> }
  > = {};

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
    if (pitchingTeamId === WOOSOX_TEAM_ID) {
      const pid = play.matchup.pitcher.id;
      if (outsAdded > 0) {
        outsByPitcher[pid] = (outsByPitcher[pid] ?? 0) + outsAdded;
      }
      if (!veloRaw[pid]) veloRaw[pid] = { all: [], byType: new Map() };
      const bucket = veloRaw[pid];
      for (const ev of play.playEvents ?? []) {
        if (!ev.isPitch) continue;
        const v = ev.pitchData?.startSpeed;
        if (typeof v !== "number" || !Number.isFinite(v)) continue;
        bucket.all.push(v);
        const t = ev.details?.type?.code ?? "??";
        if (!bucket.byType.has(t)) bucket.byType.set(t, []);
        bucket.byType.get(t)!.push(v);
      }
    }

    prevOuts = play.count.outs;
  }

  const veloByPitcher: Record<number, AppearanceVeloPartial> = {};
  for (const [pidStr, bucket] of Object.entries(veloRaw)) {
    const pid = Number(pidStr);
    if (bucket.all.length === 0) continue;
    const avg = bucket.all.reduce((s, n) => s + n, 0) / bucket.all.length;
    const max = Math.max(...bucket.all);
    const byType: PitchTypeStats[] = [];
    for (const [type, arr] of bucket.byType) {
      const tAvg = arr.reduce((s, n) => s + n, 0) / arr.length;
      const tMax = Math.max(...arr);
      byType.push({
        type,
        count: arr.length,
        avgVelo: Number(tAvg.toFixed(2)),
        maxVelo: Number(tMax.toFixed(2)),
      });
    }
    byType.sort((a, b) => b.count - a.count);
    veloByPitcher[pid] = {
      pitchCount: bucket.all.length,
      avgVelo: Number(avg.toFixed(2)),
      maxVelo: Number(max.toFixed(2)),
      byType,
    };
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
      const isTwoOut =
        outsAtStart(play) === 2 && basesEmptyBeforePlay(play);
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
        isTwoOut,
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

  return { walks, strikeouts, outsByPitcher, veloByPitcher };
}

export function classifyWooSoxWalks(
  feed: LiveFeed,
  gameDate: string,
): WalkClassification[] {
  return classifyWooSoxEvents(feed, gameDate).walks;
}
