import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { fetchGameFeed, fetchWooSoxSchedule } from "../lib/mlb-api";
import { classifyWooSoxEvents } from "../lib/walk-classifier";
import { applyEventsToState, emptyState } from "../lib/storage";
import { WOOSOX_TEAM_ID } from "../lib/constants";
import type { GameSummary } from "../lib/types";

async function main() {
  let state = emptyState();
  const games = await fetchWooSoxSchedule();
  console.log(`Processing ${games.length} games...`);

  let i = 0;
  for (const g of games) {
    i += 1;
    process.stdout.write(`\r[${i}/${games.length}] gamePk ${g.gamePk}    `);
    const feed = await fetchGameFeed(g.gamePk);
    const { walks, strikeouts, outsByPitcher } = classifyWooSoxEvents(
      feed,
      g.date,
    );
    const isHome = g.homeTeamId === WOOSOX_TEAM_ID;
    const teamScore = isHome ? g.homeScore : g.awayScore;
    const opponentScore = isHome ? g.awayScore : g.homeScore;
    let result: "W" | "L" | "T" | null = null;
    if (teamScore !== null && opponentScore !== null) {
      if (teamScore > opponentScore) result = "W";
      else if (teamScore < opponentScore) result = "L";
      else result = "T";
    }
    const summary: GameSummary = {
      gamePk: g.gamePk,
      date: g.date,
      opponent: isHome ? g.awayTeamName : g.homeTeamName,
      homeAway: isHome ? "home" : "away",
      walksProcessed: walks.length,
      strikeoutsProcessed: strikeouts.length,
      teamScore,
      opponentScore,
      result,
    };
    state = applyEventsToState(state, walks, strikeouts, outsByPitcher, summary);
  }
  process.stdout.write("\n");

  state.meta.lastRefreshAt = new Date().toISOString();

  const outDir = resolve(process.cwd(), "tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "season-state.json");
  writeFileSync(outPath, JSON.stringify(state, null, 2));

  console.log(`\nWrote ${outPath}`);
  console.log(`Pitchers: ${Object.keys(state.pitchers).length}`);
  console.log(`Games: ${state.meta.totalGames}`);
  console.log(`Total walks: ${state.meta.totalWalks}`);
  console.log(`Total K: ${state.meta.totalStrikeouts}`);
  console.log(`Total outs: ${state.meta.totalOutsRecorded}, IP: ${(state.meta.totalOutsRecorded / 3).toFixed(1)}`);
  const wins = state.games.filter((g) => g.result === "W").length;
  const losses = state.games.filter((g) => g.result === "L").length;
  console.log(`Record: ${wins}-${losses}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
