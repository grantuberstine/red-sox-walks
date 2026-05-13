export function HeroBar({
  total,
  fourPitch,
  ohTwo,
  leadoff,
  twoOut,
  leaderName,
  leaderWalks,
  rangeLabel,
}: {
  total: number;
  fourPitch: number;
  ohTwo: number;
  leadoff: number;
  twoOut: number;
  leaderName?: string;
  leaderWalks: number;
  rangeLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-sox-navy)] via-[var(--color-sox-ink)] to-[#1d2f4b] p-5 text-white shadow-md sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
            {rangeLabel} · walks
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-5xl font-bold tabular leading-none sm:text-6xl">
              {total}
            </div>
            {leaderName && (
              <div className="text-xs text-white/70">
                <div className="text-[10px] uppercase tracking-widest text-white/50">
                  Leader
                </div>
                <div className="font-medium text-white">
                  {leaderName}
                  <span className="ml-1 text-white/60">({leaderWalks})</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid w-full grid-cols-4 gap-1 sm:w-auto sm:gap-2">
          <HeroStat tone="amber" label="4-Pitch" value={fourPitch} />
          <HeroStat tone="rose" label="0-2" value={ohTwo} />
          <HeroStat tone="sky" label="Leadoff" value={leadoff} />
          <HeroStat tone="violet" label="2-Out" value={twoOut} />
        </div>
      </div>
    </div>
  );
}

const HERO_TONES = {
  amber: "from-amber-400/20 to-amber-300/5 text-amber-100",
  rose: "from-rose-400/20 to-rose-300/5 text-rose-100",
  sky: "from-sky-400/20 to-sky-300/5 text-sky-100",
  violet: "from-violet-400/20 to-violet-300/5 text-violet-100",
} as const;

function HeroStat({
  tone,
  label,
  value,
}: {
  tone: keyof typeof HERO_TONES;
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
