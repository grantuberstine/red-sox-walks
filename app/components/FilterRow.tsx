"use client";

import { RANGE_LABELS, RangeKey } from "@/lib/filters";
import { SearchInput, type SearchSuggestion } from "./SearchInput";

const ORDER: RangeKey[] = ["season", "month", "week", "today"];
const SHORT: Record<RangeKey, string> = {
  today: "Today",
  week: "7D",
  month: "30D",
  season: "Season",
};

export function TimeRangePills({
  range,
  onRangeChange,
  compact = false,
}: {
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className={`inline-flex overflow-hidden rounded-lg bg-[var(--surface-hover)] p-0.5 ${
        compact ? "" : "grid grid-cols-4 sm:inline-flex"
      }`}
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
            className={`min-h-[34px] cursor-pointer rounded-md px-2.5 text-sm font-semibold transition sm:px-3 ${
              active
                ? "bg-[var(--color-sox-red)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
            title={RANGE_LABELS[k]}
          >
            {SHORT[k]}
          </button>
        );
      })}
    </div>
  );
}

export function FilterRow({
  range,
  onRangeChange,
  query,
  onQueryChange,
  rangeContext,
  resultCount,
  resultUnit = "result",
  suggestions = [],
}: {
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  query: string;
  onQueryChange: (q: string) => void;
  rangeContext: string;
  resultCount: number;
  resultUnit?: string;
  suggestions?: SearchSuggestion[];
}) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto w-full space-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <TimeRangePills range={range} onRangeChange={onRangeChange} />
          <div className="ml-auto w-full sm:w-72">
            <SearchInput
              value={query}
              onChange={onQueryChange}
              suggestions={suggestions}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span className="truncate">{rangeContext}</span>
          <span className="shrink-0 tabular">
            {resultCount.toLocaleString()}{" "}
            {resultCount === 1 ? resultUnit : `${resultUnit}s`}
          </span>
        </div>
      </div>
    </div>
  );
}
