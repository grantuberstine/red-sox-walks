"use client";

import { RANGE_LABELS, RangeKey } from "@/lib/filters";

const ORDER: RangeKey[] = ["today", "week", "month", "season"];
const SHORT: Record<RangeKey, string> = {
  today: "Today",
  week: "7D",
  month: "30D",
  season: "Season",
};

export function FilterBar({
  range,
  onRangeChange,
  query,
  onQueryChange,
  rangeContext,
  resultCount,
}: {
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  query: string;
  onQueryChange: (q: string) => void;
  rangeContext: string;
  resultCount: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Time range"
          className="flex w-full overflow-hidden rounded-xl bg-slate-100 p-1 sm:w-auto"
        >
          {ORDER.map((k) => {
            const active = k === range;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onRangeChange(k)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:flex-initial ${
                  active
                    ? "bg-[var(--color-sox-navy)] text-white shadow"
                    : "text-slate-600 hover:text-[var(--color-sox-navy)]"
                }`}
                title={RANGE_LABELS[k]}
              >
                {SHORT[k]}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search pitcher…"
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[var(--color-sox-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sox-navy)]/10"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{rangeContext}</span>
        <span className="tabular">
          {resultCount} walk{resultCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
