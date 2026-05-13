"use client";

import { useEffect, useRef, useState } from "react";
import { RANGE_LABELS, RangeKey } from "@/lib/filters";
import { SearchInput, type SearchSuggestion } from "./SearchInput";

const ORDER: RangeKey[] = ["season", "month", "week", "today"];
const DROPDOWN_LABEL: Record<RangeKey, string> = {
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
  season: "Season",
};

export function TimeRangePills({
  range,
  onRangeChange,
}: {
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const select = (r: RangeKey) => {
    onRangeChange(r);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex h-9 w-full min-w-[140px] cursor-pointer items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--border-strong)]"
      >
        <span>{DROPDOWN_LABEL[range]}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-[var(--text-secondary)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-full min-w-[160px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg ring-1 ring-black/5">
          <ul role="listbox" aria-label="Time range" className="py-1">
            {ORDER.map((k) => {
              const active = k === range;
              return (
                <li
                  key={k}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(k);
                  }}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[var(--color-sox-red)]/10 text-[var(--text)] font-semibold"
                      : "text-[var(--text)] hover:bg-[var(--surface-hover)]"
                  }`}
                  title={RANGE_LABELS[k]}
                >
                  <span>{DROPDOWN_LABEL[k]}</span>
                  {active && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-[var(--color-sox-red)]"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
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

        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
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
