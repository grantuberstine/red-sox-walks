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
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--color-sox-red)]" />
        Loading…
      </div>
    </div>
  );
}

export function DashboardClient({ state }: { state: SeasonState }) {
  return <Dashboard state={state} />;
}
