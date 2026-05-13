"use client";

import { useMemo, useState } from "react";
import type { PitcherStats } from "@/lib/types";

type SortKey =
  | "name"
  | "appearances"
  | "totalWalks"
  | "fourPitchWalks"
  | "ohTwoWalks"
  | "leadoffWalks"
  | "twoOutWalks";

type SortDir = "asc" | "desc";

const COLUMNS: Array<{ key: SortKey; label: string; align?: "left" | "right" }> = [
  { key: "name", label: "Pitcher", align: "left" },
  { key: "appearances", label: "Apps", align: "right" },
  { key: "totalWalks", label: "Walks", align: "right" },
  { key: "fourPitchWalks", label: "4-Pitch", align: "right" },
  { key: "ohTwoWalks", label: "0-2 → BB", align: "right" },
  { key: "leadoffWalks", label: "Leadoff", align: "right" },
  { key: "twoOutWalks", label: "2-Out", align: "right" },
];

export function PitcherTable({ pitchers }: { pitchers: PitcherStats[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("totalWalks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const rows = [...pitchers];
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
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

  return (
    <div className="overflow-x-auto">
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
              <td className="px-4 py-3 font-medium text-[var(--color-sox-navy)]">
                {p.name}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                {p.appearances}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--color-sox-navy)]">
                {p.totalWalks}
              </td>
              <NumberCell value={p.fourPitchWalks} highlight />
              <NumberCell value={p.ohTwoWalks} highlight />
              <NumberCell value={p.leadoffWalks} />
              <NumberCell value={p.twoOutWalks} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NumberCell({
  value,
  highlight = false,
}: {
  value: number;
  highlight?: boolean;
}) {
  const intense = highlight && value > 0;
  return (
    <td
      className={`px-4 py-3 text-right tabular-nums ${
        intense
          ? "font-semibold text-[var(--color-sox-red)]"
          : value > 0
            ? "text-slate-700"
            : "text-slate-300"
      }`}
    >
      {value}
    </td>
  );
}
