"use client";

import * as React from "react";
import Link from "next/link";
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

function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getDeliveryStatusTone(String(children));
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-[6px] rounded-[14px] border border-[#111827] bg-[#020617] px-[16px] py-[14px]">
      <div className="text-[12px] text-[#9ca3af]">{label}</div>
      <div className="text-[20px] font-semibold text-[#f9fafb]">{value}</div>
      {hint ? <div className="text-[12px] text-[#6b7280]">{hint}</div> : null}
    </div>
  );
}

export default function DeliveryDashboardPage() {
  const [rows, setRows] = React.useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
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
          if (!mounted) return;
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

        if (!mounted) return;
        setRows(data);
      } catch {
        if (!mounted) return;
        setRows([]);
        setError("Network error while loading dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const assignedCount = rows.filter((item) => {
    const s = safeStr(item.deliveryAssignment?.status).toLowerCase();
    return s === "assigned" || s === "picked up";
  }).length;

  const outForDeliveryCount = rows.filter(
    (item) =>
      safeStr(item.deliveryAssignment?.status).toLowerCase() ===
      "out for delivery"
  ).length;

  const deliveredCount = rows.filter(
    (item) =>
      safeStr(item.deliveryAssignment?.status).toLowerCase() === "delivered"
  ).length;

  const failedCount = rows.filter((item) => {
    const s = safeStr(item.deliveryAssignment?.status).toLowerCase();
    return s === "failed delivery" || s === "returned";
  }).length;

  const recentOrders = rows.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="text-[12px] text-[#9ca3af]">Delivery Panel</div>
            <h1 className="text-[22px] font-semibold text-white">
              Delivery Dashboard
            </h1>
            <p className="text-[13px] text-[#9ca3af]">
              Manage assigned deliveries, update status, and track daily work.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/delivery/orders"
              className="rounded-lg border border-[#111827] bg-[#020617] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0b1220]"
            >
              My Orders
            </Link>

            <Link
              href="/delivery/profile"
              className="rounded-lg border border-[#111827] bg-[#020617] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0b1220]"
            >
              My Profile
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned"
          value={String(assignedCount)}
          hint="Ready to process"
        />
        <StatCard
          label="Out for Delivery"
          value={String(outForDeliveryCount)}
          hint="Currently on the way"
        />
        <StatCard
          label="Delivered"
          value={String(deliveredCount)}
          hint="Completed orders"
        />
        <StatCard
          label="Failed / Returned"
          value={String(failedCount)}
          hint="Needs follow-up"
        />
      </section>

      {error ? (
        <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[16px] font-medium text-white">
              Recent Assigned Orders
            </div>
            <div className="text-[12px] text-[#9ca3af]">
              Quick overview of your latest delivery tasks
            </div>
          </div>

          <Link
            href="/delivery/orders"
            className="rounded-lg border border-[#111827] bg-[#020617] px-4 py-2 text-center text-[13px] font-medium text-white hover:bg-[#0b1220]"
          >
            View All
          </Link>
        </div>

        <div className="mt-[10px] overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#111827] text-left text-[12px] text-[#9ca3af]">
                <th className="px-[12px] py-[10px]">Order ID</th>
                <th className="px-[12px] py-[10px]">Customer</th>
                <th className="px-[12px] py-[10px]">Address</th>
                <th className="px-[12px] py-[10px]">Status</th>
                <th className="px-[12px] py-[10px]">Total</th>
                <th className="px-[12px] py-[10px]">Assigned</th>
                <th className="px-[12px] py-[10px] text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-[12px] py-[18px] text-center text-[13px] text-[#9ca3af]"
                  >
                    Loading...
                  </td>
                </tr>
              ) : recentOrders.length ? (
                recentOrders.map((item) => {
                  const orderId = item.id || item._id || "";
                  const status =
                    safeStr(item.deliveryAssignment?.status) || "Assigned";

                  return (
                    <tr key={orderId} className="border-t border-[#111827]">
                      <td className="px-[12px] py-[12px] text-white">
                        {item.orderCode || orderId}
                      </td>

                      <td className="px-[12px] py-[12px]">
                        <div className="space-y-1">
                          <div className="font-medium text-white">
                            {getCustomerName(item)}
                          </div>
                          <div className="text-[#9ca3af]">
                            {getCustomerContact(item)}
                          </div>
                        </div>
                      </td>

                      <td className="px-[12px] py-[12px]">
                        <div className="space-y-1">
                          <div className="text-white">{getArea(item)}</div>
                          <div className="text-[#9ca3af]">{getCity(item)}</div>
                        </div>
                      </td>

                      <td className="px-[12px] py-[12px]">
                        <StatusPill>{status}</StatusPill>
                      </td>

                      <td className="px-[12px] py-[12px] text-white">
                        {formatNPR(item.totalPaisa, item.total)}
                      </td>

                      <td className="px-[12px] py-[12px] text-[#9ca3af]">
                        {formatDateShort(item.deliveryAssignment?.assignedAt)}
                      </td>

                      <td className="px-[12px] py-[12px] text-right">
                        <Link
                          href={`/delivery/orders/${orderId}`}
                          className="text-[#60a5fa] hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-[12px] py-[18px] text-center text-[13px] text-[#9ca3af]"
                  >
                    No assigned delivery orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-[18px] xl:grid-cols-2">
        <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
          <div className="text-[16px] font-medium text-white">Today’s Focus</div>
          <div className="mt-1 text-[12px] text-[#9ca3af]">
            Prioritize active deliveries before marking them completed.
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-4 text-[13px] text-[#d1d5db]">
              Check newly assigned orders and confirm pickup.
            </div>
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-4 text-[13px] text-[#d1d5db]">
              Update status to{" "}
              <span className="font-semibold text-white">
                Out for Delivery
              </span>{" "}
              when you start the trip.
            </div>
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-4 text-[13px] text-[#d1d5db]">
              Mark failed orders clearly with the reason in the delivery note.
            </div>
          </div>
        </section>

        <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
          <div className="text-[16px] font-medium text-white">Quick Links</div>
          <div className="mt-1 text-[12px] text-[#9ca3af]">
            Open common delivery actions faster.
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/delivery/orders"
              className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-4 text-[13px] font-medium text-white transition hover:bg-[#111827]"
            >
              My Delivery Orders
            </Link>

            <Link
              href="/delivery/profile"
              className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-4 text-[13px] font-medium text-white transition hover:bg-[#111827]"
            >
              Delivery Profile
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}