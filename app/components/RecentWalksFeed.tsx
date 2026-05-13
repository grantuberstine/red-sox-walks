import type { RecentWalk, WalkType } from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";
import { headshotUrl } from "@/lib/achievements";

const TAG_META: Record<WalkType, { label: string; className: string }> = {
  fourPitch: {
    label: "4-pitch",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  ohTwo: {
    label: "0-2",
    className: "bg-rose-100 text-rose-800 ring-rose-200",
  },
  leadoff: {
    label: "leadoff",
    className: "bg-sky-100 text-sky-800 ring-sky-200",
  },
  twoOut: {
    label: "2-out",
    className: "bg-violet-100 text-violet-800 ring-violet-200",
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

export function RecentWalksFeed({
  walks,
  limit = 20,
}: {
  walks: RecentWalk[];
  limit?: number;
}) {
  const items = walks.slice(0, limit);
  if (items.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-slate-500">
        No walks yet this season.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((w, idx) => (
        <li
          key={`${w.date}-${w.pitcherId}-${w.inning}-${w.halfInning}-${idx}`}
          className="flex items-center gap-3 px-4 py-3"
        >
          <PitcherAvatar name={w.pitcherName} src={headshotUrl(w.pitcherId)} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold text-[var(--color-sox-navy)]">
                {w.pitcherName}
              </span>
              <span className="text-xs text-slate-500">walked</span>
              <span className="text-sm text-slate-700">{w.batterName}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
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
          <div className="flex shrink-0 flex-wrap gap-1 justify-end">
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
    </ul>
  );
}
