"use client";

import dynamic from "next/dynamic";
import type { SeasonState } from "@/lib/types";

const Dashboard = dynamic(
  () => import("./Dashboard").then((m) => m.Dashboard),
  {
    ssr: false,
    loading: () => <DashboardLoadingShell />,
  },
);

function DashboardLoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-3">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-[var(--border-strong)] border-t-[var(--color-sox-red)]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Loading
        </span>
      </div>
    </div>
  );
}

export function DashboardClient({ state }: { state: SeasonState }) {
  return <Dashboard state={state} />;
}
