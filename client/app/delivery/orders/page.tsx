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

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

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

export default function DeliveryOrdersPage() {
  const [rows, setRows] = React.useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(DELIVERY_ENDPOINTS.orders, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          if (!mounted) return;
          setRows([]);
          setError((json as any)?.message || "Failed to load orders");
          return;
        }

        const data = Array.isArray((json as any)?.data)
          ? (json as any).data
          : [];

        if (!mounted) return;
        setRows(data);
      } catch {
        if (!mounted) return;
        setRows([]);
        setError("Network error while loading orders");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = React.useMemo(() => {
    if (statusFilter === "All") return rows;
    return rows.filter(
      (item) =>
        safeStr(item.deliveryAssignment?.status).toLowerCase() ===
        statusFilter.toLowerCase()
    );
  }, [rows, statusFilter]);

  return (
    <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section
          className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
              Delivery Panel / Orders
            </div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
              My Delivery Orders
            </h1>
            <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
              View, filter, and manage all delivery orders assigned to you.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              "All",
              "Assigned",
              "Picked Up",
              "Out for Delivery",
              "Delivered",
              "Failed Delivery",
              "Returned",
            ].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={
                  statusFilter === status
                    ? "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90"
                    : secondaryBtnClass
                }
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
            {error}
          </div>
        ) : null}

        <section className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
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

          <div className="overflow-x-auto">
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
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-center text-[13px] text-[#a7aec4]"
                    >
                      Loading delivery orders...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((item) => {
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
                      No delivery orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}