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

type SortKey = "net" | "feesOwed" | "bonusEarned" | "name";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "net", label: "Net (best first)" },
  { key: "feesOwed", label: "Fees owed (most first)" },
  { key: "bonusEarned", label: "Bonus earned (most first)" },
  { key: "name", label: "Name (A–Z)" },
];

export function FundView({ report, rangeLabel }: { report: FundReport; rangeLabel: string }) {
  const [sortKey, setSortKey] = useState<SortKey>("net");
  const sorted = useMemo(() => {
    const rows = [...report.entries];
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return b[sortKey] - a[sortKey];
    });
    return rows;
  }, [report.entries, sortKey]);

  const topOwer = [...report.entries].sort((a, b) => b.feesOwed - a.feesOwed)[0];
  const topEarner = [...report.entries].sort((a, b) => b.bonusEarned - a.bonusEarned)[0];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-sox-navy)] via-[var(--color-sox-ink)] to-[#1d2f4b] p-5 text-white shadow-md sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BigStat
            label="Pot"
            value={formatMoney(report.team.totalFees)}
            sub={`${report.team.walkCount} walk fees`}
            tone="red"
          />
          <BigStat
            label="Coaches owe"
            value={formatMoney(report.team.totalBonus)}
            sub={`${report.team.threePitchCount} 3P-K + ${report.team.sideInningCount} 3UP`}
            tone="gold"
          />
          <BigStat
            label="Team net"
            value={formatMoney(report.team.netBalance)}
            sub={
              report.team.netBalance > 0
                ? "Coaches paying out"
                : report.team.netBalance < 0
                  ? "Pot growing"
                  : "Dead even"
            }
            tone={report.team.netBalance >= 0 ? "emerald" : "rose"}
          />
          <BigStat
            label="Range"
            value={rangeLabel}
            sub={`${report.entries.length} pitchers in book`}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topOwer && topOwer.feesOwed > 0 && (
            <TopCallout
              title="Top contributor (sorry buddy)"
              entry={topOwer}
              valueLabel={`${formatMoney(topOwer.feesOwed)} owed`}
              tone="red"
            />
          )}
          {topEarner && topEarner.bonusEarned > 0 && (
            <TopCallout
              title="Top earner"
              entry={topEarner}
              valueLabel={`${formatMoney(topEarner.bonusEarned)} earned`}
              tone="gold"
            />
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-bold text-[var(--text)]">The Rules</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <RuleBlock
            title="Players pay (No Pass Fund)"
            color="rose"
            rules={[
              { label: "4-pitch walk", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "0-2 walk", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "Leadoff walk", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
              { label: "2-out walk", amount: `${formatMoney(WALK_FEE_PER_CATEGORY)} per walk` },
            ]}
          />
          <RuleBlock
            title="Coaches pay (K Bonus)"
            color="emerald"
            rules={[
              { label: "3-pitch K", amount: `${formatMoney(THREE_PITCH_K_BONUS)} each` },
              { label: "3-up-3-down inning", amount: `${formatMoney(SIDE_K_BONUS)} per inning` },
            ]}
          />
        </div>
        <div className="border-t border-[var(--border)] px-5 py-2 text-[10px] text-[var(--text-muted)]">
          A walk that hits multiple categories gets charged for each one. Coaches pay players net of fees.
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text)]">Ledger</h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {sorted.length === 0
                ? "Nobody on the books yet"
                : `${sorted.length} pitchers · ${rangeLabel.toLowerCase()}`}
            </p>
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
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
                <th className="px-3 py-2.5 text-right text-rose-700">Owes</th>
                <th className="px-3 py-2.5 text-right">3P-K</th>
                <th className="px-3 py-2.5 text-right">3-up</th>
                <th className="px-3 py-2.5 text-right text-emerald-700">Earned</th>
                <th className="px-4 py-2.5 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, idx) => (
                <tr
                  key={e.pitcherId}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    idx % 2 === 1 ? "bg-slate-50/30" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PitcherAvatar name={e.name} src={e.headshotUrl} size={32} />
                      <span className="font-medium text-[var(--text)]">
                        {e.name}
                      </span>
                    </div>
                  </td>
                  <NumCell value={e.walkBuckets.fourPitch} tint="text-amber-700" />
                  <NumCell value={e.walkBuckets.ohTwo} tint="text-rose-700" />
                  <NumCell value={e.walkBuckets.leadoff} tint="text-sky-700" />
                  <NumCell value={e.walkBuckets.twoOut} tint="text-violet-700" />
                  <MoneyCell value={e.feesOwed} tint="text-rose-700" />
                  <NumCell value={e.threePitchKs} tint="text-emerald-700" />
                  <NumCell value={e.threeUpThreeDownInnings} tint="text-indigo-700" />
                  <MoneyCell value={e.bonusEarned} tint="text-emerald-700" />
                  <td
                    className={`px-4 py-2.5 text-right text-base font-bold tabular ${
                      e.net > 0
                        ? "text-emerald-700"
                        : e.net < 0
                          ? "text-rose-700"
                          : "text-[var(--text-muted)]"
                    }`}
                  >
                    {formatMoney(e.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-[var(--border)] md:hidden">
          {sorted.map((e) => (
            <li key={e.pitcherId} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <PitcherAvatar name={e.name} src={e.headshotUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-[var(--text)]">
                      {e.name}
                    </span>
                    <span
                      className={`text-lg font-bold tabular ${
                        e.net > 0
                          ? "text-emerald-700"
                          : e.net < 0
                            ? "text-rose-700"
                            : "text-[var(--text-muted)]"
                      }`}
                    >
                      {formatMoney(e.net)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                    <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-700">
                      -{formatMoney(e.feesOwed)}
                    </span>
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
                      +{formatMoney(e.bonusEarned)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[10px]">
                <SmallCell label="4P" value={e.walkBuckets.fourPitch} on="bg-amber-50 text-amber-800" />
                <SmallCell label="0-2" value={e.walkBuckets.ohTwo} on="bg-rose-50 text-rose-800" />
                <SmallCell label="LO" value={e.walkBuckets.leadoff} on="bg-sky-50 text-sky-800" />
                <SmallCell label="2O" value={e.walkBuckets.twoOut} on="bg-violet-50 text-violet-800" />
                <SmallCell label="3P-K" value={e.threePitchKs} on="bg-emerald-50 text-emerald-800" />
                <SmallCell label="3UP" value={e.threeUpThreeDownInnings} on="bg-indigo-50 text-indigo-800" />
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
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub: string;
  tone?: "red" | "gold" | "emerald" | "rose" | "neutral";
}) {
  const toneClass = {
    red: "text-rose-200",
    gold: "text-[var(--color-woo-gold)]",
    emerald: "text-emerald-200",
    rose: "text-rose-200",
    neutral: "text-white",
  }[tone];
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular leading-none ${toneClass}`}>
        {value}
      </div>
      <div className="mt-1 truncate text-[10px] uppercase tracking-wider text-white/60">
        {sub}
      </div>
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
  tone: "red" | "gold";
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
          tone === "gold" ? "text-[var(--color-woo-gold)]" : "text-rose-200"
        }`}
      >
        {valueLabel}
      </div>
    </div>
  );
}

function RuleBlock({
  title,
  color,
  rules,
}: {
  title: string;
  color: "rose" | "emerald";
  rules: Array<{ label: string; amount: string }>;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        color === "rose" ? "border-rose-100 bg-rose-50/40" : "border-emerald-100 bg-emerald-50/40"
      }`}
    >
      <div
        className={`mb-2 text-xs font-bold uppercase tracking-wider ${
          color === "rose" ? "text-rose-800" : "text-emerald-800"
        }`}
      >
        {title}
      </div>
      <ul className="space-y-1.5">
        {rules.map((r) => (
          <li key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{r.label}</span>
            <span className="font-bold tabular text-[var(--text)]">{r.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumCell({ value, tint }: { value: number; tint: string }) {
  return (
    <td
      className={`px-3 py-2.5 text-right tabular ${
        value > 0 ? `font-semibold ${tint}` : "text-slate-300"
      }`}
    >
      {value}
    </td>
  );
}

function MoneyCell({ value, tint }: { value: number; tint: string }) {
  return (
    <td
      className={`px-3 py-2.5 text-right tabular ${
        value > 0 ? `font-semibold ${tint}` : "text-slate-300"
      }`}
    >
      {formatMoney(value)}
    </td>
  );
}

function SmallCell({ label, value, on }: { label: string; value: number; on: string }) {
  return (
    <div className={`rounded-md py-1 ${value > 0 ? on : "bg-[var(--surface-hover)] text-slate-300"}`}>
      <div className="text-[8px] font-medium uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="text-sm font-bold tabular leading-none">{value}</div>
    </div>
  );
}
