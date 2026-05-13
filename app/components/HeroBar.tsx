import type { ToneKey } from "./CategoryChips";

const HERO_TONES: Record<ToneKey, string> = {
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

export type Breakdown = {
  label: string;
  value: number | string;
  tone: ToneKey;
  highlight?: boolean;
};

export function HeroBar({
  accent,
  eventLabel,
  rangeLabel,
  total,
  totalSub,
  breakdown,
  fundLine,
}: {
  accent: keyof typeof ACCENT_GRADIENTS;
  eventLabel: string;
  rangeLabel: string;
  total: number;
  totalSub?: string;
  breakdown: Breakdown[];
  fundLine?: { label: string; value: string };
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
          <div className="flex items-baseline gap-3">
            <div className="text-5xl font-bold tabular leading-none sm:text-6xl">
              {total}
            </div>
            {totalSub && (
              <div className="text-[11px] text-white/60">{totalSub}</div>
            )}
          </div>
        </div>
        <div
          className={`grid w-full gap-1.5 sm:w-auto sm:gap-2`}
          style={{
            gridTemplateColumns: `repeat(${breakdown.length}, minmax(0, 1fr))`,
          }}
        >
          {breakdown.map((b) => (
            <HeroStat key={b.label} tone={b.tone} label={b.label} value={b.value} highlight={b.highlight} />
          ))}
        </div>
      </div>

      {fundLine && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--color-woo-gold)]/30 bg-[var(--color-woo-gold)]/10 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-woo-gold)]">
            {fundLine.label}
          </span>
          <span className="text-2xl font-bold tabular text-[var(--color-woo-gold)]">
            {fundLine.value}
          </span>
        </div>
      )}
    </div>
  );
}

function HeroStat({
  tone,
  label,
  value,
  highlight,
}: {
  tone: ToneKey;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${HERO_TONES[tone]} px-2.5 py-2 sm:px-3 sm:py-2.5 ring-1 ring-inset ${highlight ? "ring-[var(--color-woo-gold)]/40" : "ring-white/10"}`}
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
