"use client";

import { useMemo, useState } from "react";
import type { SeasonState } from "@/lib/types";
import {
  RANGE_LABELS,
  RangeKey,
  StrikeoutCategoryFilter,
  WalkCategoryFilter,
  aggregatePitchersFromStrikeouts,
  aggregatePitchersFromWalks,
  computeInsights,
  filterStrikeouts,
  filterWalks,
  formatRangeContext,
} from "@/lib/filters";
import { useHiddenPitchers } from "@/lib/preferences";
import { TopNav, type Mode } from "./components/TopNav";
import { RosterDrawer } from "./components/RosterDrawer";
import { FilterBar } from "./components/FilterBar";
import { HeroBar } from "./components/HeroBar";
import { InsightsRow } from "./components/InsightsRow";
import { TrendChart } from "./components/TrendChart";
import { InningChart } from "./components/InningChart";
import { CategoryLeaders } from "./components/CategoryLeaders";
import { StrikeoutLeaders } from "./components/StrikeoutLeaders";
import { ViewToggle, type ViewMode } from "./components/ViewToggle";
import { CategoryChips, type CategoryDef } from "./components/CategoryChips";
import { PitcherTable } from "./PitcherTable";
import { PitcherCards } from "./components/PitcherCards";
import { RecentWalksFeed } from "./components/RecentWalksFeed";
import { StrikeoutsFeed } from "./components/StrikeoutsFeed";

const WALK_CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All", emoji: "🎯", tone: "neutral" },
  { key: "fourPitch", label: "4-Pitch", emoji: "🚶", tone: "amber" },
  { key: "ohTwo", label: "0-2", emoji: "😬", tone: "rose" },
  { key: "leadoff", label: "Leadoff", emoji: "🛻", tone: "sky" },
  { key: "twoOut", label: "2-Out", emoji: "🪢", tone: "violet" },
];

const K_CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All", emoji: "🎯", tone: "neutral" },
  { key: "threePitch", label: "3-Pitch", emoji: "⚡", tone: "emerald" },
  { key: "side", label: "Sat-Side", emoji: "🪑", tone: "indigo" },
];

const WALK_CATEGORY_LABELS: Record<WalkCategoryFilter, string> = {
  all: "all walks",
  fourPitch: "4-pitch walks",
  ohTwo: "0-2 walks",
  leadoff: "leadoff walks",
  twoOut: "2-out walks",
};

