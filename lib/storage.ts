import { put, list, del } from "@vercel/blob";
import { BLOB_KEY, SEASON, WOOSOX_TEAM_ID } from "./constants";
import type { PitcherStats, SeasonState, WalkClassification, GameSummary } from "./types";

const emptyState = (): SeasonState => ({
  season: SEASON,
  teamId: WOOSOX_TEAM_ID,
  processedGamePks: [],
  pitchers: {},
  games: [],
  meta: {
    lastRefreshAt: null,
    lastGameDate: null,
    totalGames: 0,
    totalWalks: 0,
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

export async function loadState(): Promise<SeasonState> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const localPath = path.resolve(process.cwd(), "tmp", "season-state.json");
      const raw = await fs.readFile(localPath, "utf-8");
      const parsed = JSON.parse(raw) as SeasonState;
      return { ...emptyState(), ...parsed };
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
    return { ...emptyState(), ...parsed };
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
    // ignore — first write
  }
  await put(BLOB_KEY, JSON.stringify(state, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export function applyWalksToState(
  state: SeasonState,
  walks: WalkClassification[],
  game: GameSummary,
): SeasonState {
  const next: SeasonState = {
    ...state,
    pitchers: { ...state.pitchers },
    games: [...state.games],
    processedGamePks: [...state.processedGamePks],
  };

  if (next.processedGamePks.includes(game.gamePk)) return next;

  const pitcherIdsThisGame = new Set<number>();

  for (const w of walks) {
    pitcherIdsThisGame.add(w.pitcherId);
    const key = String(w.pitcherId);
    const prev: PitcherStats = next.pitchers[key] ?? {
      pitcherId: w.pitcherId,
      name: w.pitcherName,
      appearances: 0,
      totalWalks: 0,
      fourPitchWalks: 0,
      ohTwoWalks: 0,
      leadoffWalks: 0,
      twoOutWalks: 0,
      lastWalkDate: null,
    };
    next.pitchers[key] = {
      ...prev,
      name: w.pitcherName,
      totalWalks: prev.totalWalks + 1,
      fourPitchWalks: prev.fourPitchWalks + (w.isFourPitch ? 1 : 0),
      ohTwoWalks: prev.ohTwoWalks + (w.isOhTwo ? 1 : 0),
      leadoffWalks: prev.leadoffWalks + (w.isLeadoff ? 1 : 0),
      twoOutWalks: prev.twoOutWalks + (w.isTwoOut ? 1 : 0),
      lastWalkDate: w.date,
    };
  }

  for (const pid of pitcherIdsThisGame) {
    const key = String(pid);
    if (next.pitchers[key]) {
      next.pitchers[key] = {
        ...next.pitchers[key],
        appearances: next.pitchers[key].appearances + 1,
      };
    }
  }

  next.games.push(game);
  next.processedGamePks.push(game.gamePk);
  next.meta = {
    ...next.meta,
    lastRefreshAt: new Date().toISOString(),
    lastGameDate: game.date,
    totalGames: next.processedGamePks.length,
    totalWalks: next.meta.totalWalks + walks.length,
  };

  return next;
}

export { emptyState };
