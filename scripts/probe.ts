import { fetchGameFeed, fetchWooSoxSchedule } from "../lib/mlb-api";
import { classifyWooSoxWalks } from "../lib/walk-classifier";

async function main() {
  const arg = process.argv[2];

  if (arg && /^\d+$/.test(arg)) {
    const gamePk = parseInt(arg, 10);
    const feed = await fetchGameFeed(gamePk);
    const walks = classifyWooSoxWalks(feed, "probe");
    console.log(`Game ${gamePk}: ${walks.length} WooSox walks issued`);
    for (const w of walks) {
      console.log(
        `  ${w.pitcherName} | ${w.halfInning} ${w.inning} | vs ${w.batterName} | ` +
          `${w.finalCount.balls}-${w.finalCount.strikes} | ` +
          `4P=${w.isFourPitch} 0-2=${w.isOhTwo} LO=${w.isLeadoff} 2O=${w.isTwoOut}`,
      );
    }
    return;
  }

  const games = await fetchWooSoxSchedule();
  console.log(`Found ${games.length} completed WooSox games in season.`);

  if (games.length === 0) return;

  const totals: Record<string, { name: string; total: number; fp: number; oh2: number; lo: number; to: number }> = {};

  for (const g of games) {
    const feed = await fetchGameFeed(g.gamePk);
    const walks = classifyWooSoxWalks(feed, g.date);
    for (const w of walks) {
      const k = String(w.pitcherId);
      if (!totals[k]) totals[k] = { name: w.pitcherName, total: 0, fp: 0, oh2: 0, lo: 0, to: 0 };
      totals[k].total += 1;
      if (w.isFourPitch) totals[k].fp += 1;
      if (w.isOhTwo) totals[k].oh2 += 1;
      if (w.isLeadoff) totals[k].lo += 1;
      if (w.isTwoOut) totals[k].to += 1;
    }
  }

  const rows = Object.values(totals).sort((a, b) => b.total - a.total);
  console.log("\nSeason-to-date WooSox pitcher walks:");
  console.log("Name".padEnd(30), "Total", "4P", "0-2", "LO", "2O");
  for (const r of rows) {
    console.log(
      r.name.padEnd(30),
      String(r.total).padStart(5),
      String(r.fp).padStart(2),
      String(r.oh2).padStart(3),
      String(r.lo).padStart(2),
      String(r.to).padStart(2),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
