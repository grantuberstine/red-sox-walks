"use client";

import { RANGE_LABELS, RangeKey } from "@/lib/filters";
import { SearchInput, type SearchSuggestion } from "./SearchInput";

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
  suggestions = [],
}: {
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  query: string;
  onQueryChange: (q: string) => void;
  rangeContext: string;
  resultCount: number;
  suggestions?: SearchSuggestion[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Time range"
          className="flex w-full overflow-hidden rounded-xl bg-[var(--surface-hover)] p-1 sm:w-auto"
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
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
                title={RANGE_LABELS[k]}
              >
                {SHORT[k]}
              </button>
            );
          })}
        </div>

        <SearchInput
          value={query}
          onChange={onQueryChange}
          suggestions={suggestions}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span>{rangeContext}</span>
        <span className="tabular">
          {resultCount.toLocaleString()} {resultCount === 1 ? "result" : "results"}
        </span>
      </div>
    </div>
  );
}
