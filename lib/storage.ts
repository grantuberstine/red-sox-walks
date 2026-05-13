import { put, list, del } from "@vercel/blob";
import { BLOB_KEY, SEASON, WOOSOX_TEAM_ID } from "./constants";
import { computeAchievements, headshotUrl } from "./achievements";
import type { AppearanceVeloPartial } from "./walk-classifier";
import type {
  AppearanceVelo,
  GameSummary,
  PitcherStats,
  SeasonState,
  StrikeoutClassification,
  StrikeoutRecord,
  StrikeoutType,
  WalkClassification,
  WalkRecord,
  WalkType,
} from "./types";

const emptyState = (): SeasonState => ({
  season: SEASON,
  teamId: WOOSOX_TEAM_ID,
  processedGamePks: [],
  pitchers: {},
  games: [],
  walks: [],
  strikeouts: [],
  velocity: {},
  meta: {
    lastRefreshAt: null,
    lastGameDate: null,
    totalGames: 0,
    totalWalks: 0,
    totalStrikeouts: 0,
    totalOutsRecorded: 0,
  },
});

async function findBlobUrl(): Promise<string | null> {
  try {
    const result = await list({ prefix: BLOB_KEY });
    const match = result.blobs.find((b) => b.pathname === BLOB_KEY);
    return match?.url ?? null;
  } catch {
    return null;
  }
}

function mergeWithDefaults(parsed: SeasonState): SeasonState {
  const empty = emptyState();
  return {
    ...empty,
    ...parsed,
    walks: parsed.walks ?? [],
    strikeouts: parsed.strikeouts ?? [],
    games: parsed.games ?? [],
    processedGamePks: parsed.processedGamePks ?? [],
    pitchers: parsed.pitchers ?? {},
    velocity: parsed.velocity ?? {},
    meta: { ...empty.meta, ...(parsed.meta ?? {}) },
  };
}

export async function loadState(): Promise<SeasonState> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const localPath = path.resolve(process.cwd(), "tmp", "season-state.json");
      const raw = await fs.readFile(localPath, "utf-8");
      const parsed = JSON.parse(raw) as SeasonState;
      return mergeWithDefaults(parsed);
    } catch {
      return emptyState();
    }
  }

  const url = await findBlobUrl();
  if (!url) return emptyState();

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return emptyState();
    const parsed = (await res.json()) as SeasonState;
    return mergeWithDefaults(parsed);
  } catch {
    return emptyState();
  }
}

