"use client";

import * as React from "react";
import {
  AnalyticsResponse,
  getWidthClass,
  RangeKey,
} from "./analyticsTypes";
import { ChartPanel, EmptyMini, LabelRow } from "./AnalyticsShared";

type AnalyticsData = NonNullable<AnalyticsResponse["data"]>;

type Props = {
  analytics: AnalyticsData;
  range: RangeKey;
  salesTrendLabels: string[];
  trendPath: string;
};

export default function AnalyticsCharts({
  analytics,
  range,
  salesTrendLabels,
  trendPath,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartPanel
        title="Sales Trends"
        value={analytics.summaryCards.salesTrendAmount}
        change={analytics.summaryCards.salesTrendChange}
        range={range}
      >
        <div className="relative mt-5 h-[240px] overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_0_0,#1f2937,#0d0f17_55%)] p-4">
          <svg
            viewBox="0 0 560 220"
            className="h-full w-full"
            preserveAspectRatio="none"
          >
            <path
              d={trendPath}
              fill="none"
              stroke="rgba(216,199,255,0.95)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <LabelRow labels={salesTrendLabels} />
      </ChartPanel>

      <ChartPanel
        title="Revenue by Product Category"
        value={analytics.summaryCards.categoryRevenueAmount}
        change={analytics.summaryCards.categoryRevenueChange}
        range={range}
      >
        <div className="mt-6 space-y-5">
          {analytics.revenueCategoryData.length > 0 ? (
            analytics.revenueCategoryData.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium text-white">
                    {item.label}
                  </span>

                  <span className="text-[12px] text-[#a7aec4]">
                    Rs.{" "}
                    {Number(item.revenueRs || 0).toLocaleString("en-US")}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={[
                      "h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#d6c7ff]",
                      getWidthClass(item.value),
                    ].join(" ")}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyMini text="No category revenue data found." />
          )}
        </div>
      </ChartPanel>
    </section>
  );
}