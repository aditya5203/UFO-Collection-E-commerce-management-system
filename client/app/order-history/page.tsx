"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type ToastType = "success" | "error" | "info";
type SortValue = "newest" | "oldest";
type StatusFilter = "All" | "Pending" | "Confirmed" | "Shipped" | "Transit" | "Delivered" | "Cancelled";

type OrderRow = {
  id: string;
  orderCode: string;
  createdAt: string;
  orderStatus?: string;
  totalPaisa?: number;
  total?: number;
  itemsCount?: number;
  items?: Array<any>;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function parseDateSafe(iso: string) {
  const t = Date.parse(iso || "");
  return Number.isFinite(t) ? t : 0;
}

function formatNPR(value?: number) {
  const safe = Number(value || 0);
  return `Rs. ${safe.toFixed(2)}`;
}

function statusTone(status?: string) {
  const s = String(status || "").trim().toLowerCase();

  if (s === "delivered") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (s === "transit" || s === "out for delivery") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  }

  if (s === "shipped") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-200";
  }

  if (s === "confirmed") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-200";
  }

  if (s === "cancelled" || s === "canceled") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

function normalizeStatus(status?: string) {
  const s = String(status || "Pending").trim();
  if (s.toLowerCase() === "canceled") return "Cancelled";
  if (!s) return "Pending";
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function StatusBadge({ status }: { status?: string }) {
  const label = normalizeStatus(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusTone(
        label
      )}`}
    >
      {label}
    </span>
  );
}

function countItems(order: OrderRow) {
  if (typeof order.itemsCount === "number") return order.itemsCount;
  if (Array.isArray(order.items)) return order.items.length;
  return 0;
}

function resolveTotal(order: OrderRow) {
  if (typeof order.totalPaisa === "number") return order.totalPaisa / 100;
  if (typeof order.total === "number") return order.total;
  return 0;
}

function firstImage(order: OrderRow) {
  if (!Array.isArray(order.items) || !order.items.length) return "";
  return String(order.items[0]?.image || "");
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onShop }: { onShop: () => void }) {
  return (
    <div className={`${panelClass} mt-10 px-6 py-14 text-center`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/box.png"
          alt="No orders"
          width={28}
          height={28}
          className="brightness-0 invert opacity-80"
        />
      </div>

      <h2 className="mt-5 text-[24px] font-semibold text-white">
        No orders yet
      </h2>

      <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-7 text-[#a7aec4]">
        You have not placed any orders yet. Browse our latest collection and
        start shopping.
      </p>

      <button type="button" onClick={onShop} className={`${primaryBtnClass} mt-7`}>
        Start Shopping
      </button>
    </div>
  );
}

export default function OrderHistoryPage() {
  const router = useRouter();

  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("All");
  const [sortValue, setSortValue] = React.useState<SortValue>("newest");

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const loadOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API}/orders/my`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        showToast("Please login to view your order history.", "info");
        router.push("/login");
        return;
      }

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load order history");
      }

      const listRaw = Array.isArray(json)
        ? json
        : Array.isArray(json?.orders)
          ? json.orders
          : Array.isArray(json?.data)
            ? json.data
            : [];

      const list: OrderRow[] = Array.isArray(listRaw)
        ? listRaw.map((o: any) => ({
            id: String(o?._id || o?.id || ""),
            orderCode: String(o?.orderCode || o?.orderId || o?.id || ""),
            createdAt: String(o?.createdAt || o?.date || ""),
            orderStatus: String(o?.orderStatus || o?.status || "Pending"),
            totalPaisa:
              typeof o?.totalPaisa === "number" ? o.totalPaisa : undefined,
            total: typeof o?.total === "number" ? o.total : undefined,
            itemsCount:
              typeof o?.itemsCount === "number" ? o.itemsCount : undefined,
            items: Array.isArray(o?.items) ? o.items : undefined,
          }))
        : [];

      setOrders(list.filter((x) => x.orderCode || x.id));
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  React.useEffect(() => {
    const socket: Socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("order:updated", () => {
      showToast("Order history updated in real time.", "info");
      loadOrders();
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
    };
  }, [loadOrders, showToast]);

  const filteredOrders = React.useMemo(() => {
    let list = [...orders];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((order) => {
        const haystack = `${order.orderCode || ""} ${order.id || ""} ${
          order.orderStatus || ""
        }`.toLowerCase();

        return haystack.includes(q);
      });
    }

    if (statusFilter !== "All") {
      list = list.filter(
        (order) =>
          normalizeStatus(order.orderStatus).toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    list.sort((a, b) => {
      const da = parseDateSafe(a.createdAt);
      const db = parseDateSafe(b.createdAt);

      if (sortValue === "oldest") return da - db;
      return db - da;
    });

    return list;
  }, [orders, search, statusFilter, sortValue]);

  const summary = React.useMemo(() => {
    const totalOrders = orders.length;
    const delivered = orders.filter(
      (o) => normalizeStatus(o.orderStatus).toLowerCase() === "delivered"
    ).length;
    const pending = orders.filter(
      (o) => normalizeStatus(o.orderStatus).toLowerCase() === "pending"
    ).length;
    const cancelled = orders.filter(
      (o) => normalizeStatus(o.orderStatus).toLowerCase() === "cancelled"
    ).length;

    return { totalOrders, delivered, pending, cancelled };
  }, [orders]);

  const copyOrderCode = async (code: string) => {
    const clean = String(code || "").trim();

    if (!clean) {
      showToast("Order code not found.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(clean);
      showToast("Order code copied.", "success");
    } catch {
      showToast("Unable to copy order code.", "error");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSortValue("newest");
    showToast("Filters cleared.", "info");
  };

  return (
    <>
      <CartHeader />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                My Orders
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Order History
              </h1>

              <p className="mt-2 text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                Review your previous purchases, track orders, and open full
                order details.
              </p>
            </div>

            <Link href="/collection" className={secondaryBtnClass}>
              Continue Shopping
            </Link>
          </div>

          {!loading && !error && orders.length > 0 ? (
            <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ["Total Orders", summary.totalOrders],
                ["Delivered", summary.delivered],
                ["Pending", summary.pending],
                ["Cancelled", summary.cancelled],
              ].map(([label, value]) => (
                <div key={label} className={`${panelClass} p-4 sm:p-5`}>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                    {label}
                  </div>
                  <div className="mt-2 text-[26px] font-semibold text-white">
                    {value}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {!loading && !error && orders.length > 0 ? (
            <section className={`${panelClass} mb-8 p-4 sm:p-5`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-[18px] font-semibold text-white">
                    Filter Orders
                  </div>
                  <div className="mt-1 text-[12px] text-[#a7aec4]">
                    Search by order code, filter by status, and sort by date.
                  </div>
                </div>

                <button type="button" onClick={clearFilters} className={secondaryBtnClass}>
                  Clear Filters
                </button>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_190px]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order code..."
                  className="h-[50px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                />

                <select
  aria-label="Filter orders by status"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  {[
                    "All",
                    "Pending",
                    "Confirmed",
                    "Shipped",
                    "Transit",
                    "Delivered",
                    "Cancelled",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

               <select
  aria-label="Sort orders by date"
  value={sortValue}
  onChange={(e) => setSortValue(e.target.value as SortValue)}
                  className="h-[50px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none transition focus:border-[#d6c7ff]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <div className="mt-4 text-[13px] text-[#a7aec4]">
                Showing{" "}
                <span className="font-semibold text-white">
                  {filteredOrders.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-white">{orders.length}</span>{" "}
                orders.
              </div>
            </section>
          ) : null}

          {loading ? (
            <div className="mt-10 grid gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`${panelClass} animate-pulse p-6`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="h-5 w-44 rounded bg-white/5" />
                      <div className="h-4 w-32 rounded bg-white/5" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-9 w-24 rounded-full bg-white/5" />
                      <div className="h-11 w-32 rounded-xl bg-white/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="mt-10 rounded-[24px] border border-red-500/40 bg-red-500/10 p-8 text-red-200">
              {error}
            </div>
          ) : null}

          {!loading && !error && orders.length === 0 ? (
            <EmptyState onShop={() => router.push("/collection")} />
          ) : null}

          {!loading && !error && orders.length > 0 && filteredOrders.length === 0 ? (
            <div className={`${panelClass} mt-10 p-8 text-center`}>
              <h2 className="text-[22px] font-semibold text-white">
                No matching orders found
              </h2>
              <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-7 text-[#a7aec4]">
                Try changing the search text or removing filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className={`${primaryBtnClass} mt-5`}
              >
                Reset Filters
              </button>
            </div>
          ) : null}

          {!loading && !error && filteredOrders.length > 0 ? (
            <section className="mt-10">
              <div className="grid gap-6">
                {filteredOrders.map((order) => {
                  const displayId = order.orderCode || order.id;
                  const urlId = (displayId || "").replace("#", "");
                  const total = resolveTotal(order);
                  const itemsCount = countItems(order);
                  const preview = firstImage(order);

                  return (
                    <div
                      key={displayId}
                      className="group overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:p-6"
                    >
                      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-start gap-4 sm:gap-5">
                          <div className="flex h-[66px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[#26293a] bg-[#0d0f17] sm:h-[74px] sm:w-[74px]">
                            {preview ? (
                              <Image
                                src={preview}
                                alt={displayId}
                                width={74}
                                height={74}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Image
                                src="/images/box.png"
                                alt="Order"
                                width={28}
                                height={28}
                                className="brightness-0 invert opacity-80"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h2 className="break-all text-[18px] font-semibold text-white sm:text-[20px]">
                                {displayId}
                              </h2>

                              <StatusBadge status={order.orderStatus} />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#a7aec4] sm:text-[14px]">
                              <span>
                                Order Date:{" "}
                                <span className="text-[#dfe3ff]">
                                  {formatDate(order.createdAt)}
                                </span>
                              </span>

                              <span>
                                Items:{" "}
                                <span className="text-[#dfe3ff]">
                                  {itemsCount > 0 ? itemsCount : "-"}
                                </span>
                              </span>

                              <span>
                                Total:{" "}
                                <span className="text-[#dfe3ff]">
                                  {total > 0 ? formatNPR(total) : "-"}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                          <button
                            type="button"
                            onClick={() => copyOrderCode(displayId)}
                            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                          >
                            Copy Code
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/customerorderdetails/${encodeURIComponent(urlId)}`
                              )
                            }
                            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#090a12] transition hover:bg-white/90"
                            aria-label={`View details for ${displayId}`}
                            title={`View details for ${displayId}`}
                          >
                            View Details
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/order-tracking?code=${encodeURIComponent(urlId)}`
                              )
                            }
                            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                            aria-label={`Track ${displayId}`}
                            title={`Track ${displayId}`}
                          >
                            Track Order
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <MainFooter />
    </>
  );
}