export async function saveState(state: SeasonState): Promise<void> {
  try {
    const existing = await findBlobUrl();
    if (existing) {
      await del(existing);
    }
  } catch {
    // first write
  }
  await put(BLOB_KEY, JSON.stringify(state), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

function walkTags(w: WalkClassification): WalkType[] {
  const t: WalkType[] = [];
  if (w.isFourPitch) t.push("fourPitch");
  if (w.isOhTwo) t.push("ohTwo");
  if (w.isLeadoff) t.push("leadoff");
  if (w.isTwoOut) t.push("twoOut");
  return t;
}

function strikeoutTags(s: StrikeoutClassification): StrikeoutType[] {
  const t: StrikeoutType[] = [];
  if (s.isThreePitch) t.push("threePitch");
  if (s.isSide) t.push("side");
  return t;
}

function ensurePitcher(
  pitchers: Record<string, PitcherStats>,
  id: number,
  name: string,
): PitcherStats {
  const key = String(id);
  if (!pitchers[key]) {
    pitchers[key] = {
      pitcherId: id,
      name,
      headshotUrl: headshotUrl(id),
      appearances: 0,
      outsRecorded: 0,
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
      achievements: [],
    };
  }
  return pitchers[key];
}

export function applyEventsToState(
  state: SeasonState,
  walks: WalkClassification[],
  strikeouts: StrikeoutClassification[],
  outsByPitcher: Record<number, number>,
  veloByPitcher: Record<number, AppearanceVeloPartial>,
  game: GameSummary,
): SeasonState {
  const next: SeasonState = {
    ...state,
    pitchers: { ...state.pitchers },
    games: [...state.games],
    processedGamePks: [...state.processedGamePks],
    walks: [...state.walks],
    strikeouts: [...state.strikeouts],
    velocity: { ...state.velocity },
  };

  if (next.processedGamePks.includes(game.gamePk)) return next;

  for (const [pidStr, partial] of Object.entries(veloByPitcher)) {
    const key = pidStr;
    const list: AppearanceVelo[] = next.velocity[key]
      ? [...next.velocity[key]]
      : [];
    list.push({
      gamePk: game.gamePk,
      date: game.date,
      opponent: game.opponent,
      ...partial,
    });
    list.sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );
    next.velocity[key] = list;
  }

  const pitcherIdsThisGame = new Set<number>();

  for (const w of walks) {
    pitcherIdsThisGame.add(w.pitcherId);
    const p = ensurePitcher(next.pitchers, w.pitcherId, w.pitcherName);
    p.name = w.pitcherName;
    p.headshotUrl = headshotUrl(w.pitcherId);
    p.totalWalks += 1;
    if (w.isFourPitch) p.fourPitchWalks += 1;
    if (w.isOhTwo) p.ohTwoWalks += 1;
    if (w.isLeadoff) p.leadoffWalks += 1;
    if (w.isTwoOut) p.twoOutWalks += 1;
    p.lastWalkDate = w.date;

    next.walks.push({
      gamePk: game.gamePk,
      pitcherId: w.pitcherId,
      pitcherName: w.pitcherName,
      date: w.date,
      opponent: game.opponent,
      inning: w.inning,
      halfInning: w.halfInning,
      batterName: w.batterName,
      finalCount: w.finalCount,
      pitchesInPA: w.pitchesInPA,
      tags: walkTags(w),
    } satisfies WalkRecord);
  }

  const sideInningsThisGame = new Map<number, Set<string>>();
  for (const s of strikeouts) {
    pitcherIdsThisGame.add(s.pitcherId);
    const p = ensurePitcher(next.pitchers, s.pitcherId, s.pitcherName);
    p.name = s.pitcherName;
    p.headshotUrl = headshotUrl(s.pitcherId);
    p.totalStrikeouts += 1;
    if (s.isThreePitch) p.threePitchStrikeouts += 1;
    p.lastStrikeoutDate = s.date;

    if (s.isSide) {
      const key = `${s.inning}-${s.halfInning}`;
      if (!sideInningsThisGame.has(s.pitcherId)) {
        sideInningsThisGame.set(s.pitcherId, new Set());
      }
      sideInningsThisGame.get(s.pitcherId)!.add(key);
    }

    next.strikeouts.push({
      gamePk: game.gamePk,
      pitcherId: s.pitcherId,
      pitcherName: s.pitcherName,
      date: s.date,
      opponent: game.opponent,
      inning: s.inning,
      halfInning: s.halfInning,
      batterName: s.batterName,
      pitchesInPA: s.pitchesInPA,
      tags: strikeoutTags(s),
    } satisfies StrikeoutRecord);
  }
  for (const [pid, innings] of sideInningsThisGame) {
    const key = String(pid);
    next.pitchers[key].sideStrikeouts += innings.size;
  }

  for (const [pidStr, outs] of Object.entries(outsByPitcher)) {
    const pid = Number(pidStr);
    pitcherIdsThisGame.add(pid);
    const p = ensurePitcher(
      next.pitchers,
      pid,
      next.pitchers[pidStr]?.name ?? `Pitcher ${pid}`,
    );
    p.outsRecorded += outs;
  }

  for (const pid of pitcherIdsThisGame) {
    const key = String(pid);
    next.pitchers[key] = {
      ...next.pitchers[key],
      appearances: next.pitchers[key].appearances + 1,
    };
  }

  for (const key of Object.keys(next.pitchers)) {
    next.pitchers[key] = {
      ...next.pitchers[key],
      achievements: computeAchievements(next.pitchers[key]),
    };
  }

  next.walks.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  next.strikeouts.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
  next.games.push(game);
  next.processedGamePks.push(game.gamePk);

  const totalOutsAdded = Object.values(outsByPitcher).reduce(
    (s, n) => s + n,
    0,
  );
  next.meta = {
    ...next.meta,
    lastRefreshAt: new Date().toISOString(),
    lastGameDate: game.date,
    totalGames: next.processedGamePks.length,
    totalWalks: next.meta.totalWalks + walks.length,
    totalStrikeouts: next.meta.totalStrikeouts + strikeouts.length,
    totalOutsRecorded: next.meta.totalOutsRecorded + totalOutsAdded,
  };

  return next;
}

export { emptyState };
