"use client";

import { useMemo, useState } from "react";
import type { PitcherStats } from "@/lib/types";
import {
  inningsPitched,
  strikeoutsPerNine,
  walksPerNine,
} from "@/lib/filters";
import { PitcherAvatar } from "./PitcherAvatar";

type SortKey =
  | "name"
  | "outsRecorded"
  | "totalWalks"
  | "totalStrikeouts"
  | "ksPerNine"
  | "walksPerNine";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "name", label: "Name (A→Z)" },
  { key: "outsRecorded", label: "Innings pitched" },
  { key: "totalWalks", label: "Most walks" },
  { key: "totalStrikeouts", label: "Most strikeouts" },
  { key: "ksPerNine", label: "K/9 (best first)" },
  { key: "walksPerNine", label: "BB/9 (worst first)" },
];

function fmt(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  return n.toFixed(2);
}

export function PlayersGallery({
  pitchers,
  onSelect,
}: {
  pitchers: PitcherStats[];
  onSelect: (pitcherId: number) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("totalWalks");

  const sorted = useMemo(() => {
    const rows = [...pitchers];
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      const valOf = (p: PitcherStats): number => {
        if (sortKey === "ksPerNine") return strikeoutsPerNine(p);
        if (sortKey === "walksPerNine") return walksPerNine(p);
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
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          {pitchers.length} {pitchers.length === 1 ? "pitcher" : "pitchers"}
        </h2>
        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="font-semibold">Sort</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]"
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
        {sorted.map((p) => (
          <button
            key={p.pitcherId}
            type="button"
            onClick={() => onSelect(p.pitcherId)}
            className="group cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-sox-navy)]/30 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <PitcherAvatar name={p.name} src={p.headshotUrl} size={52} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[var(--text)] group-hover:text-[var(--color-sox-red)]">
                  {p.name}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {inningsPitched(p)} IP · {p.appearances} apps
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Mini label="Walks" value={p.totalWalks} rate={`${fmt(walksPerNine(p))} BB/9`} tone="rose" />
              <Mini label="K's" value={p.totalStrikeouts} rate={`${fmt(strikeoutsPerNine(p))} K/9`} tone="emerald" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-[var(--text-muted)]">
              <Pill label="4P" value={p.fourPitchWalks} on="bg-amber-50 text-amber-700" />
              <Pill label="0-2" value={p.ohTwoWalks} on="bg-rose-50 text-rose-700" />
              <Pill label="LO" value={p.leadoffWalks} on="bg-sky-50 text-sky-700" />
              <Pill label="2O" value={p.twoOutWalks} on="bg-violet-50 text-violet-700" />
              <Pill label="3P-K" value={p.threePitchStrikeouts} on="bg-emerald-50 text-emerald-700" />
              <Pill label="3-UP" value={p.sideStrikeouts} on="bg-indigo-50 text-indigo-700" />
            </div>
            <div className="mt-3 text-right text-[10px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--color-sox-red)]">
              View profile →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  rate,
  tone,
}: {
  label: string;
  value: number;
  rate: string;
  tone: "rose" | "emerald";
}) {
  const bg = tone === "rose" ? "bg-rose-50" : "bg-emerald-50";
  const txt = tone === "rose" ? "text-rose-800" : "text-emerald-800";
  return (
    <div className={`rounded-lg ${bg} p-2`}>
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${txt}`}>
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className={`text-xl font-bold tabular leading-none ${txt}`}>
          {value}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] tabular">{rate}</span>
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
  on,
}: {
  label: string;
  value: number;
  on: string;
}) {
  if (value === 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular ${on}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </span>
  );
}
