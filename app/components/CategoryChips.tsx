"use client";

export type ToneKey =
  | "neutral"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "emerald"
  | "indigo";

export type CategoryDef = {
  key: string;
  label: string;
  emoji: string;
  tone: ToneKey;
};

const TONES: Record<ToneKey, { on: string; off: string }> = {
  neutral: {
    on: "bg-[var(--color-sox-navy)] text-white",
    off: "bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text)]",
  },
  amber: {
    on: "bg-amber-50 dark:bg-amber-500/150 text-white",
    off: "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:bg-amber-500/20",
  },
  rose: {
    on: "bg-rose-50 dark:bg-rose-500/150 text-white",
    off: "bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:bg-rose-500/20",
  },
  sky: {
    on: "bg-sky-50 dark:bg-sky-500/150 text-white",
    off: "bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:bg-sky-500/20",
  },
  violet: {
    on: "bg-violet-50 dark:bg-violet-500/150 text-white",
    off: "bg-violet-50 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300 hover:bg-violet-100 dark:bg-violet-500/20",
  },
  emerald: {
    on: "bg-emerald-600 text-white",
    off: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/20",
  },
  indigo: {
    on: "bg-indigo-600 text-white",
    off: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:bg-indigo-500/20",
  },
};

export function CategoryChips<K extends string>({
  categories,
  value,
  onChange,
}: {
  categories: CategoryDef[];
  value: K;
  onChange: (v: K) => void;
}) {
  return (
    <>
      {categories.map((c) => {
        const active = c.key === value;
        const tone = TONES[c.tone];
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key as K)}
            aria-pressed={active}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold transition ${
              active ? tone.on : tone.off
            } ${active ? "shadow-sm" : ""}`}
          >
            {c.emoji && <span className="text-sm leading-none">{c.emoji}</span>}
            <span>{c.label}</span>
          </button>
        );
      })}
    </>
  );
}
