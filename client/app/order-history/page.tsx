// client/app/order-history/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type OrderRow = {
  id: string; // Mongo _id OR fallback
  orderCode: string; // "#123456"
  createdAt: string; // ISO or YYYY-MM-DD
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

export default function OrderHistoryPage() {
  const router = useRouter();

  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        // ✅ cookie-based auth
        const res = await fetch(`${API}/orders/my`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        // ✅ not logged in
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const json = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          throw new Error(json?.message || "Failed to load order history");
        }

        // ✅ accept multiple response shapes safely:
        // 1) { orders: [...] }
        // 2) { data: [...] }
        // 3) direct array [...]
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
            }))
          : [];

        if (!mounted) return;

        // ✅ filter invalid
        setOrders(list.filter((x) => x.orderCode || x.id));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Something went wrong");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <>
      {/* ✅ HEADER (same as your cart page design) */}
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

      {/* ✅ PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-14">
          <h1 className="text-[40px] font-semibold">Order History</h1>

          <div className="mt-8 h-px bg-[#2b2f45]" />

          {/* Loading */}
          {loading && (
            <div className="mt-10 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-8 text-[#9aa3cc]">
              Loading your orders...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-10 rounded-[12px] border border-red-500/40 bg-red-500/10 p-8 text-red-200">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && orders.length === 0 && (
            <div className="mt-10 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-8 text-[#9aa3cc]">
              No orders found.
            </div>
          )}

          {/* Orders */}
          {!loading && !error && orders.length > 0 && (
            <section className="mt-10">
              <div className="space-y-8">
                {orders.map((order) => {
                  const displayId = order.orderCode || order.id;

                  // ✅ IMPORTANT: pass orderCode without "#", fallback to id
                  const urlId = (displayId || "").replace("#", "");

                  return (
                    <div key={displayId} className="flex items-center justify-between">
                      <div>
                        <div className="text-[18px] font-semibold text-white">
                          Order ID: {displayId}
                        </div>
                        <div className="mt-1 text-[14px] text-[#8b90ad]">
                          Order Date: {formatDate(order.createdAt)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/customerorderdetails/${encodeURIComponent(urlId)}`)
                        }
                        className="rounded-[10px] bg-[#1b2a3a] px-6 py-3 text-[14px] text-white hover:bg-[#223449]"
                        aria-label={`View details for ${displayId}`}
                        title={`View details for ${displayId}`}
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Footer */}
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
