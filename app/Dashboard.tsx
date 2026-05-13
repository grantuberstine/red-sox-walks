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
  filterStrikeouts,
  filterWalks,
  formatRangeContext,
} from "@/lib/filters";
import { computeFundReport } from "@/lib/fund";
import { useHiddenPitchers } from "@/lib/preferences";
import { useTheme } from "@/lib/theme";
import { ThemeToggle } from "./components/ThemeToggle";
import { Sidebar, MobileTabBar, type Section } from "./components/Sidebar";
import { WooSoxLogo } from "./components/WooSoxLogo";
import { FilterRow } from "./components/FilterRow";
import type { SearchSuggestion } from "./components/SearchInput";
import { RosterDrawer } from "./components/RosterDrawer";
import { HeroBar } from "./components/HeroBar";
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
import { PlayersGallery } from "./components/PlayersGallery";
import { PlayerProfile } from "./components/PlayerProfile";

const WALK_CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All", emoji: "", tone: "neutral" },
  { key: "fourPitch", label: "4-Pitch", emoji: "", tone: "amber" },
  { key: "ohTwo", label: "0-2", emoji: "", tone: "rose" },
  { key: "leadoff", label: "Leadoff", emoji: "", tone: "sky" },
  { key: "twoOut", label: "2-Out", emoji: "", tone: "violet" },
];

