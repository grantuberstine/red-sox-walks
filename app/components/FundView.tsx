"use client";

import { useMemo, useState } from "react";
import type { LedgerEntry, FundReport } from "@/lib/fund";
import {
  WALK_FEE_PER_CATEGORY,
  THREE_PITCH_K_BONUS,
  SIDE_K_BONUS,
  formatMoney,
} from "@/lib/fund";
import { PitcherAvatar } from "./PitcherAvatar";

type SortKey = "feesOwed" | "bonusEarned" | "name";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "feesOwed", label: "Player owes most" },
  { key: "bonusEarned", label: "Coaches owe most" },
  { key: "name", label: "Name (A→Z)" },
];

export function FundView({
  report,
  rangeLabel,
}: {
  report: FundReport;
  rangeLabel: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("feesOwed");
  const sorted = useMemo(() => {
    const rows = [...report.entries];
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return b[sortKey] - a[sortKey];
    });
    return rows;
  }, [report.entries, sortKey]);

  const topOwer = [...report.entries].sort(
    (a, b) => b.feesOwed - a.feesOwed,
  )[0];
  const topEarner = [...report.entries].sort(
    (a, b) => b.bonusEarned - a.bonusEarned,
  )[0];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-sox-navy)] via-[var(--color-sox-ink)] to-[#1d2f4b] p-5 text-white shadow-md sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BigStat
            label="Players owe the fund"
            value={formatMoney(report.team.totalFees)}
            sub={`${report.team.walkCount} walk fees · ${WALK_FEE_PER_CATEGORY} per category`}
            tone="rose"
          />
          <BigStat
            label="Coaches owe players"
            value={formatMoney(report.team.totalBonus)}
            sub={`${report.team.threePitchCount} 3-pitch K × $${THREE_PITCH_K_BONUS} + ${report.team.sideInningCount} 3-up-3-down × $${SIDE_K_BONUS}`}
            tone="emerald"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topOwer && topOwer.feesOwed > 0 && (
            <TopCallout
              title="Biggest contributor to the fund"
              entry={topOwer}
              valueLabel={`${formatMoney(topOwer.feesOwed)} owes`}
              tone="rose"
            />
          )}
          {topEarner && topEarner.bonusEarned > 0 && (
            <TopCallout
              title="Coaches owe most to"
              entry={topEarner}
              valueLabel={`${formatMoney(topEarner.bonusEarned)} owed`}
              tone="emerald"
            />
          )}
        </div>

        <div className="mt-3 text-[10px] uppercase tracking-widest text-white/50">
          {rangeLabel} · {report.entries.length} pitchers on the books
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-bold text-[var(--text)]">The Rules</h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Two separate ledgers — they don&apos;t cancel out.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <RuleBlock
            title="Players → No Pass Fund"
            description="Each player pays the fund for every walk that fits one of these:"
            color="rose"
            rules={[
              { label: "4-pitch walk", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "0-2 walk", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "Leadoff walk", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "2-out walk", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
            ]}
            footnote="A walk that hits multiple categories gets charged for each."
          />
          <RuleBlock
            title="Coaches → Players"
            description="Coaches owe each pitcher a bonus for these K achievements:"
            color="emerald"
            rules={[
              { label: "3-pitch strikeout", amount: `${formatMoney(THREE_PITCH_K_BONUS)} each` },
              { label: "3-up-3-down inning", amount: `${formatMoney(SIDE_K_BONUS)} per inning` },
            ]}
            footnote="Paid out per pitcher — independent of what they owe the fund."
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text)]">Ledger</h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              Two columns: what they owe · what coaches owe them
            </p>
          </div>
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
                <th className="px-4 py-2.5 text-left">Pitcher</th>
                <th className="px-3 py-2.5 text-right">4P</th>
                <th className="px-3 py-2.5 text-right">0-2</th>
                <th className="px-3 py-2.5 text-right">LO</th>
                <th className="px-3 py-2.5 text-right">2O</th>
                <th className="px-3 py-2.5 text-right text-rose-700 dark:text-rose-300">
                  Player owes
                </th>
                <th className="px-3 py-2.5 text-right">3P-K</th>
                <th className="px-3 py-2.5 text-right">3UP</th>
                <th className="px-3 py-2.5 text-right text-emerald-700 dark:text-emerald-300">
                  Coaches owe
                </th>
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
                  <NumCell value={e.walkBuckets.fourPitch} tint="text-amber-700 dark:text-amber-300" />
                  <NumCell value={e.walkBuckets.ohTwo} tint="text-rose-700 dark:text-rose-300" />
                  <NumCell value={e.walkBuckets.leadoff} tint="text-sky-700 dark:text-sky-300" />
                  <NumCell value={e.walkBuckets.twoOut} tint="text-violet-700 dark:text-violet-300" />
                  <MoneyCell value={e.feesOwed} tint="rose" />
                  <NumCell value={e.threePitchKs} tint="text-emerald-700 dark:text-emerald-300" />
                  <NumCell
                    value={e.threeUpThreeDownInnings}
                    tint="text-indigo-700 dark:text-indigo-300"
                  />
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
                  <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-md bg-rose-50 dark:bg-rose-500/15 px-2 py-1 dark:bg-rose-50 dark:bg-rose-500/150/10">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                        Player owes
                      </div>
                      <div className="text-base font-bold tabular text-rose-700 dark:text-rose-300">
                        {formatMoney(e.feesOwed)}
                      </div>
                    </div>
                    <div className="rounded-md bg-emerald-50 dark:bg-emerald-500/15 px-2 py-1 dark:bg-emerald-50 dark:bg-emerald-500/150/10">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Coaches owe
                      </div>
                      <div className="text-base font-bold tabular text-emerald-700 dark:text-emerald-300">
                        {formatMoney(e.bonusEarned)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[10px]">
                <SmallCell label="4P" value={e.walkBuckets.fourPitch} on="bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300" />
                <SmallCell label="0-2" value={e.walkBuckets.ohTwo} on="bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300" />
                <SmallCell label="LO" value={e.walkBuckets.leadoff} on="bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300" />
                <SmallCell label="2O" value={e.walkBuckets.twoOut} on="bg-violet-50 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300" />
                <SmallCell label="3P-K" value={e.threePitchKs} on="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" />
                <SmallCell label="3UP" value={e.threeUpThreeDownInnings} on="bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: "rose" | "emerald";
}) {
  const valueTone =
    tone === "rose"
      ? "text-rose-200"
      : "text-emerald-200";
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
        {label}
      </div>
      <div className={`mt-1 text-4xl font-bold tabular leading-none ${valueTone}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[11px] text-white/60">{sub}</div>
    </div>
  );
}

function TopCallout({
  title,
  entry,
  valueLabel,
  tone,
}: {
  title: string;
  entry: LedgerEntry;
  valueLabel: string;
  tone: "rose" | "emerald";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-inset ring-white/10">
      <PitcherAvatar name={entry.name} src={entry.headshotUrl} size={36} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-white/60">
          {title}
        </div>
        <div className="truncate text-sm font-semibold text-white">
          {entry.name}
        </div>
      </div>
      <div
        className={`text-sm font-bold tabular ${
          tone === "emerald" ? "text-emerald-200" : "text-rose-200"
        }`}
      >
        {valueLabel}
      </div>
    </div>
  );
}

function RuleBlock({
  title,
  description,
  color,
  rules,
  footnote,
}: {
  title: string;
  description: string;
  color: "rose" | "emerald";
  rules: Array<{ label: string; amount: string }>;
  footnote: string;
}) {
  const bg =
    color === "rose"
      ? "border-rose-100 bg-rose-50 dark:bg-rose-500/15/40 dark:border-rose-500/20 dark:bg-rose-50 dark:bg-rose-500/150/5"
      : "border-emerald-100 bg-emerald-50 dark:bg-emerald-500/15/40 dark:border-emerald-500/20 dark:bg-emerald-50 dark:bg-emerald-500/150/5";
  const titleColor =
    color === "rose"
      ? "text-rose-800 dark:text-rose-300"
      : "text-emerald-800 dark:text-emerald-300";

  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <div className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>
        {title}
      </div>
      <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
        {description}
      </p>
      <ul className="mt-2 space-y-1.5">
        {rules.map((r) => (
          <li key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{r.label}</span>
            <span className="font-bold tabular text-[var(--text)]">
              {r.amount}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-[var(--text-muted)]">{footnote}</p>
    </div>
  );
}

function NumCell({ value, tint }: { value: number; tint: string }) {
  return (
    <td
      className={`px-3 py-2.5 text-right tabular ${
        value > 0 ? `font-semibold ${tint}` : "text-[var(--text-muted)]/60"
      }`}
    >
      {value}
    </td>
  );
}

function MoneyCell({ value, tint }: { value: number; tint: "rose" | "emerald" }) {
  const color =
    tint === "rose"
      ? "text-rose-700 dark:text-rose-300"
      : "text-emerald-700 dark:text-emerald-300";
  return (
    <td
      className={`px-3 py-2.5 text-right text-base font-bold tabular ${
        value > 0 ? color : "text-[var(--text-muted)]/60"
      }`}
    >
      {formatMoney(value)}
    </td>
  );
}

function SmallCell({
  label,
  value,
  on,
}: {
  label: string;
  value: number;
  on: string;
}) {
  return (
    <div
      className={`rounded-md py-1 ${value > 0 ? on : "bg-[var(--surface-hover)] text-[var(--text-muted)]/60"}`}
    >
      <div className="text-[8px] font-medium uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="text-sm font-bold tabular leading-none">{value}</div>
    </div>
  );
}
