"use client";

import { useMemo, useState } from "react";
import type { PitcherStats } from "@/lib/types";
import { achievementById } from "@/lib/achievements";
import { PitcherAvatar } from "./components/PitcherAvatar";

type SortKey =
  | "name"
  | "appearances"
  | "totalWalks"
  | "fourPitchWalks"
  | "ohTwoWalks"
  | "leadoffWalks"
  | "twoOutWalks"
  | "walksPerApp";

type SortDir = "asc" | "desc";

const COLUMNS: Array<{ key: SortKey; label: string; align?: "left" | "right" }> = [
  { key: "name", label: "Pitcher", align: "left" },
  { key: "appearances", label: "Apps", align: "right" },
  { key: "totalWalks", label: "BB", align: "right" },
  { key: "walksPerApp", label: "BB/App", align: "right" },
  { key: "fourPitchWalks", label: "4-Pitch", align: "right" },
  { key: "ohTwoWalks", label: "0-2", align: "right" },
  { key: "leadoffWalks", label: "Leadoff", align: "right" },
  { key: "twoOutWalks", label: "2-Out", align: "right" },
];

function rate(p: PitcherStats): number {
  if (p.appearances === 0) return 0;
  return p.totalWalks / p.appearances;
}

function fmtRate(n: number): string {
  return n === 0 ? "—" : n.toFixed(2);
}

export function PitcherTable({ pitchers }: { pitchers: PitcherStats[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("totalWalks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const sorted = useMemo(() => {
    const rows = [...pitchers];
    rows.sort((a, b) => {
      const av = sortKey === "walksPerApp" ? rate(a) : a[sortKey];
      const bv = sortKey === "walksPerApp" ? rate(b) : b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return sortDir === "asc" ? an - bn : bn - an;
    });
    return rows;
  }, [pitchers, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`inline-flex items-center gap-1 transition ${
                        active
                          ? "text-[var(--color-sox-navy)]"
                          : "hover:text-[var(--color-sox-navy)]"
                      }`}
                    >
                      <span>{col.label}</span>
                      <span className="text-[10px] text-slate-400">
                        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, idx) => (
              <tr
                key={p.pitcherId}
                className={`border-b border-slate-100 last:border-0 ${
                  idx % 2 === 1 ? "bg-slate-50/30" : ""
                }`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <PitcherAvatar
                      name={p.name}
                      src={p.headshotUrl}
                      size={32}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-[var(--color-sox-navy)]">
                        {p.name}
                      </div>
                      {p.achievements.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-0.5">
                          {p.achievements.slice(0, 6).map((id) => {
                            const a = achievementById(id);
                            if (!a) return null;
                            return (
                              <span
                                key={id}
                                title={`${a.label}: ${a.description}`}
                                className="text-[11px] leading-none"
                              >
                                {a.emoji}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular text-slate-600">
                  {p.appearances}
                </td>
                <td className="px-4 py-2.5 text-right text-base font-bold tabular text-[var(--color-sox-navy)]">
                  {p.totalWalks}
                </td>
                <td className="px-4 py-2.5 text-right tabular text-slate-600">
                  {fmtRate(rate(p))}
                </td>
                <NumberCell value={p.fourPitchWalks} color="text-amber-700" />
                <NumberCell value={p.ohTwoWalks} color="text-rose-700" />
                <NumberCell value={p.leadoffWalks} color="text-sky-700" />
                <NumberCell value={p.twoOutWalks} color="text-violet-700" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <span>Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium normal-case tracking-normal text-slate-700"
          >
            {COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <ul className="divide-y divide-slate-100">
          {sorted.map((p) => {
            const open = expanded.has(p.pitcherId);
            return (
              <li key={p.pitcherId} className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleExpand(p.pitcherId)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <PitcherAvatar
                    name={p.name}
                    src={p.headshotUrl}
                    size={44}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-[var(--color-sox-navy)]">
                        {p.name}
                      </span>
                      <span className="text-xl font-bold tabular text-[var(--color-sox-navy)]">
                        {p.totalWalks}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="tabular">{p.appearances} apps</span>
                      <span>·</span>
                      <span className="tabular">{fmtRate(rate(p))} BB/app</span>
                    </div>
                  </div>
                </button>
                <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[11px]">
                  <Pill
                    label="4P"
                    value={p.fourPitchWalks}
                    classes="bg-amber-50 text-amber-800"
                  />
                  <Pill
                    label="0-2"
                    value={p.ohTwoWalks}
                    classes="bg-rose-50 text-rose-800"
                  />
                  <Pill
                    label="Lead"
                    value={p.leadoffWalks}
                    classes="bg-sky-50 text-sky-800"
                  />
                  <Pill
                    label="2-Out"
                    value={p.twoOutWalks}
                    classes="bg-violet-50 text-violet-800"
                  />
                </div>
                {open && p.achievements.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.achievements.map((id) => {
                      const a = achievementById(id);
                      if (!a) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 ring-1 ring-inset ring-slate-200"
                        >
                          <span>{a.emoji}</span>
                          <span>{a.label}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

function NumberCell({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <td
      className={`px-4 py-2.5 text-right tabular ${
        value > 0 ? `font-semibold ${color}` : "text-slate-300"
      }`}
    >
      {value}
    </td>
  );
}

function Pill({
  label,
  value,
  classes,
}: {
  label: string;
  value: number;
  classes: string;
}) {
  return (
    <div
      className={`rounded-md px-2 py-1.5 ${value > 0 ? classes : "bg-slate-50 text-slate-300"}`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="mt-0.5 text-base font-bold tabular leading-none">
        {value}
      </div>
    </div>
  );
}
