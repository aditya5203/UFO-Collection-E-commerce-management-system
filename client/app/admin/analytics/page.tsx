"use client";

import * as React from "react";
import AdminPageGuard from "../_components/AdminPageGuard";

import AnalyticsCharts from "./_components/AnalyticsCharts";
import AnalyticsHeader from "./_components/AnalyticsHeader";
import AnalyticsMetricCards from "./_components/AnalyticsMetricCards";
import AnalyticsSections from "./_components/AnalyticsSections";
import ExportAnalyticsModal from "./_components/ExportAnalyticsModal";
import RangeTabs from "./_components/RangeTabs";
import { AlertBox, AnalyticsSkeleton } from "./_components/AnalyticsShared";
import {
  AnalyticsResponse,
  buildLinePath,
  fallbackData,
  normalizeAnalyticsData,
  RangeKey,
  safeJson,
  toInputDateValue,
} from "./_components/analyticsTypes";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080/api";

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

export default function AdminAnalyticsPage() {
  return (
    <AdminPageGuard permission="analyticsView">
      <AdminAnalyticsInner />
    </AdminPageGuard>
  );
}

function AdminAnalyticsInner() {
  const [range, setRange] = React.useState<RangeKey>("7days");
  const [analytics, setAnalytics] =
    React.useState<NonNullable<AnalyticsResponse["data"]>>(fallbackData);

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
          `${API_BASE}/admin/analytics?range=${selectedRange}`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }
        );

        if (res.status === 401 || res.status === 403) {
          window.location.href = "/admin/adminlogin";
          return;
        }

        const json = await safeJson<AnalyticsResponse>(res);

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to fetch analytics");
        }

        setAnalytics(normalizeAnalyticsData(json.data));
      } catch (err: any) {
        setAnalytics((prev) => prev || fallbackData);
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

      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new Error("Invalid date selected");
      }

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
        `${API_BASE}/admin/analytics?from=${encodeURIComponent(
          exportFrom
        )}&to=${encodeURIComponent(exportTo)}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );

      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/adminlogin";
        return;
      }

      const json = await safeJson<AnalyticsResponse>(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to export analytics");
      }

      const exportData = normalizeAnalyticsData(json.data);

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
          row
            .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
            .join(",")
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
          <AnalyticsHeader
            loading={loading}
            refreshing={refreshing}
            onExportOpen={() => setShowExportModal(true)}
            onRefresh={() => fetchAnalytics(range, true)}
          />

          {error ? (
            <AlertBox message={error} onClose={() => setError("")} />
          ) : null}

          <RangeTabs range={range} loading={loading} onChange={setRange} />

          {loading ? (
            <AnalyticsSkeleton />
          ) : (
            <>
              <AnalyticsMetricCards metrics={metrics} />

              <AnalyticsCharts
                analytics={analytics}
                range={range}
                salesTrendLabels={salesTrendLabels}
                trendPath={trendPath}
              />

              <AnalyticsSections analytics={analytics} range={range} />
            </>
          )}
        </div>
      </div>

      <ExportAnalyticsModal
        open={showExportModal}
        exporting={exporting}
        exportFrom={exportFrom}
        exportTo={exportTo}
        exportError={exportError}
        defaultTo={defaultTo}
        onClose={() => {
          if (!exporting) setShowExportModal(false);
        }}
        onExport={handleExport}
        setExportFrom={setExportFrom}
        setExportTo={setExportTo}
        setExportError={setExportError}
      />
    </>
  );
}