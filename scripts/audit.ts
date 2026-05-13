import { fetchGameFeed, fetchWooSoxSchedule } from "../lib/mlb-api";

async function main() {
  const games = await fetchWooSoxSchedule();
  const allEventTypes = new Map<string, number>();
  const allCallCodes = new Set<string>();
  const ballCodes = new Map<string, number>();
  const intentWalks: Array<{ date: string; pitcher: string; batter: string }> = [];
  let totalPitches = 0;
  let totalPlays = 0;
  let walksWithZeroPitches = 0;
  let pitcherChangedMidPA = 0;

  for (const g of games) {
    const feed = await fetchGameFeed(g.gamePk);
    for (const play of feed.plays) {
      totalPlays += 1;
      const et = play.result?.eventType ?? "?";
      allEventTypes.set(et, (allEventTypes.get(et) ?? 0) + 1);
      if (et === "intent_walk") {
        intentWalks.push({
          date: g.date,
          pitcher: play.matchup?.pitcher?.fullName,
          batter: play.matchup?.batter?.fullName,
        });
      }
      const pitches = (play.playEvents ?? []).filter((e) => e.isPitch);
      if (et === "walk" && pitches.length === 0) walksWithZeroPitches += 1;
      const pitcherIdsInPA = new Set();
      for (const ev of play.playEvents ?? []) {
        if (ev.isPitch) {
          totalPitches += 1;
          const code = ev.details?.call?.code;
          if (code) allCallCodes.add(code);
          if (ev.details?.isBall && code) {
            ballCodes.set(code, (ballCodes.get(code) ?? 0) + 1);
          }
        }
      }
    }
  }

  console.log("=== Event types ===");
  for (const [k, v] of [...allEventTypes.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }
  console.log("\n=== All pitch call codes ===");
  console.log([...allCallCodes].sort().join(", "));
  console.log("\n=== Codes where isBall=true ===");
  for (const [c, n] of [...ballCodes.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${n}`);
  }
  console.log(`\nTotal plays scanned: ${totalPlays}`);
  console.log(`Total pitches: ${totalPitches}`);
  console.log(`Intentional walks: ${intentWalks.length}`);
  console.log(`Walks with zero pitches: ${walksWithZeroPitches}`);
  if (intentWalks.length) {
    console.log("Intentional walk details:");
    for (const w of intentWalks) console.log(`  ${w.date}: ${w.pitcher} vs ${w.batter}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
