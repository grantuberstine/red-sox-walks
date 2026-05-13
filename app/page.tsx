import { loadState } from "@/lib/storage";
import { SEASON } from "@/lib/constants";
import type { PitcherStats } from "@/lib/types";
import { PitcherTable } from "./PitcherTable";
import { CategoryLeaders } from "./components/CategoryLeaders";
import { RecentWalksFeed } from "./components/RecentWalksFeed";

export const dynamic = "force-dynamic";

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

export default async function Page() {
  const state = await loadState();
  const pitchers: PitcherStats[] = Object.values(state.pitchers);

  const totals = pitchers.reduce(
    (acc, p) => ({
      total: acc.total + p.totalWalks,
      fourPitch: acc.fourPitch + p.fourPitchWalks,
      ohTwo: acc.ohTwo + p.ohTwoWalks,
      leadoff: acc.leadoff + p.leadoffWalks,
      twoOut: acc.twoOut + p.twoOutWalks,
    }),
    { total: 0, fourPitch: 0, ohTwo: 0, leadoff: 0, twoOut: 0 },
  );

  const teamLeader = [...pitchers].sort((a, b) => b.totalWalks - a.totalWalks)[0];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <header className="fade-in mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-[var(--color-sox-red)]" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-sox-navy)] sm:text-3xl">
                  WooSox Walk Tracker
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Free passes by category — {SEASON} season
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 sm:text-right sm:text-xs">
            <span>
              {pluralize(state.meta.totalGames, "game", "games")} ·{" "}
              {pluralize(state.meta.totalWalks, "walk", "walks")} ·{" "}
              {pluralize(pitchers.length, "pitcher", "pitchers")}
            </span>
            <span className="tabular">
              Last refresh: {formatTimestamp(state.meta.lastRefreshAt)}
            </span>
          </div>
        </div>
      </header>

      <section className="fade-in mb-6">
        <HeroBar
          total={totals.total}
          fourPitch={totals.fourPitch}
          ohTwo={totals.ohTwo}
          leadoff={totals.leadoff}
          twoOut={totals.twoOut}
          leaderName={teamLeader?.name}
          leaderWalks={teamLeader?.totalWalks ?? 0}
        />
      </section>

      <section className="fade-in mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <span>Walk Hall of Shame</span>
          <span className="h-px flex-1 bg-slate-200" />
        </h2>
        <CategoryLeaders pitchers={pitchers} />
      </section>

      <section className="fade-in mb-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">
              Full Leaderboard
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              All pitchers · click headers to sort · one walk can fall in
              multiple categories
            </p>
          </div>
          {pitchers.length === 0 ? (
            <EmptyState />
          ) : (
            <PitcherTable pitchers={pitchers} />
          )}
        </div>
      </section>

      <section className="fade-in mb-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-[var(--color-sox-navy)]">
              Recent Walks
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Last {Math.min(state.recentWalks.length, 20)} walks issued by
              WooSox pitchers
            </p>
          </div>
          <RecentWalksFeed walks={state.recentWalks} limit={20} />
        </div>
      </section>

      <footer className="text-center text-[11px] text-slate-400">
        Data: MLB Stats API · Refresh: daily via Vercel Cron · Built with Next.js
      </footer>
    </main>
  );
}

function HeroBar({
  total,
  fourPitch,
  ohTwo,
  leadoff,
  twoOut,
  leaderName,
  leaderWalks,
}: {
  total: number;
  fourPitch: number;
  ohTwo: number;
  leadoff: number;
  twoOut: number;
  leaderName?: string;
  leaderWalks: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-sox-navy)] via-[var(--color-sox-ink)] to-[#1d2f4b] p-5 text-white shadow-md sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
            Season walk total
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-5xl font-bold tabular leading-none sm:text-6xl">
              {total}
            </div>
            {leaderName && (
              <div className="text-xs text-white/70">
                <div className="text-[10px] uppercase tracking-widest text-white/50">
                  Team leader
                </div>
                <div className="font-medium text-white">
                  {leaderName}
                  <span className="ml-1 text-white/60">({leaderWalks})</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid w-full grid-cols-4 gap-1 sm:w-auto sm:gap-2">
          <HeroStat tone="amber" label="4-Pitch" value={fourPitch} />
          <HeroStat tone="rose" label="0-2" value={ohTwo} />
          <HeroStat tone="sky" label="Leadoff" value={leadoff} />
          <HeroStat tone="violet" label="2-Out" value={twoOut} />
        </div>
      </div>
    </div>
  );
}

const HERO_TONES = {
  amber: "from-amber-400/20 to-amber-300/5 text-amber-100",
  rose: "from-rose-400/20 to-rose-300/5 text-rose-100",
  sky: "from-sky-400/20 to-sky-300/5 text-sky-100",
  violet: "from-violet-400/20 to-violet-300/5 text-violet-100",
} as const;

function HeroStat({
  tone,
  label,
  value,
}: {
  tone: keyof typeof HERO_TONES;
  label: string;
  value: number;
}) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${HERO_TONES[tone]} px-2.5 py-2 sm:px-3 sm:py-2.5 ring-1 ring-inset ring-white/10`}
    >
      <div className="text-[9px] font-semibold uppercase tracking-widest opacity-80 sm:text-[10px]">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-bold tabular leading-none text-white sm:text-2xl">
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm text-slate-500">
        No walks recorded yet. Hit{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
          /api/backfill
        </code>{" "}
        with your cron token to load the season.
      </p>
    </div>
  );
}
