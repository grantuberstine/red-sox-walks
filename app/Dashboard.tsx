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
import { computeFundReport } from "@/lib/fund";
import { useHiddenPitchers } from "@/lib/preferences";
import { Sidebar, MobileTabBar, type Section } from "./components/Sidebar";
import { WooSoxLogo } from "./components/WooSoxLogo";
import { SubHeader } from "./components/SubHeader";
import type { Mode } from "./components/TopNav";
import { RosterDrawer } from "./components/RosterDrawer";
import { HeroBar } from "./components/HeroBar";
import { InsightsRow } from "./components/InsightsRow";
import { CategoryLeaders } from "./components/CategoryLeaders";
import { StrikeoutLeaders } from "./components/StrikeoutLeaders";
import { ViewToggle, type ViewMode } from "./components/ViewToggle";
import type { CategoryDef } from "./components/CategoryChips";
import { PitcherTable } from "./PitcherTable";
import { PitcherCards } from "./components/PitcherCards";
import { RecentWalksFeed } from "./components/RecentWalksFeed";
import { StrikeoutsFeed } from "./components/StrikeoutsFeed";
import { TeamView } from "./components/TeamView";
import { FundView } from "./components/FundView";

const WALK_CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All", emoji: "🎯", tone: "neutral" },
  { key: "fourPitch", label: "4-Pitch", emoji: "🚶", tone: "amber" },
  { key: "ohTwo", label: "0-2", emoji: "😬", tone: "rose" },
  { key: "leadoff", label: "Leadoff", emoji: "🛻", tone: "sky" },
  { key: "twoOut", label: "2-Out", emoji: "🪢", tone: "violet" },
];

const K_CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All", emoji: "🎯", tone: "neutral" },
  { key: "threePitch", label: "3-Pitch K", emoji: "⚡", tone: "emerald" },
  { key: "side", label: "3-Up-3-Dn", emoji: "🪑", tone: "indigo" },
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
  threePitch: "3-pitch K's",
  side: "3-up-3-down K's",
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

