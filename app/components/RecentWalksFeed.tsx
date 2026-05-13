import type { WalkRecord, WalkType } from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";
import { headshotUrl } from "@/lib/achievements";

const WALK_TAG_OUTLINE = "text-rose-700 ring-rose-300 dark:text-rose-300 dark:ring-rose-400/50";
const TAG_META: Record<WalkType, { label: string; className: string }> = {
  fourPitch: { label: "4-pitch", className: WALK_TAG_OUTLINE },
  ohTwo: { label: "0-2", className: WALK_TAG_OUTLINE },
  leadoff: { label: "leadoff", className: WALK_TAG_OUTLINE },
  twoOut: { label: "2-out", className: WALK_TAG_OUTLINE },
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function RecentWalksFeed({
  walks,
  limit = 30,
}: {
  walks: WalkRecord[];
  limit?: number;
}) {
  const items = walks.slice(0, limit);
  if (items.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
        No walks in this range.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--border)]">
      {items.map((w, idx) => (
        <li
          key={`${w.gamePk}-${w.pitcherId}-${w.inning}-${w.halfInning}-${idx}`}
          className="flex items-center gap-3 px-4 py-3"
        >
          <PitcherAvatar
            name={w.pitcherName}
            src={headshotUrl(w.pitcherId)}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold text-[var(--text)]">
                {w.pitcherName}
              </span>
              <span className="text-xs text-[var(--text-muted)]">walked</span>
              <span className="text-sm text-[var(--text-secondary)]">{w.batterName}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-muted)]">
              <span>{formatDate(w.date)}</span>
              <span>·</span>
              <span>vs {w.opponent}</span>
              <span>·</span>
              <span>
                {w.halfInning === "top" ? "T" : "B"}
                {w.inning}
              </span>
              <span>·</span>
              <span className="tabular">
                {w.finalCount.balls}-{w.finalCount.strikes}, {w.pitchesInPA}p
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {w.tags.map((t) => (
              <span
                key={t}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${TAG_META[t].className}`}
              >
                {TAG_META[t].label}
              </span>
            ))}
          </div>
        </li>
      ))}
      {walks.length > limit && (
        <li className="px-4 py-2 text-center text-[11px] text-[var(--text-muted)]">
          + {walks.length - limit} more
        </li>
      )}
    </ul>
  );
}
