"use client";

import type { CategoryFilter } from "@/lib/filters";

const CHIPS: Array<{
  key: CategoryFilter;
  label: string;
  emoji: string;
  on: string;
  off: string;
}> = [
  {
    key: "all",
    label: "All",
    emoji: "🎯",
    on: "bg-[var(--color-sox-navy)] text-white",
    off: "bg-white text-slate-600 hover:text-[var(--color-sox-navy)]",
  },
  {
    key: "fourPitch",
    label: "4-Pitch",
    emoji: "🚶",
    on: "bg-amber-500 text-white",
    off: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
  {
    key: "ohTwo",
    label: "0-2",
    emoji: "😬",
    on: "bg-rose-500 text-white",
    off: "bg-rose-50 text-rose-800 hover:bg-rose-100",
  },
  {
    key: "leadoff",
    label: "Leadoff",
    emoji: "🛻",
    on: "bg-sky-500 text-white",
    off: "bg-sky-50 text-sky-800 hover:bg-sky-100",
  },
  {
    key: "twoOut",
    label: "2-Out",
    emoji: "🪢",
    on: "bg-violet-500 text-white",
    off: "bg-violet-50 text-violet-800 hover:bg-violet-100",
  },
];

export function CategoryChips({
  value,
  onChange,
}: {
  value: CategoryFilter;
  onChange: (v: CategoryFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CHIPS.map((c) => {
        const active = c.key === value;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-transparent transition ${
              active ? c.on : c.off
            } ${active ? "shadow-sm" : ""}`}
          >
            <span className="text-sm leading-none">{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
