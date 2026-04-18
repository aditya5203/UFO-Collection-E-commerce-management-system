"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

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

  if (s === "cancelled" || s === "canceled") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

function StatusBadge({ status }: { status?: string }) {
  const label = status || "Pending";
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

function EmptyState({ onShop }: { onShop: () => void }) {
  return (
    <div className="mt-10 rounded-[20px] border border-[#2b2f45] bg-[#0b0f1a]/70 px-6 py-14 text-center shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#2b2f45] bg-[#111726]">
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

      <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-7 text-[#8b90ad]">
        You have not placed any orders yet. Browse our latest collection and
        start shopping.
      </p>

      <button
        type="button"
        onClick={onShop}
        className="mt-7 rounded-[12px] bg-[#1d9bf0] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#1580c5]"
      >
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
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await loadOrders();
    };

    run();

    return () => {
      mounted = false;
    };
  }, [loadOrders]);

  React.useEffect(() => {
    const socket: Socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("order:updated", () => {
      loadOrders();
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
    };
  }, [loadOrders]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/homepage")}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-2">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-white">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-10">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <Link href="/wishlist" aria-label="Wishlist" title="Wishlist">
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt="Wishlist icon"
              className="brightness-0 invert"
            />
          </Link>
        </div>
      </header>

      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[40px] font-semibold">Order History</h1>
              <p className="mt-2 text-[15px] text-[#8b90ad]">
                Review your previous purchases and open full order details.
              </p>
            </div>

            {!loading && !error && orders.length > 0 ? (
              <div className="rounded-full border border-[#2b2f45] bg-[#0b0f1a]/60 px-4 py-2 text-[13px] text-[#dfe3ff]">
                Total Orders: <span className="font-semibold">{orders.length}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-8 h-px bg-[#2b2f45]" />

          {loading && (
            <div className="mt-10 grid gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-[20px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="h-5 w-44 rounded bg-[#1a2234]" />
                      <div className="h-4 w-32 rounded bg-[#161d2d]" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-9 w-24 rounded-full bg-[#161d2d]" />
                      <div className="h-11 w-32 rounded-xl bg-[#1a2234]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mt-10 rounded-[18px] border border-red-500/40 bg-red-500/10 p-8 text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <EmptyState onShop={() => router.push("/collection")} />
          )}

          {!loading && !error && orders.length > 0 && (
            <section className="mt-10">
              <div className="grid gap-6">
                {orders.map((order) => {
                  const displayId = order.orderCode || order.id;
                  const urlId = (displayId || "").replace("#", "");
                  const total = resolveTotal(order);
                  const itemsCount = countItems(order);
                  const preview = firstImage(order);

                  return (
                    <div
                      key={displayId}
                      className="group overflow-hidden rounded-[22px] border border-[#2b2f45] bg-[linear-gradient(180deg,rgba(11,15,26,0.9),rgba(11,15,26,0.72))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)] transition duration-300 hover:border-[#3b4763] hover:shadow-[0_24px_90px_rgba(0,0,0,0.32)]"
                    >
                      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-start gap-5">
                          <div className="flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-[18px] border border-[#2b2f45] bg-[#101625]">
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
                              <h2 className="text-[20px] font-semibold text-white">
                                {displayId}
                              </h2>
                              <StatusBadge status={order.orderStatus} />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#8b90ad]">
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

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/customerorderdetails/${encodeURIComponent(urlId)}`
                              )
                            }
                            className="inline-flex items-center justify-center rounded-[12px] bg-[#1b2a3a] px-6 py-3 text-[14px] font-medium text-white transition hover:bg-[#223449]"
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
                            className="inline-flex items-center justify-center rounded-[12px] border border-[#2b2f45] bg-transparent px-6 py-3 text-[14px] font-medium text-[#dfe3ff] transition hover:bg-[#131a29]"
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
          )}

          <div className="mt-28 flex items-center justify-center gap-8 text-white/80">
            <Link href="#" aria-label="Instagram" title="Instagram">
              <Image
                src="/images/instagram.png"
                width={20}
                height={20}
                alt="Instagram"
                className="brightness-0 invert opacity-80 hover:opacity-100"
              />
            </Link>
            <Link href="#" aria-label="Facebook" title="Facebook">
              <Image
                src="/images/facebook.png"
                width={20}
                height={20}
                alt="Facebook"
                className="brightness-0 invert opacity-80 hover:opacity-100"
              />
            </Link>
          </div>

          <p className="mt-10 text-center text-[#8b90ad]">
            © 2025 UFO Collection — All Rights Reserved
          </p>
        </div>
      </main>
    </>
  );
}