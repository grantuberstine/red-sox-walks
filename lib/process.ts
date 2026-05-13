import { WOOSOX_TEAM_ID } from "./constants";
import { fetchGameFeed, fetchWooSoxSchedule } from "./mlb-api";
import { classifyWooSoxWalks } from "./walk-classifier";
import { applyWalksToState, loadState, saveState } from "./storage";
import type { GameSummary, ScheduleGame, SeasonState } from "./types";

function toGameSummary(g: ScheduleGame, walksProcessed: number): GameSummary {
  const isHome = g.homeTeamId === WOOSOX_TEAM_ID;
  return {
    gamePk: g.gamePk,
    date: g.date,
    opponent: isHome ? g.awayTeamName : g.homeTeamName,
    homeAway: isHome ? "home" : "away",
    walksProcessed,
  };
}

export type ProcessReport = {
  scanned: number;
  processedNew: number;
  skippedAlreadyProcessed: number;
  totalWalksAdded: number;
  newGames: GameSummary[];
  errors: Array<{ gamePk: number; message: string }>;
};

export async function processGames(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ state: SeasonState; report: ProcessReport }> {
  const startDate = options?.startDate;
  const endDate = options?.endDate;

  let state = await loadState();
  const games = await fetchWooSoxSchedule(startDate, endDate);

  const report: ProcessReport = {
    scanned: games.length,
    processedNew: 0,
    skippedAlreadyProcessed: 0,
    totalWalksAdded: 0,
    newGames: [],
    errors: [],
  };

  for (const g of games) {
    if (state.processedGamePks.includes(g.gamePk)) {
      report.skippedAlreadyProcessed += 1;
      continue;
    }
    try {
      const feed = await fetchGameFeed(g.gamePk);
      const walks = classifyWooSoxWalks(feed, g.date);
      const summary = toGameSummary(g, walks.length);
      state = applyWalksToState(state, walks, summary);
      report.processedNew += 1;
      report.totalWalksAdded += walks.length;
      report.newGames.push(summary);
    } catch (e) {
      report.errors.push({
        gamePk: g.gamePk,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (report.processedNew > 0) {
    await saveState(state);
  } else {
    state.meta = { ...state.meta, lastRefreshAt: new Date().toISOString() };
    await saveState(state);
  }

  return { state, report };
}
