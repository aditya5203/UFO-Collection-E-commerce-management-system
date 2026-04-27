// client/app/admin/orders/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

type PaymentStatus = "Paid" | "Pending" | "Failed";
type OrderStatus =
  | "Delivered"
  | "Transit"
  | "Shipped"
  | "Pending"
  | "Cancelled";

type PaymentMethod =
  | "eSewa"
  | "Khalti"
  | "CashOnDelivery"
  | "Card"
  | "BankTransfer"
  | "Other";

type OrderRow = {
  id: string;
  orderCode?: string;
  totalPaisa?: number;
  total?: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: PaymentMethod | string;
  payment?: {
    method?: PaymentMethod | string;
    provider?: string;
    gateway?: string;
  };
  paymentProvider?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const actionBtnClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function formatDateShort(iso?: string) {
  if (!iso) return "-";
  return String(iso).slice(0, 10);
}

function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;
  return `Rs. ${(safe / 100).toFixed(2)}`;
}

function normalizePaymentMethod(v?: string) {
  const s = (v || "").toLowerCase().trim();
  if (!s) return "—";
  if (s.includes("esewa") || s === "e-sewa") return "eSewa";
  if (s.includes("khalti")) return "Khalti";
  if (s.includes("cod") || s.includes("cash")) return "Cash on Delivery";
  if (s.includes("card") || s.includes("visa") || s.includes("master")) {
    return "Card";
  }
  if (s.includes("bank") || s.includes("transfer")) return "Bank Transfer";
  return "Other";
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function OrdersPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<OrderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [downloadingId, setDownloadingId] = React.useState<string>("");

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  // permission still loaded, but update button removed as requested
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
      } catch {}
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const load = React.useCallback(async (search: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/orders?search=${encodeURIComponent(search)}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        setRows([]);
        setError((json as any)?.message || "Failed to load orders");
        return;
      }

      setRows(Array.isArray((json as any)?.data) ? (json as any).data : []);
    } catch {
      setRows([]);
      setError("Network error while loading orders");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load("");
  }, [load]);

  React.useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  React.useEffect(() => {
    const socket: Socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("order:updated", () => {
      load(q);
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
    };
  }, [load, q]);

  const downloadInvoice = async (orderId: string, orderCode?: string) => {
    try {
      setDownloadingId(orderId);

      const target = encodeURIComponent(orderId);

      const res = await fetch(`${API_BASE}/api/orders/${target}/invoice`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to download invoice");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const fileBase = (orderCode || orderId || "invoice").replace("#", "");
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${fileBase}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to download invoice");
    } finally {
      setDownloadingId("");
    }
  };

  const paidCount = rows.filter((o) => o.paymentStatus === "Paid").length;
  const pendingCount = rows.filter((o) => o.orderStatus === "Pending").length;

  const totalRevenue = rows.reduce((sum, o) => {
    const paisa = Number.isFinite(o.totalPaisa as number)
      ? (o.totalPaisa as number)
      : Math.round(Number(o.total || 0) * 100);

    return sum + paisa;
  }, 0);

  return (
    <AdminPageGuard permission="orderView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin Sales
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Orders
                </h1>

                <p className="mt-2 max-w-[660px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Track customer orders, payment status, delivery progress, and
                  invoice downloads in real time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => load(q)}
                className={secondaryBtnClass}
              >
                Refresh
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Orders"
              value={String(rows.length)}
              iconSrc="/images/admin/orders.png"
            />

            <MetricCard
              label="Paid Orders"
              value={String(paidCount)}
              iconSrc="/images/admin/paid.png"
            />

            <MetricCard
              label="Pending Orders"
              value={String(pendingCount)}
              iconSrc="/images/admin/pending.png"
            />

            <MetricCard
              label="Total Value"
              value={formatNPR(totalRevenue)}
              iconSrc="/images/admin/revenue.png"
            />
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-[#26293a] px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Order List
                </div>

                <div className="mt-1 text-[20px] font-semibold text-white">
                  Customer Orders
                </div>
              </div>

              <div className="flex h-[46px] min-w-[280px] items-center rounded-full border border-white/10 bg-white/5 px-4">
                <label htmlFor="order-search" className="sr-only">
                  Search order or customer
                </label>

                <input
                  id="order-search"
                  name="orderSearch"
                  title="Search order or customer"
                  aria-label="Search order or customer"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search order or customer"
                  className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
                />
              </div>
            </div>

            {loading ? (
              <OrderSkeleton />
            ) : rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1220px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Order ID</th>
                      <th className="px-5 py-4 font-medium">Customer</th>
                      <th className="px-5 py-4 font-medium">Total</th>
                      <th className="px-5 py-4 font-medium">Payment Method</th>
                      <th className="px-5 py-4 font-medium">Payment Status</th>
                      <th className="px-5 py-4 font-medium">Order Status</th>
                      <th className="px-5 py-4 font-medium">Created</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((o) => {
                      const code = o.orderCode || o.id;
                      const cname = o.customer?.name || o.customerName || "-";
                      const cemail = o.customer?.email || o.customerEmail || "-";

                      const paisa = Number.isFinite(o.totalPaisa as number)
                        ? (o.totalPaisa as number)
                        : Math.round(Number(o.total || 0) * 100);

                      const methodRaw =
                        (o.paymentMethod as string) ||
                        (o.payment?.method as string) ||
                        o.payment?.provider ||
                        o.payment?.gateway ||
                        o.paymentProvider ||
                        "";

                      const methodLabel = normalizePaymentMethod(methodRaw);
                      const downloading = downloadingId === o.id;

                      return (
                        <tr
                          key={o.id}
                          className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">
                              {code}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">
                              {cname}
                            </div>

                            <div className="mt-1 text-[12px] text-[#7f879f]">
                              {cemail}
                            </div>
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#d6c7ff]">
                            {formatNPR(paisa)}
                          </td>

                          <td className="px-5 py-4">
                            <MethodBadge>{methodLabel}</MethodBadge>
                          </td>

                          <td className="px-5 py-4">
                            <PaymentBadge status={o.paymentStatus}>
                              {o.paymentStatus}
                            </PaymentBadge>
                          </td>

                          <td className="px-5 py-4">
                            <OrderBadge status={o.orderStatus}>
                              {o.orderStatus}
                            </OrderBadge>
                          </td>

                          <td className="px-5 py-4 text-[#a7aec4]">
                            {formatDateShort(o.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className={actionBtnClass}
                              >
                                View
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  downloadInvoice(o.id, o.orderCode)
                                }
                                disabled={downloading}
                                className={actionBtnClass}
                              >
                                {downloading ? "Downloading" : "Invoice"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </div>
    </AdminPageGuard>
  );
}

function MetricCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function MethodBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

function PaymentBadge({
  status,
  children,
}: {
  status: PaymentStatus;
  children: React.ReactNode;
}) {
  const styles: Record<PaymentStatus, string> = {
    Paid: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    Pending: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    Failed: "border-red-400/20 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles[status] || styles.Pending,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function OrderBadge({
  status,
  children,
}: {
  status: OrderStatus;
  children: React.ReactNode;
}) {
  const styles: Record<OrderStatus, string> = {
    Delivered: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    Transit: "border-violet-400/20 bg-violet-500/15 text-violet-300",
    Shipped: "border-blue-400/20 bg-blue-500/15 text-blue-300",
    Pending: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    Cancelled: "border-red-400/20 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles[status] || styles.Pending,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/orders.png"
          alt="Orders"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No orders found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        New customer orders will appear here automatically.
      </p>
    </div>
  );
}