"use client";

import { useEffect, useMemo, useState } from "react";
import type { SeasonState } from "@/lib/types";
import {
  RANGE_LABELS,
  RangeKey,
  aggregatePitchersFromStrikeouts,
  aggregatePitchersFromWalks,
  filterStrikeouts,
  filterWalks,
} from "@/lib/filters";
import {
  computeFundReport,
  formatMoney,
  WALK_FEE_PER_CATEGORY,
  THREE_PITCH_K_BONUS,
  SIDE_K_BONUS,
} from "@/lib/fund";
import { useHiddenPitchers } from "@/lib/preferences";
import { useTheme } from "@/lib/theme";
import { Sidebar, MobileTabBar, type Section } from "./components/Sidebar";
import { WooSoxLogo } from "./components/WooSoxLogo";
import { TimeRangePills } from "./components/FilterRow";
import { SearchInput, type SearchSuggestion } from "./components/SearchInput";
import { ThemeToggle } from "./components/ThemeToggle";
import { RosterDrawer } from "./components/RosterDrawer";
import { HeroBar } from "./components/HeroBar";
import { CategoryLeaders } from "./components/CategoryLeaders";
import { StrikeoutLeaders } from "./components/StrikeoutLeaders";
import { ViewToggle, type ViewMode } from "./components/ViewToggle";
import { PitcherTable } from "./PitcherTable";
import { PitcherCards } from "./components/PitcherCards";
import { RecentWalksFeed } from "./components/RecentWalksFeed";
import { StrikeoutsFeed } from "./components/StrikeoutsFeed";
import { TeamView } from "./components/TeamView";
import { FundView } from "./components/FundView";
import { PlayersGallery } from "./components/PlayersGallery";
import { PlayerProfile } from "./components/PlayerProfile";
import { AnalyticsView } from "./components/AnalyticsView";
import { PitcherPicker } from "./components/PitcherPicker";

const VALID_SECTIONS: Section[] = [
  "walks",
  "strikeouts",
  "players",
  "team",
  "analytics",
  "fund",
];
const VALID_RANGES: RangeKey[] = ["season", "month", "week", "today"];

