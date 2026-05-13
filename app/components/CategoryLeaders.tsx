import type { PitcherStats } from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";

type CategoryKey =
  | "totalWalks"
  | "fourPitchWalks"
  | "ohTwoWalks"
  | "leadoffWalks"
  | "twoOutWalks";

type CategoryDef = {
  key: CategoryKey;
  title: string;
  subtitle: string;
  emoji: string;
  tint: string;
  accent: string;
};

const CATEGORIES: CategoryDef[] = [
  {
    key: "fourPitchWalks",
    title: "4-Pitch Walks",
    subtitle: "Never landed a strike",
    emoji: "🚶",
    tint: "from-amber-50 to-amber-100",
    accent: "text-amber-700",
  },
  {
    key: "ohTwoWalks",
    title: "0-2 Walks",
    subtitle: "Up 0-2, then walked him",
    emoji: "😬",
    tint: "from-rose-50 to-rose-100",
    accent: "text-rose-700",
  },
  {
    key: "leadoffWalks",
    title: "Leadoff Walks",
    subtitle: "First batter of an inning",
    emoji: "🛻",
    tint: "from-sky-50 to-sky-100",
    accent: "text-sky-700",
  },
  {
    key: "twoOutWalks",
    title: "2-Out Walks",
    subtitle: "Already had 2 outs",
    emoji: "🪢",
    tint: "from-violet-50 to-violet-100",
    accent: "text-violet-700",
  },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export function CategoryLeaders({ pitchers }: { pitchers: PitcherStats[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CATEGORIES.map((cat) => {
        const ranked = [...pitchers]
          .filter((p) => p[cat.key] > 0)
          .sort((a, b) => b[cat.key] - a[cat.key])
          .slice(0, 3);
        return (
          <div
            key={cat.key}
            className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${cat.tint} p-4 shadow-sm`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-sox-navy)]">
                  <span className="text-base">{cat.emoji}</span>
                  {cat.title}
                </h3>
                <p className="text-[11px] text-slate-600">{cat.subtitle}</p>
              </div>
            </div>
            {ranked.length === 0 ? (
              <div className="rounded-lg bg-white/60 px-3 py-4 text-center text-xs text-slate-500">
                No walks of this type yet
              </div>
            ) : (
              <ol className="space-y-1.5">
                {ranked.map((p, i) => (
                  <li
                    key={p.pitcherId}
                    className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 backdrop-blur"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none">{MEDALS[i]}</span>
                      <PitcherAvatar
                        name={p.name}
                        src={p.headshotUrl}
                        size={32}
                      />
                      <span className="truncate text-sm font-medium text-[var(--color-sox-navy)]">
                        {p.name}
                      </span>
                    </div>
                    <span
                      className={`tabular font-bold text-base ${cat.accent}`}
                    >
                      {p[cat.key]}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}
