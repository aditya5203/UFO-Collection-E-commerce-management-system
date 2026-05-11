"use client";

import * as React from "react";
import { MetricCard } from "./analyticsTypes";

function StatCard({
  label,
  value,
  change,
  positive = true,
}: {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[24px] font-semibold tracking-[-0.04em] text-white">
            {value}
          </div>

          <div
            className={[
              "mt-3 text-[13px] font-semibold",
              positive ? "text-emerald-300" : "text-orange-300",
            ].join(" ")}
          >
            {change}
          </div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <span className={positive ? "text-emerald-300" : "text-orange-300"}>
            {positive ? "↗" : "↘"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsMetricCards({
  metrics,
}: {
  metrics: MetricCard[];
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item, index) => (
        <StatCard
          key={`${item.label}-${index}`}
          label={item.label}
          value={item.value}
          change={item.change}
          positive={item.positive}
        />
      ))}
    </section>
  );
}