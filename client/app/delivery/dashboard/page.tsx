"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

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
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconSrc: string;
}) {
  return (
    <div
      className={`${softPanelClass} group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>
          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 transition group-hover:bg-white/10">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
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
    <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section
          className={`${panelClass} relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                Delivery Panel
              </div>
              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                Delivery Dashboard
              </h1>
              <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                Manage assigned deliveries, update order status, and track your
                daily delivery workflow from one premium panel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/delivery/orders" className={secondaryBtnClass}>
                My Orders
              </Link>

              <Link href="/delivery/profile" className={secondaryBtnClass}>
                My Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Assigned"
            value={String(assignedCount)}
            hint="Ready to process"
            iconSrc="/images/admin/orders.png"
          />
          <StatCard
            label="Out for Delivery"
            value={String(outForDeliveryCount)}
            hint="Currently on the way"
            iconSrc="/images/admin/delivery.png"
          />
          <StatCard
            label="Delivered"
            value={String(deliveredCount)}
            hint="Completed orders"
            iconSrc="/images/admin/active.png"
          />
          <StatCard
            label="Failed / Returned"
            value={String(failedCount)}
            hint="Needs follow-up"
            iconSrc="/images/admin/cancel.png"
          />
        </section>

        {error ? (
          <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
            {error}
          </div>
        ) : null}

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

          <div className="overflow-x-auto">
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
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-center text-[13px] text-[#a7aec4]"
                    >
                      Loading delivery dashboard...
                    </td>
                  </tr>
                ) : recentOrders.length ? (
                  recentOrders.map((item) => {
                    const orderId = item.id || item._id || "";
                    const status =
                      safeStr(item.deliveryAssignment?.status) || "Assigned";

                    return (
                      <tr
                        key={orderId}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {item.orderCode || orderId}
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
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-center text-[13px] text-[#a7aec4]"
                    >
                      No assigned delivery orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <InfoCard title="Today’s Focus" eyebrow="Workflow">
            <div className="grid gap-3">
              <SmallItem text="Check newly assigned orders and confirm pickup." />
              <SmallItem text="Update status to Out for Delivery when you start the trip." />
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
    <section className={`${panelClass} p-5 sm:p-6`}>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          {eyebrow}
        </div>
        <div className="mt-1 text-[20px] font-semibold text-white">{title}</div>
      </div>

      {children}
    </section>
  );
}

function SmallItem({ text }: { text: string }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] leading-6 text-[#d1d5db]">
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