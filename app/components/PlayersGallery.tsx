"use client";

import { useMemo, useState } from "react";
import type { AppearanceVelo, PitcherStats } from "@/lib/types";
import { inningsPitched } from "@/lib/filters";
import { WALK_FEE_PER_CATEGORY, formatMoney } from "@/lib/fund";
import { PitcherAvatar } from "./PitcherAvatar";

const FIP_CONSTANT = 3.1;

type Rates = { era: number | null; whip: number | null; fip: number | null };

function ratesFor(appearances: AppearanceVelo[]): Rates {
  const t = appearances.reduce(
    (acc, a) => ({
      outs: acc.outs + (a.outs ?? 0),
      walks: acc.walks + (a.walks ?? 0),
      strikeouts: acc.strikeouts + (a.strikeouts ?? 0),
      earnedRuns: acc.earnedRuns + (a.earnedRuns ?? 0),
      homeRuns: acc.homeRuns + (a.homeRuns ?? 0),
      hitByPitch: acc.hitByPitch + (a.hitByPitch ?? 0),
      hits: acc.hits + (a.hits ?? 0),
    }),
    {
      outs: 0,
      walks: 0,
      strikeouts: 0,
      earnedRuns: 0,
      homeRuns: 0,
      hitByPitch: 0,
      hits: 0,
    },
  );
  if (t.outs === 0) return { era: null, whip: null, fip: null };
  const ip = t.outs / 3;
  return {
    era: (t.earnedRuns * 27) / t.outs,
    whip: (t.walks + t.hits) / ip,
    fip:
      (13 * t.homeRuns + 3 * (t.walks + t.hitByPitch) - 2 * t.strikeouts) / ip +
      FIP_CONSTANT,
  };
}

type SortKey =
  | "name"
  | "owes"
  | "totalWalks"
  | "totalStrikeouts"
  | "outsRecorded";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "owes", label: "Owes Most" },
  { key: "totalWalks", label: "Most Walks" },
  { key: "totalStrikeouts", label: "Most Strikeouts" },
  { key: "outsRecorded", label: "Innings Pitched" },
  { key: "name", label: "Name (A→Z)" },
];

function feesOwed(p: PitcherStats): number {
  return (
    (p.fourPitchWalks + p.ohTwoWalks + p.leadoffWalks + p.twoOutWalks) *
    WALK_FEE_PER_CATEGORY
  );
}

export function PlayersGallery({
  pitchers,
  velocityByPitcher,
  onSelect,
}: {
  pitchers: PitcherStats[];
  velocityByPitcher: Record<string, AppearanceVelo[]>;
  onSelect: (pitcherId: number) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("owes");

  const sorted = useMemo(() => {
    const rows = [...pitchers];
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      const valOf = (p: PitcherStats): number => {
        if (sortKey === "owes") return feesOwed(p);
        return p[sortKey as keyof PitcherStats] as number;
      };
      return valOf(b) - valOf(a);
    });
    return rows;
  }, [pitchers, sortKey]);

  if (pitchers.length === 0) {
    return (
      <div className="px-6 py-14 text-center text-sm text-[var(--text-muted)]">
        No pitchers match the current filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          {pitchers.length} {pitchers.length === 1 ? "pitcher" : "pitchers"}
        </h2>
        <label className="flex items-center gap-2 text-xs text-[var(--text)]">
          <span className="font-semibold">Sort</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--text)]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((p) => {
          const owes = feesOwed(p);
          const rates = ratesFor(velocityByPitcher[String(p.pitcherId)] ?? []);
          return (
            <button
              key={p.pitcherId}
              type="button"
              onClick={() => onSelect(p.pitcherId)}
              className="group cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm ring-1 ring-[var(--border)]/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <PitcherAvatar name={p.name} src={p.headshotUrl} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[var(--text)] group-hover:text-[var(--color-sox-red)]">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {inningsPitched(p)} IP · {p.totalWalks} BB ·{" "}
                    {p.totalStrikeouts} K
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <MiniRate
                  label="ERA"
                  value={rates.era !== null ? rates.era.toFixed(2) : "—"}
                />
                <MiniRate
                  label="WHIP"
                  value={rates.whip !== null ? rates.whip.toFixed(2) : "—"}
                />
                <MiniRate
                  label="FIP"
                  value={rates.fip !== null ? rates.fip.toFixed(2) : "—"}
                />
              </div>

              <div className="mt-3">
                <MoneyBlock label="Owes the Fund" value={owes} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <Pill label="4P" value={p.fourPitchWalks} tone="walk" />
                <Pill label="0-2" value={p.ohTwoWalks} tone="walk" />
                <Pill label="LO" value={p.leadoffWalks} tone="walk" />
                <Pill label="2O" value={p.twoOutWalks} tone="walk" />
                <Pill label="3P-K" value={p.threePitchStrikeouts} tone="k" />
                <Pill label="3-UP" value={p.sideStrikeouts} tone="k" />
              </div>
              <div className="mt-3 text-right text-[10px] font-semibold text-[var(--text-secondary)] group-hover:text-[var(--color-sox-red)]">
                View profile →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniRate({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--surface-hover)] px-2 py-1.5 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold tabular leading-none text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function MoneyBlock({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular leading-none text-[var(--color-sox-red)]">
        {formatMoney(value)}
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "walk" | "k";
}) {
  if (value === 0) return null;
  const cls =
    tone === "walk"
      ? "border border-rose-300 text-rose-700 dark:border-rose-400/50 dark:text-rose-300"
      : "border border-emerald-400 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular ${cls}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </span>
  );
}
