"use client";

import { useMemo, useState } from "react";
import type { PitcherStats, WalkRecord, WalkType } from "@/lib/types";
import { achievementById } from "@/lib/achievements";
import { PitcherAvatar } from "./PitcherAvatar";

type SortKey =
  | "totalWalks"
  | "fourPitchWalks"
  | "ohTwoWalks"
  | "leadoffWalks"
  | "twoOutWalks"
  | "walksPerApp"
  | "name";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "totalWalks", label: "Total walks" },
  { key: "walksPerApp", label: "Walks per app" },
  { key: "fourPitchWalks", label: "4-Pitch" },
  { key: "ohTwoWalks", label: "0-2" },
  { key: "leadoffWalks", label: "Leadoff" },
  { key: "twoOutWalks", label: "2-Out" },
  { key: "name", label: "Name (A–Z)" },
];

const TAG_COLORS: Record<WalkType, string> = {
  fourPitch: "bg-amber-100 text-amber-800",
  ohTwo: "bg-rose-100 text-rose-800",
  leadoff: "bg-sky-100 text-sky-800",
  twoOut: "bg-violet-100 text-violet-800",
};

const TAG_LABELS: Record<WalkType, string> = {
  fourPitch: "4P",
  ohTwo: "0-2",
  leadoff: "LO",
  twoOut: "2O",
};

function rate(p: PitcherStats): number {
  return p.appearances === 0 ? 0 : p.totalWalks / p.appearances;
}
function fmtRate(n: number): string {
  return n === 0 ? "—" : n.toFixed(2);
}
function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function PitcherCards({
  pitchers,
  allWalks,
  query = "",
}: {
  pitchers: PitcherStats[];
  allWalks: WalkRecord[];
  query?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("totalWalks");
  const [expanded, setExpanded] = useState<number | null>(null);

  const walksByPitcher = useMemo(() => {
    const m = new Map<number, WalkRecord[]>();
    for (const w of allWalks) {
      if (!m.has(w.pitcherId)) m.set(w.pitcherId, []);
      m.get(w.pitcherId)!.push(w);
    }
    return m;
  }, [allWalks]);

  const sorted = useMemo(() => {
    const rows = [...pitchers];
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      const av = sortKey === "walksPerApp" ? rate(a) : a[sortKey];
      const bv = sortKey === "walksPerApp" ? rate(b) : b[sortKey];
      return Number(bv) - Number(av);
    });
    return rows;
  }, [pitchers, sortKey]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-slate-600">
          Sort
        </span>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p) => {
          const open = expanded === p.pitcherId;
          const walks = walksByPitcher.get(p.pitcherId) ?? [];
          return (
            <div
              key={p.pitcherId}
              className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md ${open ? "ring-2 ring-[var(--color-sox-red)]/30" : ""}`}
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded(open ? null : p.pitcherId)
                }
                className="w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <PitcherAvatar
                    name={p.name}
                    src={p.headshotUrl}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-[var(--color-sox-navy)]">
                        <Highlight text={p.name} query={query} />
                      </span>
                      <span className="text-2xl font-bold tabular leading-none text-[var(--color-sox-navy)]">
                        {p.totalWalks}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="tabular">{p.appearances} apps</span>
                      <span>·</span>
                      <span className="tabular">{fmtRate(rate(p))} BB/app</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                  <Cell label="4P" value={p.fourPitchWalks} color="amber" />
                  <Cell label="0-2" value={p.ohTwoWalks} color="rose" />
                  <Cell label="LO" value={p.leadoffWalks} color="sky" />
                  <Cell label="2O" value={p.twoOutWalks} color="violet" />
                </div>
                {p.achievements.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-0.5">
                    {p.achievements.slice(0, 8).map((id) => {
                      const a = achievementById(id);
                      if (!a) return null;
                      return (
                        <span
                          key={id}
                          title={`${a.label}: ${a.description}`}
                          className="text-[12px] leading-none"
                        >
                          {a.emoji}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
              {open && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {walks.length === 0 ? (
                    <div className="text-center text-xs text-slate-500">
                      No walks in current filter.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {walks.slice(0, 10).map((w, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-[11px]"
                        >
                          <span className="font-medium tabular text-slate-600">
                            {formatDate(w.date)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-slate-700">
                            <Highlight text={w.batterName} query={query} />
                          </span>
                          <span className="flex gap-0.5">
                            {w.tags.map((t) => (
                              <span
                                key={t}
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${TAG_COLORS[t]}`}
                              >
                                {TAG_LABELS[t]}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                      {walks.length > 10 && (
                        <li className="text-center text-[10px] text-slate-400">
                          + {walks.length - 10} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CELL_TONES = {
  amber: { on: "bg-amber-50 text-amber-800", off: "bg-slate-50 text-slate-300" },
  rose: { on: "bg-rose-50 text-rose-800", off: "bg-slate-50 text-slate-300" },
  sky: { on: "bg-sky-50 text-sky-800", off: "bg-slate-50 text-slate-300" },
  violet: { on: "bg-violet-50 text-violet-800", off: "bg-slate-50 text-slate-300" },
} as const;

function Cell({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: keyof typeof CELL_TONES;
}) {
  const tone = CELL_TONES[color];
  return (
    <div className={`rounded-md py-1 ${value > 0 ? tone.on : tone.off}`}>
      <div className="text-[9px] font-medium uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="text-base font-bold tabular leading-none">{value}</div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-200 px-0.5 text-[var(--color-sox-navy)]">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