export function Dashboard({ state }: { state: SeasonState }) {
  const [section, setSection] = useState<Section>("players");
  const [mode, setMode] = useState<Mode>("walks");
  const [range, setRange] = useState<RangeKey>("season");
  const [query, setQuery] = useState("");
  const [walkCat, setWalkCat] = useState<WalkCategoryFilter>("all");
  const [kCat, setKCat] = useState<StrikeoutCategoryFilter>("all");
  const [view, setView] = useState<ViewMode>("table");
  const [rosterOpen, setRosterOpen] = useState(false);

  const { hidden, toggle, showAll, hideAll } = useHiddenPitchers();

  const filteredWalksAllCats = useMemo(
    () => filterWalks(state.walks, range, state, query, "all", hidden),
    [state, range, query, hidden],
  );
  const filteredKAllCats = useMemo(
    () => filterStrikeouts(state.strikeouts, range, state, query, "all", hidden),
    [state, range, query, hidden],
  );

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

  const fundReport = useMemo(
    () => computeFundReport(filteredWalksAllCats, filteredKAllCats, state.pitchers),
    [filteredWalksAllCats, filteredKAllCats, state.pitchers],
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
    return { total: filteredK.length, threePitch, side: sideInnings.size };
  }, [filteredK]);

  const walkLeader = useMemo(
    () => [...walkPitchers].sort((a, b) => b.totalWalks - a.totalWalks)[0],
    [walkPitchers],
  );
  const kLeader = useMemo(
    () => [...kPitchers].sort((a, b) => b.totalStrikeouts - a.totalStrikeouts)[0],
    [kPitchers],
  );

  const isPlayers = section === "players";
  const isFund = section === "fund";
  const currentCategories = mode === "walks" ? WALK_CATEGORIES : K_CATEGORIES;
  const currentCatValue = mode === "walks" ? walkCat : kCat;
  const currentCatLabel =
    mode === "walks"
      ? `Showing ${WALK_CATEGORY_LABELS[walkCat]}`
      : `Showing ${K_CATEGORY_LABELS[kCat]}`;

  const totalsLine = `${state.meta.totalGames}g · ${state.meta.totalWalks} BB · ${state.meta.totalStrikeouts} K`;
  const sectionLabel: Record<Section, string> = {
    players: mode === "walks" ? "Player Walks" : "Player Strikeouts",
    team: mode === "walks" ? "Team — Walks" : "Team — Strikeouts",
    fund: "No Pass Fund",
  };

  const headerCount =
    section === "fund"
      ? fundReport.entries.length
      : mode === "walks"
        ? filteredWalks.length
        : filteredK.length;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-sand)] lg:flex-row">
      <Sidebar
        section={section}
        onSectionChange={setSection}
        onOpenRoster={() => setRosterOpen(true)}
        hiddenCount={hidden.size}
        totalsLine={totalsLine}
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white/95 px-4 py-2.5 backdrop-blur lg:px-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <WooSoxLogo size={28} />
            <div>
              <div className="text-sm font-bold leading-tight text-[var(--color-sox-navy)]">
                WooSox Tracker
              </div>
              <div className="text-[10px] leading-tight text-slate-500">
                {totalsLine}
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-base font-bold text-[var(--color-sox-navy)]">
              {sectionLabel[section]}
            </h1>
            <p className="text-[11px] text-slate-500">
              {state.season} season · last refresh{" "}
              <span className="tabular">
                {formatTimestamp(state.meta.lastRefreshAt)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setRosterOpen(true)}
              className="relative inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {hidden.size > 0 && (
                <span className="rounded-full bg-[var(--color-sox-red)] px-1.5 text-[10px] font-bold text-white">
                  {hidden.size}
                </span>
              )}
            </button>
          </div>
        </header>

        {!isFund && (
          <SubHeader
            mode={mode}
            onModeChange={setMode}
            walkCount={state.meta.totalWalks}
            strikeoutCount={state.meta.totalStrikeouts}
            range={range}
            onRangeChange={setRange}
            query={query}
            onQueryChange={setQuery}
            rangeContext={rangeContext}
            resultCount={headerCount}
            categories={isPlayers ? currentCategories : undefined}
            categoryValue={isPlayers ? currentCatValue : undefined}
            onCategoryChange={
              isPlayers
                ? (v) =>
                    mode === "walks"
                      ? setWalkCat(v as WalkCategoryFilter)
                      : setKCat(v as StrikeoutCategoryFilter)
                : undefined
            }
            categoryLabel={isPlayers ? currentCatLabel : undefined}
          />
        )}

        {isFund && (
          <FundFilters
            range={range}
            onRangeChange={setRange}
            query={query}
            onQueryChange={setQuery}
            rangeContext={rangeContext}
            entryCount={fundReport.entries.length}
          />
        )}

        <main className="min-w-0 flex-1 px-4 pb-20 pt-4 sm:px-6 lg:pb-8 lg:pt-6">
          <div className="mx-auto max-w-5xl">
            <h1 className="mb-4 text-lg font-bold tracking-tight text-[var(--color-sox-navy)] sm:text-xl lg:hidden">
              {sectionLabel[section]}
            </h1>

            {section === "players" ? (
              mode === "walks" ? (
                <PlayerWalksContent
                  range={range}
                  totals={walkTotals}
                  leader={walkLeader}
                  pitchers={walkPitchers}
                  walks={filteredWalks}
                  view={view}
                  onViewChange={setView}
                  isFiltered={isFiltered}
                  query={query}
                />
              ) : (
                <PlayerStrikeoutsContent
                  range={range}
                  totals={kTotals}
                  leader={kLeader}
                  pitchers={kPitchers}
                  strikeouts={filteredK}
                  view={view}
                  onViewChange={setView}
                  isFiltered={isFiltered}
                  query={query}
                />
              )
            ) : section === "team" ? (
              <TeamView
                state={state}
                range={range}
                filteredWalks={filteredWalksAllCats}
                filteredK={filteredKAllCats}
                rangeLabel={RANGE_LABELS[range]}
              />
            ) : (
              <FundView report={fundReport} rangeLabel={RANGE_LABELS[range]} />
            )}

            <footer className="mt-8 text-center text-[11px] text-slate-400">
              Data: MLB Stats API · Daily refresh via Vercel Cron
            </footer>
          </div>
        </main>

        <MobileTabBar section={section} onSectionChange={setSection} />
      </div>
    </div>
  );
}

