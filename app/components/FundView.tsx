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
            label="Coaches owe the fund"
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
              valueLabel={`${formatMoney(topOwer.feesOwed)} owed`}
              tone="rose"
            />
          )}
          {topEarner && topEarner.bonusEarned > 0 && (
            <TopCallout
              title="Biggest K-bonus generator"
              entry={topEarner}
              valueLabel={`${formatMoney(topEarner.bonusEarned)} into fund`}
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
              { label: "4-pitch walk", detail: "Never threw a strike", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "0-2 walk", detail: "Count reached 0-2 then walked", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "Leadoff walk", detail: "First batter of an inning", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "2-out walk", detail: "Walked a batter with 2 outs, nobody on", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
            ]}
            footnote="A walk that hits multiple categories gets charged for each."
          />
          <RuleBlock
            title="Coaches → No Pass Fund"
            description="Coaches pay the fund for every team K achievement:"
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
              <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-2.5 text-left">Pitcher</th>
                <th className="px-3 py-2.5 text-right">4P</th>
                <th className="px-3 py-2.5 text-right">0-2</th>
                <th className="px-3 py-2.5 text-right">LO</th>
                <th className="px-3 py-2.5 text-right">2O</th>
                <th className="px-3 py-2.5 text-right text-[var(--color-sox-red)]">
                  Owes the fund
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
                  <NumCell value={e.walkBuckets.fourPitch} tint="text-[var(--text)]" />
                  <NumCell value={e.walkBuckets.ohTwo} tint="text-[var(--text)]" />
                  <NumCell value={e.walkBuckets.leadoff} tint="text-[var(--text)]" />
                  <NumCell value={e.walkBuckets.twoOut} tint="text-[var(--text)]" />
                  <MoneyCell value={e.feesOwed} tint="rose" />
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
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-[var(--text)]">
                      {e.name}
                    </span>
                    <span className="text-xl font-bold tabular text-[var(--color-sox-red)]">
                      {formatMoney(e.feesOwed)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    Owes the fund
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
                <SmallCell label="4P" value={e.walkBuckets.fourPitch} />
                <SmallCell label="0-2" value={e.walkBuckets.ohTwo} />
                <SmallCell label="LO" value={e.walkBuckets.leadoff} />
                <SmallCell label="2O" value={e.walkBuckets.twoOut} />
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
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
        {description}
      </p>
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
