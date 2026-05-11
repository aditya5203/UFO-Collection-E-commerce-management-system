"use client";

import * as React from "react";
import {
  AnalyticsResponse,
  getHeightClass,
  isPositiveChange,
  RangeKey,
} from "./analyticsTypes";
import { ChartPanel, LabelRow, SectionTitle } from "./AnalyticsShared";

type AnalyticsData = NonNullable<AnalyticsResponse["data"]>;

function InfoCard({
  title,
  value,
  change,
  positive = true,
}: {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
      <div className="text-[13px] font-medium text-white">{title}</div>

      <div className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-white">
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
  );
}

function ProductCard({
  title,
  value,
  change,
  positive = true,
}: {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
      <div className="text-[13px] font-medium text-white">{title}</div>

      <div className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-white">
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
  );
}

export default function AnalyticsSections({
  analytics,
  range,
}: {
  analytics: AnalyticsData;
  range: RangeKey;
}) {
  return (
    <>
      <section className="space-y-4">
        <SectionTitle
          title="Customer Behavior"
          subtitle="Understand customer retention, value, region, and acquisition."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {analytics.customerBehaviorCards.map((card) => (
            <InfoCard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              positive={isPositiveChange(card.change)}
            />
          ))}
        </div>

        <ChartPanel
          title="Customer Acquisition"
          value={String(analytics.summaryCards.customerAcquisitionTotal)}
          change={analytics.summaryCards.customerAcquisitionChange}
          range={range}
        >
          <div className="mt-6 flex h-[180px] items-end gap-3 rounded-[20px] border border-white/10 bg-[#0d0f17] p-4">
            {analytics.customerAcquisitionData.map((value, index) => (
              <div key={index} className="flex flex-1 justify-center">
                <div
                  className={[
                    "w-full max-w-[34px] rounded-t-[10px] bg-gradient-to-t from-[#1d4ed8] to-[#38bdf8]",
                    getHeightClass(value),
                  ].join(" ")}
                />
              </div>
            ))}
          </div>

          <LabelRow labels={analytics.customerAcquisitionLabels} />
        </ChartPanel>
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Product Performance"
          subtitle="Review top products, weak products, and payment behavior."
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {analytics.productPerformanceCards.map((card) => (
            <ProductCard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              positive={card.positive}
            />
          ))}
        </div>

        <ChartPanel
          title="Payment Method Usage"
          value={
            analytics.paymentMethodUsage?.mostUsedMethod ||
            analytics.summaryCards.paymentMethodTop
          }
          change={`${
            analytics.paymentMethodUsage?.mostUsedCount ??
            analytics.summaryCards.paymentMethodTopCount
          } orders`}
          range={range}
        >
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {(analytics.paymentMethodUsage?.paymentMethodData || []).map(
              (item) => (
                <div
                  key={item.label}
                  className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex h-[150px] items-end justify-center">
                    <div
                      className={[
                        "w-[54px] rounded-t-[14px] bg-gradient-to-t from-[#334155] to-[#d6c7ff]",
                        getHeightClass(item.value),
                      ].join(" ")}
                      title={`${item.count} orders`}
                    />
                  </div>

                  <div className="mt-4 text-center text-[14px] font-semibold text-white">
                    {item.label}
                  </div>

                  <div className="mt-1 text-center text-[12px] text-[#a7aec4]">
                    {item.count} orders
                  </div>
                </div>
              )
            )}
          </div>
        </ChartPanel>
      </section>
    </>
  );
}