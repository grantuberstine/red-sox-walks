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
import { PitcherAvatar } from "./PitcherAvatar";

type Mode = "walks" | "strikeouts";

type WalkSortKey =
  | "totalWalks"
  | "fourPitchWalks"
  | "ohTwoWalks"
  | "leadoffWalks"
  | "twoOutWalks"
  | "walksPerNine"
  | "inningsPitched"
  | "name";

type KSortKey =
  | "totalStrikeouts"
  | "threePitchStrikeouts"
  | "sideStrikeouts"
  | "ksPerNine"
  | "inningsPitched"
  | "name";

const WALK_SORTS: Array<{ key: WalkSortKey; label: string }> = [
  { key: "totalWalks", label: "Total walks" },
  { key: "walksPerNine", label: "BB / 9" },
  { key: "inningsPitched", label: "Innings pitched" },
  { key: "fourPitchWalks", label: "4-Pitch" },
  { key: "ohTwoWalks", label: "0-2" },
  { key: "leadoffWalks", label: "Leadoff" },
  { key: "twoOutWalks", label: "2-Out" },
  { key: "name", label: "Name (A–Z)" },
];

const K_SORTS: Array<{ key: KSortKey; label: string }> = [
  { key: "totalStrikeouts", label: "Total K's" },
  { key: "ksPerNine", label: "K / 9" },
  { key: "inningsPitched", label: "Innings pitched" },
  { key: "threePitchStrikeouts", label: "3-Pitch" },
  { key: "sideStrikeouts", label: "3-Up-3-Dn" },
  { key: "name", label: "Name (A–Z)" },
];