const K_CATEGORY_LABELS: Record<StrikeoutCategoryFilter, string> = {
  all: "all strikeouts",
  threePitch: "3-pitch strikeouts",
  side: "side strikeouts",
};

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
  const [mode, setMode] = useState<Mode>("walks");
  const [range, setRange] = useState<RangeKey>("season");
  const [query, setQuery] = useState("");
  const [walkCat, setWalkCat] = useState<WalkCategoryFilter>("all");
  const [kCat, setKCat] = useState<StrikeoutCategoryFilter>("all");
  const [view, setView] = useState<ViewMode>("table");
  const [rosterOpen, setRosterOpen] = useState(false);

  const { hidden, toggle, showAll, hideAll } = useHiddenPitchers();

  const filteredWalks = useMemo(
    () => filterWalks(state.walks, range, state, query, walkCat, hidden),
    [state, range, query, walkCat, hidden],
  );
  const filteredK = useMemo(
    () => filterStrikeouts(state.strikeouts, range, state, query, kCat, hidden),
    [state, range, query, kCat, hidden],
  );

  const walkPitchers = useMemo(
    () => aggregatePitchersFromWalks(filteredWalks, state.pitchers),
    [filteredWalks, state.pitchers],
  );
  const kPitchers = useMemo(
    () => aggregatePitchersFromStrikeouts(filteredK, state.pitchers),
    [filteredK, state.pitchers],
  );

  const allPitchers = useMemo(
    () => Object.values(state.pitchers),
    [state.pitchers],
  );

  const rangeContext = formatRangeContext(range, state);
  const isFiltered =
    range !== "season" ||
    query.trim().length > 0 ||
    (mode === "walks" ? walkCat !== "all" : kCat !== "all") ||
    hidden.size > 0;

  const walkTotals = useMemo(
    () =>
      walkPitchers.reduce(
        (acc, p) => ({
          total: acc.total + p.totalWalks,
          fourPitch: acc.fourPitch + p.fourPitchWalks,
          ohTwo: acc.ohTwo + p.ohTwoWalks,
          leadoff: acc.leadoff + p.leadoffWalks,
          twoOut: acc.twoOut + p.twoOutWalks,
        }),
        { total: 0, fourPitch: 0, ohTwo: 0, leadoff: 0, twoOut: 0 },
      ),
    [walkPitchers],
  );

  const kTotals = useMemo(() => {
    const sideInnings = new Set<string>();
    let threePitch = 0;
    for (const s of filteredK) {
      if (s.tags.includes("threePitch")) threePitch += 1;
      if (s.tags.includes("side")) {
        sideInnings.add(`${s.gamePk}-${s.inning}-${s.halfInning}`);
      }
    }
    return {
      total: filteredK.length,
      threePitch,
      side: sideInnings.size,
    };
  }, [filteredK]);

  const walkLeader = useMemo(
    () => [...walkPitchers].sort((a, b) => b.totalWalks - a.totalWalks)[0],
    [walkPitchers],
  );
  const kLeader = useMemo(
    () => [...kPitchers].sort((a, b) => b.totalStrikeouts - a.totalStrikeouts)[0],
    [kPitchers],
  );

  const walkInsights = useMemo(
    () => computeInsights(filteredWalks),
    [filteredWalks],
  );
  const kInsights = useMemo(
    () => computeInsights(filteredK),
    [filteredK],
  );

  return (
    <>
      <TopNav
        mode={mode}
        onModeChange={setMode}
        walkCount={state.meta.totalWalks}
        strikeoutCount={state.meta.totalStrikeouts}
        hiddenCount={hidden.size}
        onOpenRoster={() => setRosterOpen(true)}
      />

      <RosterDrawer
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        pitchers={allPitchers}
        hidden={hidden}
        onToggle={toggle}
        onShowAll={showAll}
        onHideAll={hideAll}
      />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        <header className="fade-in mb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-sox-navy)] sm:text-2xl">
                {mode === "walks"
                  ? "Walk Tracker"
                  : "Strikeout Tracker"}
              </h1>
              <p className="text-[11px] text-slate-500 sm:text-xs">
                {mode === "walks"
                  ? "Free passes by category — "
                  : "Punchouts by category — "}
                {state.season} season
              </p>
            </div>
            <div className="text-[11px] text-slate-500 sm:text-right">
              {pluralize(state.meta.totalGames, "game", "games")} · last refresh{" "}
              <span className="tabular">
                {formatTimestamp(state.meta.lastRefreshAt)}
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
            resultCount={mode === "walks" ? filteredWalks.length : filteredK.length}
          />
        </section>

        <section className="fade-in mb-5">
          <CategoryChips
            categories={mode === "walks" ? WALK_CATEGORIES : K_CATEGORIES}
            value={mode === "walks" ? walkCat : kCat}
            onChange={(v) =>
              mode === "walks"
                ? setWalkCat(v as WalkCategoryFilter)
                : setKCat(v as StrikeoutCategoryFilter)
            }
          />
          <div className="mt-1 text-[10px] text-slate-400">
            Showing{" "}
            {mode === "walks" ? WALK_CATEGORY_LABELS[walkCat] : K_CATEGORY_LABELS[kCat]}
          </div>
        </section>

        {mode === "walks" ? (
          <WalksContent
            range={range}
            totals={walkTotals}
            leader={walkLeader}
            insights={walkInsights}
            pitchers={walkPitchers}
            walks={filteredWalks}
            view={view}
            onViewChange={setView}
            isFiltered={isFiltered}
            query={query}
          />
        ) : (
          <StrikeoutsContent
            range={range}
            totals={kTotals}
            leader={kLeader}
            insights={kInsights}
            pitchers={kPitchers}
            strikeouts={filteredK}
            view={view}
            onViewChange={setView}
            isFiltered={isFiltered}
            query={query}
          />
        )}

        <footer className="mt-6 text-center text-[11px] text-slate-400">
          Data: MLB Stats API · Refresh: daily via Vercel Cron · Built with Next.js
        </footer>
      </main>
    </>
  );
}

