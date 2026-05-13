"use client";

import { useMemo } from "react";
import type {
  GameSummary,
  SeasonState,
  StrikeoutRecord,
  WalkRecord,
} from "@/lib/types";
import {
  RANGE_LABELS,
  RangeKey,
  buildGameLog,
  computeInsights,
  filterGames,
  walksPerNine as walksPerNineFn,
  strikeoutsPerNine as strikeoutsPerNineFn,
  inningsPitched as inningsPitchedFn,
} from "@/lib/filters";
import { TrendChart } from "./TrendChart";
import { InningChart } from "./InningChart";

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

function fmt(n: number, decimals = 2): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  return n.toFixed(decimals);
}

export function TeamView({
  state,
  range,
  filteredWalks,
  filteredK,
  rangeLabel,
}: {
  state: SeasonState;
  range: RangeKey;
  filteredWalks: WalkRecord[];
  filteredK: StrikeoutRecord[];
  rangeLabel: string;
}) {
  const games = useMemo(
    () => filterGames(state.games, range, state),
    [state, range],
  );

  const totalsByGame = useMemo(() => {
    let outs = 0;
    let wins = 0;
    let losses = 0;
    let ties = 0;
    for (const g of games) {
      if (g.result === "W") wins += 1;
      else if (g.result === "L") losses += 1;
      else if (g.result === "T") ties += 1;
    }
    const gamePks = new Set(games.map((g) => g.gamePk));
    for (const p of Object.values(state.pitchers)) {
      const walks = filteredWalks.filter((w) => w.pitcherId === p.pitcherId);
      const ks = filteredK.filter((k) => k.pitcherId === p.pitcherId);
      const pitcherInRange =
        walks.some((w) => gamePks.has(w.gamePk)) ||
        ks.some((k) => gamePks.has(k.gamePk));
      if (pitcherInRange) {
        outs += p.outsRecorded;
      }
    }
    return { wins, losses, ties, outs };
  }, [games, state.pitchers, filteredWalks, filteredK]);

  const totalsForRange = useMemo(() => {
    const bbCount = filteredWalks.length;
    const kCount = filteredK.length;
    let outs = 0;
    if (range === "season") {
      outs = state.meta.totalOutsRecorded;
    } else {
      const inRange = new Set(games.map((g) => g.gamePk));
      const walksByGame = new Map<number, number>();
      const ksByGame = new Map<number, number>();
      for (const w of filteredWalks) {
        if (inRange.has(w.gamePk)) {
          walksByGame.set(w.gamePk, (walksByGame.get(w.gamePk) ?? 0) + 1);
        }
      }
      for (const k of filteredK) {
        if (inRange.has(k.gamePk)) {
          ksByGame.set(k.gamePk, (ksByGame.get(k.gamePk) ?? 0) + 1);
        }
      }
      const totalOutsInState = state.meta.totalOutsRecorded;
      const totalGamesInState = Math.max(1, state.meta.totalGames);
      outs = Math.round((games.length / totalGamesInState) * totalOutsInState);
    }
    const bb9 = outs > 0 ? (bbCount * 27) / outs : 0;
    const k9 = outs > 0 ? (kCount * 27) / outs : 0;
    const kbb = bbCount > 0 ? kCount / bbCount : kCount > 0 ? Infinity : 0;
    return {
      bbCount,
      kCount,
      outs,
      bb9,
      k9,
      kbb,
      ipDisplay: `${Math.floor(outs / 3)}.${outs % 3}`,
    };
  }, [filteredWalks, filteredK, games, range, state.meta]);

  const walkInsights = useMemo(
    () => computeInsights(filteredWalks),
    [filteredWalks],
  );
  const kInsights = useMemo(
    () => computeInsights(filteredK),
    [filteredK],
  );

  const gameLog = useMemo(
    () => buildGameLog(games, filteredWalks, filteredK),
    [games, filteredWalks, filteredK],
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-sox-navy)] via-[var(--color-sox-ink)] to-[#1d2f4b] p-5 text-white shadow-md sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <BigStat
            label="Record"
            value={`${totalsByGame.wins}-${totalsByGame.losses}${totalsByGame.ties > 0 ? `-${totalsByGame.ties}` : ""}`}
            sub={`${games.length} ${games.length === 1 ? "game" : "games"} · ${rangeLabel}`}
          />
          <BigStat
            label="IP"
            value={totalsForRange.ipDisplay}
            sub="Innings pitched"
          />
          <BigStat
            label="K / BB"
            value={
              totalsForRange.kbb === Infinity
                ? "∞"
                : fmt(totalsForRange.kbb, 2)
            }
            sub={`${totalsForRange.kCount} K · ${totalsForRange.bbCount} BB`}
          />
          <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
              Rates per 9
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <div>
                <div className="text-2xl font-bold tabular leading-none text-rose-200">
                  {fmt(totalsForRange.bb9)}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/60">
                  BB/9
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular leading-none text-emerald-200">
                  {fmt(totalsForRange.k9)}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/60">
                  K/9
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="Walks per game" subtitle={`${filteredWalks.length} total`}>
          <TrendChart data={walkInsights.byGame} accent="red" />
        </ChartCard>
        <ChartCard title="K's per game" subtitle={`${filteredK.length} total`}>
          <TrendChart data={kInsights.byGame} accent="emerald" />
        </ChartCard>
        <ChartCard title="Walks by inning">
          <InningChart data={walkInsights.byInning} accent="red" />
        </ChartCard>
        <ChartCard title="K's by inning">
          <InningChart data={kInsights.byInning} accent="emerald" />
        </ChartCard>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">
            Game Log
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {gameLog.length === 0
              ? "No games in this range"
              : `${gameLog.length} games · newest first`}
          </p>
        </div>
        {gameLog.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            No games to show.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {gameLog.map((row) => (
              <GameLogItem key={row.game.gamePk} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular leading-none">{value}</div>
      <div className="mt-1 truncate text-[10px] uppercase tracking-wider text-white/60">
        {sub}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function GameLogItem({
  row,
}: {
  row: { game: GameSummary; walks: number; strikeouts: number };
}) {
  const r = row.game.result;
  const score =
    row.game.teamScore !== null && row.game.opponentScore !== null
      ? `${row.game.teamScore}-${row.game.opponentScore}`
      : "—";
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <div className="min-w-[60px] shrink-0 text-[11px] font-medium tabular text-slate-600">
        {formatDate(row.game.date)}
      </div>
      <div
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
          r === "W"
            ? "bg-emerald-100 text-emerald-800"
            : r === "L"
              ? "bg-rose-100 text-rose-800"
              : "bg-slate-100 text-slate-500"
        }`}
      >
        {r ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--color-sox-navy)]">
          {row.game.homeAway === "home" ? "vs" : "@"} {row.game.opponent}
        </div>
        <div className="text-[11px] tabular text-slate-500">{score}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-[11px]">
        <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-700">
          {row.walks} BB
        </span>
        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
          {row.strikeouts} K
        </span>
      </div>
    </li>
  );
}
