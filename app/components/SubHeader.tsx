"use client";

import type { Mode } from "./TopNav";
import type { CategoryDef } from "./CategoryChips";
import { CategoryChips } from "./CategoryChips";
import { FilterBar } from "./FilterBar";
import type { RangeKey } from "@/lib/filters";

export function SubHeader({
  showMode = true,
  mode,
  onModeChange,
  walkCount,
  strikeoutCount,
  range,
  onRangeChange,
  query,
  onQueryChange,
  rangeContext,
  resultCount,
  categories,
  categoryValue,
  onCategoryChange,
  categoryLabel,
}: {
  showMode?: boolean;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  walkCount: number;
  strikeoutCount: number;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  query: string;
  onQueryChange: (q: string) => void;
  rangeContext: string;
  resultCount: number;
  categories?: CategoryDef[];
  categoryValue?: string;
  onCategoryChange?: (v: string) => void;
  categoryLabel?: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-3 sm:px-6">
        {showMode && (
          <div className="flex items-center justify-between">
            <div className="inline-flex overflow-hidden rounded-full bg-slate-100 p-0.5 text-xs">
              <ModeTab
                active={mode === "walks"}
                onClick={() => onModeChange("walks")}
                label="Walks"
                count={walkCount}
                activeColor="bg-[var(--color-sox-red)]"
              />
              <ModeTab
                active={mode === "strikeouts"}
                onClick={() => onModeChange("strikeouts")}
                label="Strikeouts"
                count={strikeoutCount}
                activeColor="bg-emerald-600"
              />
            </div>
          </div>
        )}

        <FilterBar
          range={range}
          onRangeChange={onRangeChange}
          query={query}
          onQueryChange={onQueryChange}
          rangeContext={rangeContext}
          resultCount={resultCount}
        />

        {categories && categoryValue !== undefined && onCategoryChange && (
          <div>
            <CategoryChips
              categories={categories}
              value={categoryValue}
              onChange={onCategoryChange}
            />
            {categoryLabel && (
              <div className="mt-1 text-[10px] text-slate-400">{categoryLabel}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  label,
  count,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition ${
        active
          ? `${activeColor} text-white shadow-sm`
          : "text-slate-600 hover:text-[var(--color-sox-navy)]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 text-[10px] tabular ${
          active ? "bg-white/20" : "bg-white text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
