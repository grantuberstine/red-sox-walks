"use client";

import { useMemo, useState } from "react";
import type {
  PitcherStats,
  StrikeoutRecord,
  StrikeoutType,
  WalkRecord,
  WalkType,
} from "@/lib/types";
import { achievementById } from "@/lib/achievements";
import { inningsPitched, strikeoutsPerNine, walksPerNine } from "@/lib/filters";
import { PitcherAvatar } from "./components/PitcherAvatar";

type Mode = "walks" | "strikeouts";

type WalkSortKey =
  | "name"
  | "appearances"
  | "inningsPitched"
  | "totalWalks"
  | "fourPitchWalks"
  | "ohTwoWalks"
  | "leadoffWalks"
  | "twoOutWalks"
  | "walksPerNine";

type KSortKey =
  | "name"
  | "appearances"
  | "inningsPitched"
  | "totalStrikeouts"
  | "threePitchStrikeouts"
  | "sideStrikeouts"
  | "ksPerNine";

type SortDir = "asc" | "desc";

const WALK_COLS: Array<{ key: WalkSortKey; label: string; align?: "left" | "right" }> = [
  { key: "name", label: "Pitcher", align: "left" },
  { key: "inningsPitched", label: "IP", align: "right" },
  { key: "totalWalks", label: "Walks", align: "right" },
  { key: "walksPerNine", label: "BB/9", align: "right" },
  { key: "fourPitchWalks", label: "4-Pitch", align: "right" },
  { key: "ohTwoWalks", label: "0-2", align: "right" },
  { key: "leadoffWalks", label: "Leadoff", align: "right" },
  { key: "twoOutWalks", label: "2-Out", align: "right" },
];

const K_COLS: Array<{ key: KSortKey; label: string; align?: "left" | "right" }> = [
  { key: "name", label: "Pitcher", align: "left" },
  { key: "inningsPitched", label: "IP", align: "right" },
  { key: "totalStrikeouts", label: "Strikeouts", align: "right" },
  { key: "ksPerNine", label: "K/9", align: "right" },
  { key: "threePitchStrikeouts", label: "3-Pitch", align: "right" },
  { key: "sideStrikeouts", label: "3-Up-3-Dn", align: "right" },
];

