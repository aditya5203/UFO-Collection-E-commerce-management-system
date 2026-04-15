"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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

function safeStr(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function formatDateTime(d: any) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function getInitials(name?: string) {
  const safe = safeStr(name).trim();
  if (!safe) return "CU";
  const parts = safe.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");
  return initials || "CU";
}

function getStatusTone(status?: string) {
  const s = safeStr(status).toLowerCase();

  if (s === "paid" || s === "delivered") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (s === "pending" || s === "shipped") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  if (s === "failed" || s === "cancelled") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-slate-700/60 bg-slate-900/35 text-slate-100";
}

function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getStatusTone(String(children));
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function Dot({ status }: { status: TimelineStep["status"] }) {
  const base =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-bold shadow-sm";

  if (status === "done") {
    return (
      <div
        className={`${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`}
      >
        ✓
      </div>
    );
  }

  if (status === "current") {
    return (
      <div
        className={`${base} border-sky-500/40 bg-sky-500/10 text-sky-200`}
      >
        •
      </div>
    );
  }

  return (
    <div
      className={`${base} border-slate-700/60 bg-slate-900/20 text-slate-600`}
    >
      •
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-bold text-slate-100">{value}</div>
      {hint ? <div className="mt-1 text-sm text-slate-400">{hint}</div> : null}
    </div>
  );
}

function LineItem({
  label,
  value,
  valueClassName = "text-slate-100",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-right text-sm ${valueClassName}`}>{value}</span>
    </div>
  );
}

function hasLatLng(addr: any) {
  return (
    typeof addr?.lat === "number" &&
    Number.isFinite(addr.lat) &&
    typeof addr?.lng === "number" &&
    Number.isFinite(addr.lng)
  );
}

function getGoogleMapsUrl(addr: any) {
  if (!hasLatLng(addr)) return "";
  return `https://www.google.com/maps?q=${addr.lat},${addr.lng}`;
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
        setPaymentStatus(
          (((json as any).data?.paymentStatus || "Pending") as PaymentStatus)
        );
        setOrderStatus(
          (((json as any).data?.orderStatus || "Pending") as OrderStatus)
        );
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
        <div className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-8 text-slate-300 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
          Loading...
        </div>
      </AdminPageGuard>
    );
  }

  if (!order) {
    return (
      <AdminPageGuard permission="orderView">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-8 text-slate-300 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
            {error || "Order not found"}
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/35"
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
  const addrArea =
    safeStr(addr?.addressLine) || safeStr(addr?.area) || safeStr(addr?.district);
  const addrCity =
    safeStr(addr?.cityOrMunicipality) || safeStr(addr?.city) || safeStr(addr?.provinceId);

  const customerId = order?.customer?.id || order?.customer?._id || "";
  const items = Array.isArray(order.items) ? order.items : [];

  const subtotalPaisa = items.reduce((sum: number, it: any) => {
    const qty = Number(it?.qty || 0);
    const pricePaisa = Number(it?.pricePaisa || 0);
    return sum + qty * pricePaisa;
  }, 0);

  const shippingPaisa = Number(order?.shippingPaisa || 0);
  const discountPaisa = Number(order?.discountPaisa || 0);
  const totalPaisa = Number(order?.totalPaisa || 0);

  return (
    <AdminPageGuard permission="orderView">
      <div className="max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-700/50 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_35%),linear-gradient(180deg,rgba(10,19,36,1),rgba(7,14,27,1))] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.32)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Orders <span className="mx-2">/</span> {order.orderCode}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  {order.orderCode}
                </h1>
                <StatusPill>{paymentStatus}</StatusPill>
                <StatusPill>{orderStatus}</StatusPill>
              </div>

              <p className="text-sm text-slate-400">
                Placed on {placedOn}
                {order?.paymentMethod ? (
                  <>
                    <span className="mx-2">•</span>
                    <span>{safeStr(order.paymentMethod)}</span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {customerId ? (
                <Link
                  href={`/admin/customers/${customerId}?tab=addresses`}
                  className="inline-flex rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/35"
                >
                  View Customer Addresses
                </Link>
              ) : null}

              <Link
                href="/admin/orders"
                className="inline-flex rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/35"
              >
                Back
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Customer"
              value={order.customer?.name || "-"}
              hint={order.customer?.email || "No email"}
            />
            <SummaryCard
              label="Items"
              value={String(items.length)}
              hint="Products in this order"
            />
            <SummaryCard
              label="Total"
              value={formatNPR(totalPaisa)}
              hint="Final charged amount"
            />
            <SummaryCard
              label="Order Date"
              value={formatDate(order.createdAt)}
              hint={formatDateTime(order.createdAt)}
            />
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-slate-700/50 bg-[#0A1324] shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between border-b border-slate-700/40 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Ordered Items
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Product, quantity, color, size, and pricing
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-slate-900/30 text-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left">Product</th>
                      <th className="px-6 py-4 text-left">Size</th>
                      <th className="px-6 py-4 text-left">Color</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Price</th>
                      <th className="px-6 py-4 text-right">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.length ? (
                      items.map((it: any, i: number) => {
                        const colorValue = safeStr(it?.color);
                        const colorLabel = safeStr(it?.colorLabel);
                        const qty = Number(it?.qty || 0);
                        const pricePaisa = Number(it?.pricePaisa || 0);
                        const lineTotalPaisa = qty * pricePaisa;

                        return (
                          <tr
                            key={i}
                            className="border-t border-slate-700/40 text-slate-100 hover:bg-slate-900/15"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/30">
                                  {it?.image ? (
                                    <Image
                                      src={it.image}
                                      alt={it?.name || "Product"}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="grid h-full w-full place-items-center text-xs text-slate-500">
                                      No image
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-100">
                                    {it?.name || "-"}
                                  </div>
                                  {it?.productId ? (
                                    <div className="mt-1 text-xs text-slate-500">
                                      Product ID: {it.productId}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5 text-slate-300">
                              {safeStr(it?.size) || "-"}
                            </td>

                            <td className="px-6 py-5">
                              {colorValue || colorLabel ? (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <span
                                    className="h-4 w-4 rounded-full border border-slate-600"
                                    style={{
                                      backgroundColor:
                                        colorValue || "#16191f",
                                    }}
                                  />
                                  <span>{colorLabel || colorValue}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>

                            <td className="px-6 py-5 text-center text-slate-300">
                              {qty || "-"}
                            </td>

                            <td className="px-6 py-5 text-right text-slate-300">
                              {formatNPR(pricePaisa)}
                            </td>

                            <td className="px-6 py-5 text-right font-semibold text-slate-100">
                              {formatNPR(lineTotalPaisa)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-slate-700/40">
                        <td colSpan={6} className="px-6 py-10 text-slate-400">
                          No items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Order Timeline
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Current lifecycle status of this order
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {timeline.map((t, index) => (
                  <div key={t.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <Dot status={t.status} />
                      {index !== timeline.length - 1 ? (
                        <div className="mt-2 h-10 w-px bg-slate-700/50" />
                      ) : null}
                    </div>

                    <div className="pt-1">
                      <div className="text-sm font-semibold text-slate-100">
                        {t.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {t.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-slate-700/60 bg-slate-900/30 text-base font-bold text-slate-100">
                  {getInitials(order.customer?.name)}
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-100">
                    Customer Details
                  </h2>
                  <div className="mt-2 text-sm text-slate-100">
                    {order.customer?.name || "-"}
                  </div>
                  <div className="mt-1 break-all text-sm text-slate-400">
                    {order.customer?.email || "-"}
                  </div>
                  {order.customer?.phone ? (
                    <div className="mt-1 text-sm text-slate-400">
                      {order.customer.phone}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    {addrTitle}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Delivery information attached to this order
                  </p>
                </div>

                {customerId ? (
                  <Link
                    href={`/admin/customers/${customerId}?tab=addresses`}
                    className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-900/35"
                  >
                    Open Customer
                  </Link>
                ) : null}
              </div>

              {!addr ? (
                <div className="mt-5 rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5 text-sm text-slate-400">
                  No shipping address found.
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
                    <div className="text-base font-semibold text-slate-100">
                      {addrName || "-"}
                    </div>

                    {addrPhone ? (
                      <div className="mt-1 text-sm text-slate-400">
                        {addrPhone}
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-2">
                      <LineItem label="Street" value={addrStreet || "-"} />
                      <LineItem label="Area" value={addrArea || "-"} />
                      <LineItem label="City" value={addrCity || "-"} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Map Location
                    </div>

                    <div
                      className={`mt-2 text-sm ${
                        hasLatLng(addr) ? "text-slate-100" : "text-slate-500"
                      }`}
                    >
                      {hasLatLng(addr)
                        ? `${Number(addr.lat).toFixed(6)}, ${Number(addr.lng).toFixed(6)}`
                        : "No map location saved in this order"}
                    </div>

                    {hasLatLng(addr) ? (
                      <div className="mt-4">
                        <a
                          href={getGoogleMapsUrl(addr)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/15"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
              <h2 className="text-lg font-bold text-slate-100">
                Payment & Totals
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Payment state and order amount breakdown
              </p>

              <div className="mt-5 space-y-3 rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
                <LineItem
                  label="Payment Method"
                  value={safeStr(order?.paymentMethod) || "-"}
                />
                <LineItem
                  label="Payment Reference"
                  value={safeStr(order?.paymentRef) || "-"}
                />
                <LineItem label="Subtotal" value={formatNPR(subtotalPaisa)} />
                <LineItem label="Shipping" value={formatNPR(shippingPaisa)} />
                <LineItem
                  label="Discount"
                  value={`- ${formatNPR(discountPaisa)}`}
                  valueClassName="text-emerald-300"
                />
                <div className="border-t border-slate-700/50 pt-3">
                  <LineItem
                    label="Total"
                    value={formatNPR(totalPaisa)}
                    valueClassName="text-base font-bold text-white"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Update Order
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Change payment and fulfillment status
                  </p>
                </div>

                {canUpdate ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Editable
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-700/60 bg-slate-900/35 px-3 py-1 text-xs font-semibold text-slate-300">
                    Read only
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label
                    htmlFor="order-payment-status"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
                  >
                    Payment Status
                  </label>
                  <select
                    id="order-payment-status"
                    value={paymentStatus}
                    onChange={(e) =>
                      setPaymentStatus(e.target.value as PaymentStatus)
                    }
                    disabled={!canUpdate}
                    className="w-full rounded-2xl border border-slate-700/50 bg-slate-900/25 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
                  >
                    Order Status
                  </label>
                  <select
                    id="order-status"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                    disabled={!canUpdate}
                    className="w-full rounded-2xl border border-slate-700/50 bg-slate-900/25 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/50 pt-5">
                  <Link
                    href="/admin/orders"
                    className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/35"
                  >
                    Back
                  </Link>

                  {canUpdate ? (
                    <button
                      onClick={saveChanges}
                      disabled={saving}
                      className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
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
            </section>
          </div>
        </div>
      </div>
    </AdminPageGuard>
  );
}