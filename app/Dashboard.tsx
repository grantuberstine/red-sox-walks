"use client";

import { useMemo, useState } from "react";
import type { SeasonState } from "@/lib/types";
import {
  CATEGORY_LABELS,
  CategoryFilter,
  RANGE_LABELS,
  RangeKey,
  aggregateByPitcher,
  computeInsights,
  filterWalks,
  formatRangeContext,
} from "@/lib/filters";
import { PitcherTable } from "./PitcherTable";
import { PitcherCards } from "./components/PitcherCards";
import { CategoryLeaders } from "./components/CategoryLeaders";
import { RecentWalksFeed } from "./components/RecentWalksFeed";
import { FilterBar } from "./components/FilterBar";
import { HeroBar } from "./components/HeroBar";
import { CategoryChips } from "./components/CategoryChips";
import { ViewToggle, type ViewMode } from "./components/ViewToggle";
import { TrendChart } from "./components/TrendChart";
import { InningChart } from "./components/InningChart";
import { InsightsRow } from "./components/InsightsRow";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function pluralize(n: number, s: string, p: string): string {
  return n === 1 ? `${n} ${s}` : `${n} ${p}`;
}

export function Dashboard({ state }: { state: SeasonState }) {
  const [range, setRange] = useState<RangeKey>("season");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [view, setView] = useState<ViewMode>("table");

  const filteredWalks = useMemo(
    () => filterWalks(state.walks, range, state, query, category),
    [state, range, query, category],
  );

  const filteredPitchers = useMemo(
    () => aggregateByPitcher(filteredWalks, state.pitchers),
    [filteredWalks, state.pitchers],
  );

  const totals = useMemo(
    () =>
      filteredPitchers.reduce(
        (acc, p) => ({
          total: acc.total + p.totalWalks,
          fourPitch: acc.fourPitch + p.fourPitchWalks,
          ohTwo: acc.ohTwo + p.ohTwoWalks,
          leadoff: acc.leadoff + p.leadoffWalks,
          twoOut: acc.twoOut + p.twoOutWalks,
        }),
        { total: 0, fourPitch: 0, ohTwo: 0, leadoff: 0, twoOut: 0 },
      ),
    [filteredPitchers],
  );

  const teamLeader = useMemo(
    () => [...filteredPitchers].sort((a, b) => b.totalWalks - a.totalWalks)[0],
    [filteredPitchers],
  );

  const insights = useMemo(
    () => computeInsights(filteredWalks),
    [filteredWalks],
  );

  const rangeContext = formatRangeContext(range, state);
  const isFiltered =
    range !== "season" || query.trim().length > 0 || category !== "all";

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <header className="fade-in mb-5 sm:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-[var(--color-sox-red)]" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-sox-navy)] sm:text-3xl">
                  WooSox Walk Tracker
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Free passes by category — {state.season} season
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 sm:text-right sm:text-xs">
            <span>
              {pluralize(state.meta.totalGames, "game", "games")} ·{" "}
              {pluralize(state.meta.totalWalks, "walk", "walks")} ·{" "}
              {pluralize(Object.keys(state.pitchers).length, "pitcher", "pitchers")}
            </span>
            <span className="tabular">
              Last refresh: {formatTimestamp(state.meta.lastRefreshAt)}
            </span>
          </div>
        </div>
      </header>

      <section className="fade-in mb-3">
        <FilterBar
          range={range}
          onRangeChange={setRange}
          query={query}
          onQueryChange={setQuery}
          rangeContext={rangeContext}
          resultCount={filteredWalks.length}
        />
      </section>

      <section className="fade-in mb-5">
        <CategoryChips value={category} onChange={setCategory} />
        <div className="mt-1 text-[10px] text-slate-400">
          Showing {CATEGORY_LABELS[category].toLowerCase()}
        </div>
      </section>

      <section className="fade-in mb-5">
        <HeroBar
          total={totals.total}
          fourPitch={totals.fourPitch}
          ohTwo={totals.ohTwo}
          leadoff={totals.leadoff}
          twoOut={totals.twoOut}
          leaderName={teamLeader?.name}
          leaderWalks={teamLeader?.totalWalks ?? 0}
          rangeLabel={RANGE_LABELS[range]}
        />
      </section>

      <section className="fade-in mb-5">
        <InsightsRow insights={insights} />
      </section>

      <section className="fade-in mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Walks Per Game
            </h3>
          </div>
          <TrendChart data={insights.walksByGame} />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Walks By Inning
            </h3>
          </div>
          <InningChart data={insights.walksByInning} />
        </div>
      </section>

      <section className="fade-in mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <span>Walk Hall of Shame</span>
          <span className="opacity-60">· {RANGE_LABELS[range]}</span>
          <span className="h-px flex-1 bg-slate-200" />
        </h2>
        <CategoryLeaders pitchers={filteredPitchers} />
      </section>

      <section className="fade-in mb-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">
                Pitcher Leaderboard
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {filteredPitchers.length === 0
                  ? "No matching pitchers"
                  : `${filteredPitchers.length} ${filteredPitchers.length === 1 ? "pitcher" : "pitchers"} · tap any row for detail`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isFiltered && (
                <span className="rounded-full bg-[var(--color-sox-red)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-sox-red)]">
                  filtered
                </span>
              )}
              <ViewToggle value={view} onChange={setView} />
            </div>
          </div>
          {filteredPitchers.length === 0 ? (
            <EmptyState query={query} range={RANGE_LABELS[range]} />
          ) : view === "table" ? (
            <PitcherTable
              pitchers={filteredPitchers}
              allWalks={filteredWalks}
            />
          ) : (
            <PitcherCards
              pitchers={filteredPitchers}
              allWalks={filteredWalks}
              query={query}
            />
          )}
        </div>
      </section>

      <section className="fade-in mb-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">
              Walk Feed
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {filteredWalks.length === 0
                ? "No walks in this filter"
                : `${filteredWalks.length} ${filteredWalks.length === 1 ? "walk" : "walks"} · newest first`}
            </p>
          </div>
          <RecentWalksFeed walks={filteredWalks} limit={30} />
        </div>
      </section>

      <footer className="text-center text-[11px] text-slate-400">
        Data: MLB Stats API · Refresh: daily via Vercel Cron · Built with Next.js
      </footer>
    </main>
  );
}

function EmptyState({ query, range }: { query: string; range: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm text-slate-500">
        {query.trim()
          ? `No pitchers matching "${query.trim()}" in ${range.toLowerCase()}.`
          : `No walks in ${range.toLowerCase()}.`}
      </p>
    </div>
  );
}