function readInitialUrl(): {
  section: Section;
  range: RangeKey;
  profileId: number | null;
  analyticsPitcherId: number | null;
} {
  if (typeof window === "undefined") {
    return {
      section: "walks",
      range: "season",
      profileId: null,
      analyticsPitcherId: null,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const s = params.get("section");
  const r = params.get("range");
  const p = Number(params.get("pitcher"));
  const ap = Number(params.get("analyticsPitcher"));
  return {
    section: VALID_SECTIONS.includes(s as Section) ? (s as Section) : "walks",
    range: VALID_RANGES.includes(r as RangeKey) ? (r as RangeKey) : "season",
    profileId: Number.isFinite(p) && p > 0 ? p : null,
    analyticsPitcherId: Number.isFinite(ap) && ap > 0 ? ap : null,
  };
}

export function Dashboard({ state }: { state: SeasonState }) {
  const initial = readInitialUrl();
  const [section, setSection] = useState<Section>(initial.section);
  const [range, setRange] = useState<RangeKey>(initial.range);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(initial.profileId);
  const [analyticsPitcherId, setAnalyticsPitcherId] = useState<number | null>(
    initial.analyticsPitcherId,
  );

  const { hidden, toggle, showAll, hideAll } = useHiddenPitchers();
  const { theme, toggle: toggleTheme } = useTheme();

  // Sync state → URL (replaceState so we don't fill browser history on every click)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (section !== "walks") params.set("section", section);
    if (range !== "season") params.set("range", range);
    if (profileId !== null) params.set("pitcher", String(profileId));
    if (analyticsPitcherId !== null)
      params.set("analyticsPitcher", String(analyticsPitcherId));
    const qs = params.toString();
    const newUrl = qs ? `?${qs}` : window.location.pathname;
    if (window.location.search !== (qs ? `?${qs}` : "")) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [section, range, profileId, analyticsPitcherId]);

  const filteredWalks = useMemo(
    () => filterWalks(state.walks, range, state, query, "all", hidden),
    [state, range, query, hidden],
  );
  const filteredK = useMemo(
    () => filterStrikeouts(state.strikeouts, range, state, query, "all", hidden),
    [state, range, query, hidden],
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
    () => computeFundReport(filteredWalks, filteredK, state.pitchers),
    [filteredWalks, filteredK, state.pitchers],
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

  const walkFeeCount =
    walkTotals.fourPitch + walkTotals.ohTwo + walkTotals.leadoff + walkTotals.twoOut;

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

  const veloPitchers = useMemo(() => {
    const ids = Object.keys(state.velocity);
    const list: typeof allPitchers = [];
    for (const id of ids) {
      const p = state.pitchers[id];
      if (p) list.push(p);
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [state.velocity, state.pitchers, allPitchers]);

  const analyticsPitcher = useMemo(() => {
    const id =
      analyticsPitcherId ?? (veloPitchers.length > 0 ? veloPitchers[0].pitcherId : null);
    if (id === null) return null;
    return state.pitchers[String(id)] ?? null;
  }, [analyticsPitcherId, veloPitchers, state.pitchers]);

  const sectionLabel: Record<Section, string> = {
    walks: "Walks",
    strikeouts: "Strikeouts",
    players: profilePitcher ? profilePitcher.name : "Players",
    team: "Team",
    analytics: "Analytics",
    fund: "No Pass Fund",
  };

  const scrollTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  };

  const openProfile = (id: number) => {
    setProfileId(id);
    setSection("players");
    scrollTop();
  };

  const closeProfile = () => {
    setProfileId(null);
    scrollTop();
  };

  const changeSection = (s: Section) => {
    setSection(s);
    if (s !== "players") setProfileId(null);
    scrollTop();
  };

  const changeAnalyticsPitcher = (id: number) => {
    setAnalyticsPitcherId(id);
    scrollTop();
  };

  const goHome = () => {
    changeSection("walks");
    setProfileId(null);
  };

  const showFilters =
    section !== "analytics" &&
    (section !== "players" || profileId === null);

  const showAnalyticsPicker = section === "analytics";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] lg:flex-row">
      <Sidebar
        section={section}
        onSectionChange={changeSection}
        onOpenRoster={() => setRosterOpen(true)}
        onGoHome={goHome}
        theme={theme}
        onToggleTheme={toggleTheme}
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
          className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex h-[73px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <button
                type="button"
                onClick={goHome}
                aria-label="Go to Walks"
                className="lg:hidden -m-1 cursor-pointer rounded-md p-1 transition hover:opacity-80"
              >
                <WooSoxLogo size={28} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold leading-tight text-[var(--text)] sm:text-xl">
                  {sectionLabel[section]}
                </h1>
              </div>
            </div>

            {showFilters && (
              <div className="hidden items-center gap-2 lg:flex">
                <TimeRangePills range={range} onRangeChange={setRange} />
                <div className="w-72">
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    suggestions={searchSuggestions}
                  />
                </div>
              </div>
            )}

            {showAnalyticsPicker && (
              <div className="hidden lg:block">
                <PitcherPicker
                  pitchers={veloPitchers}
                  value={analyticsPitcher?.pitcherId ?? null}
                  onChange={changeAnalyticsPitcher}
                  placeholder="Pick a pitcher"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 lg:hidden">
              <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
              <button
                type="button"
                onClick={() => setRosterOpen(true)}
                aria-label="Roster"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition hover:border-[var(--border-strong)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 9h10M7 13h10M7 17h6" />
                </svg>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-2 lg:hidden">
              <TimeRangePills range={range} onRangeChange={setRange} />
              <div className="ml-auto w-full max-w-[220px]">
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  suggestions={searchSuggestions}
                />
              </div>
            </div>
          )}

          {showAnalyticsPicker && (
            <div className="border-t border-[var(--border)] px-4 py-2 lg:hidden">
              <PitcherPicker
                pitchers={veloPitchers}
                value={analyticsPitcher?.pitcherId ?? null}
                onChange={setAnalyticsPitcherId}
                placeholder="Pick a pitcher"
              />
            </div>
          )}
        </header>

        <main className="min-w-0 flex-1 px-4 pb-20 pt-4 sm:px-6 lg:pb-8 lg:pt-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            {section === "walks" && (
              <WalksView
                range={range}
                totals={walkTotals}
                feeCount={walkFeeCount}
                feeTotal={walkFeeCount * WALK_FEE_PER_CATEGORY}
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
                bonusTotal={
                  kTotals.threePitch * THREE_PITCH_K_BONUS +
                  kTotals.side * SIDE_K_BONUS
                }
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
                  walks={filteredWalks}
                  strikeouts={filteredK}
                  appearances={state.velocity[String(profilePitcher.pitcherId)] ?? []}
                  onBack={closeProfile}
                />
              ) : (
                <PlayersGallery
                  pitchers={allPitchersFiltered}
                  velocityByPitcher={state.velocity}
                  onSelect={openProfile}
                />
              ))}

            {section === "team" && (
              <TeamView
                state={state}
                range={range}
                filteredWalks={filteredWalks}
                filteredK={filteredK}
                rangeLabel={RANGE_LABELS[range]}
              />
            )}

            {section === "analytics" && (
              <AnalyticsView state={state} pitcher={analyticsPitcher} />
            )}

            {section === "fund" && <FundView report={fundReport} />}
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
  feeCount,
  feeTotal,
  pitchers,
  walks,
  view,
  onViewChange,
  query,
  onSelect,
}: {
  range: RangeKey;
  totals: { total: number; fourPitch: number; ohTwo: number; leadoff: number; twoOut: number };
  feeCount: number;
  feeTotal: number;
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
        eventLabel="walks"
        rangeLabel={RANGE_LABELS[range]}
        total={totals.total}
        totalSub={undefined}
        breakdown={[
          { label: "4-Pitch", value: totals.fourPitch, tone: "neutral" },
          { label: "0-2", value: totals.ohTwo, tone: "neutral" },
          { label: "Leadoff", value: totals.leadoff, tone: "neutral" },
          { label: "2-Out", value: totals.twoOut, tone: "neutral" },
        ]}
        fundLine={
          feeTotal > 0
            ? { label: "Total Owed to Fund", value: formatMoney(feeTotal) }
            : undefined
        }
      />
      <CategoryLeaders pitchers={pitchers} />
      <LeaderboardSection
        title="Walks Leaderboard"
        hint={`${pitchers.length} ${pitchers.length === 1 ? "pitcher" : "pitchers"} — click a row to see their profile`}
        pitchers={pitchers}
        walks={walks}
        strikeouts={[]}
        view={view}
        onViewChange={onViewChange}
        query={query}
        mode="walks"
        onSelect={onSelect}
      />
      <Collapsible
        title="Walk Feed"
        subtitle={`${walks.length} ${walks.length === 1 ? "walk" : "walks"} · newest first`}
      >
        <RecentWalksFeed walks={walks} limit={30} />
      </Collapsible>
    </div>
  );
}

