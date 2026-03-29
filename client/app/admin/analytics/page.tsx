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
    { label: "Average Order Value", value: "Rs. 0", change: "0%", positive: true },
    { label: "Conversion Rate", value: "0%", change: "0%", positive: true },
    { label: "Sales Trends", value: "0%", change: "0%", positive: true },
  ],
  salesTrendData: [0, 0, 0, 0, 0, 0, 0],
  salesTrendLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  revenueCategoryData: [],
  customerBehaviorCards: [
    { title: "New vs. Returning Customers", value: "0% / 0%", change: "0%" },
    { title: "Customer Lifetime Value", value: "Rs. 0", change: "0%" },
    { title: "Geographic Distribution", value: "No data", change: "0 regions" },
  ],
  customerAcquisitionData: [0, 0, 0, 0, 0, 0, 0],
  customerAcquisitionLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  productPerformanceCards: [
    { title: "Top Selling Products", value: "No sales yet", change: "0 sold", positive: true },
    { title: "Least Selling Products", value: "No sales yet", change: "0 sold", positive: false },
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

function buildLinePath(values: number[], width: number, height: number, padding = 10) {
  if (!values.length) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1);

  const points = values.map((value, index) => {
    const x = padding + index * stepX;
    const y = padding + ((max - value) / range) * (height - padding * 2);
    return { x, y };
  });

  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
}

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
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