function WalksContent(props: {
  range: RangeKey;
  totals: { total: number; fourPitch: number; ohTwo: number; leadoff: number; twoOut: number };
  leader?: { name: string; totalWalks: number };
  insights: ReturnType<typeof computeInsights>;
  pitchers: ReturnType<typeof aggregatePitchersFromWalks>;
  walks: ReturnType<typeof filterWalks>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  isFiltered: boolean;
  query: string;
}) {
  const {
    range,
    totals,
    leader,
    insights,
    pitchers,
    walks,
    view,
    onViewChange,
    isFiltered,
    query,
  } = props;

  return (
    <>
      <section className="fade-in mb-5">
        <HeroBar
          accent="red"
          eventLabel="walks"
          rangeLabel={RANGE_LABELS[range]}
          total={totals.total}
          leaderName={leader?.name}
          leaderValue={leader?.totalWalks ?? 0}
          breakdown={[
            { label: "4-Pitch", value: totals.fourPitch, tone: "amber" },
            { label: "0-2", value: totals.ohTwo, tone: "rose" },
            { label: "Leadoff", value: totals.leadoff, tone: "sky" },
            { label: "2-Out", value: totals.twoOut, tone: "violet" },
          ]}
        />
      </section>

      <section className="fade-in mb-5">
        <InsightsRow
          mode="walks"
          worstLabel="Most walks in a game"
          insights={insights}
        />
      </section>

      <section className="fade-in mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="Walks per game">
          <TrendChart data={insights.byGame} accent="red" />
        </ChartCard>
        <ChartCard title="Walks by inning">
          <InningChart data={insights.byInning} accent="red" />
        </ChartCard>
      </section>

      <section className="fade-in mb-5">
        <SectionHeader title="Walk Hall of Shame" subtitle={RANGE_LABELS[range]} />
        <CategoryLeaders pitchers={pitchers} />
      </section>

      <section className="fade-in mb-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <BoardHeader
            title="Pitcher Leaderboard"
            count={pitchers.length}
            isFiltered={isFiltered}
            view={view}
            onViewChange={onViewChange}
          />
          {pitchers.length === 0 ? (
            <Empty />
          ) : view === "table" ? (
            <PitcherTable pitchers={pitchers} allWalks={walks} mode="walks" />
          ) : (
            <PitcherCards
              pitchers={pitchers}
              allWalks={walks}
              allStrikeouts={[]}
              query={query}
              mode="walks"
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
              {walks.length === 0
                ? "No walks in this filter"
                : `${walks.length} ${walks.length === 1 ? "walk" : "walks"} · newest first`}
            </p>
          </div>
          <RecentWalksFeed walks={walks} limit={30} />
        </div>
      </section>
    </>
  );
}

function StrikeoutsContent(props: {
  range: RangeKey;
  totals: { total: number; threePitch: number; side: number };
  leader?: { name: string; totalStrikeouts: number };
  insights: ReturnType<typeof computeInsights>;
  pitchers: ReturnType<typeof aggregatePitchersFromStrikeouts>;
  strikeouts: ReturnType<typeof filterStrikeouts>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  isFiltered: boolean;
  query: string;
}) {
  const {
    range,
    totals,
    leader,
    insights,
    pitchers,
    strikeouts,
    view,
    onViewChange,
    isFiltered,
    query,
  } = props;

  return (
    <>
      <section className="fade-in mb-5">
        <HeroBar
          accent="emerald"
          eventLabel="strikeouts"
          rangeLabel={RANGE_LABELS[range]}
          total={totals.total}
          leaderName={leader?.name}
          leaderValue={leader?.totalStrikeouts ?? 0}
          breakdown={[
            { label: "3-Pitch", value: totals.threePitch, tone: "emerald" },
            { label: "Sat-Side", value: totals.side, tone: "indigo" },
          ]}
        />
      </section>

      <section className="fade-in mb-5">
        <InsightsRow
          mode="strikeouts"
          worstLabel="Most K's in a game"
          insights={insights}
        />
      </section>

      <section className="fade-in mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="K's per game">
          <TrendChart data={insights.byGame} accent="emerald" />
        </ChartCard>
        <ChartCard title="K's by inning">
          <InningChart data={insights.byInning} accent="emerald" />
        </ChartCard>
      </section>

      <section className="fade-in mb-5">
        <SectionHeader title="K Hall of Fame" subtitle={RANGE_LABELS[range]} />
        <StrikeoutLeaders pitchers={pitchers} />
      </section>

      <section className="fade-in mb-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <BoardHeader
            title="Pitcher Leaderboard"
            count={pitchers.length}
            isFiltered={isFiltered}
            view={view}
            onViewChange={onViewChange}
          />
          {pitchers.length === 0 ? (
            <Empty />
          ) : view === "table" ? (
            <PitcherTable
              pitchers={pitchers}
              allStrikeouts={strikeouts}
              mode="strikeouts"
            />
          ) : (
            <PitcherCards
              pitchers={pitchers}
              allWalks={[]}
              allStrikeouts={strikeouts}
              query={query}
              mode="strikeouts"
            />
          )}
        </div>
      </section>

      <section className="fade-in mb-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">
              Strikeout Feed
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {strikeouts.length === 0
                ? "No strikeouts in this filter"
                : `${strikeouts.length} ${strikeouts.length === 1 ? "K" : "K's"} · newest first`}
            </p>
          </div>
          <StrikeoutsFeed strikeouts={strikeouts} limit={30} />
        </div>
      </section>
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
      <span>{title}</span>
      <span className="opacity-60">· {subtitle}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </h2>
  );
}

function BoardHeader({
  title,
  count,
  isFiltered,
  view,
  onViewChange,
}: {
  title: string;
  count: number;
  isFiltered: boolean;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">
          {title}
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {count === 0
            ? "No matching pitchers"
            : `${count} ${count === 1 ? "pitcher" : "pitchers"} · tap row for detail`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isFiltered && (
          <span className="rounded-full bg-[var(--color-sox-red)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-sox-red)]">
            filtered
          </span>
        )}
        <ViewToggle value={view} onChange={onViewChange} />
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="px-6 py-14 text-center text-sm text-slate-500">
      Nothing matches the current filter.
    </div>
  );
}
