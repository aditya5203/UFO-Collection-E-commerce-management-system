"use client";

import * as React from "react";
import {
  SalesBarItem,
  StatusBarItem,
  formatMoneyNPR,
  panelClass,
} from "./dashboardTypes";
import {
  ChartBar,
  EmptyChartState,
  StatusBar,
} from "./DashboardShared";

type Props = {
  salesBars: SalesBarItem[];
  weeklyRevenue: number;
  hasSalesData: boolean;
  statusBars: StatusBarItem[];
  totalOrdersByStatus: number;
  hasStatusData: boolean;
};

export default function DashboardCharts({
  salesBars,
  weeklyRevenue,
  hasSalesData,
  statusBars,
  totalOrdersByStatus,
  hasStatusData,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
      <div className={`${panelClass} p-5 sm:p-6`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
              Sales Performance
            </div>

            <div className="mt-1 text-[20px] font-semibold text-white">
              Sales Overview
            </div>

            <div className="mt-1 text-[13px] text-[#a7aec4]">
              Last 7 days revenue trend
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white">
            {formatMoneyNPR(weeklyRevenue)}
          </div>
        </div>

        <div className="relative h-[260px] overflow-hidden rounded-[22px] border border-[#26293a] bg-[radial-gradient(circle_at_0_0,rgba(139,92,246,0.20),transparent_35%),linear-gradient(180deg,#161824,#0d0f17)] p-4">
          <div className="absolute inset-x-5 top-10 border-t border-dashed border-white/10" />
          <div className="absolute inset-x-5 top-24 border-t border-dashed border-white/10" />
          <div className="absolute inset-x-5 top-[152px] border-t border-dashed border-white/10" />

          {!hasSalesData && (
            <EmptyChartState message="No sales revenue recorded in the last 7 days." />
          )}

          <div className="relative flex h-full items-end gap-3 pb-7 pt-3">
            {salesBars.map((b, idx) => (
              <ChartBar
                key={`${b.label}-${idx}`}
                heightClass={b.heightClass}
                label={b.label}
                value={formatMoneyNPR(b.totalPaisa)}
                muted={!hasSalesData}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={`${panelClass} p-5 sm:p-6`}>
        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Order Pipeline
          </div>

          <div className="mt-1 text-[20px] font-semibold text-white">
            Orders by Status
          </div>

          <div className="mt-1 text-[13px] text-[#a7aec4]">
            {totalOrdersByStatus.toLocaleString("en-US")} total orders
          </div>
        </div>

        <div className="relative rounded-[22px] border border-[#26293a] bg-[#0d0f17] p-4">
          {!hasStatusData && (
            <EmptyChartState
              message="No order status data available yet."
              compact
            />
          )}

          <div className="flex h-[190px] items-end gap-4">
            {statusBars.map((s) => (
              <StatusBar
                key={s.label}
                label={s.label}
                value={s.value}
                heightClass={s.heightClass}
                tone={s.tone}
                muted={!hasStatusData}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}