const K_CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All", emoji: "", tone: "neutral" },
  { key: "threePitch", label: "3-Pitch", emoji: "", tone: "emerald" },
  { key: "side", label: "3-Up-3-Dn", emoji: "", tone: "indigo" },
];

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
  const [section, setSection] = useState<Section>("walks");
  const [range, setRange] = useState<RangeKey>("season");
  const [query, setQuery] = useState("");
  const [walkCat, setWalkCat] = useState<WalkCategoryFilter>("all");
  const [kCat, setKCat] = useState<StrikeoutCategoryFilter>("all");
  const [view, setView] = useState<ViewMode>("table");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);

  const { hidden, toggle, showAll, hideAll } = useHiddenPitchers();
  const { theme, toggle: toggleTheme } = useTheme();

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

  const allPitchersFiltered = useMemo(() => {
    const both = new Map<number, ReturnType<typeof aggregatePitchersFromWalks>[number]>();
    for (const p of walkPitchers) both.set(p.pitcherId, p);
    for (const p of kPitchers) {
      const existing = both.get(p.pitcherId);
      if (existing) {
        existing.totalStrikeouts = p.totalStrikeouts;
        existing.threePitchStrikeouts = p.threePitchStrikeouts;
        existing.sideStrikeouts = p.sideStrikeouts;
        existing.lastStrikeoutDate = p.lastStrikeoutDate;
      } else {
        both.set(p.pitcherId, p);
      }
    }
    for (const p of both.values()) {
      const meta = state.pitchers[String(p.pitcherId)];
      if (meta) {
        p.outsRecorded = meta.outsRecorded;
        p.achievements = meta.achievements;
      }
    }
    const q = query.trim().toLowerCase();
    return [...both.values()].filter((p) => {
      if (hidden.has(p.pitcherId)) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [walkPitchers, kPitchers, state.pitchers, hidden, query]);

  const allPitchers = useMemo(
    () => Object.values(state.pitchers),
    [state.pitchers],
  );

  const fundReport = useMemo(
    () => computeFundReport(filteredWalksAllCats, filteredKAllCats, state.pitchers),
    [filteredWalksAllCats, filteredKAllCats, state.pitchers],
  );

  const searchSuggestions: SearchSuggestion[] = useMemo(
    () =>
      allPitchers
        .filter((p) => !hidden.has(p.pitcherId))
        .map((p) => ({
          id: p.pitcherId,
          name: p.name,
          headshotUrl: p.headshotUrl,
          hint: `${p.totalWalks} BB · ${p.totalStrikeouts} K`,
        })),
    [allPitchers, hidden],
  );

  const rangeContext = formatRangeContext(range, state);

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

  const profilePitcher = useMemo(() => {
    if (profileId === null) return null;
    return state.pitchers[String(profileId)] ?? null;
  }, [profileId, state.pitchers]);

  const totalsLine = `${state.meta.totalGames}g · ${state.meta.totalWalks} BB · ${state.meta.totalStrikeouts} K`;

  const sectionLabel: Record<Section, string> = {
    walks: "Walks",
    strikeouts: "Strikeouts",
    players: profilePitcher ? profilePitcher.name : "Players",
    team: "Team",
    fund: "No Pass Fund",
  };

  const openProfile = (id: number) => {
    setProfileId(id);
    setSection("players");
  };

  const changeSection = (s: Section) => {
    setSection(s);
    if (s !== "players") setProfileId(null);
  };

  const showFilters = section !== "players" || profileId === null;

  const filterCategories =
    section === "walks"
      ? WALK_CATEGORIES
      : section === "strikeouts"
        ? K_CATEGORIES
        : undefined;
  const filterCategoryValue =
    section === "walks" ? walkCat : section === "strikeouts" ? kCat : undefined;
  const onFilterCategoryChange = (v: string) => {
    if (section === "walks") setWalkCat(v as WalkCategoryFilter);
    if (section === "strikeouts") setKCat(v as StrikeoutCategoryFilter);
  };

  const filterResultCount = (() => {
    switch (section) {
      case "walks":
        return filteredWalks.length;
      case "strikeouts":
        return filteredK.length;
      case "players":
        return allPitchersFiltered.length;
      case "team":
        return filteredWalksAllCats.length + filteredKAllCats.length;
      case "fund":
        return fundReport.entries.length;
    }
  })();

  const filterResultUnit = (() => {
    switch (section) {
      case "walks":
        return "walk";
      case "strikeouts":
        return "strikeout";
      case "players":
        return "pitcher";
      case "team":
        return "event";
      case "fund":
        return "pitcher";
    }
  })();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] lg:flex-row">
      <Sidebar
        section={section}
        onSectionChange={changeSection}
        onOpenRoster={() => setRosterOpen(true)}
        hiddenCount={hidden.size}
        totalsLine={totalsLine}
        themeToggle={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
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
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2.5 backdrop-blur sm:px-6 lg:px-8"
          style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
        >
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <WooSoxLogo size={28} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-tight text-[var(--text)]">
                {sectionLabel[section]}
              </div>
              <div className="truncate text-[10px] leading-tight text-[var(--text-muted)]">
                {totalsLine}
              </div>
            </div>
          </div>
          <div className="hidden min-w-0 lg:block">
            <h1 className="truncate text-base font-bold text-[var(--text)]">
              {sectionLabel[section]}
            </h1>
            <p className="truncate text-[11px] text-[var(--text-muted)]">
              {state.season} season · last refresh{" "}
              <span className="tabular">
                {formatTimestamp(state.meta.lastRefreshAt)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRosterOpen(true)}
            aria-label="Manage roster"
            className="relative inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] lg:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {hidden.size > 0 && (
              <span className="rounded-full bg-[var(--color-sox-red)] px-1.5 text-[10px] font-bold text-white">
                {hidden.size}
              </span>
            )}
          </button>
        </header>

        {showFilters && (
          <FilterRow
            range={range}
            onRangeChange={setRange}
            query={query}
            onQueryChange={setQuery}
            rangeContext={rangeContext}
            resultCount={filterResultCount}
            resultUnit={filterResultUnit}
            suggestions={searchSuggestions}
            categories={filterCategories}
            categoryValue={filterCategoryValue}
            onCategoryChange={
              filterCategories ? onFilterCategoryChange : undefined
            }
          />
        )}

        <main className="min-w-0 flex-1 px-4 pb-20 pt-4 sm:px-6 lg:pb-8 lg:pt-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            {section === "walks" && (
              <WalksView
                range={range}
                totals={walkTotals}
                pitchers={walkPitchers}
                walks={filteredWalks}
                view={view}
                onViewChange={setView}
                query={query}
                onSelect={openProfile}
              />
            )}

            {section === "strikeouts" && (
              <StrikeoutsView
                range={range}
                totals={kTotals}
                pitchers={kPitchers}
                strikeouts={filteredK}
                view={view}
                onViewChange={setView}
                query={query}
                onSelect={openProfile}
              />
            )}

            {section === "players" &&
              (profilePitcher ? (
                <PlayerProfile
                  pitcher={profilePitcher}
                  walks={filteredWalksAllCats}
                  strikeouts={filteredKAllCats}
                  onBack={() => setProfileId(null)}
                  rangeLabel={RANGE_LABELS[range]}
                />
              ) : (
                <PlayersGallery
                  pitchers={allPitchersFiltered}
                  onSelect={openProfile}
                />
              ))}

            {section === "team" && (
              <TeamView
                state={state}
                range={range}
                filteredWalks={filteredWalksAllCats}
                filteredK={filteredKAllCats}
                rangeLabel={RANGE_LABELS[range]}
              />
            )}

            {section === "fund" && (
              <FundView
                report={fundReport}
                rangeLabel={RANGE_LABELS[range]}
              />
            )}

            <footer className="mt-8 text-center text-[11px] text-[var(--text-muted)]">
              Data: MLB Stats API · Daily refresh via Vercel Cron
            </footer>
          </div>
        </main>

        <MobileTabBar section={section} onSectionChange={changeSection} />
      </div>
    </div>
  );
}

