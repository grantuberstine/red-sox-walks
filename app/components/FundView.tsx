"use client";

import { useMemo, useState } from "react";
import type { FundReport } from "@/lib/fund";
import {
  WALK_FEE_PER_CATEGORY,
  THREE_PITCH_K_BONUS,
  SIDE_K_BONUS,
  formatMoney,
} from "@/lib/fund";
import { PitcherAvatar } from "./PitcherAvatar";

type SortKey =
  | "feesOwed"
  | "bonusEarned"
  | "fourPitch"
  | "ohTwo"
  | "leadoff"
  | "twoOut"
  | "threePitchKs"
  | "threeUpThreeDownInnings"
  | "name";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "feesOwed", label: "Players Owe Most" },
  { key: "bonusEarned", label: "Coaches Owe Most" },
  { key: "fourPitch", label: "Most 4-Pitch Walks" },
  { key: "ohTwo", label: "Most 0-2 Walks" },
  { key: "leadoff", label: "Most Leadoff Walks" },
  { key: "twoOut", label: "Most 2-Out Walks" },
  { key: "threePitchKs", label: "Most 3-Pitch K" },
  { key: "threeUpThreeDownInnings", label: "Most 3-Up-3-Dn" },
  { key: "name", label: "Name (A→Z)" },
];

