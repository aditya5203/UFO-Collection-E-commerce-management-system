// client/app/admin/analytics/page.tsx
"use client";

import * as React from "react";

type RangeKey = "today" | "7days" | "30days";

type MetricCard = {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
};

type CategoryItem = {
  label: string;
  value: number;
  revenueRs?: number;
};

type InfoCardData = {
  title: string;
  value: string;
  change: string;
};

type ProductCardData = {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
};

type PaymentMethodItem = {
  label: string;
  value: number;
  count: number;
};

type AnalyticsResponse = {
  success: boolean;
  data: {
    range: RangeKey;
    summaryCards: {
      salesTrendAmount: string;
      salesTrendChange: string;
      categoryRevenueAmount: string;
      categoryRevenueChange: string;
      customerAcquisitionTotal: number;
      customerAcquisitionChange: string;
      paymentMethodTop: string;
      paymentMethodTopCount: number;
    };
    metrics: MetricCard[];
    salesTrendData: number[];
    salesTrendLabels: string[];
    revenueCategoryData: CategoryItem[];
    customerBehaviorCards: InfoCardData[];
    customerAcquisitionData: number[];
    customerAcquisitionLabels: string[];
    productPerformanceCards: ProductCardData[];
    paymentMethodUsage: {
      paymentMethodData: PaymentMethodItem[];
      mostUsedMethod: string;
      mostUsedCount: number;
    };
  };
};

const rangeTabs: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7days", label: "Last 7 days" },
  { key: "30days", label: "Last 30 days" },
];

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const fallbackData: AnalyticsResponse["data"] = {
  range: "7days",
  summaryCards: {
    salesTrendAmount: "Rs. 0",
    salesTrendChange: "0%",
    categoryRevenueAmount: "Rs. 0",
    categoryRevenueChange: "0%",
    customerAcquisitionTotal: 0,
    customerAcquisitionChange: "0%",
    paymentMethodTop: "COD",
    paymentMethodTopCount: 0,
  },
  metrics: [
    { label: "Total Revenue", value: "Rs. 0", change: "0%", positive: true },
    {
      label: "Average Order Value",
      value: "Rs. 0",
      change: "0%",
      positive: true,
    },
    { label: "Conversion Rate", value: "0%", change: "0%", positive: true },
    { label: "Sales Trends", value: "0%", change: "0%", positive: true },
  ],
  salesTrendData: [0, 0, 0, 0, 0, 0, 0],
  salesTrendLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  revenueCategoryData: [],
  customerBehaviorCards: [
    { title: "New vs. Returning Customers", value: "0% / 0%", change: "0%" },
    { title: "Customer Lifetime Value", value: "Rs. 0", change: "0%" },
    {
      title: "Geographic Distribution",
      value: "No data",
      change: "0 regions",
    },
  ],
  customerAcquisitionData: [0, 0, 0, 0, 0, 0, 0],
  customerAcquisitionLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  productPerformanceCards: [
    {
      title: "Top Selling Products",
      value: "No sales yet",
      change: "0 sold",
      positive: true,
    },
    {
      title: "Least Selling Products",
      value: "No sales yet",
      change: "0 sold",
      positive: false,
    },
  ],
  paymentMethodUsage: {
    paymentMethodData: [
      { label: "COD", value: 0, count: 0 },
      { label: "Khalti", value: 0, count: 0 },
      { label: "eSewa", value: 0, count: 0 },
    ],
    mostUsedMethod: "COD",
    mostUsedCount: 0,
  },
};

