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
    off: "bg-white text-slate-600 hover:text-[var(--color-sox-navy)]",
  },
  amber: {
    on: "bg-amber-500 text-white",
    off: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
  rose: {
    on: "bg-rose-500 text-white",
    off: "bg-rose-50 text-rose-800 hover:bg-rose-100",
  },
  sky: {
    on: "bg-sky-500 text-white",
    off: "bg-sky-50 text-sky-800 hover:bg-sky-100",
  },
  violet: {
    on: "bg-violet-500 text-white",
    off: "bg-violet-50 text-violet-800 hover:bg-violet-100",
  },
  emerald: {
    on: "bg-emerald-600 text-white",
    off: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  },
  indigo: {
    on: "bg-indigo-600 text-white",
    off: "bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
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
    <div className="flex flex-wrap gap-1.5">
      {categories.map((c) => {
        const active = c.key === value;
        const tone = TONES[c.tone];
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key as K)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold transition ${
              active ? tone.on : tone.off
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
