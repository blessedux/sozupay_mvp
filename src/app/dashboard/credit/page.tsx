"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

/** Mock data – replace with API later. */
const MOCK_POOL = {
  totalVolume: 125_000,
  available: 48_000,
  allocated: 62_000,
  inRepayment: 52_000,
  overdue: 3_200,
};

const MOCK_ALLOCATIONS = [
  { recipientName: "María López", amount: 12_000, trustpoints: 85, status: "on_track", nextDue: "2025-03-15" },
  { recipientName: "Ana García", amount: 8_500, trustpoints: 72, status: "on_track", nextDue: "2025-03-22" },
  { recipientName: "Carmen Ruiz", amount: 15_000, trustpoints: 90, status: "on_track", nextDue: "2025-03-08" },
  { recipientName: "Rosa Martínez", amount: 6_200, trustpoints: 65, status: "at_risk", nextDue: "2025-02-28" },
  { recipientName: "Elena Díaz", amount: 9_800, trustpoints: 78, status: "on_track", nextDue: "2025-03-18" },
  { recipientName: "Laura Fernández", amount: 4_500, trustpoints: 58, status: "overdue", nextDue: "2025-02-15" },
];

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** SVG segment for a donut slice (0–1 is full circle). */
function DonutSegment({
  startFrac,
  endFrac,
  color,
  label,
  value,
  isActive,
  onClick,
}: {
  startFrac: number;
  endFrac: number;
  color: string;
  label: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const r = 42;
  const R = 52;
  const cx = 60;
  const cy = 60;
  const toRad = (f: number) => 2 * Math.PI * (f - 0.25);
  const x1 = cx + R * Math.cos(toRad(startFrac));
  const y1 = cy + R * Math.sin(toRad(startFrac));
  const x2 = cx + R * Math.cos(toRad(endFrac));
  const y2 = cy + R * Math.sin(toRad(endFrac));
  const x3 = cx + r * Math.cos(toRad(endFrac));
  const y3 = cy + r * Math.sin(toRad(endFrac));
  const x4 = cx + r * Math.cos(toRad(startFrac));
  const y4 = cy + r * Math.sin(toRad(startFrac));
  const large = endFrac - startFrac > 0.5 ? 1 : 0;
  const d = [
    `M ${x1} ${y1}`,
    `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${r} ${r} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
  return (
    <g>
      <path
        d={d}
        fill={color}
        className="cursor-pointer transition opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-full"
        style={{ opacity: isActive ? 1 : 0.85 }}
        onClick={onClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
        role="button"
        tabIndex={0}
        aria-label={`${label}: ${value}`}
      />
    </g>
  );
}

export default function CreditPage() {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const segments = useMemo(() => {
    const { totalVolume, available, allocated, inRepayment, overdue } = MOCK_POOL;
    const a = available / totalVolume;
    const b = (allocated - inRepayment - overdue) / totalVolume;
    const c = inRepayment / totalVolume;
    const d = overdue / totalVolume;
    return [
      { id: "available", start: 0, end: a, color: "#22c55e", label: "Available in pool", value: formatUsd(available) },
      { id: "allocated", start: a, end: a + b, color: "#3b82f6", label: "Allocated (pending)", value: formatUsd(allocated - inRepayment - overdue) },
      { id: "repayment", start: a + b, end: a + b + c, color: "#eab308", label: "In repayment", value: formatUsd(inRepayment) },
      { id: "overdue", start: a + b + c, end: 1, color: "#ef4444", label: "Overdue", value: formatUsd(overdue) },
    ].filter((s) => s.end > s.start);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Credit
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
        Credit eligibility is based on a <strong className="text-gray-900 dark:text-white">trustpoint</strong> system.
        Recipients build trustpoints through repayment history and engagement. The pool below shows total volume
        available for microcredits, how much is allocated to recipients, and the health of payback cycles.
      </p>

      <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* Daisy-disk style circular graphic */}
        <div className="flex-shrink-0">
          <div
            className="relative w-[320px] h-[320px] rounded-full bg-gray-900 dark:bg-gray-950 border-4 border-gray-700 dark:border-gray-700 shadow-xl animate-pulse"
            style={{ animationDuration: "2.5s" }}
          >
            <svg
              viewBox="0 0 120 120"
              className="absolute inset-0 w-full h-full rounded-full"
              aria-hidden
            >
              {segments.map((s) => (
                <DonutSegment
                  key={s.id}
                  startFrac={s.start}
                  endFrac={s.end}
                  color={s.color}
                  label={s.label}
                  value={s.value}
                  isActive={activeSegment === null || activeSegment === s.id}
                  onClick={() => setActiveSegment(activeSegment === s.id ? null : s.id)}
                />
              ))}
              <circle cx="60" cy="60" r="32" fill="rgb(17 24 39)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="60" y="56" textAnchor="middle" className="fill-white text-[8px] font-bold">
                {formatUsd(MOCK_POOL.totalVolume)}
              </text>
              <text x="60" y="66" textAnchor="middle" className="fill-gray-400 text-[6px]">
                total pool
              </text>
            </svg>
            {activeSegment && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md bg-gray-800/95 text-white text-xs font-medium whitespace-nowrap">
                {segments.find((s) => s.id === activeSegment)?.label}: {segments.find((s) => s.id === activeSegment)?.value}
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            Click a segment to see detail
          </p>
        </div>

        {/* Key stats list */}
        <div className="flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Pool summary
          </h2>
          <ul className="space-y-3">
            <li className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total volume in pool</span>
              <span className="font-semibold tabular-nums">{formatUsd(MOCK_POOL.totalVolume)}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Available for new credit</span>
              <span className="font-semibold tabular-nums text-green-600 dark:text-green-400">{formatUsd(MOCK_POOL.available)}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Allocated to recipients</span>
              <span className="font-semibold tabular-nums">{formatUsd(MOCK_POOL.allocated)}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">In repayment (on track)</span>
              <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{formatUsd(MOCK_POOL.inRepayment)}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Overdue</span>
              <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">{formatUsd(MOCK_POOL.overdue)}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Allocation by recipient */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Allocation by recipient
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Microcredits disbursed and trustpoints. Health indicates payback cycle status.
        </p>
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="text-left p-3 font-medium">Recipient</th>
                <th className="text-left p-3 font-medium">Allocated</th>
                <th className="text-left p-3 font-medium">Trustpoints</th>
                <th className="text-left p-3 font-medium">Health</th>
                <th className="text-left p-3 font-medium">Next due</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ALLOCATIONS.map((row) => (
                <tr key={row.recipientName} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-3 font-medium">{row.recipientName}</td>
                  <td className="p-3 tabular-nums">{formatUsd(row.amount)}</td>
                  <td className="p-3">{row.trustpoints}</td>
                  <td className="p-3">
                    <span
                      className={
                        row.status === "on_track"
                          ? "text-green-600 dark:text-green-400"
                          : row.status === "at_risk"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                      }
                    >
                      {row.status === "on_track" ? "On track" : row.status === "at_risk" ? "At risk" : "Overdue"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">{row.nextDue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/dashboard/recipients" className="underline hover:no-underline">
          Manage recipients
        </Link>
        {" · "}
        <Link href="/dashboard/payouts" className="underline hover:no-underline">
          Payouts
        </Link>
      </p>
    </div>
  );
}
