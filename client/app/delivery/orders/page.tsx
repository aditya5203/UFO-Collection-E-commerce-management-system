"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  DELIVERY_ENDPOINTS,
  DeliveryOrder,
  formatDateShort,
  formatNPR,
  getArea,
  getCity,
  getCustomerContact,
  getCustomerName,
  getDeliveryStatusTone,
  safeJson,
  safeStr,
} from "@/app/lib/delivery";

const panelClass =
  "rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const inputClass =
  "h-12 w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-sm font-medium text-white placeholder:text-[#7f879f] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10";

const STATUSES = [
  "All",
  "Assigned",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
  "Failed Delivery",
  "Returned",
];

function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getDeliveryStatusTone(String(children));

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export default function DeliveryOrdersPage() {
  const [rows, setRows] = React.useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [query, setQuery] = React.useState("");

  const loadOrders = React.useCallback(async (mode: "initial" | "refresh") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      setError("");

      const res = await fetch(DELIVERY_ENDPOINTS.orders, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setRows([]);
        setError((json as any)?.message || "Failed to load orders");
        return;
      }

      const data = Array.isArray((json as any)?.data)
        ? (json as any).data
        : [];

      setRows(data);
    } catch {
      setRows([]);
      setError("Network error while loading orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadOrders("initial");
  }, [loadOrders]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      All: rows.length,
    };

    for (const status of STATUSES) {
      if (status === "All") continue;

      counts[status] = rows.filter(
        (item) =>
          safeStr(item.deliveryAssignment?.status).toLowerCase() ===
          status.toLowerCase()
      ).length;
    }

    return counts;
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const search = query.trim().toLowerCase();

    return rows.filter((item) => {
      const status = safeStr(item.deliveryAssignment?.status);

      const matchesStatus =
        statusFilter === "All" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      if (!matchesStatus) return false;

      if (!search) return true;

      const orderId = safeStr(item.id || item._id || "");
      const searchable = [
        orderId,
        safeStr(item.orderCode),
        getCustomerName(item),
        getCustomerContact(item),
        getArea(item),
        getCity(item),
        status,
        formatNPR(item.totalPaisa, item.total),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [rows, statusFilter, query]);

  return (
    <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)]" />

      <div className="relative space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${panelClass} relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_34%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6 lg:p-7`}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#8b5cf6]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                Delivery Panel / Orders
              </div>

              <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] text-white sm:text-[38px]">
                My Delivery Orders
              </h1>

              <p className="mt-2 max-w-[650px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                View, search, filter, and manage all delivery orders assigned to
                you.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <MiniMetric label="Total" value={rows.length} />
                <MiniMetric
                  label="Active"
                  value={
                    (statusCounts["Assigned"] || 0) +
                    (statusCounts["Picked Up"] || 0) +
                    (statusCounts["Out for Delivery"] || 0)
                  }
                />
                <MiniMetric label="Delivered" value={statusCounts.Delivered || 0} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadOrders("refresh")}
                disabled={loading || refreshing}
                className={primaryBtnClass}
              >
                {refreshing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
                    Refreshing
                  </>
                ) : (
                  "Refresh"
                )}
              </button>

              <Link href="/delivery/dashboard" className={secondaryBtnClass}>
                Dashboard
              </Link>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order ID, customer, phone, city, area..."
              className={inputClass}
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className={secondaryBtnClass}
              >
                Clear Search
              </button>
            ) : null}
          </div>

          <div className="relative mt-5 flex gap-3 overflow-x-auto pb-1">
            {STATUSES.map((status) => {
              const active = statusFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={
                    active
                      ? "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90"
                      : `${secondaryBtnClass} shrink-0 gap-2`
                  }
                >
                  <span>{status}</span>
                  <span
                    className={
                      active
                        ? "rounded-full bg-[#090a12]/10 px-2 py-0.5 text-[11px]"
                        : "rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-[#d1d5db]"
                    }
                  >
                    {statusCounts[status] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] font-medium text-red-200"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className={`${panelClass} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                Orders
              </div>

              <div className="mt-1 text-[20px] font-semibold text-white">
                Assigned Delivery List
              </div>

              <div className="mt-1 text-[13px] text-[#a7aec4]">
                Showing {filteredRows.length} of {rows.length} orders
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[12px] font-semibold text-[#a7aec4]">
              Filter: <span className="text-white">{statusFilter}</span>
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1180px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                  <th className="px-5 py-4 font-medium">Order ID</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Address</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Total</th>
                  <th className="px-5 py-4 font-medium">Assigned</th>
                  <th className="px-5 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <TableSkeleton />
                ) : filteredRows.length ? (
                  filteredRows.map((item, index) => {
                    const orderId = item.id || item._id || "";
                    const status =
                      safeStr(item.deliveryAssignment?.status) || "Assigned";

                    return (
                      <motion.tr
                        key={orderId || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.025,
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {item.orderCode || orderId || "N/A"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-white">
                            {getCustomerName(item)}
                          </div>

                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            {getCustomerContact(item)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-white">{getArea(item)}</div>

                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            {getCity(item)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StatusPill>{status}</StatusPill>
                        </td>

                        <td className="px-5 py-4 font-semibold text-[#d6c7ff]">
                          {formatNPR(item.totalPaisa, item.total)}
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {formatDateShort(item.deliveryAssignment?.assignedAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/delivery/orders/${orderId}`}
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10"
                          >
                            Open
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <EmptyTable
                    colSpan={7}
                    title="No delivery orders found"
                    description={
                      query
                        ? "Try clearing your search or changing the selected status filter."
                        : "You do not have delivery orders for this status yet."
                    }
                  />
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-4 lg:hidden">
            {loading ? (
              <>
                <MobileSkeleton />
                <MobileSkeleton />
                <MobileSkeleton />
              </>
            ) : filteredRows.length ? (
              filteredRows.map((item, index) => {
                const orderId = item.id || item._id || "";
                const status =
                  safeStr(item.deliveryAssignment?.status) || "Assigned";

                return (
                  <motion.div
                    key={orderId || index}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.03,
                      duration: 0.35,
                      ease: "easeOut",
                    }}
                    className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f879f]">
                          Order ID
                        </div>

                        <div className="mt-1 font-semibold text-white">
                          {item.orderCode || orderId || "N/A"}
                        </div>
                      </div>

                      <StatusPill>{status}</StatusPill>
                    </div>

                    <div className="mt-4 grid gap-3 text-[13px]">
                      <MobileInfo
                        label="Customer"
                        value={getCustomerName(item)}
                        subValue={getCustomerContact(item)}
                      />

                      <MobileInfo
                        label="Address"
                        value={getArea(item)}
                        subValue={getCity(item)}
                      />

                      <MobileInfo
                        label="Total"
                        value={formatNPR(item.totalPaisa, item.total)}
                      />

                      <MobileInfo
                        label="Assigned"
                        value={formatDateShort(
                          item.deliveryAssignment?.assignedAt
                        )}
                      />
                    </div>

                    <Link
                      href={`/delivery/orders/${orderId}`}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                    >
                      Open Order
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-10 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-xl">
                  📦
                </div>

                <div className="mt-4 text-base font-semibold text-white">
                  No delivery orders found
                </div>

                <div className="mx-auto mt-2 max-w-[320px] text-[13px] leading-6 text-[#a7aec4]">
                  {query
                    ? "Try clearing your search or changing the selected status filter."
                    : "You do not have delivery orders for this status yet."}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2">
      <span className="text-[11px] uppercase tracking-[0.16em] text-[#8f98b3]">
        {label}
      </span>
      <span className="ml-2 text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-t border-[#26293a]">
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-5 py-4">
              <div className="h-4 w-full max-w-[150px] animate-pulse rounded-full bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyTable({
  colSpan,
  title,
  description,
}: {
  colSpan: number;
  title: string;
  description: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-xl">
          📦
        </div>

        <div className="mt-4 text-base font-semibold text-white">{title}</div>

        <div className="mx-auto mt-2 max-w-[420px] text-[13px] leading-6 text-[#a7aec4]">
          {description}
        </div>
      </td>
    </tr>
  );
}

function MobileSkeleton() {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex justify-between gap-4">
        <div className="h-5 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
      </div>

      <div className="mt-5 grid gap-3">
        <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function MobileInfo({
  label,
  value,
  subValue,
}: {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-[#0d0f17]/70 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f879f]">
        {label}
      </div>

      <div className="mt-1 font-semibold text-white">{value}</div>

      {subValue ? (
        <div className="mt-1 text-[12px] text-[#8f98b3]">{subValue}</div>
      ) : null}
    </div>
  );
}