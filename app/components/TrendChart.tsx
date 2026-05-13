"use client";

type Point = {
  date: string;
  opponent: string;
  count: number;
  gamePk: number;
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function TrendChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-slate-500">
        No games to chart in this range.
      </div>
    );
  }

  const max = Math.max(2, ...data.map((d) => d.count));
  const avg = data.reduce((s, d) => s + d.count, 0) / data.length;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="mb-2 flex items-baseline justify-between text-[11px] text-slate-500">
        <span>Walks per game · {data.length} games</span>
        <span className="tabular">avg {avg.toFixed(1)}</span>
      </div>
      <div className="flex items-end gap-0.5 overflow-x-auto" style={{ minHeight: 96 }}>
        {data.map((d) => {
          const h = Math.max(4, Math.round((d.count / max) * 84));
          const intensity =
            d.count >= avg * 1.5
              ? "bg-[var(--color-sox-red)]"
              : d.count >= avg
                ? "bg-[var(--color-sox-red)]/70"
                : d.count > 0
                  ? "bg-[var(--color-sox-navy)]/40"
                  : "bg-slate-200";
          return (
            <div
              key={d.gamePk}
              className="group relative flex min-w-[10px] flex-1 flex-col items-center"
              title={`${formatDate(d.date)} vs ${d.opponent}: ${d.count} walks`}
            >
              <div
                className={`w-full rounded-t transition-all ${intensity} group-hover:brightness-110`}
                style={{ height: `${h}px` }}
              />
              <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[var(--color-sox-navy)] px-2 py-1 text-[10px] text-white group-hover:block">
                {formatDate(d.date)} · {d.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