const WALK_TAG_COLORS: Record<WalkType, string> = {
  fourPitch: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300",
  ohTwo: "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300",
  leadoff: "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300",
  twoOut: "bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300",
};
const WALK_TAG_LABELS: Record<WalkType, string> = {
  fourPitch: "4P",
  ohTwo: "0-2",
  leadoff: "LO",
  twoOut: "2O",
};
const K_TAG_COLORS: Record<StrikeoutType, string> = {
  threePitch: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300",
  side: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300",
};
const K_TAG_LABELS: Record<StrikeoutType, string> = {
  threePitch: "3P",
  side: "side",
};

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
    mode === "walks" ? "totalWalks" : "totalStrikeouts";
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
        return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const valOf = (p: PitcherStats): number => {
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
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`inline-flex items-center gap-1 transition ${
                        active
                          ? "text-[var(--text)]"
                          : "hover:text-[var(--text)]"
                      }`}
                    >
                      <span>{col.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
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
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <span>Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => onSort(e.target.value as WalkSortKey | KSortKey)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium normal-case tracking-normal text-[var(--text-secondary)]"
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
            return (
              <li key={p.pitcherId}>
                <button
                  type="button"
                  onClick={() => toggleExpand(p.pitcherId)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[var(--surface-subtle)]"
                >
                  <PitcherAvatar
                    name={p.name}
                    src={p.headshotUrl}
                    size={44}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-[var(--text)]">
                        {p.name}
                      </span>
                      <span className="text-xl font-bold tabular text-[var(--text)]">
                        {mode === "walks" ? p.totalWalks : p.totalStrikeouts}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      <span className="tabular">{inningsPitched(p)} IP</span>
                      <span>·</span>
                      <span className="tabular">
                        {mode === "walks"
                          ? `${fmtRate(walksPerNine(p))} BB/9`
                          : `${fmtRate(strikeoutsPerNine(p))} K/9`}
                      </span>
                      <span className="ml-auto text-[10px]">
                        {open ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                </button>
                <div className="px-4 pb-3">
                  {mode === "walks" ? (
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                      <Pill label="4P" value={p.fourPitchWalks} classes="bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300" />
                      <Pill label="0-2" value={p.ohTwoWalks} classes="bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300" />
                      <Pill label="Lead" value={p.leadoffWalks} classes="bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300" />
                      <Pill label="2-Out" value={p.twoOutWalks} classes="bg-violet-50 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                      <Pill label="3-Pitch" value={p.threePitchStrikeouts} classes="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" />
                      <Pill label="Sat-Side" value={p.sideStrikeouts} classes="bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300" />
                    </div>
                  )}
                </div>
                {open && (
                  <div className="border-t border-[var(--border)] bg-[var(--surface-subtle)]/50 px-4 py-3">
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
        className={`cursor-pointer border-b border-[var(--border)] last:border-0 transition hover:bg-[var(--color-sox-navy)]/5 ${
          idx % 2 === 1 ? "bg-[var(--row-stripe)]" : ""
        } ${open ? "bg-[var(--surface-subtle)]" : ""}`}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-3">
            <PitcherAvatar name={p.name} src={p.headshotUrl} size={32} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium text-[var(--text)]">
                  {p.name}
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">{open ? "▲" : "▼"}</span>
              </div>
              {p.achievements.length > 0 && (
                <div className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                  {p.achievements
                    .slice(0, 3)
                    .map((id) => achievementById(id)?.label)
                    .filter(Boolean)
                    .join(" · ")}
                  {p.achievements.length > 3 && ` +${p.achievements.length - 3}`}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-2.5 text-right tabular text-[var(--text-secondary)]">
          {inningsPitched(p)}
        </td>
        {mode === "walks" ? (
          <>
            <td className="px-4 py-2.5 text-right text-base font-bold tabular text-[var(--text)]">
              {p.totalWalks}
            </td>
            <td className="px-4 py-2.5 text-right tabular text-[var(--text-secondary)]">
              {fmtRate(walksPerNine(p))}
            </td>
            <NumberCell value={p.fourPitchWalks} color="text-[var(--text)]" />
            <NumberCell value={p.ohTwoWalks} color="text-[var(--text)]" />
            <NumberCell value={p.leadoffWalks} color="text-[var(--text)]" />
            <NumberCell value={p.twoOutWalks} color="text-[var(--text)]" />
          </>
        ) : (
          <>
            <td className="px-4 py-2.5 text-right text-base font-bold tabular text-[var(--text)]">
              {p.totalStrikeouts}
            </td>
            <td className="px-4 py-2.5 text-right tabular text-[var(--text-secondary)]">
              {fmtRate(strikeoutsPerNine(p))}
            </td>
            <NumberCell value={p.threePitchStrikeouts} color="text-[var(--text)]" />
            <NumberCell value={p.sideStrikeouts} color="text-[var(--text)]" />
          </>
        )}
      </tr>
      {open && (
        <tr className="bg-[var(--surface-subtle)]">
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
    <div className="space-y-2">
      <AchievementBadges achievements={p.achievements} />
      <ul className="divide-y divide-[var(--border)] rounded-lg bg-[var(--surface)] text-xs ring-1 ring-slate-200">
        {walks.slice(0, 25).map((w, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-[64px] shrink-0 text-[11px] font-medium text-[var(--text-secondary)]">
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
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${WALK_TAG_COLORS[t]}`}
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
    </div>
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
    <div className="space-y-2">
      <AchievementBadges achievements={p.achievements} />
      <ul className="divide-y divide-[var(--border)] rounded-lg bg-[var(--surface)] text-xs ring-1 ring-slate-200">
        {strikeouts.slice(0, 25).map((s, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-[64px] shrink-0 text-[11px] font-medium text-[var(--text-secondary)]">
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
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${K_TAG_COLORS[t]}`}
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
    </div>
  );
}

function AchievementBadges({ achievements }: { achievements: string[] }) {
  if (achievements.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {achievements.map((id) => {
        const a = achievementById(id);
        if (!a) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] ring-1 ring-inset ring-slate-200"
          >
            <span>{a.emoji}</span>
            <span>{a.label}</span>
          </span>
        );
      })}
    </div>
  );
}

function NumberCell({ value, color }: { value: number; color: string }) {
  return (
    <td
      className={`px-4 py-2.5 text-right tabular ${
        value > 0 ? `font-semibold ${color}` : "text-[var(--text-muted)]/60"
      }`}
    >
      {value}
    </td>
  );
}

function Pill({ label, value, classes }: { label: string; value: number; classes: string }) {
  return (
    <div className={`rounded-md px-2 py-1.5 ${value > 0 ? classes : "bg-[var(--surface-hover)] text-[var(--text-muted)]/60"}`}>
      <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="mt-0.5 text-base font-bold tabular leading-none">{value}</div>
    </div>
  );
}
