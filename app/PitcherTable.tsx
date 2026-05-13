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
import { PitcherAvatar } from "./components/PitcherAvatar";

type Mode = "walks" | "strikeouts";

type WalkSortKey =
  | "name"
  | "appearances"
  | "totalWalks"
  | "fourPitchWalks"
  | "ohTwoWalks"
  | "leadoffWalks"
  | "twoOutWalks"
  | "walksPerApp";

type KSortKey =
  | "name"
  | "appearances"
  | "totalStrikeouts"
  | "threePitchStrikeouts"
  | "sideStrikeouts"
  | "ksPerApp";

type SortDir = "asc" | "desc";

const WALK_COLS: Array<{ key: WalkSortKey; label: string; align?: "left" | "right" }> = [
  { key: "name", label: "Pitcher", align: "left" },
  { key: "appearances", label: "Apps", align: "right" },
  { key: "totalWalks", label: "BB", align: "right" },
  { key: "walksPerApp", label: "BB/App", align: "right" },
  { key: "fourPitchWalks", label: "4-Pitch", align: "right" },
  { key: "ohTwoWalks", label: "0-2", align: "right" },
  { key: "leadoffWalks", label: "Leadoff", align: "right" },
  { key: "twoOutWalks", label: "2-Out", align: "right" },
];

const K_COLS: Array<{ key: KSortKey; label: string; align?: "left" | "right" }> = [
  { key: "name", label: "Pitcher", align: "left" },
  { key: "appearances", label: "Apps", align: "right" },
  { key: "totalStrikeouts", label: "K", align: "right" },
  { key: "ksPerApp", label: "K/App", align: "right" },
  { key: "threePitchStrikeouts", label: "3-Pitch", align: "right" },
  { key: "sideStrikeouts", label: "Sat-Side", align: "right" },
];

const WALK_TAG_COLORS: Record<WalkType, string> = {
  fourPitch: "bg-amber-100 text-amber-800",
  ohTwo: "bg-rose-100 text-rose-800",
  leadoff: "bg-sky-100 text-sky-800",
  twoOut: "bg-violet-100 text-violet-800",
};
const WALK_TAG_LABELS: Record<WalkType, string> = {
  fourPitch: "4P",
  ohTwo: "0-2",
  leadoff: "LO",
  twoOut: "2O",
};
const K_TAG_COLORS: Record<StrikeoutType, string> = {
  threePitch: "bg-emerald-100 text-emerald-800",
  side: "bg-indigo-100 text-indigo-800",
};
const K_TAG_LABELS: Record<StrikeoutType, string> = {
  threePitch: "3P",
  side: "side",
};