function StrikeoutsView({
  range,
  totals,
  bonusTotal,
  pitchers,
  strikeouts,
  view,
  onViewChange,
  query,
  onSelect,
}: {
  range: RangeKey;
  totals: { total: number; threePitch: number; side: number };
  bonusTotal: number;
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
        eventLabel="strikeouts"
        rangeLabel={RANGE_LABELS[range]}
        total={totals.total}
        totalSub={undefined}
        breakdown={[
          { label: "3-Pitch K", value: totals.threePitch, tone: "neutral" },
          { label: "3-Up-3-Dn", value: totals.side, tone: "neutral" },
        ]}
        fundLine={
          bonusTotal > 0
            ? { label: "Total coaches owe", value: formatMoney(bonusTotal) }
            : undefined
        }
      />
      <StrikeoutLeaders pitchers={pitchers} />
      <LeaderboardSection
        title="Strikeouts Leaderboard"
        hint={`${pitchers.length} ${pitchers.length === 1 ? "pitcher" : "pitchers"} — click a row to see their profile`}
        pitchers={pitchers}
        walks={[]}
        strikeouts={strikeouts}
        view={view}
        onViewChange={onViewChange}
        query={query}
        mode="strikeouts"
        onSelect={onSelect}
      />
      <Collapsible
        title="Strikeout Feed"
        subtitle={`${strikeouts.length} ${strikeouts.length === 1 ? "K" : "K's"} · newest first`}
      >
        <StrikeoutsFeed strikeouts={strikeouts} limit={30} />
      </Collapsible>
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
          <h2 className="text-sm font-bold text-[var(--text)]">{title}</h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            {pitchers.length === 0 ? "No matching pitchers" : hint}
          </p>
        </div>
        <div className="hidden lg:block">
          <ViewToggle value={view} onChange={onViewChange} />
        </div>
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

function Collapsible({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-[var(--surface-hover)]"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[var(--text)]">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
              {subtitle}
            </p>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-[var(--border)]">{children}</div>
      )}
    </div>
  );
}
