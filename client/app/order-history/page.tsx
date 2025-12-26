"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Order = {
  id: string; // "#12345"
  date: string; // "2023-11-15"
};

export default function OrderHistoryPage() {
  const router = useRouter();

  const [orders, setOrders] = React.useState<Order[]>([]);

  // ✅ Load orders from localStorage (optional)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ufo_orders");
      const parsed = raw ? (JSON.parse(raw) as Order[]) : null;

      if (Array.isArray(parsed) && parsed.length) {
        setOrders(parsed);
      } else {
        // Demo fallback (same like your screenshot)
        setOrders([
          { id: "#12345", date: "2023-11-15" },
          { id: "#67890", date: "2023-10-20" },
          { id: "#11223", date: "2023-09-05" },
          { id: "#44556", date: "2023-08-10" },
          { id: "#77889", date: "2023-07-25" },
        ]);
      }
    } catch {
      setOrders([
        { id: "#12345", date: "2023-11-15" },
        { id: "#67890", date: "2023-10-20" },
        { id: "#11223", date: "2023-09-05" },
        { id: "#44556", date: "2023-08-10" },
        { id: "#77889", date: "2023-07-25" },
      ]);
    }
  }, []);

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

      {/* ✅ PAGE (Order History design like your screenshot) */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-14">
          <h1 className="text-[40px] font-semibold">Order History</h1>

          <div className="mt-8 h-px bg-[#2b2f45]" />

          {orders.length === 0 ? (
            <div className="mt-10 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-8 text-[#9aa3cc]">
              No orders found.
            </div>
          ) : (
            <section className="mt-10">
              <div className="space-y-8">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between"
                  >
                    {/* left info */}
                    <div>
                      <div className="text-[18px] font-semibold text-white">
                        Order ID: {order.id}
                      </div>
                      <div className="mt-1 text-[14px] text-[#8b90ad]">
                        Order Date: {order.date}
                      </div>
                    </div>

                    {/* right button */}
                    <button
                      type="button"
                      onClick={() => router.push(`/order-history/${order.id.replace("#", "")}`)}
                      className="rounded-[10px] bg-[#1b2a3a] px-6 py-3 text-[14px] text-white hover:bg-[#223449]"
                      aria-label={`View details for ${order.id}`}
                      title={`View details for ${order.id}`}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer like your screenshot (optional) */}
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