function walkRate(p: PitcherStats) {
  return p.appearances === 0 ? 0 : p.totalWalks / p.appearances;
}
function kRate(p: PitcherStats) {
  return p.appearances === 0 ? 0 : p.totalStrikeouts / p.appearances;
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
}: {
  pitchers: PitcherStats[];
  allWalks?: WalkRecord[];
  allStrikeouts?: StrikeoutRecord[];
  mode?: Mode;
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
      const av =
        sortKey === "walksPerApp"
          ? walkRate(a)
          : sortKey === "ksPerApp"
            ? kRate(a)
            : (a[sortKey as keyof PitcherStats] as number);
      const bv =
        sortKey === "walksPerApp"
          ? walkRate(b)
          : sortKey === "ksPerApp"
            ? kRate(b)
            : (b[sortKey as keyof PitcherStats] as number);
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
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
    setExpanded((cur) => (cur === id ? null : id));
  };

  return (
    <>
      <div className="hidden md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              {cols.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
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
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <span>Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => onSort(e.target.value as WalkSortKey | KSortKey)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium normal-case tracking-normal text-slate-700"
          >
            {cols.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <ul className="divide-y divide-slate-100">
          {sorted.map((p) => {
            const open = expanded === p.pitcherId;
            return (
              <li key={p.pitcherId}>
                <button
                  type="button"
                  onClick={() => toggleExpand(p.pitcherId)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50"
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
                        {mode === "walks" ? p.totalWalks : p.totalStrikeouts}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="tabular">{p.appearances} apps</span>
                      <span>·</span>
                      <span className="tabular">
                        {mode === "walks"
                          ? `${fmtRate(walkRate(p))} BB/app`
                          : `${fmtRate(kRate(p))} K/app`}
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
                      <Pill label="4P" value={p.fourPitchWalks} classes="bg-amber-50 text-amber-800" />
                      <Pill label="0-2" value={p.ohTwoWalks} classes="bg-rose-50 text-rose-800" />
                      <Pill label="Lead" value={p.leadoffWalks} classes="bg-sky-50 text-sky-800" />
                      <Pill label="2-Out" value={p.twoOutWalks} classes="bg-violet-50 text-violet-800" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                      <Pill label="3-Pitch" value={p.threePitchStrikeouts} classes="bg-emerald-50 text-emerald-800" />
                      <Pill label="Sat-Side" value={p.sideStrikeouts} classes="bg-indigo-50 text-indigo-800" />
                    </div>
                  )}
                </div>
                {open && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
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
        className={`cursor-pointer border-b border-slate-100 last:border-0 transition hover:bg-slate-50 ${
          idx % 2 === 1 ? "bg-slate-50/30" : ""
        } ${open ? "bg-slate-50" : ""}`}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-3">
            <PitcherAvatar name={p.name} src={p.headshotUrl} size={32} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium text-[var(--color-sox-navy)]">
                  {p.name}
                </span>
                <span className="text-[9px] text-slate-400">{open ? "▲" : "▼"}</span>
              </div>
              {p.achievements.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-0.5">
                  {p.achievements.slice(0, 8).map((id) => {
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
        {mode === "walks" ? (
          <>
            <td className="px-4 py-2.5 text-right text-base font-bold tabular text-[var(--color-sox-navy)]">
              {p.totalWalks}
            </td>
            <td className="px-4 py-2.5 text-right tabular text-slate-600">
              {fmtRate(walkRate(p))}
            </td>
            <NumberCell value={p.fourPitchWalks} color="text-amber-700" />
            <NumberCell value={p.ohTwoWalks} color="text-rose-700" />
            <NumberCell value={p.leadoffWalks} color="text-sky-700" />
            <NumberCell value={p.twoOutWalks} color="text-violet-700" />
          </>
        ) : (
          <>
            <td className="px-4 py-2.5 text-right text-base font-bold tabular text-[var(--color-sox-navy)]">
              {p.totalStrikeouts}
            </td>
            <td className="px-4 py-2.5 text-right tabular text-slate-600">
              {fmtRate(kRate(p))}
            </td>
            <NumberCell value={p.threePitchStrikeouts} color="text-emerald-700" />
            <NumberCell value={p.sideStrikeouts} color="text-indigo-700" />
          </>
        )}
      </tr>
      {open && (
        <tr className="bg-slate-50">
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
      <div className="text-center text-xs text-slate-500">
        No walks for {p.name} in current filter.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <AchievementBadges achievements={p.achievements} />
      <ul className="divide-y divide-slate-200 rounded-lg bg-white text-xs ring-1 ring-slate-200">
        {walks.slice(0, 25).map((w, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-[64px] shrink-0 text-[11px] font-medium text-slate-600">
              {formatDate(w.date)}
            </div>
            <div className="min-w-0 flex-1 truncate text-slate-700">
              vs <span className="font-medium">{w.batterName}</span>{" "}
              <span className="text-slate-400">
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
          <li className="px-3 py-2 text-center text-[11px] text-slate-400">
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
      <div className="text-center text-xs text-slate-500">
        No strikeouts for {p.name} in current filter.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <AchievementBadges achievements={p.achievements} />
      <ul className="divide-y divide-slate-200 rounded-lg bg-white text-xs ring-1 ring-slate-200">
        {strikeouts.slice(0, 25).map((s, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-[64px] shrink-0 text-[11px] font-medium text-slate-600">
              {formatDate(s.date)}
            </div>
            <div className="min-w-0 flex-1 truncate text-slate-700">
              <span className="font-medium">{s.batterName}</span>{" "}
              <span className="text-slate-400">
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
          <li className="px-3 py-2 text-center text-[11px] text-slate-400">
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
            className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-700 ring-1 ring-inset ring-slate-200"
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
        value > 0 ? `font-semibold ${color}` : "text-slate-300"
      }`}
    >
      {value}
    </td>
  );
}

function Pill({ label, value, classes }: { label: string; value: number; classes: string }) {
  return (
    <div className={`rounded-md px-2 py-1.5 ${value > 0 ? classes : "bg-slate-50 text-slate-300"}`}>
      <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="mt-0.5 text-base font-bold tabular leading-none">{value}</div>
    </div>
  );
}
