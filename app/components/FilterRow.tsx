"use client";

import { RANGE_LABELS, RangeKey } from "@/lib/filters";
import { SearchInput, type SearchSuggestion } from "./SearchInput";
import type { CategoryDef } from "./CategoryChips";
import { CategoryChips } from "./CategoryChips";

const ORDER: RangeKey[] = ["today", "week", "month", "season"];
const SHORT: Record<RangeKey, string> = {
  today: "Today",
  week: "7D",
  month: "30D",
  season: "Season",
};

export function FilterRow({
  range,
  onRangeChange,
  query,
  onQueryChange,
  rangeContext,
  resultCount,
  resultUnit = "result",
  suggestions = [],
  categories,
  categoryValue,
  onCategoryChange,
}: {
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  query: string;
  onQueryChange: (q: string) => void;
  rangeContext: string;
  resultCount: number;
  resultUnit?: string;
  suggestions?: SearchSuggestion[];
  categories?: CategoryDef[];
  categoryValue?: string;
  onCategoryChange?: (v: string) => void;
}) {
  return (
    <div className="border-b border-[var(--color-line)] bg-white">
      <div className="mx-auto w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Time range"
            className="inline-flex shrink-0 overflow-hidden rounded-lg bg-slate-100 p-0.5"
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
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--color-sox-navy)] text-white shadow-sm"
                      : "text-slate-600 hover:text-[var(--color-sox-navy)]"
                  }`}
                  title={RANGE_LABELS[k]}
                >
                  {SHORT[k]}
                </button>
              );
            })}
          </div>

          {categories && categoryValue !== undefined && onCategoryChange && (
            <div className="flex-1 sm:flex-initial">
              <CategoryChips
                categories={categories}
                value={categoryValue}
                onChange={onCategoryChange}
              />
            </div>
          )}

          <div className="ml-auto w-full sm:w-72">
            <SearchInput
              value={query}
              onChange={onQueryChange}
              suggestions={suggestions}
            />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{rangeContext}</span>
          <span className="tabular">
            {resultCount.toLocaleString()} {resultCount === 1 ? resultUnit : `${resultUnit}s`}
          </span>
        </div>
      </div>
    </div>
  );
}
