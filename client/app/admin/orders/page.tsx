"use client";

import * as React from "react";
import Link from "next/link";

type PaymentStatus = "Paid" | "Pending" | "Failed";
type OrderStatus = "Delivered" | "Shipped" | "Pending" | "Cancelled";

// ✅ Payment method types (kept same)
type PaymentMethod =
  | "eSewa"
  | "Khalti"
  | "CashOnDelivery"
  | "Card"
  | "BankTransfer"
  | "Other";

type OrderRow = {
  id: string; // Mongo _id
  orderCode?: string; // "#12345"
  totalPaisa?: number; // ✅ preferred
  total?: number; // fallback if backend sends rupees
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/35 px-4 py-2 text-xs font-semibold text-slate-100">
      {children}
    </span>
  );
}

function formatDateShort(iso?: string) {
  if (!iso) return "-";
  return String(iso).slice(0, 10);
}

function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;
  return `Rs. ${(safe / 100).toFixed(2)}`;
}

// ✅ normalize payment method from any backend shape
function normalizePaymentMethod(v?: string) {
  const s = (v || "").toLowerCase().trim();
  if (!s) return "—";
  if (s.includes("esewa") || s === "e-sewa") return "eSewa";
  if (s.includes("khalti")) return "Khalti";
  if (s.includes("cod") || s.includes("cash")) return "Cash on Delivery";
  if (s.includes("card") || s.includes("visa") || s.includes("master"))
    return "Card";
  if (s.includes("bank") || s.includes("transfer")) return "Bank Transfer";
  return "Other";
}

export default function OrdersPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<OrderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // ✅ per-row downloading state
  const [downloadingId, setDownloadingId] = React.useState<string>("");

  const load = React.useCallback(async (search: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/orders?search=${encodeURIComponent(search)}`,
        { credentials: "include" }
      );

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setRows([]);
        setError(json?.message || "Failed to load orders");
        return;
      }

      setRows(Array.isArray(json?.data) ? json.data : []);
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

  // ✅ NEW: Download invoice PDF (Admin)
  const downloadInvoice = async (orderId: string, orderCode?: string) => {
    try {
      setDownloadingId(orderId);

      // You can use Mongo _id OR orderCode.
      // Using _id is safest for admin.
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

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Orders</h1>

      <div className="flex justify-end">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="h-11 w-[280px] rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 text-sm text-slate-100 placeholder:text-slate-400 outline-none"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0A1324]">
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] w-full border-collapse">
            <thead className="bg-slate-900/30">
              <tr className="text-left text-sm font-semibold text-slate-200">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Order Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((o) => {
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
                      className="border-t border-slate-700/40 text-sm text-slate-100 hover:bg-slate-900/20"
                    >
                      <td className="px-6 py-5 font-semibold">{code}</td>

                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-200">
                            {cname}
                          </div>
                          <div className="text-slate-400">{cemail}</div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {formatNPR(paisa)}
                      </td>

                      <td className="px-6 py-5">
                        <Pill>{methodLabel}</Pill>
                      </td>

                      <td className="px-6 py-5">
                        <Pill>{o.paymentStatus}</Pill>
                      </td>

                      <td className="px-6 py-5">
                        <Pill>{o.orderStatus}</Pill>
                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        {formatDateShort(o.createdAt)}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-semibold text-slate-200 hover:text-slate-100"
                        >
                          View
                        </Link>

                        <span className="mx-2 text-slate-500">/</span>

                        <Link
                          href={`/admin/orders/${o.id}/update`}
                          className="font-semibold text-slate-200 hover:text-slate-100"
                        >
                          Update
                        </Link>

                        <span className="mx-2 text-slate-500">/</span>

                        {/* ✅ NEW: Download Invoice */}
                        <button
                          type="button"
                          onClick={() => downloadInvoice(o.id, o.orderCode)}
                          disabled={downloading}
                          className="font-semibold text-slate-200 hover:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {downloading ? "Downloading..." : "Invoice"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
