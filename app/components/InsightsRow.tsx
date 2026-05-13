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

export function InsightsRow({ insights }: { insights: Insights }) {
  const cards = [
    {
      label: "Worst game",
      icon: "💀",
      primary: insights.worstGame
        ? `${insights.worstGame.walks} walks`
        : "—",
      secondary: insights.worstGame
        ? `${formatDate(insights.worstGame.date)} vs ${insights.worstGame.opponent}`
        : "No games yet",
    },
    {
      label: "Most-walked batter",
      icon: "🎯",
      primary: insights.mostWalkedBatter
        ? insights.mostWalkedBatter.name
        : "—",
      secondary: insights.mostWalkedBatter
        ? `${insights.mostWalkedBatter.walks} walks issued`
        : "No data",
    },
    {
      label: "Best opponent",
      icon: "🤝",
      primary: insights.topOpponent ? insights.topOpponent.name : "—",
      secondary: insights.topOpponent
        ? `${insights.topOpponent.walks} walks given up`
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
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {c.label}
              </div>
              <div className="mt-1 truncate text-lg font-bold text-[var(--color-sox-navy)]">
                {c.primary}
              </div>
              <div className="text-[11px] text-slate-500">{c.secondary}</div>
            </div>
            <span className="text-2xl leading-none">{c.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
