"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AppearanceVelo,
  PitcherStats,
  SeasonState,
} from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";

type ChartView = "velocity" | "usage" | "count";

const VIEW_OPTIONS: Array<{ key: ChartView; label: string }> = [
  { key: "velocity", label: "Velocity" },
  { key: "usage", label: "Pitch usage" },
  { key: "count", label: "Pitch count" },
];

// MLB Stats API / Statcast / Baseball Savant pitch codes.
// "FB" isn't a real code — "fastball" is the category covering FF/FT/SI/FC.
// FT is legacy: modern Statcast merges two-seamers into SI, kept for old feeds.
const PITCH_TYPE_LABELS: Record<string, string> = {
  FF: "4-Seam",
  FT: "2-Seam",
  SI: "Sinker",
  FC: "Cutter",
  FA: "Fastball",
  SL: "Slider",
  ST: "Sweeper",
  SV: "Slurve",
  CU: "Curveball",
  KC: "Knuckle Curve",
  CS: "Slow Curve",
  CH: "Changeup",
  FS: "Splitter",
  FO: "Forkball",
  SC: "Screwball",
  KN: "Knuckleball",
  EP: "Eephus",
  PO: "Pitchout",
  IN: "Intentional",
  UN: "Unknown",
};

const FASTBALL_CODES = new Set(["FF", "FT", "SI", "FC", "FA"]);

const PITCH_COLORS: Record<string, { light: string; dark: string }> = {
  FF: { light: "#bd3039", dark: "#f87171" },   // 4-Seam — Sox red
  FT: { light: "#7f1d1d", dark: "#fca5a5" },   // 2-Seam — dark red (different from FF)
  SI: { light: "#059669", dark: "#34d399" },   // Sinker — emerald (true green)
  FC: { light: "#92400e", dark: "#fdba74" },   // Cutter — brown/rust (out of green family)
  FA: { light: "#dc2626", dark: "#fca5a5" },   // Generic fastball — vivid red
  SL: { light: "#1d4ed8", dark: "#60a5fa" },   // Slider — deep blue
  ST: { light: "#0e7490", dark: "#67e8f9" },   // Sweeper — deeper cyan-blue
  SV: { light: "#475569", dark: "#94a3b8" },   // Slurve — slate
  CU: { light: "#1e3a8a", dark: "#93c5fd" },   // Curveball — navy
  KC: { light: "#0284c7", dark: "#bae6fd" },   // Knuckle Curve — sky (lighter)
  CS: { light: "#312e81", dark: "#a5b4fc" },   // Slow Curve — indigo
  CH: { light: "#ea580c", dark: "#fb923c" },   // Changeup — orange
  FS: { light: "#16a34a", dark: "#86efac" },   // Splitter — lighter green
  FO: { light: "#365314", dark: "#bef264" },   // Forkball — olive
  SC: { light: "#9a3412", dark: "#fdba74" },   // Screwball — burnt sienna
  KN: { light: "#3f3f46", dark: "#a1a1aa" },   // Knuckleball — zinc
  EP: { light: "#44403c", dark: "#a8a29e" },   // Eephus — stone
  PO: { light: "#525252", dark: "#a3a3a3" },   // Pitchout — gray
  IN: { light: "#737373", dark: "#a3a3a3" },   // Intentional — neutral
  UN: { light: "#737373", dark: "#a3a3a3" },   // Unknown — neutral
};

const DEFAULT_PITCH_COLOR = { light: "#475569", dark: "#94a3b8" };

function colorFor(type: string): { light: string; dark: string } {
  return PITCH_COLORS[type] ?? DEFAULT_PITCH_COLOR;
}

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

// IP shown the way MLB does it: outs/3 with the remainder as ".1" or ".2"
function formatIp(outs: number | undefined): string {
  if (!outs) return "—";
  const innings = Math.floor(outs / 3);
  const rem = outs % 3;
  return `${innings}.${rem}`;
}

