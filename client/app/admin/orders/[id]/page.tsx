// client/app/admin/orders/[id]/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminPageGuard from "../../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../../_components/adminPermissions";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type PaymentStatus = "Paid" | "Pending" | "Failed";
type OrderStatus = "Pending" | "Shipped" | "Delivered" | "Cancelled";

type TimelineStep = {
  label: string;
  date: string;
  status: "done" | "current" | "upcoming";
};

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

function Dot({ status }: { status: TimelineStep["status"] }) {
  const base =
    "grid h-6 w-6 place-items-center rounded-full border text-xs font-bold";

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

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
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

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] = React.useState<AdminPermissions | null>(
    null
  );

  const canUpdate = hasPermission(role, permissions, "orderUpdate");

  React.useEffect(() => {
    let mounted = true;

    const loadAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const body = (await safeJson(res)) as AdminSettingsResponse;
        const nextRole = (body?.profile?.role || "admin") as
          | "admin"
          | "superadmin";
        const nextPermissions = normalizeAdminPermissions(
          nextRole,
          body?.profile?.permissions
        );

        if (!mounted) return;
        setRole(nextRole);
        setPermissions(nextPermissions);
      } catch {
        // ignore
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          setError((json as any)?.message || "Order not found");
          setOrder(null);
          return;
        }

        setOrder((json as any).data);
        setPaymentStatus(((json as any).data?.paymentStatus || "Pending") as PaymentStatus);
        setOrderStatus(((json as any).data?.orderStatus || "Pending") as OrderStatus);
      } catch {
        setError("Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const saveChanges = async () => {
    if (!order?.id) return;

    if (!canUpdate) {
      alert("You do not have permission to update orders.");
      return;
    }

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

      const json = await safeJson(res);

      if (!res.ok) {
        alert((json as any)?.message || "Failed to save changes");
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
      <AdminPageGuard permission="orderView">
        <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-6 text-slate-300">
          Loading...
        </div>
      </AdminPageGuard>
    );
  }

  if (!order) {
    return (
      <AdminPageGuard permission="orderView">
        <div className="space-y-3">
          <div className="text-slate-300">{error || "Order not found"}</div>
          <Link
            href="/admin/orders"
            className="inline-flex rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm text-slate-100"
          >
            Back
          </Link>
        </div>
      </AdminPageGuard>
    );
  }

  const placedOn = formatDate(order.createdAt);

  const timeline: TimelineStep[] = [
    { label: "Order Placed", date: placedOn, status: "done" },
    {
      label: "Order Shipped",
      date: order.shippedAt ? formatDate(order.shippedAt) : "—",
      status:
        orderStatus === "Delivered"
          ? "done"
          : orderStatus === "Shipped"
          ? "current"
          : "upcoming",
    },
    {
      label: "Order Delivered",
      date: order.deliveredAt ? formatDate(order.deliveredAt) : "—",
      status: orderStatus === "Delivered" ? "current" : "upcoming",
    },
  ];

  const addr = order.address || null;
  const addrTitle = addr?.label ? safeStr(addr.label) : "Shipping Address";
  const addrName = safeStr(addr?.fullName);
  const addrPhone = safeStr(addr?.phone);
  const addrStreet = safeStr(addr?.street);
  const addrArea = safeStr(addr?.addressLine);
  const addrCity = safeStr(addr?.cityOrMunicipality);

  const customerId = order?.customer?.id || order?.customer?._id || "";

  return (
    <AdminPageGuard permission="orderView">
      <div className="max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400">
              Orders <span className="mx-2">/</span> {order.orderCode}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold">{order.orderCode}</h1>
            <p className="text-sm text-slate-400">Placed on {placedOn}</p>
          </div>

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

        <div className="grid rounded-2xl border border-slate-700/40 bg-[#0A1324] md:grid-cols-3">
          <div className="p-5">
            <div className="text-xs text-slate-400">Name</div>
            <div className="text-sm text-slate-100">
              {order.customer?.name || "-"}
            </div>
          </div>

          <div className="border-l border-slate-700/40 p-5">
            <div className="text-xs text-slate-400">Email</div>
            <div className="text-sm text-slate-100">
              {order.customer?.email || "-"}
            </div>
          </div>

          <div className="border-l border-slate-700/40 p-5">
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
                  {[addrStreet, addrArea, addrCity].filter(Boolean).join(", ") ||
                    "-"}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-700/40 bg-[#0A1324]">
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

        <div className="space-y-6 rounded-2xl border border-slate-700/40 bg-[#0A1324] p-6">
          {timeline.map((t) => (
            <div key={t.label} className="flex gap-4">
              <Dot status={t.status} />
              <div>
                <div className="text-sm text-slate-100">{t.label}</div>
                <div className="text-xs text-slate-400">{t.date}</div>
              </div>
            </div>
          ))}

          <div>
            <label
              htmlFor="order-payment-status"
              className="mb-1 block text-xs text-slate-400"
            >
              Payment Status
            </label>
            <select
              id="order-payment-status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              disabled={!canUpdate}
              className="w-full max-w-lg rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-3 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="Paid" className="bg-[#0A1324]">
                Paid
              </option>
              <option value="Pending" className="bg-[#0A1324]">
                Pending
              </option>
              <option value="Failed" className="bg-[#0A1324]">
                Failed
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="order-status"
              className="mb-1 block text-xs text-slate-400"
            >
              Order Status
            </label>
            <select
              id="order-status"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              disabled={!canUpdate}
              className="w-full max-w-lg rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-3 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="Pending" className="bg-[#0A1324]">
                Pending
              </option>
              <option value="Shipped" className="bg-[#0A1324]">
                Shipped
              </option>
              <option value="Delivered" className="bg-[#0A1324]">
                Delivered
              </option>
              <option value="Cancelled" className="bg-[#0A1324]">
                Cancelled
              </option>
            </select>
          </div>

          <div className="flex justify-between pt-4">
            <Link
              href="/admin/orders"
              className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm text-slate-100"
            >
              Back
            </Link>

            {canUpdate ? (
              <button
                onClick={saveChanges}
                disabled={saving}
                className="rounded-xl bg-sky-500 px-6 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            ) : (
              <div className="text-sm text-slate-400">
                Update permission required
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminPageGuard>
  );
}