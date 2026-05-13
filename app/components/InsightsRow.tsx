"use client";

import type { Insights } from "@/lib/filters";

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function InsightsRow({
  insights,
  mode,
  worstLabel,
}: {
  insights: Insights;
  mode: "walks" | "strikeouts";
  worstLabel: string;
}) {
  const isWalks = mode === "walks";
  const cards = [
    {
      label: worstLabel,
      icon: isWalks ? "💀" : "🔥",
      primary: insights.bestGame ? `${insights.bestGame.count} ${isWalks ? "walks" : "K's"}` : "—",
      secondary: insights.bestGame
        ? `${formatDate(insights.bestGame.date)} vs ${insights.bestGame.opponent}`
        : "No games yet",
    },
    {
      label: isWalks ? "Most-walked batter" : "Most K'd batter",
      icon: "🎯",
      primary: insights.topVictim ? insights.topVictim.name : "—",
      secondary: insights.topVictim
        ? `${insights.topVictim.count} ${isWalks ? "walks issued" : "K's"}`
        : "No data",
    },
    {
      label: isWalks ? "Most generous opponent" : "Top victim opponent",
      icon: isWalks ? "🤝" : "🥊",
      primary: insights.topOpponent ? insights.topOpponent.name : "—",
      secondary: insights.topOpponent
        ? `${insights.topOpponent.count} ${isWalks ? "walks given up" : "K's recorded"}`
        : "No data",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {c.label}
              </div>
              <div className="mt-1 truncate text-lg font-bold text-[var(--color-sox-navy)]">
                {c.primary}
              </div>
              <div className="truncate text-[11px] text-slate-500">{c.secondary}</div>
            </div>
            <span className="text-2xl leading-none">{c.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
