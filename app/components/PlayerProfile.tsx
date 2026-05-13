"use client";

import { useMemo } from "react";
import type {
  AppearanceVelo,
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
import { computeFundReport, formatMoney } from "@/lib/fund";
import { PitcherAvatar } from "./PitcherAvatar";

const FIP_CONSTANT = 3.1;

function formatIp(outs: number): string {
  if (!outs) return "—";
  const innings = Math.floor(outs / 3);
  const rem = outs % 3;
  return `${innings}.${rem}`;
}

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
  appearances,
  onBack,
}: {
  pitcher: PitcherStats;
  walks: WalkRecord[];
  strikeouts: StrikeoutRecord[];
  appearances: AppearanceVelo[];
  onBack: () => void;
}) {
  const fundReport = useMemo(
    () => computeFundReport(walks, strikeouts, { [pitcher.pitcherId]: pitcher }),
    [walks, strikeouts, pitcher],
  );
  const entry = fundReport.entries.find((e) => e.pitcherId === pitcher.pitcherId);
  const fees = entry?.feesOwed ?? 0;

  const playerWalks = useMemo(
    () => walks.filter((w) => w.pitcherId === pitcher.pitcherId),
    [walks, pitcher.pitcherId],
  );
  const playerKs = useMemo(
    () => strikeouts.filter((s) => s.pitcherId === pitcher.pitcherId),
    [strikeouts, pitcher.pitcherId],
  );

  const seasonLine = useMemo(() => {
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
    const ipDecimal = t.outs / 3;
    const era = t.outs > 0 ? (t.earnedRuns * 27) / t.outs : null;
    const fip =
      t.outs > 0
        ? (13 * t.homeRuns + 3 * (t.walks + t.hitByPitch) - 2 * t.strikeouts) /
            ipDecimal +
          FIP_CONSTANT
        : null;
    const whip = t.outs > 0 ? (t.walks + t.hits) / ipDecimal : null;
    return { ...t, era, fip, whip };
  }, [appearances]);

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
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <PitcherAvatar name={pitcher.name} src={pitcher.headshotUrl} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight text-[var(--text)]">
              {pitcher.name}
            </h1>
            <a
              href={`https://www.mlb.com/player/${pitcher.pitcherId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] underline-offset-2 transition hover:text-[var(--color-sox-red)] hover:underline"
            >
              MLB.com profile
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          <StatCard
            label="IP"
            value={
              seasonLine.outs > 0
                ? formatIp(seasonLine.outs)
                : inningsPitched(pitcher)
            }
          />
          <StatCard label="K" value={pitcher.totalStrikeouts} />
          <StatCard label="BB" value={pitcher.totalWalks} />
          <StatCard label="H" value={seasonLine.hits} />
          <StatCard label="HR" value={seasonLine.homeRuns} />
          <StatCard
            label="ERA"
            value={seasonLine.era !== null ? seasonLine.era.toFixed(2) : "—"}
          />
          <StatCard
            label="WHIP"
            value={seasonLine.whip !== null ? seasonLine.whip.toFixed(2) : "—"}
          />
          <StatCard
            label="FIP"
            value={seasonLine.fip !== null ? seasonLine.fip.toFixed(2) : "—"}
          />
          <StatCard
            label="K/9"
            value={pitcher.outsRecorded > 0 ? fmt(strikeoutsPerNine(pitcher)) : "—"}
          />
          <StatCard
            label="BB/9"
            value={pitcher.outsRecorded > 0 ? fmt(walksPerNine(pitcher)) : "—"}
          />
        </div>

        <div className="mt-4">
          <MoneyCard
            label="Owes the Fund"
            value={formatMoney(fees)}
            sub="$1 per walk category"
            tone="rose"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Walk Breakdown">
          <CategoryRow
            label="4-Pitch walks"
            value={pitcher.fourPitchWalks}
            tone="walk"
          />
          <CategoryRow
            label="0-2 walks"
            value={pitcher.ohTwoWalks}
            tone="walk"
          />
          <CategoryRow
            label="Leadoff walks"
            value={pitcher.leadoffWalks}
            tone="walk"
          />
          <CategoryRow
            label="2-out walks"
            value={pitcher.twoOutWalks}
            tone="walk"
          />
        </Card>

        <Card title="Strikeout Breakdown">
          <CategoryRow
            label="3-pitch strikeouts"
            value={pitcher.threePitchStrikeouts}
            tone="k"
          />
          <CategoryRow
            label="3-up-3-down innings"
            value={pitcher.sideStrikeouts}
            tone="k"
          />
        </Card>
      </section>

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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-2.5 py-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular leading-none text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function MoneyCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "rose" | "emerald";
}) {
  const valueColor =
    tone === "rose"
      ? "text-[var(--color-sox-red)]"
      : "text-emerald-700 dark:text-emerald-400";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </div>
      <div className={`mt-1 text-3xl font-bold tabular leading-none ${valueColor}`}>
        {value}
      </div>
      <div className="mt-1.5 truncate text-[11px] text-[var(--text-muted)]">
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
  tone: "walk" | "k";
}) {
  const dot =
    tone === "walk"
      ? "bg-[var(--color-sox-red)] dark:bg-rose-400"
      : "bg-emerald-500 dark:bg-emerald-400";
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