// FIP = ((13*HR + 3*(BB+HBP) - 2*K) / IP) + constant
// Constant ~3.10 is a reasonable approximation; varies by league but
// good enough for relative comparison between a pitcher's own outings.
const FIP_CONSTANT = 3.1;
function computeFip(a: AppearanceVelo): number {
  if (!a.outs) return 0;
  const ip = a.outs / 3;
  const hr = a.homeRuns ?? 0;
  const bb = a.walks ?? 0;
  const hbp = a.hitByPitch ?? 0;
  const k = a.strikeouts ?? 0;
  return (13 * hr + 3 * (bb + hbp) - 2 * k) / ip + FIP_CONSTANT;
}

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
        maxVelo: 0,
        totalPitches: 0,
        appearances: 0,
        byType: [] as Array<{ type: string; count: number; avgVelo: number; maxVelo: number }>,
        primaryFastball: null as null | { type: string; avg: number; max: number; count: number },
        line: { outs: 0, walks: 0, strikeouts: 0, earnedRuns: 0, homeRuns: 0, hitByPitch: 0, hits: 0 },
        era: null as number | null,
        whip: null as number | null,
        fip: null as number | null,
        k9: null as number | null,
        bb9: null as number | null,
      };
    }
    let total = 0;
    let max = 0;
    const byTypeAcc = new Map<string, { count: number; sumVelo: number; maxVelo: number }>();
    for (const a of appearances) {
      total += a.pitchCount;
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

    // Primary fastball: prefer 4-Seam (FF), else most-thrown of FT/SI/FC
    const ff = byType.find((t) => t.type === "FF");
    const otherFb = byType.find((t) => FASTBALL_CODES.has(t.type) && t.type !== "FF");
    const primary = ff ?? otherFb ?? null;
    const primaryFastball = primary
      ? { type: primary.type, avg: primary.avgVelo, max: primary.maxVelo, count: primary.count }
      : null;

    // Per-pitcher pitching line aggregate from boxscore data
    const line = appearances.reduce(
      (acc, a) => ({
        outs: acc.outs + (a.outs ?? 0),
        walks: acc.walks + (a.walks ?? 0),
        strikeouts: acc.strikeouts + (a.strikeouts ?? 0),
        earnedRuns: acc.earnedRuns + (a.earnedRuns ?? 0),
        homeRuns: acc.homeRuns + (a.homeRuns ?? 0),
        hitByPitch: acc.hitByPitch + (a.hitByPitch ?? 0),
        hits: acc.hits + (a.hits ?? 0),
      }),
      { outs: 0, walks: 0, strikeouts: 0, earnedRuns: 0, homeRuns: 0, hitByPitch: 0, hits: 0 },
    );
    const ip = line.outs / 3;
    const era = line.outs > 0 ? (line.earnedRuns * 27) / line.outs : null;
    const whip = line.outs > 0 ? (line.walks + line.hits) / ip : null;
    const fip =
      line.outs > 0
        ? (13 * line.homeRuns + 3 * (line.walks + line.hitByPitch) - 2 * line.strikeouts) /
            ip +
          FIP_CONSTANT
        : null;
    const k9 = line.outs > 0 ? (line.strikeouts * 27) / line.outs : null;
    const bb9 = line.outs > 0 ? (line.walks * 27) / line.outs : null;

    return {
      maxVelo: max,
      totalPitches: total,
      appearances: appearances.length,
      byType,
      primaryFastball,
      line,
      era,
      whip,
      fip,
      k9,
      bb9,
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
        <div className="flex flex-wrap items-center gap-4">
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
              {appearances.length}{" "}
              {appearances.length === 1 ? "outing" : "outings"} this season ·{" "}
              {career.totalPitches} pitches tracked
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <BigStat
            label={
              career.primaryFastball
                ? `${labelFor(career.primaryFastball.type)} avg`
                : "Fastball avg"
            }
            value={
              career.primaryFastball
                ? career.primaryFastball.avg.toFixed(1)
                : "—"
            }
            suffix={career.primaryFastball ? "mph" : ""}
          />
          <BigStat
            label="Max velocity"
            value={career.maxVelo.toFixed(1)}
            suffix="mph"
          />
          <BigStat
            label="Total pitches"
            value={`${career.totalPitches}`}
            suffix=""
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          <SmallStat
            label="ERA"
            value={career.era !== null ? career.era.toFixed(2) : "—"}
          />
          <SmallStat
            label="WHIP"
            value={career.whip !== null ? career.whip.toFixed(2) : "—"}
          />
          <SmallStat
            label="FIP"
            value={career.fip !== null ? career.fip.toFixed(2) : "—"}
          />
          <SmallStat
            label="K/9"
            value={career.k9 !== null ? career.k9.toFixed(1) : "—"}
          />
          <SmallStat
            label="BB/9"
            value={career.bb9 !== null ? career.bb9.toFixed(1) : "—"}
          />
        </div>
      </section>

      <PitcherChartCard appearances={appearances} byType={career.byType} />

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h3 className="text-sm font-bold text-[var(--text)]">Pitch mix</h3>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
            Usage and velocity per pitch type
          </p>
        </div>
        <PitchMixTable byType={career.byType} total={career.totalPitches} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h3 className="text-sm font-bold text-[var(--text)]">Outings</h3>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
            {appearances.length}{" "}
            {appearances.length === 1 ? "appearance" : "appearances"} ·
            newest first · best max velo highlighted
          </p>
        </div>
        <OutingsGrid appearances={appearances} byType={career.byType} />
      </section>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-2.5 py-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-sm">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-bold tabular leading-none text-[var(--text)]">
        {value}
      </div>
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={`text-3xl font-bold tabular leading-none ${
            highlight
              ? "text-[var(--color-sox-red)] dark:text-red-400"
              : "text-[var(--text)]"
          }`}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function PitcherChartCard({
  appearances,
  byType,
}: {
  appearances: AppearanceVelo[];
  byType: Array<{ type: string; count: number; avgVelo: number; maxVelo: number }>;
}) {
  const [view, setView] = useState<ChartView>("velocity");

  const availableTypes = byType.map((b) => b.type);
  const defaultType =
    availableTypes.find((t) => t === "FF") ??
    availableTypes.find((t) => FASTBALL_CODES.has(t)) ??
    availableTypes[0] ??
    null;
  const [selectedType, setSelectedType] = useState<string | null>(defaultType);

  useEffect(() => {
    if (selectedType && !availableTypes.includes(selectedType)) {
      setSelectedType(defaultType);
    }
    if (!selectedType && defaultType) {
      setSelectedType(defaultType);
    }
  }, [availableTypes, defaultType, selectedType]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="border-b border-[var(--border)] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)]">
              {view === "velocity"
                ? `Velocity — ${selectedType ? labelFor(selectedType) : ""}`
                : view === "usage"
                  ? "Pitch usage by outing"
                  : "Pitch count by outing"}
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
              {view === "velocity"
                ? "Avg + max per outing · hover for detail"
                : view === "usage"
                  ? "Stacked by pitch type · hover for detail"
                  : "Total pitches per outing"}
            </p>
          </div>
          <ViewPills value={view} onChange={setView} />
        </div>
        {availableTypes.length > 0 && (
          <div
            className={`mt-3 ${view === "velocity" ? "" : "invisible"}`}
            aria-hidden={view !== "velocity"}
          >
            <PitchTypePills
              types={byType}
              value={selectedType}
              onChange={setSelectedType}
            />
          </div>
        )}
      </div>
      <div className="min-h-[360px]">
        {view === "velocity" && selectedType ? (
          <VelocityChart appearances={appearances} pitchType={selectedType} />
        ) : view === "usage" ? (
          <UsageChart appearances={appearances} byType={byType} />
        ) : view === "count" ? (
          <PitchCountChart appearances={appearances} />
        ) : (
          <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
            No pitch type data.
          </div>
        )}
      </div>
    </section>
  );
}

function ViewPills({
  value,
  onChange,
}: {
  value: ChartView;
  onChange: (v: ChartView) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] p-0.5">
      {VIEW_OPTIONS.map((v) => {
        const active = v.key === value;
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => onChange(v.key)}
            aria-pressed={active}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
              active
                ? "bg-[var(--surface)] text-[var(--text)] shadow-sm ring-1 ring-[var(--border-strong)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

function PitchTypePills({
  types,
  value,
  onChange,
}: {
  types: Array<{ type: string; count: number }>;
  value: string | null;
  onChange: (t: string) => void;
}) {
  const isDark = useIsDark();
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((t) => {
        const active = value === t.type;
        const c = colorFor(t.type);
        return (
          <button
            key={t.type}
            type="button"
            onClick={() => onChange(t.type)}
            aria-pressed={active}
            className={`group inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              active
                ? "border-[var(--border-strong)] bg-[var(--surface-hover)] text-[var(--text)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: isDark ? c.dark : c.light }}
            />
            <span>{labelFor(t.type)}</span>
            <span className="text-[10px] tabular opacity-60">{t.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function useChartWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function VelocityChart({
  appearances,
  pitchType,
}: {
  appearances: AppearanceVelo[];
  pitchType: string;
}) {
  const [containerRef, w] = useChartWidth();
  const [hovered, setHovered] = useState<number | null>(null);
  const isDark = useIsDark();

  const points = useMemo(() => {
    return appearances.map((a) => {
      const t = a.byType.find((b) => b.type === pitchType);
      return {
        date: a.date,
        opponent: a.opponent,
        avg: t?.avgVelo ?? null,
        max: t?.maxVelo ?? null,
        count: t?.count ?? 0,
      };
    });
  }, [appearances, pitchType]);

  const valid = points.filter((p) => p.avg !== null);
  if (valid.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
        No {labelFor(pitchType)} thrown in this range.
      </div>
    );
  }

  const h = 260;
  const pad = { top: 24, right: 16, bottom: 44, left: 36 };
  const innerW = Math.max(80, w - pad.left - pad.right);
  const innerH = h - pad.top - pad.bottom;

  const allVals = valid.flatMap((p) => [p.avg!, p.max!]);
  const maxV = Math.max(...allVals) + 1.5;
  const minV = Math.min(...allVals) - 1.5;
  const range = Math.max(1, maxV - minV);

  const x = (i: number) =>
    points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW;
  const y = (v: number) => innerH - ((v - minV) / range) * innerH;

  const buildPath = (key: "avg" | "max") => {
    let d = "";
    let started = false;
    for (let i = 0; i < points.length; i++) {
      const v = points[i][key];
      if (v === null) {
        started = false;
        continue;
      }
      d += `${started ? "L" : "M"} ${x(i)} ${y(v)} `;
      started = true;
    }
    return d.trim();
  };

  const avgPath = buildPath("avg");
  const maxPath = buildPath("max");

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = minV + (range * i) / ticks;
    return { v, y: y(v) };
  });

  const color = colorFor(pitchType);
  const colorVal = isDark ? color.dark : color.light;

  const hoveredPoint = hovered !== null ? points[hovered] : null;
  const showTooltip = hoveredPoint && hoveredPoint.avg !== null;

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (points.length === 1) {
      setHovered(0);
      return;
    }
    const step = innerW / (points.length - 1);
    const idx = Math.max(0, Math.min(points.length - 1, Math.round(px / step)));
    setHovered(idx);
  };

  return (
    <div className="relative px-4 pb-4 pt-3">
      <div className="mb-2 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
        <Legend swatch="#94a3b8" label="avg" line />
        <Legend swatch={colorVal} label="max" line />
        <span className="ml-auto tabular">
          {minV.toFixed(0)}–{maxV.toFixed(0)} mph
        </span>
      </div>
      <div ref={containerRef} className="relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-[260px] w-full"
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
                  x={-8}
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
              stroke={colorVal}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={avgPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0"
            />

            {points.map((p, i) =>
              p.avg === null ? null : (
                <g key={i}>
                  <circle
                    cx={x(i)}
                    cy={y(p.max!)}
                    r={hovered === i ? 5 : 3.5}
                    fill={colorVal}
                  />
                  <circle
                    cx={x(i)}
                    cy={y(p.avg!)}
                    r={hovered === i ? 5 : 3.5}
                    fill="#94a3b8"
                  />
                </g>
              ),
            )}

            {hovered !== null && hoveredPoint?.avg !== null && (
              <line
                x1={x(hovered)}
                x2={x(hovered)}
                y1={0}
                y2={innerH}
                stroke="var(--border-strong)"
                strokeDasharray="3 3"
              />
            )}

            {(() => {
              const labelStep = Math.max(
                1,
                Math.ceil(points.length / Math.max(2, Math.floor(innerW / 60))),
              );
              return points.map((p, i) =>
                i % labelStep === 0 || i === points.length - 1 ? (
                  <text
                    key={`d-${i}`}
                    x={x(i)}
                    y={innerH + 24}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-secondary)"
                    className="tabular"
                  >
                    {formatDate(p.date)}
                  </text>
                ) : null,
              );
            })()}

            <rect
              x={0}
              y={0}
              width={innerW}
              height={innerH}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHovered(null)}
            />
          </g>
        </svg>
        {showTooltip && (
          <Tooltip
            x={pad.left + x(hovered!)}
            chartWidth={w}
            chartHeight={h}
          >
            <div className="text-[11px] font-semibold text-[var(--text)]">
              {formatDate(hoveredPoint!.date)}
              <span className="ml-1.5 font-normal text-[var(--text-muted)]">
                vs {hoveredPoint!.opponent}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[var(--text-muted)]">Max</span>
              <span
                className="font-bold tabular"
                style={{ color: colorVal }}
              >
                {hoveredPoint!.max!.toFixed(1)} mph
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[var(--text-muted)]">Avg</span>
              <span className="font-semibold tabular text-[var(--text)]">
                {hoveredPoint!.avg!.toFixed(1)} mph
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-[var(--text-muted)]">
              <span>{labelFor(pitchType)}</span>
              <span className="tabular">{hoveredPoint!.count} pitches</span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function UsageChart({
  appearances,
  byType,
}: {
  appearances: AppearanceVelo[];
  byType: Array<{ type: string; count: number; avgVelo: number; maxVelo: number }>;
}) {
  const [containerRef, w] = useChartWidth();
  const [hovered, setHovered] = useState<number | null>(null);
  const isDark = useIsDark();

  const orderedTypes = byType.map((b) => b.type);
  const totalPitches = appearances.reduce((s, a) => s + a.pitchCount, 0);

  const h = 260;
  const pad = { top: 24, right: 16, bottom: 44, left: 36 };
  const innerW = Math.max(80, w - pad.left - pad.right);
  const innerH = h - pad.top - pad.bottom;

  const gap = 6;
  const barW = Math.max(
    8,
    (innerW - gap * (appearances.length - 1)) / appearances.length,
  );

  const yTicks = [0, 25, 50, 75, 100].map((p) => ({
    v: p,
    y: innerH - (p / 100) * innerH,
  }));

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const step = (barW + gap);
    const idx = Math.max(
      0,
      Math.min(appearances.length - 1, Math.floor(px / step)),
    );
    setHovered(idx);
  };

  const hoveredApp = hovered !== null ? appearances[hovered] : null;

  return (
    <div className="relative px-4 pb-4 pt-3">
      <div className="mb-2 flex items-center gap-3 overflow-x-auto text-[11px] text-[var(--text-secondary)]">
        <div className="flex shrink-0 items-center gap-3">
          {orderedTypes.slice(0, 8).map((t) => {
            const c = colorFor(t);
            return (
              <Legend
                key={t}
                swatch={isDark ? c.dark : c.light}
                label={labelFor(t)}
              />
            );
          })}
        </div>
        <span className="ml-auto shrink-0 tabular">
          {appearances.length} outings · {totalPitches} pitches
        </span>
      </div>
      <div ref={containerRef} className="relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-[260px] w-full"
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
                  x={-8}
                  y={t.y}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-secondary)"
                  className="tabular"
                >
                  {t.v}%
                </text>
              </g>
            ))}

            {appearances.map((a, i) => {
              const xPos = i * (barW + gap);
              const total = a.pitchCount || 1;
              let yAcc = innerH;
              const segments = orderedTypes
                .map((type) => {
                  const t = a.byType.find((b) => b.type === type);
                  if (!t || t.count === 0) return null;
                  const pct = t.count / total;
                  const segH = pct * innerH;
                  yAcc -= segH;
                  return { type, height: segH, y: yAcc, count: t.count, pct };
                })
                .filter(Boolean) as Array<{
                type: string;
                height: number;
                y: number;
                count: number;
                pct: number;
              }>;
              return (
                <g key={a.gamePk} opacity={hovered === null || hovered === i ? 1 : 0.45}>
                  {segments.map((s, idx) => {
                    const c = colorFor(s.type);
                    const isTop = idx === segments.length - 1;
                    return (
                      <rect
                        key={s.type}
                        x={xPos}
                        y={s.y}
                        width={barW}
                        height={s.height}
                        rx={isTop ? 2 : 0}
                        ry={isTop ? 2 : 0}
                        fill={isDark ? c.dark : c.light}
                      />
                    );
                  })}
                  {segments.map((s) =>
                    s.height >= 14 && barW >= 14 ? (
                      <text
                        key={`l-${s.type}`}
                        x={xPos + barW / 2}
                        y={s.y + s.height / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontWeight="700"
                        fill="white"
                        style={{ pointerEvents: "none" }}
                      >
                        {s.type}
                      </text>
                    ) : null,
                  )}
                </g>
              );
            })}

            {(() => {
              const labelStep = Math.max(
                1,
                Math.ceil(appearances.length / Math.max(2, Math.floor(innerW / 60))),
              );
              return appearances.map((a, i) =>
                i % labelStep === 0 || i === appearances.length - 1 ? (
                  <text
                    key={`d-${i}`}
                    x={i * (barW + gap) + barW / 2}
                    y={innerH + 24}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-secondary)"
                    className="tabular"
                  >
                    {formatDate(a.date)}
                  </text>
                ) : null,
              );
            })()}

            <rect
              x={0}
              y={0}
              width={innerW}
              height={innerH}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHovered(null)}
            />
          </g>
        </svg>
        {hoveredApp && (
          <Tooltip
            x={pad.left + hovered! * (barW + gap) + barW / 2}
            chartWidth={w}
            chartHeight={h}
          >
            <div className="text-[11px] font-semibold text-[var(--text)]">
              {formatDate(hoveredApp.date)}
              <span className="ml-1.5 font-normal text-[var(--text-secondary)]">
                vs {hoveredApp.opponent}
              </span>
            </div>
            <div className="mt-1 space-y-0.5">
              {hoveredApp.byType.map((t) => {
                const c = colorFor(t.type);
                const pct = (t.count / Math.max(1, hoveredApp.pitchCount)) * 100;
                return (
                  <div
                    key={t.type}
                    className="flex items-center justify-between gap-3 text-[11px]"
                  >
                    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: isDark ? c.dark : c.light }}
                      />
                      {labelFor(t.type)}
                    </span>
                    <span className="font-semibold tabular text-[var(--text)]">
                      {pct.toFixed(0)}%{" "}
                      <span className="font-normal text-[var(--text-secondary)]">
                        ({t.count})
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-1 border-t border-[var(--border)] pt-1 text-[10px] tabular text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text)]">
                {hoveredApp.pitchCount}
              </span>{" "}
              total pitches
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function PitchCountChart({ appearances }: { appearances: AppearanceVelo[] }) {
  const [containerRef, w] = useChartWidth();
  const [hovered, setHovered] = useState<number | null>(null);
  const isDark = useIsDark();
  const lineColor = isDark ? "#f87171" : "#bd3039";

  const counts = appearances.map((a) => a.pitchCount);
  const maxCount = Math.max(...counts, 1);

  const h = 260;
  const pad = { top: 24, right: 16, bottom: 44, left: 36 };
  const innerW = Math.max(80, w - pad.left - pad.right);
  const innerH = h - pad.top - pad.bottom;

  const x = (i: number) =>
    appearances.length === 1
      ? innerW / 2
      : (i / (appearances.length - 1)) * innerW;
  const yScale = (v: number) => innerH - (v / maxCount) * innerH;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = (maxCount * i) / ticks;
    return { v: Math.round(v), y: yScale(v) };
  });

  const linePath = appearances
    .map((a, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yScale(a.pitchCount)}`)
    .join(" ");

  const areaPath =
    appearances.length > 0
      ? `${linePath} L ${x(appearances.length - 1)} ${innerH} L ${x(0)} ${innerH} Z`
      : "";

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (appearances.length === 1) {
      setHovered(0);
      return;
    }
    const step = innerW / (appearances.length - 1);
    const idx = Math.max(
      0,
      Math.min(appearances.length - 1, Math.round(px / step)),
    );
    setHovered(idx);
  };

  const hoveredApp = hovered !== null ? appearances[hovered] : null;
  const avg = counts.reduce((s, n) => s + n, 0) / Math.max(1, counts.length);

  return (
    <div className="relative px-4 pb-4 pt-3">
      <div className="mb-2 flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
        <Legend swatch={lineColor} label="pitches" line />
        <span className="ml-auto tabular">
          avg {avg.toFixed(0)} · peak {maxCount}
        </span>
      </div>
      <div ref={containerRef} className="relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-[260px] w-full"
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
                  x={-8}
                  y={t.y}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-secondary)"
                  className="tabular"
                >
                  {t.v}
                </text>
              </g>
            ))}

            <path d={areaPath} fill={lineColor} fillOpacity={0.12} />
            <path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {appearances.map((a, i) => (
              <circle
                key={a.gamePk}
                cx={x(i)}
                cy={yScale(a.pitchCount)}
                r={hovered === i ? 5 : 3.5}
                fill={lineColor}
              />
            ))}

            {hovered !== null && (
              <line
                x1={x(hovered)}
                x2={x(hovered)}
                y1={0}
                y2={innerH}
                stroke="var(--border-strong)"
                strokeDasharray="3 3"
              />
            )}

            {(() => {
              const labelStep = Math.max(
                1,
                Math.ceil(appearances.length / Math.max(2, Math.floor(innerW / 60))),
              );
              return appearances.map((a, i) =>
                i % labelStep === 0 || i === appearances.length - 1 ? (
                  <text
                    key={`d-${i}`}
                    x={x(i)}
                    y={innerH + 24}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-secondary)"
                    className="tabular"
                  >
                    {formatDate(a.date)}
                  </text>
                ) : null,
              );
            })()}

            <rect
              x={0}
              y={0}
              width={innerW}
              height={innerH}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHovered(null)}
            />
          </g>
        </svg>
        {hoveredApp && (
          <Tooltip
            x={pad.left + x(hovered!)}
            chartWidth={w}
            chartHeight={h}
          >
            <div className="text-[11px] font-semibold text-[var(--text)]">
              {formatDate(hoveredApp.date)}
              <span className="ml-1.5 font-normal text-[var(--text-secondary)]">
                vs {hoveredApp.opponent}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--text-secondary)]">
                Total pitches
              </span>
              <span className="text-base font-bold tabular text-[var(--text)]">
                {hoveredApp.pitchCount}
              </span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function Legend({
  swatch,
  label,
  line = false,
}: {
  swatch: string;
  label: string;
  line?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block ${line ? "h-0.5 w-4" : "h-2 w-2 rounded-sm"}`}
        style={{ background: swatch }}
      />
      <span>{label}</span>
    </span>
  );
}

function Tooltip({
  x,
  chartWidth,
  chartHeight,
  children,
}: {
  x: number;
  chartWidth: number;
  chartHeight: number;
  children: React.ReactNode;
}) {
  const pctX = (x / chartWidth) * 100;
  const flipLeft = pctX > 65;
  return (
    <div
      className="pointer-events-none absolute z-10 w-[180px] rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-2.5 shadow-lg ring-1 ring-black/5"
      style={{
        left: `${pctX}%`,
        top: `${(24 / chartHeight) * 100}%`,
        transform: flipLeft
          ? "translate(calc(-100% - 12px), 0)"
          : "translate(12px, 0)",
      }}
    >
      {children}
    </div>
  );
}

function OutingsGrid({
  appearances,
  byType,
}: {
  appearances: AppearanceVelo[];
  byType: Array<{ type: string; count: number; avgVelo: number; maxVelo: number }>;
}) {
  const isDark = useIsDark();
  if (appearances.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
        No outings yet.
      </div>
    );
  }
  const bestMaxVelo = Math.max(...appearances.map((a) => a.maxVelo));
  const bestPitchCount = Math.max(...appearances.map((a) => a.pitchCount));
  const orderedTypes = byType.map((b) => b.type);

  // Newest first
  const ordered = [...appearances].reverse();

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {ordered.map((a) => {
        const ff = a.byType.find((t) => t.type === "FF");
        const otherFb = a.byType.find(
          (t) => FASTBALL_CODES.has(t.type) && t.type !== "FF",
        );
        const primary = ff ?? otherFb;
        const fbAvg = primary ? primary.avgVelo : null;
        const isBestMax = a.maxVelo === bestMaxVelo;
        const isBestPitches = a.pitchCount === bestPitchCount;

        return (
          <div
            key={a.gamePk}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[var(--text)]">
                  {formatDate(a.date)}
                </div>
                <div className="truncate text-[11px] text-[var(--text-secondary)]">
                  vs {a.opponent}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {isBestMax && (
                  <span className="rounded-full bg-[var(--color-sox-red)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-sox-red)] dark:bg-red-400/20 dark:text-red-300">
                    Top velo
                  </span>
                )}
                {isBestPitches && !isBestMax && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                    Most pitches
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-3 text-[11px] tabular text-[var(--text-secondary)]">
              <span>
                <span className="font-bold text-[var(--text)]">{a.pitchCount}</span>{" "}
                pitches
              </span>
              {fbAvg !== null && (
                <span>
                  <span className="font-bold text-[var(--text)]">
                    {fbAvg.toFixed(1)}
                  </span>{" "}
                  FB
                </span>
              )}
              <span>
                <span
                  className={`font-bold ${
                    isBestMax
                      ? "text-[var(--color-sox-red)] dark:text-red-400"
                      : "text-[var(--text)]"
                  }`}
                >
                  {a.maxVelo.toFixed(1)}
                </span>{" "}
                max
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <MiniStat label="IP" value={formatIp(a.outs)} />
              <MiniStat label="H" value={a.hits ?? 0} />
              <MiniStat label="BB" value={a.walks ?? 0} />
              <MiniStat label="K" value={a.strikeouts ?? 0} />
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              <MiniStat
                label="ERA"
                value={
                  a.outs > 0
                    ? (((a.earnedRuns ?? 0) * 27) / a.outs).toFixed(2)
                    : "—"
                }
              />
              <MiniStat
                label="WHIP"
                value={
                  a.outs > 0
                    ? (((a.walks ?? 0) + (a.hits ?? 0)) / (a.outs / 3)).toFixed(2)
                    : "—"
                }
              />
              <MiniStat
                label="K/9"
                value={
                  a.outs > 0
                    ? (((a.strikeouts ?? 0) * 27) / a.outs).toFixed(1)
                    : "—"
                }
              />
              <MiniStat
                label="BB/9"
                value={
                  a.outs > 0
                    ? (((a.walks ?? 0) * 27) / a.outs).toFixed(1)
                    : "—"
                }
              />
            </div>

            {a.byType.length > 0 && (
              <div className="mt-3">
                <div className="flex h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                  {orderedTypes.map((type) => {
                    const t = a.byType.find((b) => b.type === type);
                    if (!t || t.count === 0) return null;
                    const pct = (t.count / a.pitchCount) * 100;
                    const c = colorFor(type);
                    return (
                      <div
                        key={type}
                        style={{
                          width: `${pct}%`,
                          background: isDark ? c.dark : c.light,
                        }}
                        title={`${labelFor(type)}: ${t.count} (${pct.toFixed(0)}%)`}
                      />
                    );
                  })}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[var(--text-secondary)]">
                  {a.byType.slice(0, 5).map((t) => {
                    const c = colorFor(t.type);
                    const pct = (t.count / a.pitchCount) * 100;
                    return (
                      <span
                        key={t.type}
                        className="inline-flex items-center gap-1"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: isDark ? c.dark : c.light }}
                        />
                        {labelFor(t.type)}{" "}
                        <span className="tabular">{pct.toFixed(0)}%</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface)] px-2 py-1.5">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span
          className={`text-base font-bold tabular leading-none ${
            accent
              ? "text-[var(--color-sox-red)] dark:text-red-400"
              : "text-[var(--text)]"
          }`}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {suffix}
          </span>
        )}
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
  const isDark = useIsDark();
  if (byType.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
        No pitch type data.
      </div>
    );
  }
  return (
    <>
      <div className="hidden md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
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
              const c = colorFor(t.type);
              return (
                <tr
                  key={t.type}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-4 py-2.5 text-[var(--text)]">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: isDark ? c.dark : c.light }}
                      />
                      <span className="inline-block min-w-[36px] rounded-md bg-[var(--surface-hover)] px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wider">
                        {t.type}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {labelFor(t.type)}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-[var(--text)]">
                    {t.count}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-[var(--text-secondary)]">
                    {pct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-[var(--text)]">
                    {t.avgVelo.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-semibold tabular text-[var(--color-sox-red)] dark:text-red-400">
                    {t.maxVelo.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-[var(--border)] md:hidden">
        {byType.map((t) => {
          const pct = total > 0 ? (t.count / total) * 100 : 0;
          const c = colorFor(t.type);
          return (
            <li key={t.type} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: isDark ? c.dark : c.light }}
                  />
                  <span className="shrink-0 rounded-md bg-[var(--surface-hover)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text)]">
                    {t.type}
                  </span>
                  <span className="truncate text-sm font-medium text-[var(--text)]">
                    {labelFor(t.type)}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] tabular text-[var(--text-secondary)]">
                  {t.count} · {pct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-4 text-[12px]">
                <span className="text-[var(--text-secondary)]">
                  Avg{" "}
                  <span className="font-semibold tabular text-[var(--text)]">
                    {t.avgVelo.toFixed(1)}
                  </span>
                </span>
                <span className="text-[var(--text-secondary)]">
                  Max{" "}
                  <span className="font-bold tabular text-[var(--color-sox-red)] dark:text-red-400">
                    {t.maxVelo.toFixed(1)}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

