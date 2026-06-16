import type {
  GameSummary,
  PitcherStats,
  SeasonState,
  StrikeoutRecord,
  StrikeoutType,
  WalkRecord,
  WalkType,
} from "./types";
import { headshotUrl } from "./achievements";

export type RangeKey = "today" | "week" | "month" | "season";
export type WalkCategoryFilter = "all" | WalkType;
export type StrikeoutCategoryFilter = "all" | StrikeoutType;

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Last game",
  week: "Last 7 days",
  month: "Last 30 days",
  season: "Season",
};

function addDays(yyyymmdd: string, days: number): string {
  const d = new Date(yyyymmdd + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function rangeBounds(
  range: RangeKey,
  state: Pick<SeasonState, "walks" | "strikeouts" | "meta">,
): { start: string | null; end: string | null } {
  const latest =
    state.meta.lastGameDate ??
    state.walks[0]?.date ??
    state.strikeouts[0]?.date ??
    new Date().toISOString().slice(0, 10);

  // "Last game" anchors to the most recent game (so off-days don't show empty).
  // "Last 7/30 days" are calendar-relative to today, matching their labels.
  const today = new Date().toISOString().slice(0, 10);

  switch (range) {
    case "today":
      return { start: latest, end: latest };
    case "week":
      return { start: addDays(today, -6), end: today };
    case "month":
      return { start: addDays(today, -29), end: today };
    case "season":
    default:
      return { start: null, end: null };
  }
}

export function filterWalks(
  walks: WalkRecord[],
  range: RangeKey,
  state: Pick<SeasonState, "walks" | "strikeouts" | "meta">,
  query = "",
  category: WalkCategoryFilter = "all",
  hiddenIds: Set<number> = new Set(),
): WalkRecord[] {
  const { start, end } = rangeBounds(range, state);
  const q = query.trim().toLowerCase();
  return walks.filter((w) => {
    if (hiddenIds.has(w.pitcherId)) return false;
    if (start && w.date < start) return false;
    if (end && w.date > end) return false;
    if (q) {
      const matches =
        w.pitcherName.toLowerCase().includes(q) ||
        w.batterName.toLowerCase().includes(q) ||
        w.opponent.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (category !== "all" && !w.tags.includes(category)) return false;
    return true;
  });
}

export function filterStrikeouts(
  strikeouts: StrikeoutRecord[],
  range: RangeKey,
  state: Pick<SeasonState, "walks" | "strikeouts" | "meta">,
  query = "",
  category: StrikeoutCategoryFilter = "all",
  hiddenIds: Set<number> = new Set(),
): StrikeoutRecord[] {
  const { start, end } = rangeBounds(range, state);
  const q = query.trim().toLowerCase();
  return strikeouts.filter((s) => {
    if (hiddenIds.has(s.pitcherId)) return false;
    if (start && s.date < start) return false;
    if (end && s.date > end) return false;
    if (q) {
      const matches =
        s.pitcherName.toLowerCase().includes(q) ||
        s.batterName.toLowerCase().includes(q) ||
        s.opponent.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (category !== "all" && !s.tags.includes(category)) return false;
    return true;
  });
}

export function filterGames(
  games: GameSummary[],
  range: RangeKey,
  state: Pick<SeasonState, "walks" | "strikeouts" | "meta">,
): GameSummary[] {
  const { start, end } = rangeBounds(range, state);
  return games.filter((g) => {
    if (start && g.date < start) return false;
    if (end && g.date > end) return false;
    return true;
  });
}

type PitcherMetaMap = Record<
  string,
  Pick<
    PitcherStats,
    "pitcherId" | "name" | "headshotUrl" | "achievements" | "outsRecorded"
  >
>;

export function aggregatePitchersFromWalks(
  walks: WalkRecord[],
  meta: PitcherMetaMap,
): PitcherStats[] {
  const map = new Map<number, PitcherStats>();
  const datesByPitcher = new Map<number, Set<string>>();

  const ensure = (id: number, name: string): PitcherStats => {
    const existing = map.get(id);
    if (existing) return existing;
    const base = meta[String(id)];
    const fresh: PitcherStats = {
      pitcherId: id,
      name: base?.name ?? name,
      headshotUrl: base?.headshotUrl ?? headshotUrl(id),
      appearances: 0,
      outsRecorded: base?.outsRecorded ?? 0,
      totalWalks: 0,
      fourPitchWalks: 0,
      ohTwoWalks: 0,
      leadoffWalks: 0,
      twoOutWalks: 0,
      totalStrikeouts: 0,
      threePitchStrikeouts: 0,
      sideStrikeouts: 0,
      lastWalkDate: null,
      lastStrikeoutDate: null,
      achievements: base?.achievements ?? [],
    };
    map.set(id, fresh);
    return fresh;
  };

  for (const w of walks) {
    const p = ensure(w.pitcherId, w.pitcherName);
    p.totalWalks += 1;
    if (w.tags.includes("fourPitch")) p.fourPitchWalks += 1;
    if (w.tags.includes("ohTwo")) p.ohTwoWalks += 1;
    if (w.tags.includes("leadoff")) p.leadoffWalks += 1;
    if (w.tags.includes("twoOut")) p.twoOutWalks += 1;
    if (!p.lastWalkDate || w.date > p.lastWalkDate) p.lastWalkDate = w.date;
    if (!datesByPitcher.has(w.pitcherId)) datesByPitcher.set(w.pitcherId, new Set());
    datesByPitcher.get(w.pitcherId)!.add(w.date);
  }

  for (const [id, dates] of datesByPitcher) {
    const p = map.get(id);
    if (p) p.appearances = dates.size;
  }

  return [...map.values()];
}

export function aggregatePitchersFromStrikeouts(
  strikeouts: StrikeoutRecord[],
  meta: PitcherMetaMap,
): PitcherStats[] {
  const map = new Map<number, PitcherStats>();
  const datesByPitcher = new Map<number, Set<string>>();
  const sideInningsByPitcher = new Map<number, Set<string>>();

  const ensure = (id: number, name: string): PitcherStats => {
    const existing = map.get(id);
    if (existing) return existing;
    const base = meta[String(id)];
    const fresh: PitcherStats = {
      pitcherId: id,
      name: base?.name ?? name,
      headshotUrl: base?.headshotUrl ?? headshotUrl(id),
      appearances: 0,
      outsRecorded: base?.outsRecorded ?? 0,
      totalWalks: 0,
      fourPitchWalks: 0,
      ohTwoWalks: 0,
      leadoffWalks: 0,
      twoOutWalks: 0,
      totalStrikeouts: 0,
      threePitchStrikeouts: 0,
      sideStrikeouts: 0,
      lastWalkDate: null,
      lastStrikeoutDate: null,
      achievements: base?.achievements ?? [],
    };
    map.set(id, fresh);
    return fresh;
  };

  for (const s of strikeouts) {
    const p = ensure(s.pitcherId, s.pitcherName);
    p.totalStrikeouts += 1;
    if (s.tags.includes("threePitch")) p.threePitchStrikeouts += 1;
    if (s.tags.includes("side")) {
      const key = `${s.gamePk}-${s.inning}-${s.halfInning}`;
      if (!sideInningsByPitcher.has(s.pitcherId)) {
        sideInningsByPitcher.set(s.pitcherId, new Set());
      }
      sideInningsByPitcher.get(s.pitcherId)!.add(key);
    }
    if (!p.lastStrikeoutDate || s.date > p.lastStrikeoutDate) p.lastStrikeoutDate = s.date;
    if (!datesByPitcher.has(s.pitcherId)) datesByPitcher.set(s.pitcherId, new Set());
    datesByPitcher.get(s.pitcherId)!.add(s.date);
  }

  for (const [id, dates] of datesByPitcher) {
    const p = map.get(id);
    if (p) p.appearances = dates.size;
  }
  for (const [id, innings] of sideInningsByPitcher) {
    const p = map.get(id);
    if (p) p.sideStrikeouts = innings.size;
  }

  return [...map.values()];
}


export type Insights = {
  bestGame: { date: string; opponent: string; count: number; gamePk: number } | null;
  topVictim: { name: string; count: number } | null;
  topOpponent: { name: string; count: number } | null;
  byInning: Array<{ inning: number; count: number }>;
  byGame: Array<{ date: string; opponent: string; count: number; gamePk: number }>;
};

type EventLike = {
  gamePk: number;
  date: string;
  opponent: string;
  batterName: string;
  inning: number;
};

export function computeInsights(events: EventLike[]): Insights {
  const byGame = new Map<number, { date: string; opponent: string; count: number }>();
  const byBatter = new Map<string, number>();
  const byOpponent = new Map<string, number>();
  const byInning = new Map<number, number>();

  for (const e of events) {
    const g = byGame.get(e.gamePk);
    if (g) g.count += 1;
    else byGame.set(e.gamePk, { date: e.date, opponent: e.opponent, count: 1 });
    byBatter.set(e.batterName, (byBatter.get(e.batterName) ?? 0) + 1);
    byOpponent.set(e.opponent, (byOpponent.get(e.opponent) ?? 0) + 1);
    byInning.set(e.inning, (byInning.get(e.inning) ?? 0) + 1);
  }

  const games = [...byGame.entries()].map(([gamePk, v]) => ({ gamePk, ...v }));
  games.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let bestGame: Insights["bestGame"] = null;
  for (const g of games) {
    if (!bestGame || g.count > bestGame.count) {
      bestGame = {
        date: g.date,
        opponent: g.opponent,
        count: g.count,
        gamePk: g.gamePk,
      };
    }
  }

  const batterTop = [...byBatter.entries()].sort((a, b) => b[1] - a[1])[0];
  const opponentTop = [...byOpponent.entries()].sort((a, b) => b[1] - a[1])[0];

  const innings: Array<{ inning: number; count: number }> = [];
  const maxInning = Math.max(9, ...byInning.keys());
  for (let i = 1; i <= maxInning; i++) {
    innings.push({ inning: i, count: byInning.get(i) ?? 0 });
  }

  return {
    bestGame,
    topVictim: batterTop ? { name: batterTop[0], count: batterTop[1] } : null,
    topOpponent: opponentTop
      ? { name: opponentTop[0], count: opponentTop[1] }
      : null,
    byInning: innings,
    byGame: games,
  };
}

export function walksPerNine(p: { totalWalks: number; outsRecorded: number }): number {
  if (p.outsRecorded === 0) return 0;
  return (p.totalWalks * 27) / p.outsRecorded;
}

export function strikeoutsPerNine(p: {
  totalStrikeouts: number;
  outsRecorded: number;
}): number {
  if (p.outsRecorded === 0) return 0;
  return (p.totalStrikeouts * 27) / p.outsRecorded;
}

export function inningsPitched(p: { outsRecorded: number }): string {
  const full = Math.floor(p.outsRecorded / 3);
  const rem = p.outsRecorded % 3;
  return `${full}.${rem}`;
}

export type GameLogRow = {
  game: GameSummary;
  walks: number;
  strikeouts: number;
};

export function buildGameLog(
  games: GameSummary[],
  walks: WalkRecord[],
  strikeouts: StrikeoutRecord[],
): GameLogRow[] {
  const wMap = new Map<number, number>();
  const kMap = new Map<number, number>();
  for (const w of walks) wMap.set(w.gamePk, (wMap.get(w.gamePk) ?? 0) + 1);
  for (const s of strikeouts) kMap.set(s.gamePk, (kMap.get(s.gamePk) ?? 0) + 1);
  return games
    .map((g) => ({
      game: g,
      walks: wMap.get(g.gamePk) ?? 0,
      strikeouts: kMap.get(g.gamePk) ?? 0,
    }))
    .sort((a, b) =>
      a.game.date < b.game.date ? 1 : a.game.date > b.game.date ? -1 : 0,
    );
}