function WalksView({
  range,
  totals,
  pitchers,
  walks,
  view,
  onViewChange,
  query,
  onSelect,
}: {
  range: RangeKey;
  totals: { total: number; fourPitch: number; ohTwo: number; leadoff: number; twoOut: number };
  pitchers: ReturnType<typeof aggregatePitchersFromWalks>;
  walks: ReturnType<typeof filterWalks>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  query: string;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="space-y-5">
      <HeroBar
        accent="red"
        eventLabel="walks issued"
        rangeLabel={RANGE_LABELS[range]}
        total={totals.total}
        breakdown={[
          { label: "4-Pitch", value: totals.fourPitch, tone: "amber" },
          { label: "0-2", value: totals.ohTwo, tone: "rose" },
          { label: "Leadoff", value: totals.leadoff, tone: "sky" },
          { label: "2-Out", value: totals.twoOut, tone: "violet" },
        ]}
      />
      <SectionHeader title="Top of each category" subtitle={RANGE_LABELS[range]} />
      <CategoryLeaders pitchers={pitchers} />
      <LeaderboardSection
        title="Walks Leaderboard"
        hint={`"Walks" = total free passes issued by that pitcher`}
        pitchers={pitchers}
        walks={walks}
        strikeouts={[]}
        view={view}
        onViewChange={onViewChange}
        query={query}
        mode="walks"
        onSelect={onSelect}
      />
      <FeedSection
        title="Walk Feed"
        subtitle={`${walks.length} ${walks.length === 1 ? "walk" : "walks"} · newest first`}
      >
        <RecentWalksFeed walks={walks} limit={30} />
      </FeedSection>
    </div>
  );
}

function StrikeoutsView({
  range,
  totals,
  pitchers,
  strikeouts,
  view,
  onViewChange,
  query,
  onSelect,
}: {
  range: RangeKey;
  totals: { total: number; threePitch: number; side: number };
  pitchers: ReturnType<typeof aggregatePitchersFromStrikeouts>;
  strikeouts: ReturnType<typeof filterStrikeouts>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  query: string;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="space-y-5">
      <HeroBar
        accent="emerald"
        eventLabel="strikeouts recorded"
        rangeLabel={RANGE_LABELS[range]}
        total={totals.total}
        breakdown={[
          { label: "3-Pitch K", value: totals.threePitch, tone: "emerald" },
          { label: "3-Up-3-Dn", value: totals.side, tone: "indigo" },
        ]}
      />
      <SectionHeader title="Top of each category" subtitle={RANGE_LABELS[range]} />
      <StrikeoutLeaders pitchers={pitchers} />
      <LeaderboardSection
        title="Strikeouts Leaderboard"
        hint={`"Strikeouts" = total K's recorded by that pitcher`}
        pitchers={pitchers}
        walks={[]}
        strikeouts={strikeouts}
        view={view}
        onViewChange={onViewChange}
        query={query}
        mode="strikeouts"
        onSelect={onSelect}
      />
      <FeedSection
        title="Strikeout Feed"
        subtitle={`${strikeouts.length} ${strikeouts.length === 1 ? "K" : "K's"} · newest first`}
      >
        <StrikeoutsFeed strikeouts={strikeouts} limit={30} />
      </FeedSection>
    </div>
  );
}

function LeaderboardSection({
  title,
  hint,
  pitchers,
  walks,
  strikeouts,
  view,
  onViewChange,
  query,
  mode,
  onSelect,
}: {
  title: string;
  hint: string;
  pitchers: ReturnType<typeof aggregatePitchersFromWalks>;
  walks: ReturnType<typeof filterWalks>;
  strikeouts: ReturnType<typeof filterStrikeouts>;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  query: string;
  mode: "walks" | "strikeouts";
  onSelect: (id: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-5 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[var(--text)]">
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            {pitchers.length === 0
              ? "No matching pitchers"
              : `${hint} · click a row for the full profile`}
          </p>
        </div>
        <ViewToggle value={view} onChange={onViewChange} />
      </div>
      {pitchers.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-[var(--text-muted)]">
          Nothing matches the current filter.
        </div>
      ) : view === "table" ? (
        <PitcherTable
          pitchers={pitchers}
          allWalks={walks}
          allStrikeouts={strikeouts}
          mode={mode}
          onSelect={onSelect}
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
    <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
      <span>{title}</span>
      <span className="opacity-60">· {subtitle}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </h2>
  );
}

function FeedSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="border-b border-[var(--border)] px-5 py-3">
        <h2 className="text-sm font-bold text-[var(--text)]">{title}</h2>
        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