const WALK_TAG_OUTLINE = "border border-rose-300 text-rose-700 dark:border-rose-400/50 dark:text-rose-300";
const WALK_TAG_COLORS: Record<WalkType, string> = {
  fourPitch: WALK_TAG_OUTLINE,
  ohTwo: WALK_TAG_OUTLINE,
  leadoff: WALK_TAG_OUTLINE,
  twoOut: WALK_TAG_OUTLINE,
};
const WALK_TAG_LABELS: Record<WalkType, string> = {
  fourPitch: "4P",
  ohTwo: "0-2",
  leadoff: "LO",
  twoOut: "2O",
};
const K_TAG_OUTLINE = "border border-emerald-400 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300";
const K_TAG_COLORS: Record<StrikeoutType, string> = {
  threePitch: K_TAG_OUTLINE,
  side: K_TAG_OUTLINE,
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

export function PitcherCards({
  pitchers,
  allWalks = [],
  allStrikeouts = [],
  query = "",
  mode = "walks",
}: {
  pitchers: PitcherStats[];
  allWalks?: WalkRecord[];
  allStrikeouts?: StrikeoutRecord[];
  query?: string;
  mode?: Mode;
}) {
  const sortOptions = mode === "walks" ? WALK_SORTS : K_SORTS;
  const defaultSort: WalkSortKey | KSortKey =
    mode === "walks" ? "totalWalks" : "totalStrikeouts";
  const [sortKey, setSortKey] = useState<WalkSortKey | KSortKey>(defaultSort);
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
      if (sortKey === "name") return a.name.localeCompare(b.name);
      const valOf = (p: PitcherStats): number => {
        if (sortKey === "walksPerNine") return walksPerNine(p);
        if (sortKey === "ksPerNine") return strikeoutsPerNine(p);
        if (sortKey === "inningsPitched") return p.outsRecorded;
        return Number(p[sortKey as keyof PitcherStats]);
      };
      return valOf(b) - valOf(a);
    });
    return rows;
  }, [pitchers, sortKey]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Sort</span>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as WalkSortKey | KSortKey)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]"
        >
          {sortOptions.map((o) => (
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
          const ks = ksByPitcher.get(p.pitcherId) ?? [];
          const primaryNum = mode === "walks" ? p.totalWalks : p.totalStrikeouts;
          const rate =
            mode === "walks" ? walksPerNine(p) : strikeoutsPerNine(p);
          return (
            <div
              key={p.pitcherId}
              className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm transition hover:shadow-md ${
                open ? "ring-2 ring-[var(--color-sox-red)]/30" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(open ? null : p.pitcherId)}
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
                      <span className="truncate font-semibold text-[var(--text)]">
                        <Highlight text={p.name} query={query} />
                      </span>
                      <span className="text-2xl font-bold tabular leading-none text-[var(--text)]">
                        {primaryNum}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                      <span className="tabular">{inningsPitched(p)} IP</span>
                      <span>·</span>
                      <span className="tabular">
                        {fmtRate(rate)} {mode === "walks" ? "BB" : "K"}/9
                      </span>
                    </div>
                  </div>
                </div>
                {mode === "walks" ? (
                  <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                    <Cell label="4P" value={p.fourPitchWalks} color="amber" />
                    <Cell label="0-2" value={p.ohTwoWalks} color="rose" />
                    <Cell label="LO" value={p.leadoffWalks} color="sky" />
                    <Cell label="2O" value={p.twoOutWalks} color="violet" />
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-1 text-center">
                    <Cell label="3-Pitch" value={p.threePitchStrikeouts} color="emerald" />
                    <Cell label="Sat-Side" value={p.sideStrikeouts} color="indigo" />
                  </div>
                )}
                {p.achievements.length > 0 && (
                  <div className="mt-2 truncate text-[10px] text-[var(--text-muted)]">
                    {p.achievements
                      .slice(0, 3)
                      .map((id) => achievementById(id)?.label)
                      .filter(Boolean)
                      .join(" · ")}
                    {p.achievements.length > 3 && ` +${p.achievements.length - 3}`}
                  </div>
                )}
              </button>
              {open && (
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  {mode === "walks" ? (
                    walks.length === 0 ? (
                      <EmptyDetail mode={mode} />
                    ) : (
                      <ul className="space-y-1">
                        {walks.slice(0, 10).map((w, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-hover)] px-2 py-1 text-[11px]"
                          >
                            <span className="font-medium tabular text-[var(--text-secondary)]">
                              {formatDate(w.date)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">
                              <Highlight text={w.batterName} query={query} />
                            </span>
                            <span className="flex gap-0.5">
                              {w.tags.map((t) => (
                                <span
                                  key={t}
                                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${WALK_TAG_COLORS[t]}`}
                                >
                                  {WALK_TAG_LABELS[t]}
                                </span>
                              ))}
                            </span>
                          </li>
                        ))}
                        {walks.length > 10 && (
                          <li className="text-center text-[10px] text-[var(--text-muted)]">
                            + {walks.length - 10} more
                          </li>
                        )}
                      </ul>
                    )
                  ) : ks.length === 0 ? (
                    <EmptyDetail mode={mode} />
                  ) : (
                    <ul className="space-y-1">
                      {ks.slice(0, 10).map((s, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-hover)] px-2 py-1 text-[11px]"
                        >
                          <span className="font-medium tabular text-[var(--text-secondary)]">
                            {formatDate(s.date)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">
                            <Highlight text={s.batterName} query={query} />
                          </span>
                          <span className="flex gap-0.5">
                            {s.tags.map((t) => (
                              <span
                                key={t}
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${K_TAG_COLORS[t]}`}
                              >
                                {K_TAG_LABELS[t]}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                      {ks.length > 10 && (
                        <li className="text-center text-[10px] text-[var(--text-muted)]">
                          + {ks.length - 10} more
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
  amber: { on: "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300", off: "bg-[var(--surface-hover)] text-[var(--text-muted)]/60" },
  rose: { on: "bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300", off: "bg-[var(--surface-hover)] text-[var(--text-muted)]/60" },
  sky: { on: "bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300", off: "bg-[var(--surface-hover)] text-[var(--text-muted)]/60" },
  violet: { on: "bg-violet-50 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300", off: "bg-[var(--surface-hover)] text-[var(--text-muted)]/60" },
  emerald: { on: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300", off: "bg-[var(--surface-hover)] text-[var(--text-muted)]/60" },
  indigo: { on: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300", off: "bg-[var(--surface-hover)] text-[var(--text-muted)]/60" },
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
      <div className="text-[9px] font-medium uppercase tracking-wider opacity-80">{label}</div>
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
      <mark className="rounded bg-yellow-200 px-0.5 text-[var(--text)]">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function EmptyDetail({ mode }: { mode: Mode }) {
  return (
    <div className="text-center text-xs text-[var(--text-muted)]">
      No {mode === "walks" ? "walks" : "strikeouts"} in current filter.
    </div>
  );
}
