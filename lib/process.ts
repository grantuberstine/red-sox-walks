import { WOOSOX_TEAM_ID } from "./constants";
import { fetchGameFeed, fetchWooSoxSchedule } from "./mlb-api";
import { classifyWooSoxEvents } from "./walk-classifier";
import { applyEventsToState, loadState, saveState } from "./storage";
import type { GameSummary, ScheduleGame, SeasonState } from "./types";

function toGameSummary(
  g: ScheduleGame,
  walksProcessed: number,
  strikeoutsProcessed: number,
): GameSummary {
  const isHome = g.homeTeamId === WOOSOX_TEAM_ID;
  const teamScore = isHome ? g.homeScore : g.awayScore;
  const opponentScore = isHome ? g.awayScore : g.homeScore;
  let result: "W" | "L" | "T" | null = null;
  if (teamScore !== null && opponentScore !== null) {
    if (teamScore > opponentScore) result = "W";
    else if (teamScore < opponentScore) result = "L";
    else result = "T";
  }
  return {
    gamePk: g.gamePk,
    date: g.date,
    opponent: isHome ? g.awayTeamName : g.homeTeamName,
    homeAway: isHome ? "home" : "away",
    walksProcessed,
    strikeoutsProcessed,
    teamScore,
    opponentScore,
    result,
  };
}

export type ProcessReport = {
  scanned: number;
  processedNew: number;
  skippedAlreadyProcessed: number;
  totalWalksAdded: number;
  totalStrikeoutsAdded: number;
  newGames: GameSummary[];
  errors: Array<{ gamePk: number; message: string }>;
};

export async function processGames(options?: {
  startDate?: string;
  endDate?: string;
  initialState?: SeasonState;
}): Promise<{ state: SeasonState; report: ProcessReport }> {
  const startDate = options?.startDate;
  const endDate = options?.endDate;

  let state = options?.initialState ?? (await loadState());
  const games = await fetchWooSoxSchedule(startDate, endDate);

  const report: ProcessReport = {
    scanned: games.length,
    processedNew: 0,
    skippedAlreadyProcessed: 0,
    totalWalksAdded: 0,
    totalStrikeoutsAdded: 0,
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
      const { walks, strikeouts, outsByPitcher } = classifyWooSoxEvents(
        feed,
        g.date,
      );
      const summary = toGameSummary(g, walks.length, strikeouts.length);
      state = applyEventsToState(state, walks, strikeouts, outsByPitcher, summary);
      report.processedNew += 1;
      report.totalWalksAdded += walks.length;
      report.totalStrikeoutsAdded += strikeouts.length;
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
