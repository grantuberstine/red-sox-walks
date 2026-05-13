import type { PitcherStats } from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";

type CategoryKey =
  | "totalStrikeouts"
  | "threePitchStrikeouts"
  | "sideStrikeouts";

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
    key: "threePitchStrikeouts",
    title: "3-Pitch K's",
    subtitle: "Strikeout in 3 straight strikes",
    emoji: "",
    tint: "from-emerald-50 to-emerald-100",
    accent: "text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "sideStrikeouts",
    title: "3-Up-3-Down Innings",
    subtitle: "Struck out side in order",
    emoji: "",
    tint: "from-indigo-50 to-indigo-100",
    accent: "text-indigo-700 dark:text-indigo-300",
  },
];

const RANK_LABELS = ["1st", "2nd", "3rd"];
const RANK_COLORS = [
  "bg-[var(--color-woo-gold)] text-[var(--text)]",
  "bg-slate-300 text-[var(--text-secondary)]",
  "bg-amber-700 text-white",
];

export function StrikeoutLeaders({ pitchers }: { pitchers: PitcherStats[] }) {
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
            className={`rounded-2xl border border-[var(--border)] bg-gradient-to-br ${cat.tint} p-4 shadow-sm`}
          >
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[var(--text)]">
                {cat.title}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">{cat.subtitle}</p>
            </div>
            {ranked.length === 0 ? (
              <div className="rounded-lg bg-white/60 px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                None yet
              </div>
            ) : (
              <ol className="space-y-1.5">
                {ranked.map((p, i) => (
                  <li
                    key={p.pitcherId}
                    className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 backdrop-blur"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${RANK_COLORS[i]}`}
                      >
                        {RANK_LABELS[i]}
                      </span>
                      <PitcherAvatar
                        name={p.name}
                        src={p.headshotUrl}
                        size={32}
                      />
                      <span className="truncate text-sm font-medium text-[var(--text)]">
                        {p.name}
                      </span>
                    </div>
                    <span className={`text-base font-bold tabular ${cat.accent}`}>
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
