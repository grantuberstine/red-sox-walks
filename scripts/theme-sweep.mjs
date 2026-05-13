import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const REPLACEMENTS = [
  ["border-[var(--color-line)]", "border-[var(--border)]"],
  ["text-[var(--color-sox-navy)]", "text-[var(--text)]"],
  ["text-slate-700", "text-[var(--text-secondary)]"],
  ["text-slate-600", "text-[var(--text-secondary)]"],
  ["text-slate-500", "text-[var(--text-muted)]"],
  ["text-slate-400", "text-[var(--text-muted)]"],
  ["border-slate-200", "border-[var(--border)]"],
  ["border-slate-100", "border-[var(--border)]"],
  ["bg-white\"", "bg-[var(--surface)]\""],
  ["bg-white ", "bg-[var(--surface)] "],
  ["bg-slate-50/60", "bg-[var(--surface-hover)]"],
  ["bg-slate-50 ", "bg-[var(--surface-hover)] "],
  ["bg-slate-100", "bg-[var(--surface-hover)]"],
  ["divide-slate-100", "divide-[var(--border)]"],
  ["divide-slate-200", "divide-[var(--border)]"],
];

const TARGETS = [
  "app/Dashboard.tsx",
  "app/PitcherTable.tsx",
  "app/components/CategoryLeaders.tsx",
  "app/components/CategoryChips.tsx",
  "app/components/FilterBar.tsx",
  "app/components/FilterRow.tsx",
  "app/components/FundView.tsx",
  "app/components/HeroBar.tsx",
  "app/components/InningChart.tsx",
  "app/components/PitcherAvatar.tsx",
  "app/components/PitcherCards.tsx",
  "app/components/PlayerProfile.tsx",
  "app/components/PlayersGallery.tsx",
  "app/components/RecentWalksFeed.tsx",
  "app/components/RosterDrawer.tsx",
  "app/components/SearchInput.tsx",
  "app/components/Sidebar.tsx",
  "app/components/StrikeoutLeaders.tsx",
  "app/components/StrikeoutsFeed.tsx",
  "app/components/TeamView.tsx",
  "app/components/TrendChart.tsx",
  "app/components/ViewToggle.tsx",
];

let total = 0;
for (const file of TARGETS) {
  let text = readFileSync(file, "utf-8");
  let changed = false;
  let count = 0;
  for (const [from, to] of REPLACEMENTS) {
    const before = text;
    text = text.split(from).join(to);
    if (text !== before) {
      changed = true;
      count += (before.length - text.length + (to.length - from.length) * 0) / Math.max(1, from.length);
    }
  }
  if (changed) {
    writeFileSync(file, text);
    total += 1;
    console.log(`✓ ${file}`);
  }
}
console.log(`\nUpdated ${total} files.`);
