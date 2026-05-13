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
};

const CATEGORIES: CategoryDef[] = [
  { key: "fourPitchWalks", title: "4-Pitch Walks", subtitle: "Never threw a strike" },
  { key: "ohTwoWalks", title: "0-2 Walks", subtitle: "Up 0-2, then walked him" },
  { key: "leadoffWalks", title: "Leadoff Walks", subtitle: "First batter of an inning" },
  { key: "twoOutWalks", title: "2-Out Walks", subtitle: "Already had 2 outs" },
];

const RANK_LABELS = ["1st", "2nd", "3rd"];

export function CategoryLeaders({ pitchers }: { pitchers: PitcherStats[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {CATEGORIES.map((cat) => {
        const ranked = [...pitchers]
          .filter((p) => p[cat.key] > 0)
          .sort((a, b) => b[cat.key] - a[cat.key])
          .slice(0, 3);
        return (
          <div
            key={cat.key}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
          >
            <div className="mb-3 border-b border-[var(--border)] pb-2">
              <h3 className="text-sm font-bold text-[var(--text)]">
                {cat.title}
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                {cat.subtitle}
              </p>
            </div>
            {ranked.length === 0 ? (
              <div className="rounded-lg bg-[var(--surface-hover)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                None yet
              </div>
            ) : (
              <ol className="space-y-1">
                {ranked.map((p, i) => (
                  <li
                    key={p.pitcherId}
                    className="flex items-center justify-between gap-2 py-1"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-sox-red)] text-[10px] font-bold text-white">
                        {RANK_LABELS[i]}
                      </span>
                      <PitcherAvatar name={p.name} src={p.headshotUrl} size={28} />
                      <span className="truncate text-sm font-medium text-[var(--text)]">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-base font-bold tabular text-[var(--text)]">
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
