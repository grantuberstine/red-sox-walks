"use client";

import { useMemo } from "react";
import type {
  AppearanceVelo,
  PitcherStats,
  SeasonState,
} from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";

const PITCH_TYPE_LABELS: Record<string, string> = {
  FF: "4-Seam",
  FT: "2-Seam",
  SI: "Sinker",
  FC: "Cutter",
  SL: "Slider",
  ST: "Sweeper",
  CU: "Curveball",
  KC: "Knuckle Curve",
  CH: "Changeup",
  FS: "Splitter",
  SV: "Slurve",
  KN: "Knuckleball",
  EP: "Eephus",
  PO: "Pitchout",
};

function labelFor(type: string): string {
  return PITCH_TYPE_LABELS[type] ?? type;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function AnalyticsView({
  state,
  pitcher,
}: {
  state: SeasonState;
  pitcher: PitcherStats | null;
}) {
  const appearances: AppearanceVelo[] = useMemo(() => {
    if (!pitcher) return [];
    return state.velocity[String(pitcher.pitcherId)] ?? [];
  }, [pitcher, state.velocity]);

  const career = useMemo(() => {
    if (appearances.length === 0) {
      return {
        avgVelo: 0,
        maxVelo: 0,
        totalPitches: 0,
        appearances: 0,
        byType: [] as Array<{ type: string; count: number; avgVelo: number; maxVelo: number }>,
      };
    }
    let total = 0;
    let sumVelo = 0;
    let max = 0;
    const byTypeAcc = new Map<string, { count: number; sumVelo: number; maxVelo: number }>();
    for (const a of appearances) {
      total += a.pitchCount;
      sumVelo += a.avgVelo * a.pitchCount;
      if (a.maxVelo > max) max = a.maxVelo;
      for (const t of a.byType) {
        const cur = byTypeAcc.get(t.type) ?? { count: 0, sumVelo: 0, maxVelo: 0 };
        cur.count += t.count;
        cur.sumVelo += t.avgVelo * t.count;
        if (t.maxVelo > cur.maxVelo) cur.maxVelo = t.maxVelo;
        byTypeAcc.set(t.type, cur);
      }
    }
    const byType = [...byTypeAcc.entries()]
      .map(([type, v]) => ({
        type,
        count: v.count,
        avgVelo: v.sumVelo / Math.max(1, v.count),
        maxVelo: v.maxVelo,
      }))
      .sort((a, b) => b.count - a.count);
    return {
      avgVelo: sumVelo / Math.max(1, total),
      maxVelo: max,
      totalPitches: total,
      appearances: appearances.length,
      byType,
    };
  }, [appearances]);

  if (!pitcher || appearances.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--text-muted)]">
        {pitcher
          ? `No velocity data tracked for ${pitcher.name} in this season.`
          : "No velocity data yet. Once games are processed, this view will populate."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <PitcherAvatar
            name={pitcher.name}
            src={pitcher.headshotUrl}
            size={64}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[var(--text)]">
              {pitcher.name}
            </h1>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              {career.appearances}{" "}
              {career.appearances === 1 ? "outing" : "outings"} ·{" "}
              {career.totalPitches} pitches tracked
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <BigStat
            label="Avg velocity"
            value={career.avgVelo.toFixed(1)}
            suffix="mph"
          />
          <BigStat
            label="Max velocity"
            value={career.maxVelo.toFixed(1)}
            suffix="mph"
            highlight
          />
          <BigStat
            label="Total pitches"
            value={`${career.totalPitches}`}
            suffix=""
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h3 className="text-sm font-bold text-[var(--text)]">
            Velocity trend
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Avg + max per appearance, newest right
          </p>
        </div>
        <VeloLineChart appearances={appearances} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h3 className="text-sm font-bold text-[var(--text)]">
            Velocity by outing
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Stacked bars — outer is max, inner is avg
          </p>
        </div>
        <VeloBarChart appearances={appearances} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h3 className="text-sm font-bold text-[var(--text)]">
            Pitch mix
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Career totals — usage and velocity per pitch type
          </p>
        </div>
        <PitchMixTable byType={career.byType} total={career.totalPitches} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h3 className="text-sm font-bold text-[var(--text)]">
            Outing log
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            {appearances.length} appearances · newest first
          </p>
        </div>
        <OutingsTable appearances={[...appearances].reverse()} />
      </section>
    </div>
  );
}

