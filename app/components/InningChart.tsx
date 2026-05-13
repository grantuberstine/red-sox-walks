"use client";

type Bin = { inning: number; count: number };

const BAR_COLOR = {
  red: "bg-[var(--color-sox-red)]/70 hover:bg-[var(--color-sox-red)]",
  emerald: "bg-emerald-50 dark:bg-emerald-500/150/70 hover:bg-emerald-600",
} as const;

export function InningChart({
  data,
  accent = "red",
}: {
  data: Bin[];
  accent?: keyof typeof BAR_COLOR;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
        No walks to bin by inning.
      </div>
    );
  }
  return (
    <div className="px-4 pb-4 pt-2">
      <div className="mb-2 flex items-baseline justify-between text-[11px] text-[var(--text-muted)]">
        <span>Walks by inning</span>
        <span className="tabular">
          peak inning {data.reduce((a, b) => (b.count > a.count ? b : a)).inning}
        </span>
      </div>
      <div className="grid grid-cols-9 gap-1">
        {data.slice(0, 9).map((d) => {
          const h = Math.max(6, Math.round((d.count / max) * 88));
          return (
            <div key={d.inning} className="flex flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-t transition-all ${BAR_COLOR[accent]}`}
                  style={{ height: `${h}px` }}
                  title={`Inning ${d.inning}: ${d.count}`}
                />
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-semibold tabular text-[var(--text)]">
                  {d.count}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] tabular">
                  {d.inning}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {data.some((d) => d.inning > 9) && (
        <div className="mt-2 text-[10px] text-[var(--text-muted)]">
          Extra innings:{" "}
          {data
            .filter((d) => d.inning > 9 && d.count > 0)
            .map((d) => `${d.inning}=${d.count}`)
            .join(", ")}
        </div>
      )}
    </div>
  );
}
