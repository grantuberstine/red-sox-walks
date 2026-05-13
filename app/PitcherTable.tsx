"use client";

import { useMemo, useState } from "react";
import type {
  PitcherStats,
  StrikeoutRecord,
  StrikeoutType,
  WalkRecord,
  WalkType,
} from "@/lib/types";
import {
  inningsPitched,
  strikeoutsPerNine,
  walksPerNine,
} from "@/lib/filters";
import {
  WALK_FEE_PER_CATEGORY,
  THREE_PITCH_K_BONUS,
  SIDE_K_BONUS,
  formatMoney,
} from "@/lib/fund";
import { PitcherAvatar } from "./components/PitcherAvatar";

type Mode = "walks" | "strikeouts";

type WalkSortKey =
  | "name"
  | "owes"
  | "totalWalks"
  | "fourPitchWalks"
  | "ohTwoWalks"
  | "leadoffWalks"
  | "twoOutWalks"
  | "walksPerNine"
  | "inningsPitched";

type KSortKey =
  | "name"
  | "coachesOwe"
  | "totalStrikeouts"
  | "threePitchStrikeouts"
  | "sideStrikeouts"
  | "ksPerNine"
  | "inningsPitched";

type SortDir = "asc" | "desc";

const WALK_COLS: Array<{ key: WalkSortKey; label: string; align?: "left" | "right" }> = [
  { key: "name", label: "Pitcher", align: "left" },
  { key: "owes", label: "Owes", align: "right" },
  { key: "fourPitchWalks", label: "4-Pitch", align: "right" },
  { key: "ohTwoWalks", label: "0-2", align: "right" },
  { key: "leadoffWalks", label: "Leadoff", align: "right" },
  { key: "twoOutWalks", label: "2-Out", align: "right" },
  { key: "totalWalks", label: "Walks", align: "right" },
  { key: "inningsPitched", label: "IP", align: "right" },
  { key: "walksPerNine", label: "BB/9", align: "right" },
];

const K_COLS: Array<{ key: KSortKey; label: string; align?: "left" | "right" }> = [
  { key: "name", label: "Pitcher", align: "left" },
  { key: "totalStrikeouts", label: "K's", align: "right" },
  { key: "threePitchStrikeouts", label: "3-Pitch", align: "right" },
  { key: "sideStrikeouts", label: "3-Up-3-Dn", align: "right" },
  { key: "inningsPitched", label: "IP", align: "right" },
  { key: "ksPerNine", label: "K/9", align: "right" },
];

const WALK_TAG_LABELS: Record<WalkType, string> = {
  fourPitch: "4P",
  ohTwo: "0-2",
  leadoff: "LO",
  twoOut: "2O",
};
const K_TAG_LABELS: Record<StrikeoutType, string> = {
  threePitch: "3P",
  side: "3-Up",
};

const PILL_WALK = "bg-[var(--color-sox-red)]/10 text-[var(--color-sox-red)] dark:bg-[var(--color-sox-red)]/20 dark:text-rose-200";
const PILL_K = "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";

function feesOwed(p: PitcherStats): number {
  return (
    (p.fourPitchWalks + p.ohTwoWalks + p.leadoffWalks + p.twoOutWalks) *
    WALK_FEE_PER_CATEGORY
  );
}

function coachesOwe(p: PitcherStats): number {
  return (
    p.threePitchStrikeouts * THREE_PITCH_K_BONUS +
    p.sideStrikeouts * SIDE_K_BONUS
  );
}