export function FundView({ report }: { report: FundReport }) {
  const [sortKey, setSortKey] = useState<SortKey>("feesOwed");
  const sorted = useMemo(() => {
    const rows = [...report.entries];
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "feesOwed" || sortKey === "bonusEarned") {
        return b[sortKey] - a[sortKey];
      }
      if (sortKey === "threePitchKs" || sortKey === "threeUpThreeDownInnings") {
        return b[sortKey] - a[sortKey];
      }
      // walk bucket sort
      return b.walkBuckets[sortKey] - a.walkBuckets[sortKey];
    });
    return rows;
  }, [report.entries, sortKey]);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FilledStat
          label="Players Owe the Fund"
          value={formatMoney(report.team.totalFees)}
          sub={`${report.team.walkCount} walk fees · $${WALK_FEE_PER_CATEGORY} per category`}
          tone="rose"
        />
        <FilledStat
          label="Coaches Owe the Fund"
          value={formatMoney(report.team.totalBonus)}
          sub={`${report.team.threePitchCount} 3-pitch K · ${report.team.sideInningCount} 3-up-3-down`}
          tone="emerald"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-bold text-[var(--text)]">The Rules</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <RuleBlock
            title="Players → No Pass Fund"
            color="rose"
            rules={[
              { label: "4-pitch walk", detail: "Never threw a strike", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "0-2 walk", detail: "Count reached 0-2 then walked", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "Leadoff walk", detail: "First batter of an inning", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "2-out walk", detail: "Walked a batter with 2 outs, nobody on", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
            ]}
            footnote="A walk that hits multiple categories gets charged for each."
          />
          <RuleBlock
            title="Coaches → No Pass Fund"
            color="emerald"
            rules={[
              { label: "3-pitch K", detail: "Strikeout in 3 straight strikes", amount: `${formatMoney(THREE_PITCH_K_BONUS)} each` },
              { label: "3-up-3-down inning", detail: "All 3 outs by K, same pitcher, in a row", amount: `${formatMoney(SIDE_K_BONUS)} per inning` },
            ]}
            footnote="Pool grows from coaches' contributions, not paid out per pitcher."
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-bold text-[var(--text)]">Ledger</h2>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="font-semibold">Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="hidden md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <SortTh label="Pitcher" sortKey="name" current={sortKey} onSort={setSortKey} align="left" className="px-4 py-2.5" />
                <SortTh label="4P" sortKey="fourPitch" current={sortKey} onSort={setSortKey} className="w-[64px] px-3 py-2.5" />
                <SortTh label="0-2" sortKey="ohTwo" current={sortKey} onSort={setSortKey} className="w-[64px] px-3 py-2.5" />
                <SortTh label="LO" sortKey="leadoff" current={sortKey} onSort={setSortKey} className="w-[64px] px-3 py-2.5" />
                <SortTh label="2O" sortKey="twoOut" current={sortKey} onSort={setSortKey} className="w-[64px] px-3 py-2.5" />
                <SortTh
                  label="Owes"
                  sortKey="feesOwed"
                  current={sortKey}
                  onSort={setSortKey}
                  className="w-[110px] border-r border-[var(--border-strong)] px-3 py-2.5 text-[var(--color-sox-red)]"
                />
                <SortTh label="3-Pitch K" sortKey="threePitchKs" current={sortKey} onSort={setSortKey} className="w-[80px] px-3 py-2.5" />
                <SortTh label="3-Up-3-Dn" sortKey="threeUpThreeDownInnings" current={sortKey} onSort={setSortKey} className="w-[90px] px-3 py-2.5" />
                <SortTh
                  label="Coaches Owe"
                  sortKey="bonusEarned"
                  current={sortKey}
                  onSort={setSortKey}
                  className="w-[120px] px-3 py-2.5 text-emerald-700 dark:text-emerald-400"
                />
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, idx) => (
                <tr
                  key={e.pitcherId}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    idx % 2 === 1 ? "bg-[var(--row-stripe)]" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PitcherAvatar
                        name={e.name}
                        src={e.headshotUrl}
                        size={32}
                      />
                      <span className="font-medium text-[var(--text)]">
                        {e.name}
                      </span>
                    </div>
                  </td>
                  <NumCell value={e.walkBuckets.fourPitch} />
                  <NumCell value={e.walkBuckets.ohTwo} />
                  <NumCell value={e.walkBuckets.leadoff} />
                  <NumCell value={e.walkBuckets.twoOut} />
                  <MoneyCell value={e.feesOwed} tint="rose" withDivider />
                  <NumCell value={e.threePitchKs} />
                  <NumCell value={e.threeUpThreeDownInnings} />
                  <MoneyCell value={e.bonusEarned} tint="emerald" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-[var(--border)] md:hidden">
          {sorted.map((e) => (
            <li key={e.pitcherId} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <PitcherAvatar
                  name={e.name}
                  src={e.headshotUrl}
                  size={48}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-[var(--text)]">
                    {e.name}
                  </div>
                  <div className="mt-1 flex items-baseline gap-4 text-[11px]">
                    <span className="text-[var(--text-secondary)]">
                      Owes{" "}
                      <span className="font-bold tabular text-[var(--color-sox-red)]">
                        {formatMoney(e.feesOwed)}
                      </span>
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      Coaches Owe{" "}
                      <span className="font-bold tabular text-emerald-700 dark:text-emerald-400">
                        {formatMoney(e.bonusEarned)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px]">
                <SmallCell label="4P" value={e.walkBuckets.fourPitch} />
                <SmallCell label="0-2" value={e.walkBuckets.ohTwo} />
                <SmallCell label="LO" value={e.walkBuckets.leadoff} />
                <SmallCell label="2O" value={e.walkBuckets.twoOut} />
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1 text-center text-[10px]">
                <SmallCell label="3-Pitch K" value={e.threePitchKs} />
                <SmallCell label="3-Up-3-Dn" value={e.threeUpThreeDownInnings} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FilledStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "rose" | "emerald";
}) {
  const gradient =
    tone === "rose"
      ? "from-[#8e1f26] via-[var(--color-sox-red)] to-[#8e1f26]"
      : "from-emerald-800 via-emerald-700 to-emerald-800";
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-6`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
        {label}
      </div>
      <div
        className="mt-2 text-5xl font-bold tabular leading-none sm:text-6xl"
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div className="mt-3 text-[11px] text-white/75">{sub}</div>
    </div>
  );
}

function RuleBlock({
  title,
  color,
  rules,
  footnote,
}: {
  title: string;
  color: "rose" | "emerald";
  rules: Array<{ label: string; detail?: string; amount: string }>;
  footnote: string;
}) {
  const accentBar =
    color === "rose" ? "bg-[var(--color-sox-red)]" : "bg-emerald-500";
  const titleColor =
    color === "rose"
      ? "text-[var(--color-sox-red)]"
      : "text-emerald-700 dark:text-emerald-400";

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4 pl-5">
      <div className={`absolute inset-y-0 left-0 w-1 ${accentBar}`} />
      <div className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {rules.map((r) => (
          <li
            key={r.label}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <div className="min-w-0">
              <div className="font-medium text-[var(--text)]">{r.label}</div>
              {r.detail && (
                <div className="text-[10px] text-[var(--text-muted)]">
                  {r.detail}
                </div>
              )}
            </div>
            <span className="shrink-0 font-semibold tabular text-[var(--text)]">
              {r.amount}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-[var(--border)] pt-2 text-[10px] text-[var(--text-muted)]">
        {footnote}
      </p>
    </div>
  );
}

function SortTh({
  label,
  sortKey,
  current,
  onSort,
  align = "right",
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sortKey === current;
  return (
    <th className={`${className} ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex cursor-pointer items-center gap-1 transition ${
          active ? "text-[var(--text)]" : "hover:text-[var(--text)]"
        }`}
      >
        <span>{label}</span>
        <span className="text-[10px] opacity-50">{active ? "▼" : "↕"}</span>
      </button>
    </th>
  );
}

function NumCell({ value }: { value: number }) {
  return (
    <td className="px-3 py-2.5 text-right tabular text-[var(--text)]">
      {value}
    </td>
  );
}

function MoneyCell({
  value,
  tint,
  withDivider = false,
}: {
  value: number;
  tint: "rose" | "emerald";
  withDivider?: boolean;
}) {
  const color =
    tint === "rose"
      ? "text-[var(--color-sox-red)] dark:text-rose-300"
      : "text-emerald-700 dark:text-emerald-300";
  return (
    <td
      className={`px-3 py-2.5 text-right text-base font-bold tabular ${color} ${
        withDivider ? "border-r border-[var(--border-strong)]" : ""
      }`}
    >
      {formatMoney(value)}
    </td>
  );
}

function SmallCell({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className={`rounded-md py-1 ${
        value > 0
          ? "bg-[var(--surface-hover)] text-[var(--text)]"
          : "bg-[var(--surface-hover)]/50 text-[var(--text-muted)]/60"
      }`}
    >
      <div className="text-[8px] font-medium uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="text-sm font-bold tabular leading-none">{value}</div>
    </div>
  );
}
