import type {
  PitcherStats,
  StrikeoutRecord,
  WalkRecord,
} from "./types";

export const WALK_FEE_PER_CATEGORY = 1;
export const THREE_PITCH_K_BONUS = 2;
export const SIDE_K_BONUS = 10;

export type LedgerEntry = {
  pitcherId: number;
  name: string;
  headshotUrl: string;
  walkBuckets: {
    fourPitch: number;
    ohTwo: number;
    leadoff: number;
    twoOut: number;
  };
  threePitchKs: number;
  threeUpThreeDownInnings: number;
  feesOwed: number;
  bonusEarned: number;
  net: number;
};

export type FundReport = {
  entries: LedgerEntry[];
  team: {
    totalFees: number;
    totalBonus: number;
    netBalance: number;
    walkCount: number;
    threePitchCount: number;
    sideInningCount: number;
  };
};

export function computeFundReport(
  walks: WalkRecord[],
  strikeouts: StrikeoutRecord[],
  pitcherMeta: Record<string, Pick<PitcherStats, "pitcherId" | "name" | "headshotUrl">>,
): FundReport {
  const ensure = (id: number, name: string): LedgerEntry => {
    if (!byId.has(id)) {
      const meta = pitcherMeta[String(id)];
      byId.set(id, {
        pitcherId: id,
        name: meta?.name ?? name,
        headshotUrl:
          meta?.headshotUrl ??
          `https://midfield.mlbstatic.com/v1/people/${id}/spots/120`,
        walkBuckets: { fourPitch: 0, ohTwo: 0, leadoff: 0, twoOut: 0 },
        threePitchKs: 0,
        threeUpThreeDownInnings: 0,
        feesOwed: 0,
        bonusEarned: 0,
        net: 0,
      });
    }
    return byId.get(id)!;
  };

  const byId = new Map<number, LedgerEntry>();
  const sideInningsByPitcher = new Map<number, Set<string>>();

  for (const w of walks) {
    const e = ensure(w.pitcherId, w.pitcherName);
    if (w.tags.includes("fourPitch")) e.walkBuckets.fourPitch += 1;
    if (w.tags.includes("ohTwo")) e.walkBuckets.ohTwo += 1;
    if (w.tags.includes("leadoff")) e.walkBuckets.leadoff += 1;
    if (w.tags.includes("twoOut")) e.walkBuckets.twoOut += 1;
  }

  for (const s of strikeouts) {
    const e = ensure(s.pitcherId, s.pitcherName);
    if (s.tags.includes("threePitch")) e.threePitchKs += 1;
    if (s.tags.includes("side")) {
      const key = `${s.gamePk}-${s.inning}-${s.halfInning}`;
      if (!sideInningsByPitcher.has(s.pitcherId)) {
        sideInningsByPitcher.set(s.pitcherId, new Set());
      }
      sideInningsByPitcher.get(s.pitcherId)!.add(key);
    }
  }

  for (const [pid, innings] of sideInningsByPitcher) {
    const e = byId.get(pid);
    if (e) e.threeUpThreeDownInnings = innings.size;
  }

  let totalFees = 0;
  let totalBonus = 0;
  let walkCount = 0;
  let threePitchCount = 0;
  let sideInningCount = 0;

  for (const e of byId.values()) {
    const fees =
      (e.walkBuckets.fourPitch +
        e.walkBuckets.ohTwo +
        e.walkBuckets.leadoff +
        e.walkBuckets.twoOut) *
      WALK_FEE_PER_CATEGORY;
    const bonus =
      e.threePitchKs * THREE_PITCH_K_BONUS +
      e.threeUpThreeDownInnings * SIDE_K_BONUS;
    e.feesOwed = fees;
    e.bonusEarned = bonus;
    e.net = bonus - fees;
    totalFees += fees;
    totalBonus += bonus;
    walkCount +=
      e.walkBuckets.fourPitch +
      e.walkBuckets.ohTwo +
      e.walkBuckets.leadoff +
      e.walkBuckets.twoOut;
    threePitchCount += e.threePitchKs;
    sideInningCount += e.threeUpThreeDownInnings;
  }

  return {
    entries: [...byId.values()],
    team: {
      totalFees,
      totalBonus,
      netBalance: totalBonus - totalFees,
      walkCount,
      threePitchCount,
      sideInningCount,
    },
  };
}

export function formatMoney(n: number): string {
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  const formatted = `$${abs.toLocaleString("en-US")}`;
  return n < 0 ? `-${formatted}` : formatted;
}