function buildLinePath(
  values: number[],
  width: number,
  height: number,
  padding = 10
) {
  if (!values.length) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = padding + ((max - value) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
}

function isPositiveChange(value?: string) {
  return !value?.trim().startsWith("-");
}

function getRangeText(range: RangeKey) {
  if (range === "today") return "Today";
  if (range === "30days") return "Last 30 Days";
  return "Last 7 Days";
}

function toInputDateValue(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().split("T")[0];
}

function addMonthsSafe(dateString: string, months: number) {
  const d = new Date(dateString);
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return toInputDateValue(result);
}

function getWidthClass(value: number) {
  const safe = Math.min(Math.max(Number(value || 0), 0), 100);

  if (safe <= 5) return "w-[5%]";
  if (safe <= 10) return "w-[10%]";
  if (safe <= 20) return "w-[20%]";
  if (safe <= 30) return "w-[30%]";
  if (safe <= 40) return "w-[40%]";
  if (safe <= 50) return "w-[50%]";
  if (safe <= 60) return "w-[60%]";
  if (safe <= 70) return "w-[70%]";
  if (safe <= 80) return "w-[80%]";
  if (safe <= 90) return "w-[90%]";
  return "w-full";
}

function getHeightClass(value: number) {
  const safe = Math.min(Math.max(Number(value || 0), 0), 100);

  if (safe <= 4) return "h-[4%]";
  if (safe <= 10) return "h-[10%]";
  if (safe <= 20) return "h-[20%]";
  if (safe <= 30) return "h-[30%]";
  if (safe <= 40) return "h-[40%]";
  if (safe <= 50) return "h-[50%]";
  if (safe <= 60) return "h-[60%]";
  if (safe <= 70) return "h-[70%]";
  if (safe <= 80) return "h-[80%]";
  if (safe <= 90) return "h-[90%]";
  return "h-full";
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = React.useState<RangeKey>("7days");
  const [analytics, setAnalytics] =
    React.useState<AnalyticsResponse["data"]>(fallbackData);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState("");

  const [showExportModal, setShowExportModal] = React.useState(false);
  const today = React.useMemo(() => new Date(), []);
  const defaultTo = toInputDateValue(today);
  const defaultFrom = toInputDateValue(
    new Date(today.getFullYear(), today.getMonth() - 2, today.getDate())
  );

  const [exportFrom, setExportFrom] = React.useState(defaultFrom);
  const [exportTo, setExportTo] = React.useState(defaultTo);
  const [exportError, setExportError] = React.useState("");

  const fetchAnalytics = React.useCallback(
    async (selectedRange: RangeKey, silent = false) => {
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);

        setError("");

        const res = await fetch(
          `${getApiBase()}/admin/analytics?range=${selectedRange}`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }
        );

        const json: AnalyticsResponse = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error("Failed to fetch analytics");
        }

        setAnalytics(json.data);
      } catch (err: any) {
        setError(err?.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  const handleExport = React.useCallback(async () => {
    try {
      setExporting(true);
      setExportError("");

      if (!exportFrom || !exportTo) {
        throw new Error("Please select both From and To dates");
      }

      const fromDate = new Date(exportFrom);
      const toDate = new Date(exportTo);

      if (fromDate > toDate) {
        throw new Error("'From' date cannot be greater than 'To' date");
      }

      const diffDays = Math.floor(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > 92) {
        throw new Error("Date range cannot be more than 3 months");
      }

      const res = await fetch(
        `${getApiBase()}/admin/analytics?from=${encodeURIComponent(
          exportFrom
        )}&to=${encodeURIComponent(exportTo)}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );

      const json: AnalyticsResponse = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error("Failed to export analytics");
      }

      const exportData = json.data;

      const rows: string[][] = [
        ["Analytics Export"],
        ["From", exportFrom],
        ["To", exportTo],
        ["Exported At", new Date().toLocaleString()],
        [],
        ["Metrics"],
        ["Label", "Value", "Change", "Positive"],
        ...exportData.metrics.map((item) => [
          item.label,
          item.value,
          item.change,
          item.positive ? "Yes" : "No",
        ]),
        [],
        ["Sales Trend"],
        ["Label", "Value"],
        ...(exportData.salesTrendLabels || []).map((label, index) => [
          label,
          String(exportData.salesTrendData?.[index] ?? 0),
        ]),
        [],
        ["Revenue by Product Category"],
        ["Category", "Width %", "Revenue Rs"],
        ...(exportData.revenueCategoryData || []).map((item) => [
          item.label,
          String(item.value),
          String(item.revenueRs ?? 0),
        ]),
        [],
        ["Customer Behavior"],
        ["Title", "Value", "Change"],
        ...(exportData.customerBehaviorCards || []).map((item) => [
          item.title,
          item.value,
          item.change,
        ]),
        [],
        ["Customer Acquisition"],
        ["Label", "Value"],
        ...(exportData.customerAcquisitionLabels || []).map((label, index) => [
          label,
          String(exportData.customerAcquisitionData?.[index] ?? 0),
        ]),
        [],
        ["Product Performance"],
        ["Title", "Value", "Change", "Positive"],
        ...(exportData.productPerformanceCards || []).map((item) => [
          item.title,
          item.value,
          item.change,
          item.positive ? "Yes" : "No",
        ]),
        [],
        ["Payment Method Usage"],
        ["Method", "Height %", "Orders"],
        ...(exportData.paymentMethodUsage?.paymentMethodData || []).map(
          (item) => [item.label, String(item.value), String(item.count)]
        ),
      ];

      const csvContent = rows
        .map((row) =>
          row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `analytics-${exportFrom}-to-${exportTo}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (err: any) {
      setExportError(err?.message || "Failed to export analytics");
    } finally {
      setExporting(false);
    }
  }, [exportFrom, exportTo]);

  const metrics = analytics.metrics?.length
    ? analytics.metrics
    : fallbackData.metrics;

  const salesTrendValues = analytics.salesTrendData?.length
    ? analytics.salesTrendData
    : fallbackData.salesTrendData;

  const salesTrendLabels = analytics.salesTrendLabels?.length
    ? analytics.salesTrendLabels
    : fallbackData.salesTrendLabels;

  const trendPath = React.useMemo(
    () => buildLinePath(salesTrendValues, 560, 220, 14),
    [salesTrendValues]
  );

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_35%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Admin / Analytics
                </div>
                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Analytics Dashboard
                </h1>
                <p className="mt-2 max-w-[760px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Track sales performance, customer behavior, product insights,
                  and payment method usage with real-time store data.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  disabled={loading}
                  className={secondaryBtnClass}
                >
                  Export
                </button>

                <button
                  type="button"
                  onClick={() => fetchAnalytics(range, true)}
                  disabled={refreshing}
                  className={primaryBtnClass}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/15 px-4 py-3 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <section className={`${panelClass} p-2`}>
            <div className="grid grid-cols-3 gap-2">
              {rangeTabs.map((tab) => {
                const active = range === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRange(tab.key)}
                    disabled={loading}
                    className={[
                      "rounded-[18px] px-3 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] transition sm:text-[13px]",
                      active
                        ? "bg-white text-[#090a12]"
                        : "text-[#cbd5e1] hover:bg-white/10",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>

          {loading ? (
            <div
              className={`${panelClass} px-5 py-12 text-center text-[14px] text-[#a7aec4]`}
            >
              Loading analytics...
            </div>
          ) : (
            <>
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
                              {Number(item.revenueRs || 0).toLocaleString(
                                "en-US"
                              )}
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
                      <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-6 text-center text-[13px] text-[#a7aec4]">
                        No category revenue data found.
                      </div>
                    )}
                  </div>
                </ChartPanel>
              </section>

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
          )}
        </div>
      </div>

      {showExportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur">
          <div className={`${panelClass} w-full max-w-md p-5`}>
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-semibold text-white">
                Export Analytics
              </h3>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                aria-label="Close export modal"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[20px] text-[#a7aec4] hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
              Select a date range to export analytics data. Maximum allowed
              range is 3 months.
            </p>

            <div className="mt-5 space-y-4">
              <DateField
                label="From"
                value={exportFrom}
                max={exportTo || defaultTo}
                onChange={(nextFrom) => {
                  setExportFrom(nextFrom);

                  if (
                    exportTo &&
                    nextFrom &&
                    new Date(nextFrom) > new Date(exportTo)
                  ) {
                    setExportTo(nextFrom);
                  }
                }}
              />

              <DateField
                label="To"
                value={exportTo}
                min={exportFrom}
                max={
                  addMonthsSafe(exportFrom, 3) < defaultTo
                    ? addMonthsSafe(exportFrom, 3)
                    : defaultTo
                }
                onChange={setExportTo}
              />

              {exportError ? (
                <div className="rounded-[18px] border border-red-400/20 bg-red-500/15 px-4 py-3 text-[13px] text-red-200">
                  {exportError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className={primaryBtnClass}
                >
                  {exporting ? "Exporting..." : "Download CSV"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function LabelRow({ labels }: { labels: string[] }) {
  return (
    <div className="mt-3 flex gap-2 text-[11px] text-[#7f879f]">
      {labels.map((label, index) => (
        <span
          key={`${label}-${index}`}
          className="min-w-0 flex-1 truncate text-center"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
        Analytics
      </div>
      <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>
      <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">{subtitle}</p>
    </div>
  );
}

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

function ChartPanel({
  title,
  value,
  change,
  range,
  children,
}: {
  title: string;
  value: string;
  change: string;
  range: RangeKey;
  children: React.ReactNode;
}) {
  const positive = isPositiveChange(change);

  return (
    <div className={`${panelClass} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-semibold text-white">{title}</h3>
          <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-white">
            {value}
          </div>
          <div className="mt-1 text-[13px] text-[#a7aec4]">
            {getRangeText(range)}{" "}
            <span
              className={
                positive
                  ? "font-semibold text-emerald-300"
                  : "font-semibold text-orange-300"
              }
            >
              {change}
            </span>
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#cbd5e1]">
          {getRangeText(range)}
        </span>
      </div>

      {children}
    </div>
  );
}

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

function DateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const inputId = React.useId();

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
      >
        {label}
      </label>

      <input
        id={inputId}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="h-[48px] w-full rounded-full border border-white/10 bg-[#0d0f17] px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff]"
      />
    </div>
  );
}