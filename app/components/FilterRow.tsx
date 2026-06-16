"use client";

import { useEffect, useRef, useState } from "react";
import {
  RANGE_LABELS,
  RangeKey,
  RangeValue,
  Series,
  parseSeriesId,
  seriesDateLabel,
  seriesTitle,
} from "@/lib/filters";
import { SearchInput, type SearchSuggestion } from "./SearchInput";

const ORDER: RangeKey[] = ["season", "month", "week", "today"];
const DROPDOWN_LABEL: Record<RangeKey, string> = {
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
  season: "Season",
};

const CheckMark = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    className="shrink-0 text-[var(--color-sox-red)]"
  >
    <path
      d="M20 6L9 17l-5-5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function TimeRangePills({
  range,
  onRangeChange,
  series = [],
}: {
  range: RangeValue;
  onRangeChange: (r: RangeValue) => void;
  series?: Series[];
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

  const select = (r: RangeValue) => {
    onRangeChange(r);
    setOpen(false);
  };

  const activeSeriesId = parseSeriesId(range);
  const activeSeries =
    activeSeriesId !== null ? series.find((s) => s.id === activeSeriesId) : undefined;
  const buttonLabel = activeSeries
    ? seriesTitle(activeSeries)
    : activeSeriesId !== null
      ? DROPDOWN_LABEL.season // series id no longer present
      : DROPDOWN_LABEL[range as RangeKey];
  // Most recent series first.
  const seriesDesc = [...series].reverse();

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex h-10 w-full min-w-[140px] max-w-[220px] cursor-pointer items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--border-strong)] lg:h-9"
      >
        <span className="truncate">{buttonLabel}</span>
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
        <div className="absolute left-0 top-full z-40 mt-1 max-h-[70vh] w-full min-w-[240px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg ring-1 ring-black/5">
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
                  {active && <CheckMark />}
                </li>
              );
            })}

            {seriesDesc.length > 0 && (
              <>
                <li
                  role="presentation"
                  className="mt-1 border-t border-[var(--border)] px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  By Series
                </li>
                {seriesDesc.map((s) => {
                  const key = `series:${s.id}` as RangeValue;
                  const active = key === range;
                  return (
                    <li
                      key={s.id}
                      role="option"
                      aria-selected={active}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        select(key);
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition ${
                        active
                          ? "bg-[var(--color-sox-red)]/10 text-[var(--text)] font-semibold"
                          : "text-[var(--text)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{seriesTitle(s)}</span>
                        <span className="block text-[11px] font-normal text-[var(--text-muted)]">
                          {seriesDateLabel(s)} · {s.gameCount} game
                          {s.gameCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      {active && <CheckMark />}
                    </li>
                  );
                })}
              </>
            )}
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
  series = [],
}: {
  range: RangeValue;
  onRangeChange: (r: RangeValue) => void;
  query: string;
  onQueryChange: (q: string) => void;
  rangeContext: string;
  resultCount: number;
  resultUnit?: string;
  suggestions?: SearchSuggestion[];
  series?: Series[];
}) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto w-full space-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <TimeRangePills range={range} onRangeChange={onRangeChange} series={series} />
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
