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

        const data = Array.isArray((json as any)?.data) ? (json as any).data : [];

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
    <div className="space-y-6">
      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="space-y-2">
          <div className="text-[12px] text-[#9ca3af]">Delivery Panel / Orders</div>
          <h1 className="text-[22px] font-semibold text-white">
            My Delivery Orders
          </h1>
          <p className="text-[13px] text-[#9ca3af]">
            View and manage all orders assigned to you.
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
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                statusFilter === status
                  ? "bg-[#2563eb] text-white"
                  : "border border-[#111827] bg-[#020617] text-white hover:bg-[#0b1220]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-[13px]">
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
              ) : filteredRows.length ? (
                filteredRows.map((item) => {
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
                    No delivery orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}