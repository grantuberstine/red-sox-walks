"use client";

import { useMemo } from "react";
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
import { achievementById } from "@/lib/achievements";
import { computeFundReport, formatMoney } from "@/lib/fund";
import { PitcherAvatar } from "./PitcherAvatar";

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
  side: "3-Up",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

function fmt(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  return n.toFixed(2);
}

export function PlayerProfile({
  pitcher,
  walks,
  strikeouts,
  onBack,
  rangeLabel,
}: {
  pitcher: PitcherStats;
  walks: WalkRecord[];
  strikeouts: StrikeoutRecord[];
  onBack: () => void;
  rangeLabel: string;
}) {
  const fundReport = useMemo(
    () => computeFundReport(walks, strikeouts, { [pitcher.pitcherId]: pitcher }),
    [walks, strikeouts, pitcher],
  );
  const entry = fundReport.entries.find((e) => e.pitcherId === pitcher.pitcherId);
  const fees = entry?.feesOwed ?? 0;
  const bonus = entry?.bonusEarned ?? 0;

  const playerWalks = useMemo(
    () => walks.filter((w) => w.pitcherId === pitcher.pitcherId),
    [walks, pitcher.pitcherId],
  );
  const playerKs = useMemo(
    () => strikeouts.filter((s) => s.pitcherId === pitcher.pitcherId),
    [strikeouts, pitcher.pitcherId],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to gallery
        </button>
        <span className="text-[11px] text-[var(--text-muted)]">{rangeLabel}</span>
      </div>

      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-sox-navy)] via-[var(--color-sox-ink)] to-[#1d2f4b] p-5 text-white shadow-md sm:p-6">
        <div className="flex items-center gap-4">
          <PitcherAvatar name={pitcher.name} src={pitcher.headshotUrl} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight">{pitcher.name}</h1>
            <p className="mt-1 text-xs text-white/70">
              {inningsPitched(pitcher)} IP · {pitcher.appearances} appearances
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Walks"
            value={pitcher.totalWalks}
            sub={`${fmt(walksPerNine(pitcher))} BB/9`}
            tone="rose"
          />
          <Stat
            label="Owes the fund"
            value={formatMoney(fees)}
            sub="From walks"
            tone="rose"
          />
          <Stat
            label="Strikeouts"
            value={pitcher.totalStrikeouts}
            sub={`${fmt(strikeoutsPerNine(pitcher))} K/9`}
            tone="emerald"
          />
          <Stat
            label="Coaches owe"
            value={formatMoney(bonus)}
            sub="From K's"
            tone="emerald"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Walk Breakdown">
          <CategoryRow
            label="4-Pitch walks"
            value={pitcher.fourPitchWalks}
            tone="amber"
          />
          <CategoryRow
            label="0-2 walks"
            value={pitcher.ohTwoWalks}
            tone="rose"
          />
          <CategoryRow
            label="Leadoff walks"
            value={pitcher.leadoffWalks}
            tone="sky"
          />
          <CategoryRow
            label="2-out walks"
            value={pitcher.twoOutWalks}
            tone="violet"
          />
        </Card>

        <Card title="Strikeout Breakdown">
          <CategoryRow
            label="3-pitch strikeouts"
            value={pitcher.threePitchStrikeouts}
            tone="emerald"
          />
          <CategoryRow
            label="3-up-3-down innings"
            value={pitcher.sideStrikeouts}
            tone="indigo"
          />
        </Card>
      </section>

      {pitcher.achievements.length > 0 && (
        <Card title="Achievements">
          <div className="flex flex-wrap gap-1.5">
            {pitcher.achievements.map((id) => {
              const a = achievementById(id);
              if (!a) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] ring-1 ring-inset ring-slate-200"
                >
                  {a.label}
                </span>
              );
            })}
          </div>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title={`Walk Log (${playerWalks.length})`}>
          {playerWalks.length === 0 ? (
            <Empty text="No walks recorded in this range." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {playerWalks.slice(0, 50).map((w, i) => (
                <li key={i} className="flex items-center gap-2 px-1 py-2 text-xs">
                  <span className="w-12 shrink-0 font-medium tabular text-[var(--text-muted)]">
                    {formatDate(w.date)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">
                    vs <span className="font-medium">{w.batterName}</span>
                    <span className="ml-1 text-[var(--text-muted)]">
                      ({w.opponent} · {w.halfInning === "top" ? "T" : "B"}
                      {w.inning} · {w.finalCount.balls}-{w.finalCount.strikes})
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {w.tags.map((t) => (
                      <span
                        key={t}
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${WALK_TAG_COLORS[t]}`}
                      >
                        {WALK_TAG_LABELS[t]}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
              {playerWalks.length > 50 && (
                <li className="py-2 text-center text-[10px] text-[var(--text-muted)]">
                  + {playerWalks.length - 50} more
                </li>
              )}
            </ul>
          )}
        </Card>

        <Card title={`Strikeout Log (${playerKs.length})`}>
          {playerKs.length === 0 ? (
            <Empty text="No strikeouts recorded in this range." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {playerKs.slice(0, 50).map((s, i) => (
                <li key={i} className="flex items-center gap-2 px-1 py-2 text-xs">
                  <span className="w-12 shrink-0 font-medium tabular text-[var(--text-muted)]">
                    {formatDate(s.date)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">
                    <span className="font-medium">{s.batterName}</span>
                    <span className="ml-1 text-[var(--text-muted)]">
                      ({s.opponent} · {s.halfInning === "top" ? "T" : "B"}
                      {s.inning} · {s.pitchesInPA}p)
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${K_TAG_COLORS[t]}`}
                      >
                        {K_TAG_LABELS[t]}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
              {playerKs.length > 50 && (
                <li className="py-2 text-center text-[10px] text-[var(--text-muted)]">
                  + {playerKs.length - 50} more
                </li>
              )}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub: string;
  tone?: "neutral" | "gold" | "rose" | "emerald";
}) {
  const valueClass = {
    neutral: "text-white",
    gold: "text-[var(--color-woo-gold)]",
    rose: "text-rose-200",
    emerald: "text-emerald-200",
  }[tone];
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular leading-none ${valueClass}`}>
        {value}
      </div>
      <div className="mt-1 truncate text-[10px] uppercase tracking-wider text-white/60">
        {sub}
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="border-b border-[var(--border)] px-4 py-2.5">
        <h3 className="text-sm font-bold text-[var(--text)]">
          {title}
        </h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function CategoryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "rose" | "sky" | "violet" | "emerald" | "indigo";
}) {
  const dot = {
    amber: "bg-amber-400",
    rose: "bg-rose-400",
    sky: "bg-sky-400",
    violet: "bg-violet-400",
    emerald: "bg-emerald-400",
    indigo: "bg-indigo-400",
  }[tone];
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span>{label}</span>
      </div>
      <span
        className={`tabular font-bold ${value > 0 ? "text-[var(--text)]" : "text-[var(--text-muted)]/60"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-6 text-center text-xs text-[var(--text-muted)]">{text}</div>;
}
