"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  isDeliveryBlockedByOrderStatus,
  normalizeOrderStatus,
  safeJson,
  safeStr,
} from "@/app/lib/delivery";

const panelClass =
  "rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const softPanelClass =
  "rounded-[22px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

function getDisplayStatus(item: DeliveryOrder) {
  const deliveryStatus = safeStr(item.deliveryAssignment?.status) || "Assigned";
  const orderStatus = normalizeOrderStatus(item.orderStatus);
  const blocked = isDeliveryBlockedByOrderStatus(item);

  return blocked ? orderStatus : deliveryStatus;
}

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

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
  );
}

function StatCard({
  label,
  value,
  hint,
  iconSrc,
  index,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconSrc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
      className={`${softPanelClass} group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#8b5cf6]/10 blur-2xl transition group-hover:bg-[#8b5cf6]/20" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-white">
            {value}
          </div>

          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 transition group-hover:scale-105 group-hover:bg-white/10">
          <Image src={iconSrc} alt={label} width={24} height={24} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DeliveryDashboardPage() {
  const [rows, setRows] = React.useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadDashboard = React.useCallback(
    async (mode: "initial" | "refresh") => {
      try {
        if (mode === "initial") setLoading(true);
        if (mode === "refresh") setRefreshing(true);

        setError("");

        let res = await fetch(DELIVERY_ENDPOINTS.dashboard, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        let json = await safeJson(res);

        if (!res.ok) {
          res = await fetch(DELIVERY_ENDPOINTS.orders, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });

          json = await safeJson(res);
        }

        if (!res.ok) {
          setRows([]);
          setError((json as any)?.message || "Failed to load dashboard");
          return;
        }

        const possibleData =
          (json as any)?.data?.orders ??
          (json as any)?.data?.rows ??
          (json as any)?.orders ??
          (json as any)?.rows ??
          (json as any)?.data;

        const data = Array.isArray(possibleData) ? possibleData : [];
        setRows(data);
      } catch {
        setRows([]);
        setError("Network error while loading dashboard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await loadDashboard("initial");
    };

    run();

    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  const assignedCount = rows.filter((item) => {
    const displayStatus = getDisplayStatus(item).toLowerCase();
    return displayStatus === "assigned" || displayStatus === "picked up";
  }).length;

  const outForDeliveryCount = rows.filter(
    (item) => getDisplayStatus(item).toLowerCase() === "out for delivery",
  ).length;

  const deliveredCount = rows.filter(
    (item) => getDisplayStatus(item).toLowerCase() === "delivered",
  ).length;

  const failedCount = rows.filter((item) => {
    const displayStatus = getDisplayStatus(item).toLowerCase();

    return (
      displayStatus === "failed delivery" ||
      displayStatus === "returned" ||
      displayStatus === "cancelled" ||
      displayStatus === "refunded"
    );
  }).length;

  const blockedCount = rows.filter((item) =>
    isDeliveryBlockedByOrderStatus(item),
  ).length;

  const activeCount = assignedCount + outForDeliveryCount;
  const totalCount = rows.length;
  const recentOrders = rows.slice(0, 5);

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

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                Delivery Panel
              </div>

              <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] text-white sm:text-[38px]">
                Delivery Dashboard
              </h1>

              <p className="mt-2 max-w-[650px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                Manage assigned deliveries, update order status, and track your
                daily delivery workflow from one premium panel.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <MiniMetric label="Total Orders" value={totalCount} />
                <MiniMetric label="Active Tasks" value={activeCount} />
                <MiniMetric label="Completed" value={deliveredCount} />
                <MiniMetric label="Blocked" value={blockedCount} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadDashboard("refresh")}
                disabled={refreshing || loading}
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

              <Link href="/delivery/orders" className={secondaryBtnClass}>
                My Orders
              </Link>

              <Link href="/delivery/profile" className={secondaryBtnClass}>
                My Profile
              </Link>
            </div>
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            index={0}
            label="Assigned"
            value={String(assignedCount)}
            hint="Ready to process"
            iconSrc="/images/admin/orders.png"
          />

          <StatCard
            index={1}
            label="Out for Delivery"
            value={String(outForDeliveryCount)}
            hint="Currently on the way"
            iconSrc="/images/admin/delivery.png"
          />

          <StatCard
            index={2}
            label="Delivered"
            value={String(deliveredCount)}
            hint="Completed orders"
            iconSrc="/images/admin/active.png"
          />

          <StatCard
            index={3}
            label="Failed / Blocked"
            value={String(failedCount)}
            hint="Failed, returned, cancelled, refunded"
            iconSrc="/images/admin/cancel.png"
          />
        </section>

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
                Recent Assigned Orders
              </div>

              <div className="mt-1 text-[13px] text-[#a7aec4]">
                Quick overview of your latest delivery tasks
              </div>
            </div>

            <Link href="/delivery/orders" className={secondaryBtnClass}>
              View All
            </Link>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px] border-collapse text-[13px]">
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
                ) : recentOrders.length ? (
                  recentOrders.map((item, index) => {
                    const orderId = item.id || item._id || "";
                    const status = getDisplayStatus(item);
                    const blocked = isDeliveryBlockedByOrderStatus(item);

                    return (
                      <motion.tr
                        key={orderId || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.04,
                          duration: 0.35,
                          ease: "easeOut",
                        }}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {item.orderCode || orderId || "N/A"}
                          </div>

                          {blocked ? (
                            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300">
                              Delivery blocked
                            </div>
                          ) : null}
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
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-[13px] text-[#a7aec4]"
                    >
                      No assigned delivery orders found.
                    </td>
                  </tr>
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
            ) : recentOrders.length ? (
              recentOrders.map((item, index) => {
                const orderId = item.id || item._id || "";
                const status = getDisplayStatus(item);
                const blocked = isDeliveryBlockedByOrderStatus(item);

                return (
                  <motion.div
                    key={orderId || index}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.04,
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

                        {blocked ? (
                          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300">
                            Delivery blocked
                          </div>
                        ) : null}
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
                          item.deliveryAssignment?.assignedAt,
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
              <div className="rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-8 text-center text-[13px] text-[#a7aec4]">
                No assigned delivery orders found.
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <InfoCard title="Today’s Focus" eyebrow="Workflow">
            <div className="grid gap-3">
              <SmallItem text="Check newly assigned orders and confirm pickup." />
              <SmallItem text="Update status to Out for Delivery when you start the trip." />
              <SmallItem text="Do not continue delivery for cancelled, returned, or refunded orders." />
              <SmallItem text="Mark failed orders clearly with the reason in the delivery note." />
            </div>
          </InfoCard>

          <InfoCard title="Quick Links" eyebrow="Actions">
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickLink href="/delivery/orders" label="My Delivery Orders" />
              <QuickLink href="/delivery/profile" label="Delivery Profile" />
            </div>
          </InfoCard>
        </div>
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
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-t border-[#26293a]">
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-5 py-4">
              <div className="h-4 w-full max-w-[140px] animate-pulse rounded-full bg-white/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
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

function InfoCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`${panelClass} p-5 sm:p-6`}
    >
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          {eyebrow}
        </div>

        <div className="mt-1 text-[20px] font-semibold text-white">{title}</div>
      </div>

      {children}
    </motion.section>
  );
}

function SmallItem({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] leading-6 text-[#d1d5db] transition hover:bg-white/[0.055]">
      {text}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-[16px] border border-white/10 bg-white/[0.03] p-4 text-[13px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
    >
      {label}
    </Link>
  );
}