export default function AdminAnalyticsPage() {
  const [range, setRange] = React.useState<RangeKey>("7days");
  const [analytics, setAnalytics] = React.useState<AnalyticsResponse["data"]>(fallbackData);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState("");

  const [showExportModal, setShowExportModal] = React.useState(false);
  const today = React.useMemo(() => new Date(), []);
  const defaultTo = toInputDateValue(today);
  const defaultFrom = toInputDateValue(new Date(today.getFullYear(), today.getMonth() - 2, today.getDate()));

  const [exportFrom, setExportFrom] = React.useState(defaultFrom);
  const [exportTo, setExportTo] = React.useState(defaultTo);
  const [exportError, setExportError] = React.useState("");

  const fetchAnalytics = React.useCallback(async (selectedRange: RangeKey, silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      const res = await fetch(`${getApiBase()}/admin/analytics?range=${selectedRange}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

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
  }, []);

  React.useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  const handleOpenExport = React.useCallback(() => {
    setExportError("");
    setShowExportModal(true);
  }, []);

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

      const diffMs = toDate.getTime() - fromDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 92) {
        throw new Error("Date range cannot be more than 3 months");
      }

      const res = await fetch(
        `${getApiBase()}/admin/analytics?from=${encodeURIComponent(exportFrom)}&to=${encodeURIComponent(exportTo)}`,
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
        ...(exportData.paymentMethodUsage?.paymentMethodData || []).map((item) => [
          item.label,
          String(item.value),
          String(item.count),
        ]),
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

  const metrics = analytics.metrics?.length ? analytics.metrics : fallbackData.metrics;
  const salesTrendValues =
    analytics.salesTrendData?.length ? analytics.salesTrendData : fallbackData.salesTrendData;
  const salesTrendLabels =
    analytics.salesTrendLabels?.length ? analytics.salesTrendLabels : fallbackData.salesTrendLabels;
  const trendPath = React.useMemo(
    () => buildLinePath(salesTrendValues, 560, 220, 14),
    [salesTrendValues]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-white">Analytics Dashboard</h1>
            <p className="mt-1 text-[13px] text-[#9ca3af]">
              Comprehensive data visualizations and key performance indicators for store
              insights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenExport}
              disabled={loading}
              className="rounded-[12px] bg-[#334155] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#3f4d63] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Export
            </button>

            <button
              type="button"
              onClick={() => fetchAnalytics(range, true)}
              disabled={refreshing}
              className="rounded-[12px] bg-[#2563eb] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-[14px] border border-[#7f1d1d] bg-[#450a0a] px-4 py-3 text-[13px] text-[#fecaca]">
            {error}
          </div>
        ) : null}

        <section className="rounded-[14px] bg-[#23374d] p-1">
          <div className="grid grid-cols-3 gap-1">
            {rangeTabs.map((tab) => {
              const active = range === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRange(tab.key)}
                  disabled={loading}
                  className={[
                    "rounded-[10px] px-3 py-3 text-[12px] font-medium transition sm:text-[13px]",
                    active ? "bg-[#020617] text-white" : "text-[#cbd5e1] hover:bg-[#1b2b3d]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {loading ? (
          <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-5 py-10 text-center text-[14px] text-[#9ca3af]">
            Loading analytics...
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-[18px] font-semibold text-white">Sales Performance</h2>

              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((item) => (
                  <StatCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    change={item.change}
                    positive={item.positive}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2">
                <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
                  <div className="text-[16px] font-medium text-white">Sales Trends</div>
                  <div className="mt-2 text-[18px] font-semibold text-white">
                    {analytics.summaryCards.salesTrendAmount}
                  </div>
                  <div className="mt-1 text-[13px] text-[#9ca3af]">
                    {getRangeText(range)}{" "}
                    <span
                      className={[
                        "font-medium",
                        isPositiveChange(analytics.summaryCards.salesTrendChange)
                          ? "text-[#00e29a]"
                          : "text-[#fb923c]",
                      ].join(" ")}
                    >
                      {analytics.summaryCards.salesTrendChange}
                    </span>
                  </div>

                  <div className="relative mt-4 h-[220px] overflow-hidden rounded-[12px]">
                    <svg viewBox="0 0 560 220" className="h-full w-full" preserveAspectRatio="none">
                      <path
                        d={trendPath}
                        fill="none"
                        stroke="rgba(167,199,239,0.95)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div
                    className="mt-2 grid gap-2 text-[11px] text-[#9ca3af]"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(salesTrendLabels.length, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {salesTrendLabels.map((label, index) => (
                      <span key={`${label}-${index}`} className="truncate text-center">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
                  <div className="text-[16px] font-medium text-white">Revenue by Product Category</div>
                  <div className="mt-2 text-[18px] font-semibold text-white">
                    {analytics.summaryCards.categoryRevenueAmount}
                  </div>
                  <div className="mt-1 text-[13px] text-[#9ca3af]">
                    {getRangeText(range)}{" "}
                    <span
                      className={[
                        "font-medium",
                        isPositiveChange(analytics.summaryCards.categoryRevenueChange)
                          ? "text-[#00e29a]"
                          : "text-[#fb923c]",
                      ].join(" ")}
                    >
                      {analytics.summaryCards.categoryRevenueChange}
                    </span>
                  </div>

                  <div className="mt-6 space-y-5">
                    {analytics.revenueCategoryData.length > 0 ? (
                      analytics.revenueCategoryData.map((item) => (
                        <div
                          key={item.label}
                          className="grid grid-cols-[100px_1fr] items-center gap-4 sm:grid-cols-[110px_1fr]"
                        >
                          <span className="text-[12px] text-white sm:text-[13px]">
                            {item.label}
                          </span>
                          <div className="h-[18px] rounded-[6px] bg-transparent sm:h-[22px]">
                            <div
                              className="h-full rounded-[6px] bg-[#475569]"
                              style={{ width: `${item.value}%` }}
                              title={
                                typeof item.revenueRs === "number"
                                  ? `Rs. ${item.revenueRs.toLocaleString("en-US")}`
                                  : item.label
                              }
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[13px] text-[#9ca3af]">No category revenue data found.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-[18px] font-semibold text-white">Customer Behavior</h2>

              <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
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

              <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
                <div className="text-[16px] font-medium text-white">Customer Acquisition</div>
                <div className="mt-2 text-[18px] font-semibold text-white">
                  {analytics.summaryCards.customerAcquisitionTotal}
                </div>
                <div className="mt-1 text-[13px] text-[#9ca3af]">
                  {getRangeText(range)}{" "}
                  <span
                    className={[
                      "font-medium",
                      isPositiveChange(analytics.summaryCards.customerAcquisitionChange)
                        ? "text-[#00e29a]"
                        : "text-[#fb923c]",
                    ].join(" ")}
                  >
                    {analytics.summaryCards.customerAcquisitionChange}
                  </span>
                </div>

                <div className="mt-6 flex h-[150px] items-end gap-[12px] sm:gap-[16px]">
                  {analytics.customerAcquisitionData.map((value, index) => (
                    <div key={index} className="flex flex-1 justify-center">
                      <div
                        className="w-[22px] rounded-[2px] bg-[#334155] sm:w-[28px]"
                        style={{ height: `${value}%` }}
                      />
                    </div>
                  ))}
                </div>

                <div
                  className="mt-4 grid gap-2 text-[11px] text-[#9ca3af]"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(analytics.customerAcquisitionLabels.length, 1)}, minmax(0, 1fr))`,
                  }}
                >
                  {analytics.customerAcquisitionLabels.map((label, index) => (
                    <span key={`${label}-${index}`} className="truncate text-center">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-[18px] font-semibold text-white">Product Performance</h2>

              <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2">
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

              <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
                <div className="text-[16px] font-medium text-white">Payment Method Usage</div>
                <div className="mt-2 text-[18px] font-semibold text-white">
                  {analytics.paymentMethodUsage?.mostUsedMethod || analytics.summaryCards.paymentMethodTop}
                </div>
                <div className="mt-1 text-[13px] text-[#9ca3af]">
                  Most used by customers{" "}
                  <span className="font-medium text-[#00e29a]">
                    {analytics.paymentMethodUsage?.mostUsedCount ??
                      analytics.summaryCards.paymentMethodTopCount}{" "}
                    orders
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {(analytics.paymentMethodUsage?.paymentMethodData || []).map((item) => (
                    <div key={item.label} className="flex flex-col items-center">
                      <div className="flex h-[140px] w-full max-w-[70px] items-end">
                        <div
                          className="w-full rounded-[2px] bg-[#334155]"
                          style={{ height: `${item.value}%` }}
                          title={`${item.count} orders`}
                        />
                      </div>
                      <div className="mt-3 text-center text-[12px] text-[#cbd5e1]">{item.label}</div>
                      <div className="mt-1 text-[11px] text-[#94a3b8]">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {showExportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-[18px] border border-[#1f2937] bg-[#020617] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-white">Export Analytics</h3>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-[20px] leading-none text-[#94a3b8] hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="mt-2 text-[13px] text-[#9ca3af]">
              Select a date range to export analytics data. Maximum allowed range is 3 months.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-white">From</label>
                <input
                  type="date"
                  value={exportFrom}
                  max={exportTo || defaultTo}
                  onChange={(e) => {
                    const nextFrom = e.target.value;
                    setExportFrom(nextFrom);
                    if (exportTo && nextFrom && new Date(nextFrom) > new Date(exportTo)) {
                      setExportTo(nextFrom);
                    }
                  }}
                  className="w-full rounded-[12px] border border-[#334155] bg-[#0f172a] px-3 py-2 text-[13px] text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-white">To</label>
                <input
                  type="date"
                  value={exportTo}
                  min={exportFrom}
                  max={addMonthsSafe(exportFrom, 3) < defaultTo ? addMonthsSafe(exportFrom, 3) : defaultTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="w-full rounded-[12px] border border-[#334155] bg-[#0f172a] px-3 py-2 text-[13px] text-white outline-none"
                />
              </div>

              {exportError ? (
                <div className="rounded-[12px] border border-[#7f1d1d] bg-[#450a0a] px-3 py-2 text-[12px] text-[#fecaca]">
                  {exportError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="rounded-[12px] bg-[#1e293b] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#334155]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="rounded-[12px] bg-[#2563eb] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
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
    <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[16px] py-[14px]">
      <div className="text-[13px] text-white">{label}</div>
      <div className="mt-4 text-[18px] font-semibold text-[#f9fafb]">{value}</div>
      <div
        className={[
          "mt-3 text-[13px] font-medium",
          positive ? "text-[#00e29a]" : "text-[#fb923c]",
        ].join(" ")}
      >
        {change}
      </div>
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
    <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[16px] py-[14px]">
      <div className="text-[14px] text-white">{title}</div>
      <div className="mt-3 text-[18px] font-semibold text-white">{value}</div>
      <div
        className={[
          "mt-3 text-[13px] font-medium",
          positive ? "text-[#00e29a]" : "text-[#fb923c]",
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
    <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[16px] py-[14px]">
      <div className="text-[14px] text-white">{title}</div>
      <div className="mt-3 text-[18px] font-semibold text-white">{value}</div>
      <div
        className={[
          "mt-3 text-[13px] font-medium",
          positive ? "text-[#00e29a]" : "text-[#fb923c]",
        ].join(" ")}
      >
        {change}
      </div>
    </div>
  );
}