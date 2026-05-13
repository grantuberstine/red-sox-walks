import { loadState } from "@/lib/storage";
import { SEASON } from "@/lib/constants";
import type { PitcherStats } from "@/lib/types";
import { PitcherTable } from "./PitcherTable";

export const revalidate = 60;
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-1.5 rounded-full bg-[var(--color-sox-red)]" />
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-sox-navy)] sm:text-4xl">
              WooSox Walk Tracker
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Worcester Red Sox pitcher walks by category — {SEASON} season.
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>
            Last refresh:{" "}
            <span className="font-mono text-slate-700">
              {formatTimestamp(state.meta.lastRefreshAt)}
            </span>
          </div>
          <div>
            Games tracked:{" "}
            <span className="font-mono text-slate-700">
              {state.meta.totalGames}
            </span>{" "}
            · Total walks:{" "}
            <span className="font-mono text-slate-700">
              {state.meta.totalWalks}
            </span>
          </div>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total walks" value={totals.total} accent />
        <StatCard label="4-pitch" value={totals.fourPitch} />
        <StatCard label="0-2 → BB" value={totals.ohTwo} />
        <StatCard label="Leadoff" value={totals.leadoff} />
        <StatCard label="2-out" value={totals.twoOut} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Pitcher Walk Breakdown
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Click any column to sort. A single walk can fall in multiple
            categories.
          </p>
        </div>
        {pitchers.length === 0 ? (
          <EmptyState />
        ) : (
          <PitcherTable pitchers={pitchers} />
        )}
      </section>

      <footer className="mt-10 text-xs text-slate-500">
        <p>
          Data source: MLB Stats API. Updates daily via Vercel Cron. Walk
          categories track sequences against WooSox pitchers only — opponent
          walks are filtered out.
        </p>
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent
          ? "border-[var(--color-sox-red)]/20 bg-[var(--color-sox-red)]/5"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold tabular-nums ${
          accent ? "text-[var(--color-sox-red)]" : "text-[var(--color-sox-navy)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm text-slate-500">
        No walks recorded yet. Run a backfill from the deployed{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
          /api/backfill
        </code>{" "}
        endpoint to load season-to-date data.
      </p>
    </div>
  );
}
