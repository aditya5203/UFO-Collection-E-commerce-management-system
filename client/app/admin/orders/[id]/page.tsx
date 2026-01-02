"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type PaymentStatus = "Paid" | "Pending" | "Failed";
type OrderStatus = "Pending" | "Shipped" | "Delivered" | "Cancelled";

function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;
  return `Rs. ${(safe / 100).toFixed(2)}`;
}

function formatDate(d: any) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

type TimelineStep = {
  label: string;
  date: string;
  status: "done" | "current" | "upcoming";
};

function Dot({ status }: { status: TimelineStep["status"] }) {
  const base =
    "h-6 w-6 rounded-full grid place-items-center border text-xs font-bold";

  if (status === "done") {
    return (
      <div className={`${base} border-slate-600 bg-slate-900/30 text-slate-100`}>
        ✓
      </div>
    );
  }

  if (status === "current") {
    return (
      <div className={`${base} border-sky-500 bg-sky-500/10 text-sky-200`}>
        •
      </div>
    );
  }

  return (
    <div className={`${base} border-slate-700 bg-transparent text-slate-600`}>
      •
    </div>
  );
}

function safeStr(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [order, setOrder] = React.useState<any>(null);
  const [error, setError] = React.useState("");

  const [paymentStatus, setPaymentStatus] =
    React.useState<PaymentStatus>("Pending");
  const [orderStatus, setOrderStatus] =
    React.useState<OrderStatus>("Pending");

  React.useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }

        const json = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          setError(json?.message || "Order not found");
          setOrder(null);
          return;
        }

        setOrder(json.data);
        setPaymentStatus(json.data?.paymentStatus || "Pending");
        setOrderStatus(json.data?.orderStatus || "Pending");
      } catch {
        setError("Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, router]);

  const saveChanges = async () => {
    if (!order?.id) return;

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE}/api/admin/orders/${order.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus,
          orderStatus,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        alert("Failed to save changes");
        return;
      }

      router.push("/admin/orders");
    } catch {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-6 text-slate-300">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <div className="text-slate-300">{error || "Order not found"}</div>
        <Link
          href="/admin/orders"
          className="inline-flex rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm text-slate-100"
        >
          Back
        </Link>
      </div>
    );
  }

  const placedOn = formatDate(order.createdAt);

  const timeline: TimelineStep[] = [
    { label: "Order Placed", date: placedOn, status: "done" },
    {
      label: "Order Shipped",
      date: "—",
      status:
        orderStatus === "Delivered"
          ? "done"
          : orderStatus === "Shipped"
          ? "current"
          : "upcoming",
    },
    {
      label: "Order Delivered",
      date: "—",
      status: orderStatus === "Delivered" ? "current" : "upcoming",
    },
  ];

  const addr = order.address || null;

  // ✅ Order address pretty view (based on your Order.model.ts addressSchema)
  const addrTitle = addr?.label ? safeStr(addr.label) : "Shipping Address";
  const addrName = safeStr(addr?.fullName);
  const addrPhone = safeStr(addr?.phone);
  const addrStreet = safeStr(addr?.street);
  const addrArea = safeStr(addr?.area);
  const addrCity = safeStr(addr?.city);

  const customerId = order?.customer?.id || order?.customer?._id || "";

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">
            Orders <span className="mx-2">/</span> {order.orderCode}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold">{order.orderCode}</h1>
          <p className="text-sm text-slate-400">Placed on {placedOn}</p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          {customerId ? (
            <Link
              href={`/admin/customers/${customerId}?tab=addresses`}
              className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/35"
            >
              View Customer Addresses
            </Link>
          ) : null}

          <Link
            href="/admin/orders"
            className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900/35"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Customer + Address block */}
      <div className="rounded-2xl border border-slate-700/40 bg-[#0A1324] grid md:grid-cols-3">
        <div className="p-5">
          <div className="text-xs text-slate-400">Name</div>
          <div className="text-sm text-slate-100">{order.customer?.name || "-"}</div>
        </div>

        <div className="p-5 border-l border-slate-700/40">
          <div className="text-xs text-slate-400">Email</div>
          <div className="text-sm text-slate-100">{order.customer?.email || "-"}</div>
        </div>

        <div className="p-5 border-l border-slate-700/40">
          <div className="text-xs text-slate-400">{addrTitle}</div>

          {!addr ? (
            <div className="text-sm text-slate-100">-</div>
          ) : (
            <div className="mt-1 space-y-1">
              <div className="text-sm font-semibold text-slate-100">
                {addrName || "-"}
              </div>
              {addrPhone ? (
                <div className="text-xs text-slate-300">{addrPhone}</div>
              ) : null}

              <div className="text-xs text-slate-300">
                {[addrStreet, addrArea, addrCity].filter(Boolean).join(", ") || "-"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-slate-700/40 bg-[#0A1324] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/30 text-slate-200">
            <tr>
              <th className="px-6 py-4 text-left">Product</th>
              <th className="px-6 py-4">Qty</th>
              <th className="px-6 py-4 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(order.items) && order.items.length ? (
              order.items.map((it: any, i: number) => (
                <tr key={i} className="border-t border-slate-700/40">
                  <td className="px-6 py-4">{it?.name || "-"}</td>
                  <td className="px-6 py-4 text-center">{it?.qty ?? "-"}</td>
                  <td className="px-6 py-4 text-right">
                    {formatNPR(Number(it?.pricePaisa || 0))}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-slate-700/40">
                <td colSpan={3} className="px-6 py-6 text-slate-400">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Timeline + Status */}
      <div className="rounded-2xl border border-slate-700/40 bg-[#0A1324] p-6 space-y-6">
        {timeline.map((t) => (
          <div key={t.label} className="flex gap-4">
            <Dot status={t.status} />
            <div>
              <div className="text-sm text-slate-100">{t.label}</div>
              <div className="text-xs text-slate-400">{t.date}</div>
            </div>
          </div>
        ))}

        {/* Payment Status */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Payment Status</div>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            className="w-full max-w-lg rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-3 text-sm text-slate-100"
          >
            <option className="bg-[#0A1324]">Paid</option>
            <option className="bg-[#0A1324]">Pending</option>
            <option className="bg-[#0A1324]">Failed</option>
          </select>
        </div>

        {/* Order Status */}
        <div>
          <div className="text-xs text-slate-400 mb-1">Order Status</div>
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
            className="w-full max-w-lg rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-3 text-sm text-slate-100"
          >
            <option className="bg-[#0A1324]">Pending</option>
            <option className="bg-[#0A1324]">Shipped</option>
            <option className="bg-[#0A1324]">Delivered</option>
            <option className="bg-[#0A1324]">Cancelled</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Link
            href="/admin/orders"
            className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm text-slate-100"
          >
            Back
          </Link>

          <button
            onClick={saveChanges}
            disabled={saving}
            className="rounded-xl bg-sky-500 px-6 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