function BigStat({
  label,
  value,
  suffix,
  highlight = false,
}: {
  label: string;
  value: string;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={`text-3xl font-bold tabular leading-none ${
            highlight
              ? "text-orange-600 dark:text-orange-400"
              : "text-[var(--text)]"
          }`}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function VeloLineChart({ appearances }: { appearances: AppearanceVelo[] }) {
  if (appearances.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
        No outings yet.
      </div>
    );
  }

  const w = 600;
  const h = 200;
  const pad = { top: 16, right: 12, bottom: 28, left: 32 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const maxV = Math.max(...appearances.map((a) => a.maxVelo)) + 1;
  const minV = Math.min(...appearances.map((a) => a.avgVelo)) - 2;
  const range = Math.max(1, maxV - minV);

  const x = (i: number) =>
    appearances.length === 1
      ? innerW / 2
      : (i / (appearances.length - 1)) * innerW;
  const y = (v: number) => innerH - ((v - minV) / range) * innerH;

  const avgPath = appearances
    .map((a, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(a.avgVelo)}`)
    .join(" ");
  const maxPath = appearances
    .map((a, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(a.maxVelo)}`)
    .join(" ");

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = minV + (range * i) / ticks;
    return { v, y: y(v) };
  });

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="mb-2 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-[var(--text-muted)]" />
          avg
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-orange-500 dark:bg-orange-400" />
          max
        </span>
        <span className="ml-auto tabular">
          {minV.toFixed(0)}–{maxV.toFixed(0)} mph
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="block h-[200px] w-full min-w-[480px]"
        >
          <g transform={`translate(${pad.left} ${pad.top})`}>
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={t.y}
                  y2={t.y}
                  stroke="var(--border)"
                  strokeDasharray="2 3"
                />
                <text
                  x={-6}
                  y={t.y}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted)"
                  className="tabular"
                >
                  {t.v.toFixed(0)}
                </text>
              </g>
            ))}

            <path
              d={maxPath}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-orange-400"
            />
            <path
              d={avgPath}
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {appearances.map((a, i) => (
              <g key={a.gamePk}>
                <circle
                  cx={x(i)}
                  cy={y(a.maxVelo)}
                  r="3"
                  fill="#f97316"
                  className="dark:fill-orange-400"
                >
                  <title>{`${formatDate(a.date)}: max ${a.maxVelo.toFixed(1)}`}</title>
                </circle>
                <circle
                  cx={x(i)}
                  cy={y(a.avgVelo)}
                  r="3"
                  fill="var(--text-secondary)"
                >
                  <title>{`${formatDate(a.date)}: avg ${a.avgVelo.toFixed(1)}`}</title>
                </circle>
                {(appearances.length <= 10 || i % Math.ceil(appearances.length / 10) === 0) && (
                  <text
                    x={x(i)}
                    y={innerH + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--text-muted)"
                    className="tabular"
                  >
                    {formatDate(a.date)}
                  </text>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

function VeloBarChart({ appearances }: { appearances: AppearanceVelo[] }) {
  if (appearances.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
        No outings yet.
      </div>
    );
  }
  const max = Math.max(...appearances.map((a) => a.maxVelo)) + 1;
  const min = Math.min(...appearances.map((a) => a.avgVelo)) - 2;
  const range = Math.max(1, max - min);

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="mb-2 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-[var(--text-secondary)]" />
          avg
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-orange-500 dark:bg-orange-400" />
          max
        </span>
        <span className="ml-auto tabular">
          {appearances.length} outings · {min.toFixed(0)}–{max.toFixed(0)} mph
        </span>
      </div>
      <div
        className="grid items-end gap-1"
        style={{
          gridTemplateColumns: `repeat(${appearances.length}, minmax(18px, 1fr))`,
          minHeight: 160,
        }}
      >
        {appearances.map((a) => {
          const avgPct = ((a.avgVelo - min) / range) * 100;
          const maxPct = ((a.maxVelo - min) / range) * 100;
          return (
            <div
              key={a.gamePk}
              className="group relative flex h-[140px] flex-col items-center justify-end"
              title={`${formatDate(a.date)} vs ${a.opponent}: avg ${a.avgVelo.toFixed(1)}, max ${a.maxVelo.toFixed(1)} (${a.pitchCount} pitches)`}
            >
              <div className="relative h-full w-full">
                <div
                  className="absolute bottom-0 w-full rounded-t bg-orange-500/80 dark:bg-orange-400/60"
                  style={{ height: `${maxPct}%` }}
                />
                <div
                  className="absolute bottom-0 w-full rounded-t bg-[var(--text-secondary)]"
                  style={{ height: `${avgPct}%` }}
                />
              </div>
              <div className="mt-1 truncate text-[9px] text-[var(--text-muted)] tabular">
                {formatDate(a.date)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PitchMixTable({
  byType,
  total,
}: {
  byType: Array<{ type: string; count: number; avgVelo: number; maxVelo: number }>;
  total: number;
}) {
  if (byType.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
        No pitch type data.
      </div>
    );
  }
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <th className="px-4 py-2.5 text-left">Pitch type</th>
          <th className="px-3 py-2.5 text-right">Count</th>
          <th className="px-3 py-2.5 text-right">Usage</th>
          <th className="px-3 py-2.5 text-right">Avg velo</th>
          <th className="px-3 py-2.5 text-right">Max velo</th>
        </tr>
      </thead>
      <tbody>
        {byType.map((t) => {
          const pct = total > 0 ? (t.count / total) * 100 : 0;
          return (
            <tr
              key={t.type}
              className="border-b border-[var(--border)] last:border-0"
            >
              <td className="px-4 py-2.5 text-[var(--text)]">
                <span className="inline-block min-w-[36px] rounded-md bg-[var(--surface-hover)] px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wider">
                  {t.type}
                </span>{" "}
                <span className="ml-2 text-[11px] text-[var(--text-muted)]">
                  {labelFor(t.type)}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right tabular text-[var(--text)]">
                {t.count}
              </td>
              <td className="px-3 py-2.5 text-right tabular text-[var(--text-muted)]">
                {pct.toFixed(1)}%
              </td>
              <td className="px-3 py-2.5 text-right tabular text-[var(--text)]">
                {t.avgVelo.toFixed(1)}
              </td>
              <td className="px-3 py-2.5 text-right text-sm font-semibold tabular text-orange-600 dark:text-orange-400">
                {t.maxVelo.toFixed(1)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function OutingsTable({ appearances }: { appearances: AppearanceVelo[] }) {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <th className="px-4 py-2.5 text-left">Date</th>
          <th className="px-3 py-2.5 text-left">Opponent</th>
          <th className="px-3 py-2.5 text-right">Pitches</th>
          <th className="px-3 py-2.5 text-right">Avg</th>
          <th className="px-3 py-2.5 text-right">Max</th>
        </tr>
      </thead>
      <tbody>
        {appearances.map((a) => (
          <tr
            key={a.gamePk}
            className="border-b border-[var(--border)] last:border-0"
          >
            <td className="px-4 py-2.5 tabular text-[var(--text-muted)]">
              {formatDate(a.date)}
            </td>
            <td className="px-3 py-2.5 text-[var(--text)]">{a.opponent}</td>
            <td className="px-3 py-2.5 text-right tabular text-[var(--text)]">
              {a.pitchCount}
            </td>
            <td className="px-3 py-2.5 text-right tabular text-[var(--text)]">
              {a.avgVelo.toFixed(1)}
            </td>
            <td className="px-3 py-2.5 text-right text-sm font-semibold tabular text-orange-600 dark:text-orange-400">
              {a.maxVelo.toFixed(1)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