function fmtRate(n: number) {
  return n === 0 ? "—" : n.toFixed(2);
}

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function PitcherTable({
  pitchers,
  allWalks = [],
  allStrikeouts = [],
  mode = "walks",
  onSelect,
}: {
  pitchers: PitcherStats[];
  allWalks?: WalkRecord[];
  allStrikeouts?: StrikeoutRecord[];
  mode?: Mode;
  onSelect?: (pitcherId: number) => void;
}) {
  const cols = mode === "walks" ? WALK_COLS : K_COLS;
  const defaultSort: WalkSortKey | KSortKey =
    mode === "walks" ? "owes" : "totalStrikeouts";
  const [sortKey, setSortKey] = useState<WalkSortKey | KSortKey>(defaultSort);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<number | null>(null);

  const walksByPitcher = useMemo(() => {
    const m = new Map<number, WalkRecord[]>();
    for (const w of allWalks) {
      if (!m.has(w.pitcherId)) m.set(w.pitcherId, []);
      m.get(w.pitcherId)!.push(w);
    }
    return m;
  }, [allWalks]);

  const ksByPitcher = useMemo(() => {
    const m = new Map<number, StrikeoutRecord[]>();
    for (const s of allStrikeouts) {
      if (!m.has(s.pitcherId)) m.set(s.pitcherId, []);
      m.get(s.pitcherId)!.push(s);
    }
    return m;
  }, [allStrikeouts]);

  const sorted = useMemo(() => {
    const rows = [...pitchers];
    rows.sort((a, b) => {
      if (sortKey === "name") {
        return sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const valOf = (p: PitcherStats): number => {
        if (sortKey === "owes") return feesOwed(p);
        if (sortKey === "coachesOwe") return coachesOwe(p);
        if (sortKey === "walksPerNine") return walksPerNine(p);
        if (sortKey === "ksPerNine") return strikeoutsPerNine(p);
        if (sortKey === "inningsPitched") return p.outsRecorded;
        return Number(p[sortKey as keyof PitcherStats]);
      };
      const av = valOf(a);
      const bv = valOf(b);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [pitchers, sortKey, sortDir]);

  const onSort = (key: WalkSortKey | KSortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const toggleExpand = (id: number) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    setExpanded((cur) => (cur === id ? null : id));
  };

  return (
    <>
      <div className="hidden md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
              {cols.map((col) => {
                const active = sortKey === col.key;
                const isMoney = col.key === "owes" || col.key === "coachesOwe";
                return (
                  <th
                    key={col.key}
                    className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${
                      isMoney
                        ? "border-r border-[var(--border-strong)] " +
                          (mode === "walks"
                            ? "text-[var(--color-sox-red)]"
                            : "text-emerald-700 dark:text-emerald-300")
                        : "text-[var(--text-secondary)]"
                    } ${col.align === "right" ? "text-right" : "text-left"}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`inline-flex cursor-pointer items-center gap-1 transition ${
                        active ? "text-[var(--text)]" : "hover:text-[var(--text)]"
                      }`}
                    >
                      <span>{col.label}</span>
                      <span className="text-[10px] opacity-50">
                        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, idx) => {
              const open = expanded === p.pitcherId;
              return (
                <PitcherRowDesktop
                  key={p.pitcherId}
                  mode={mode}
                  p={p}
                  idx={idx}
                  open={open}
                  walks={walksByPitcher.get(p.pitcherId) ?? []}
                  strikeouts={ksByPitcher.get(p.pitcherId) ?? []}
                  onToggle={() => toggleExpand(p.pitcherId)}
                  colCount={cols.length}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span>Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => onSort(e.target.value as WalkSortKey | KSortKey)}
            className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium normal-case tracking-normal text-[var(--text-secondary)]"
          >
            {cols.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {sorted.map((p) => {
            const open = expanded === p.pitcherId;
            const primary =
              mode === "walks" ? formatMoney(feesOwed(p)) : `${p.totalStrikeouts}`;
            const primaryColor =
              mode === "walks"
                ? "text-[var(--color-sox-red)]"
                : "text-[var(--text)]";
            return (
              <li key={p.pitcherId}>
                <button
                  type="button"
                  onClick={() => toggleExpand(p.pitcherId)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left active:bg-[var(--surface-hover)]"
                >
                  <PitcherAvatar name={p.name} src={p.headshotUrl} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-[var(--text)]">
                        {p.name}
                      </span>
                      <span className={`text-xl font-bold tabular ${primaryColor}`}>
                        {primary}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      <span className="tabular">
                        {mode === "walks" ? p.totalWalks : p.totalStrikeouts}{" "}
                        {mode === "walks" ? "walks" : "K's"}
                      </span>
                      <span>·</span>
                      <span className="tabular">{inningsPitched(p)} IP</span>
                      <span>·</span>
                      <span className="tabular">
                        {mode === "walks"
                          ? `${fmtRate(walksPerNine(p))} BB/9`
                          : `${fmtRate(strikeoutsPerNine(p))} K/9`}
                      </span>
                      <span className="ml-auto text-[10px]">{open ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </button>
                <div className="px-4 pb-3">
                  {mode === "walks" ? (
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                      <Pill label="4P" value={p.fourPitchWalks} />
                      <Pill label="0-2" value={p.ohTwoWalks} />
                      <Pill label="LO" value={p.leadoffWalks} />
                      <Pill label="2O" value={p.twoOutWalks} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                      <Pill label="3-Pitch" value={p.threePitchStrikeouts} />
                      <Pill label="3-Up-3-Dn" value={p.sideStrikeouts} />
                    </div>
                  )}
                </div>
                {open && (
                  <div className="border-t border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3">
                    {mode === "walks" ? (
                      <WalkDetail p={p} walks={walksByPitcher.get(p.pitcherId) ?? []} />
                    ) : (
                      <KDetail p={p} strikeouts={ksByPitcher.get(p.pitcherId) ?? []} />
                    )}
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

function PitcherRowDesktop({
  mode,
  p,
  idx,
  open,
  walks,
  strikeouts,
  onToggle,
  colCount,
}: {
  mode: Mode;
  p: PitcherStats;
  idx: number;
  open: boolean;
  walks: WalkRecord[];
  strikeouts: StrikeoutRecord[];
  onToggle: () => void;
  colCount: number;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-[var(--border)] last:border-0 transition hover:bg-[var(--surface-hover)] ${
          idx % 2 === 1 ? "bg-[var(--row-stripe)]" : ""
        } ${open ? "bg-[var(--surface-hover)]" : ""}`}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <PitcherAvatar name={p.name} src={p.headshotUrl} size={32} />
            <span className="truncate font-medium text-[var(--text)]">
              {p.name}
            </span>
          </div>
        </td>
        {mode === "walks" ? (
          <>
            <td className="border-r border-[var(--border-strong)] px-3 py-2.5 text-right text-sm font-semibold tabular text-[var(--color-sox-red)]">
              {formatMoney(feesOwed(p))}
            </td>
            <NumberCell value={p.fourPitchWalks} />
            <NumberCell value={p.ohTwoWalks} />
            <NumberCell value={p.leadoffWalks} />
            <NumberCell value={p.twoOutWalks} />
            <td className="px-3 py-2.5 text-right text-sm tabular text-[var(--text)]">
              {p.totalWalks}
            </td>
            <td className="px-3 py-2.5 text-right text-sm tabular text-[var(--text)]">
              {inningsPitched(p)}
            </td>
            <td className="px-3 py-2.5 text-right text-sm tabular text-[var(--text)]">
              {fmtRate(walksPerNine(p))}
            </td>
          </>
        ) : (
          <>
            <td className="px-3 py-2.5 text-right text-sm font-semibold tabular text-[var(--text)]">
              {p.totalStrikeouts}
            </td>
            <NumberCell value={p.threePitchStrikeouts} />
            <NumberCell value={p.sideStrikeouts} />
            <td className="px-3 py-2.5 text-right text-sm tabular text-[var(--text)]">
              {inningsPitched(p)}
            </td>
            <td className="px-3 py-2.5 text-right text-sm tabular text-[var(--text)]">
              {fmtRate(strikeoutsPerNine(p))}
            </td>
          </>
        )}
      </tr>
      {open && (
        <tr className="bg-[var(--surface-hover)]">
          <td colSpan={colCount} className="px-4 py-4">
            {mode === "walks" ? (
              <WalkDetail p={p} walks={walks} />
            ) : (
              <KDetail p={p} strikeouts={strikeouts} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function WalkDetail({ p, walks }: { p: PitcherStats; walks: WalkRecord[] }) {
  if (walks.length === 0) {
    return (
      <div className="text-center text-xs text-[var(--text-muted)]">
        No walks for {p.name} in current filter.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--border)] rounded-lg bg-[var(--surface)] text-xs ring-1 ring-[var(--border)]">
      {walks.slice(0, 25).map((w, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="min-w-[64px] shrink-0 text-[11px] font-medium tabular text-[var(--text-muted)]">
            {formatDate(w.date)}
          </div>
          <div className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">
            vs <span className="font-medium">{w.batterName}</span>{" "}
            <span className="text-[var(--text-muted)]">
              ({w.opponent} · {w.halfInning === "top" ? "T" : "B"}
              {w.inning} · {w.finalCount.balls}-{w.finalCount.strikes},{" "}
              {w.pitchesInPA}p)
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1">
            {w.tags.map((t) => (
              <span
                key={t}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PILL_WALK}`}
              >
                {WALK_TAG_LABELS[t]}
              </span>
            ))}
          </div>
        </li>
      ))}
      {walks.length > 25 && (
        <li className="px-3 py-2 text-center text-[11px] text-[var(--text-muted)]">
          + {walks.length - 25} more
        </li>
      )}
    </ul>
  );
}

function KDetail({
  p,
  strikeouts,
}: {
  p: PitcherStats;
  strikeouts: StrikeoutRecord[];
}) {
  if (strikeouts.length === 0) {
    return (
      <div className="text-center text-xs text-[var(--text-muted)]">
        No strikeouts for {p.name} in current filter.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--border)] rounded-lg bg-[var(--surface)] text-xs ring-1 ring-[var(--border)]">
      {strikeouts.slice(0, 25).map((s, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="min-w-[64px] shrink-0 text-[11px] font-medium tabular text-[var(--text-muted)]">
            {formatDate(s.date)}
          </div>
          <div className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">
            <span className="font-medium">{s.batterName}</span>{" "}
            <span className="text-[var(--text-muted)]">
              ({s.opponent} · {s.halfInning === "top" ? "T" : "B"}
              {s.inning} · {s.pitchesInPA}p)
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1">
            {s.tags.map((t) => (
              <span
                key={t}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PILL_K}`}
              >
                {K_TAG_LABELS[t]}
              </span>
            ))}
          </div>
        </li>
      ))}
      {strikeouts.length > 25 && (
        <li className="px-3 py-2 text-center text-[11px] text-[var(--text-muted)]">
          + {strikeouts.length - 25} more
        </li>
      )}
    </ul>
  );
}

function NumberCell({ value }: { value: number }) {
  return (
    <td
      className={`px-3 py-2.5 text-right text-sm tabular ${
        value > 0 ? "text-[var(--text)]" : "text-[var(--text-muted)]/50"
      }`}
    >
      {value}
    </td>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <div
      className={`rounded-md px-2 py-1.5 ${
        value > 0
          ? "bg-[var(--surface-hover)] text-[var(--text)]"
          : "bg-[var(--surface-hover)]/50 text-[var(--text-muted)]/60"
      }`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">
        {label}
      </div>
      <div className="mt-0.5 text-base font-bold tabular leading-none">
        {value}
      </div>
    </div>
  );
}
