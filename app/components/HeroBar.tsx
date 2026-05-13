import type { ToneKey } from "./CategoryChips";

const HERO_TONES: Record<
  ToneKey,
  string
> = {
  neutral: "from-white/10 to-white/0 text-white",
  amber: "from-amber-400/20 to-amber-300/5 text-amber-100",
  rose: "from-rose-400/20 to-rose-300/5 text-rose-100",
  sky: "from-sky-400/20 to-sky-300/5 text-sky-100",
  violet: "from-violet-400/20 to-violet-300/5 text-violet-100",
  emerald: "from-emerald-400/25 to-emerald-300/5 text-emerald-100",
  indigo: "from-indigo-400/25 to-indigo-300/5 text-indigo-100",
};

const ACCENT_GRADIENTS = {
  red: "from-[var(--color-sox-navy)] via-[var(--color-sox-ink)] to-[#1d2f4b]",
  emerald: "from-emerald-900 via-emerald-800 to-emerald-700",
} as const;

export function HeroBar({
  accent,
  eventLabel,
  rangeLabel,
  total,
  breakdown,
}: {
  accent: keyof typeof ACCENT_GRADIENTS;
  eventLabel: string;
  rangeLabel: string;
  total: number;
  breakdown: Array<{ label: string; value: number; tone: ToneKey }>;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-gradient-to-br ${ACCENT_GRADIENTS[accent]} p-5 text-white shadow-md sm:p-6`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
            Total {eventLabel} · {rangeLabel}
          </div>
          <div className="text-5xl font-bold tabular leading-none sm:text-6xl">
            {total}
          </div>
        </div>
        <div
          className={`grid w-full gap-1.5 sm:w-auto sm:gap-2 ${
            breakdown.length >= 4
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-2"
          }`}
        >
          {breakdown.map((b) => (
            <HeroStat key={b.label} tone={b.tone} label={b.label} value={b.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  tone,
  label,
  value,
}: {
  tone: ToneKey;
  label: string;
  value: number;
}) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${HERO_TONES[tone]} px-2.5 py-2 sm:px-3 sm:py-2.5 ring-1 ring-inset ring-white/10`}
    >
      <div className="text-[9px] font-semibold uppercase tracking-widest opacity-80 sm:text-[10px]">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-bold tabular leading-none text-white sm:text-2xl">
        {value}
      </div>
    </div>
  );
}
