"use client";

import Link from "next/link";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    Pending: "bg-yellow-500/15 text-yellow-200 border-yellow-500/30",
    Confirmed: "bg-blue-500/15 text-blue-200 border-blue-500/30",
    Processing: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
    Shipped: "bg-purple-500/15 text-purple-200 border-purple-500/30",
    Transit: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
    "Out for Delivery": "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
    Delivered: "bg-green-500/15 text-green-200 border-green-500/30",
    Cancelled: "bg-red-500/15 text-red-200 border-red-500/30",
    Returned: "bg-orange-500/15 text-orange-200 border-orange-500/30",
    Refunded: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
        map[status] || map.Pending
      }`}
    >
      {status}
    </span>
  );
}

function DeliveryStatusBadge({ status }: { status?: string }) {
  const value = String(status || "").trim();
  if (!value) return null;

  const map: Record<string, string> = {
    Assigned: "bg-slate-500/15 text-slate-200 border-slate-500/30",
    "Picked Up": "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
    "Out for Delivery": "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
    Delivered: "bg-green-500/15 text-green-200 border-green-500/30",
    "Failed Delivery": "bg-orange-500/15 text-orange-200 border-orange-500/30",
    Returned: "bg-red-500/15 text-red-200 border-red-500/30",
    "Returned to Store":
      "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
        map[value] || "bg-slate-500/15 text-slate-200 border-slate-500/30"
      }`}
    >
      {value}
    </span>
  );
}

export { StatusBadge, DeliveryStatusBadge };

export default function OrderHero({
  order,
  loading,
  error,
  trackingNumber,
  invoiceLoading,
  copyOrderId,
  downloadInvoice,
}: {
  order: any;
  loading: boolean;
  error: string | null;
  trackingNumber: string;
  invoiceLoading: boolean;
  copyOrderId: () => void;
  downloadInvoice: () => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="relative px-5 py-8 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,199,255,0.14),transparent_38%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Customer Order
            </div>

            <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[48px]">
              Order Details
            </h1>

            <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[#a7aec4]">
              Track your order, view delivery progress, download invoice,
              request return/refund, request exchange, and submit refund details
              when needed.
            </p>
          </div>

          {!loading && !error && order ? (
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />

              {order.deliveryAssignment?.status ? (
                <DeliveryStatusBadge status={order.deliveryAssignment.status} />
              ) : null}

              <button type="button" onClick={copyOrderId} className={secondaryBtnClass}>
                Copy Order ID
              </button>

              <button
                type="button"
                onClick={downloadInvoice}
                disabled={invoiceLoading}
                className={secondaryBtnClass}
              >
                {invoiceLoading ? "Downloading..." : "Download Invoice"}
              </button>
            </div>
          ) : null}
        </div>

        {!loading && !error && order ? (
          <div className="relative mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] text-[#a7aec4]">
              Order ID:{" "}
              <span className="font-semibold text-white">{order.orderId}</span>
            </span>

            <Link
              href={`/order-tracking?code=${encodeURIComponent(trackingNumber)}&from=details`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
            >
              Track Order
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}