function FundFilters({
  range,
  onRangeChange,
  query,
  onQueryChange,
  rangeContext,
  entryCount,
}: {
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  query: string;
  onQueryChange: (q: string) => void;
  rangeContext: string;
  entryCount: number;
}) {
  const RANGES: RangeKey[] = ["today", "week", "month", "season"];
  const SHORT = { today: "Today", week: "7D", month: "30D", season: "Season" };
  return (
    <div className="border-b border-[var(--color-line)] bg-white">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            className="flex w-full overflow-hidden rounded-xl bg-slate-100 p-1 sm:w-auto"
          >
            {RANGES.map((k) => {
              const active = k === range;
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onRangeChange(k)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:flex-initial ${
                    active
                      ? "bg-[var(--color-sox-navy)] text-white shadow"
                      : "text-slate-600 hover:text-[var(--color-sox-navy)]"
                  }`}
                >
                  {SHORT[k]}
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-72">
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search pitcher…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-[var(--color-sox-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sox-navy)]/10"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{rangeContext}</span>
          <span className="tabular">
            {entryCount} {entryCount === 1 ? "pitcher" : "pitchers"} on the books
          </span>
        </div>
      </div>
    </div>
  );
}

function PlayerWalksContent(props: {
  range: RangeKey;
  totals: { total: number; fourPitch: number; ohTwo: number; leadoff: number; twoOut: number };
  leader?: { name: string; totalWalks: number };
  pitchers: ReturnType<typeof aggregatePitchersFromWalks>;
  walks: ReturnType<typeof filterWalks>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  isFiltered: boolean;
  query: string;
}) {
  const { range, totals, leader, pitchers, walks, view, onViewChange, isFiltered, query } = props;
  const insights = computeInsights(walks);
  return (
    <div className="space-y-5">
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
      <InsightsRow mode="walks" worstLabel="Most walks in a game" insights={insights} />
      <SectionHeader title="Walk Hall of Shame" subtitle={RANGE_LABELS[range]} />
      <CategoryLeaders pitchers={pitchers} />
      <LeaderboardSection
        title="Pitcher Leaderboard"
        pitchers={pitchers}
        walks={walks}
        strikeouts={[]}
        view={view}
        onViewChange={onViewChange}
        isFiltered={isFiltered}
        query={query}
        mode="walks"
      />
      <FeedSection title="Walk Feed" emptyLabel="walks">
        <RecentWalksFeed walks={walks} limit={30} />
      </FeedSection>
    </div>
  );
}

function PlayerStrikeoutsContent(props: {
  range: RangeKey;
  totals: { total: number; threePitch: number; side: number };
  leader?: { name: string; totalStrikeouts: number };
  pitchers: ReturnType<typeof aggregatePitchersFromStrikeouts>;
  strikeouts: ReturnType<typeof filterStrikeouts>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  isFiltered: boolean;
  query: string;
}) {
  const { range, totals, leader, pitchers, strikeouts, view, onViewChange, isFiltered, query } = props;
  const insights = computeInsights(strikeouts);
  return (
    <div className="space-y-5">
      <HeroBar
        accent="emerald"
        eventLabel="strikeouts"
        rangeLabel={RANGE_LABELS[range]}
        total={totals.total}
        leaderName={leader?.name}
        leaderValue={leader?.totalStrikeouts ?? 0}
        breakdown={[
          { label: "3-Pitch K", value: totals.threePitch, tone: "emerald" },
          { label: "3-Up-3-Dn", value: totals.side, tone: "indigo" },
        ]}
      />
      <InsightsRow mode="strikeouts" worstLabel="Most K's in a game" insights={insights} />
      <SectionHeader title="K Hall of Fame" subtitle={RANGE_LABELS[range]} />
      <StrikeoutLeaders pitchers={pitchers} />
      <LeaderboardSection
        title="Pitcher Leaderboard"
        pitchers={pitchers}
        walks={[]}
        strikeouts={strikeouts}
        view={view}
        onViewChange={onViewChange}
        isFiltered={isFiltered}
        query={query}
        mode="strikeouts"
      />
      <FeedSection title="Strikeout Feed" emptyLabel="strikeouts">
        <StrikeoutsFeed strikeouts={strikeouts} limit={30} />
      </FeedSection>
    </div>
  );
}

function LeaderboardSection({
  title,
  pitchers,
  walks,
  strikeouts,
  view,
  onViewChange,
  isFiltered,
  query,
  mode,
}: {
  title: string;
  pitchers: ReturnType<typeof aggregatePitchersFromWalks>;
  walks: ReturnType<typeof filterWalks>;
  strikeouts: ReturnType<typeof filterStrikeouts>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  isFiltered: boolean;
  query: string;
  mode: Mode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {pitchers.length === 0
              ? "No matching pitchers"
              : `${pitchers.length} ${pitchers.length === 1 ? "pitcher" : "pitchers"} · tap row for detail`}
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
      {pitchers.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-slate-500">
          Nothing matches the current filter.
        </div>
      ) : view === "table" ? (
        <PitcherTable
          pitchers={pitchers}
          allWalks={walks}
          allStrikeouts={strikeouts}
          mode={mode}
        />
      ) : (
        <PitcherCards
          pitchers={pitchers}
          allWalks={walks}
          allStrikeouts={strikeouts}
          query={query}
          mode={mode}
        />
      )}
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
    <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
      <span>{title}</span>
      <span className="opacity-60">· {subtitle}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </h2>
  );
}

function FeedSection({
  title,
  emptyLabel,
  children,
}: {
  title: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">{title}</h2>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {emptyLabel} feed · newest first
        </p>
      </div>
      {children}
    </div>
  );
}
