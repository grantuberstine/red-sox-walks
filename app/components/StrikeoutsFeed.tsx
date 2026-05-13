import type { StrikeoutRecord, StrikeoutType } from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";
import { headshotUrl } from "@/lib/achievements";

const TAG_META: Record<StrikeoutType, { label: string; className: string }> = {
  threePitch: {
    label: "3-pitch",
    className: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-500/30",
  },
  side: {
    label: "side",
    className: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 ring-indigo-200 dark:ring-indigo-500/30",
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function StrikeoutsFeed({
  strikeouts,
  limit = 30,
}: {
  strikeouts: StrikeoutRecord[];
  limit?: number;
}) {
  const items = strikeouts.slice(0, limit);
  if (items.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
        No strikeouts in this range.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--border)]">
      {items.map((s, idx) => (
        <li
          key={`${s.gamePk}-${s.pitcherId}-${s.inning}-${s.halfInning}-${idx}`}
          className="flex items-center gap-3 px-4 py-3"
        >
          <PitcherAvatar
            name={s.pitcherName}
            src={headshotUrl(s.pitcherId)}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold text-[var(--text)]">
                {s.pitcherName}
              </span>
              <span className="text-xs text-emerald-600">struck out</span>
              <span className="text-sm text-[var(--text-secondary)]">{s.batterName}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-muted)]">
              <span>{formatDate(s.date)}</span>
              <span>·</span>
              <span>vs {s.opponent}</span>
              <span>·</span>
              <span>
                {s.halfInning === "top" ? "T" : "B"}
                {s.inning}
              </span>
              <span>·</span>
              <span className="tabular">{s.pitchesInPA}p</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {s.tags.map((t) => (
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
      {strikeouts.length > limit && (
        <li className="px-4 py-2 text-center text-[11px] text-[var(--text-muted)]">
          + {strikeouts.length - limit} more
        </li>
      )}
    </ul>
  );
}
