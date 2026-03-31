"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type AvailableCoupon = {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: "PERCENT" | "FLAT" | "FREESHIP";
  scope: "ALL" | "CATEGORY" | "PRODUCT";
  value: number;
  minOrder?: number | null;
  maxDiscountCap?: number | null;
  endAt?: string | null;
};

type CollectedRow = {
  id: string;
  status: "COLLECTED" | "USED";
  usedAt?: string | null;
  coupon: {
    id: string;
    code: string;
    title: string;
    type: string;
    scope: string;
    value: number;
    minOrder?: number | null;
    maxDiscountCap?: number | null;
    endAt?: string | null;
  };
};

type CartItem = {
  qty?: number;
};

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function fmtCoupon(c: {
  type: string;
  value: number;
  maxDiscountCap?: number | null;
}) {
  if (c.type === "PERCENT") {
    const cap = c.maxDiscountCap ? ` (Max Rs ${c.maxDiscountCap})` : "";
    return `${c.value}% OFF${cap}`;
  }
  if (c.type === "FLAT") return `Rs ${c.value} OFF`;
  if (c.type === "FREESHIP") return `FREE SHIPPING`;
  return "";
}

function readCartCount() {
  try {
    const raw = localStorage.getItem("ufo_cart");
    const cart = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(cart)) return 0;
    return cart.reduce(
      (sum: number, item: CartItem) => sum + (Number(item?.qty) || 0),
      0
    );
  } catch {
    return 0;
  }
}

export default function DiscountsPage() {
  const router = useRouter();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api";

  const [available, setAvailable] = React.useState<AvailableCoupon[]>([]);
  const [collected, setCollected] = React.useState<CollectedRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [cartCount, setCartCount] = React.useState(0);

  const collectedCodeSet = React.useMemo(() => {
    return new Set(
      collected
        .map((r) => (r?.coupon?.code || "").toUpperCase())
        .filter(Boolean)
    );
  }, [collected]);

  const loadAll = async () => {
    try {
      setLoading(true);

      const aRes = await fetch(`${API_BASE}/discounts/available`, {
        cache: "no-store",
      });
      const aJson = await safeJson(aRes);
      setAvailable(Array.isArray(aJson?.data) ? aJson.data : []);

      const mRes = await fetch(`${API_BASE}/discounts/my-collected`, {
        credentials: "include",
        cache: "no-store",
      });
      const mJson = await safeJson(mRes);
      setCollected(Array.isArray(mJson?.data) ? mJson.data : []);
    } catch {
      setAvailable([]);
      setCollected([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAll();
  }, []);

  React.useEffect(() => {
    const updateCartCount = () => setCartCount(readCartCount());

    updateCartCount();
    window.addEventListener("ufo_cart_updated", updateCartCount);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "ufo_cart") updateCartCount();
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("ufo_cart_updated", updateCartCount);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const collectOne = async (code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) return;

    await fetch(`${API_BASE}/discounts/collect/${encodeURIComponent(c)}`, {
      method: "POST",
      credentials: "include",
    });

    await loadAll();
  };

  const collectAll = async () => {
    await fetch(`${API_BASE}/discounts/collect-all`, {
      method: "POST",
      credentials: "include",
    });
    await loadAll();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex min-h-[80px] w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push("/collection")}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#050611]"
              aria-label="Back to collection"
              title="Back to collection"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:brightness-100 group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex min-w-0 items-center gap-3">
              <div className="h-[42px] w-[42px] overflow-hidden rounded-full border-2 border-white sm:h-[48px] sm:w-[48px]">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <span className="truncate text-[16px] font-bold uppercase tracking-[0.14em] text-white sm:text-[22px] lg:text-[26px]">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-10">
            <Link
              href="/homepage"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => router.push("/cartpage")}
            aria-label="Go to cart"
            title="Go to cart"
            className="relative shrink-0"
          >
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt="Cart icon"
              className="brightness-0 invert"
            />
            {cartCount > 0 ? (
              <span className="absolute -bottom-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#1f7cff] px-[5px] text-[11px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="border-t border-[#14162a] bg-[rgba(5,6,17,0.92)] lg:hidden">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
            <Link
              href="/homepage"
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <section className="relative overflow-hidden rounded-[24px] border border-[#1f2136] bg-[linear-gradient(135deg,#0b0d1a_0%,#0d1324_55%,#111a31_100%)] p-6 sm:p-8 lg:p-10">
            <div className="absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-[#1f7cff]/10 blur-3xl" />
            <div className="absolute bottom-[-100px] left-[-60px] h-[200px] w-[200px] rounded-full bg-[#7c3aed]/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[760px]">
                <div className="inline-flex rounded-full border border-[#2b2f45] bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#c9d2ff]">
                  UFO Exclusive Offers
                </div>

                <h1 className="mt-4 text-[30px] font-semibold leading-tight sm:text-[38px] lg:text-[46px]">
                  Discount Coupons
                </h1>

                <p className="mt-3 max-w-[620px] text-[14px] leading-7 text-[#9aa3cc] sm:text-[15px]">
                  Collect your discount coupons here and use them in your cart.
                  Available offers can help you save on products, flat discounts,
                  and even free shipping.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/cartpage"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[12px] font-medium uppercase tracking-[0.16em] transition hover:bg-white/10"
                >
                  Go to Cart
                </Link>
                <button
                  type="button"
                  onClick={() => router.push("/homepage")}
                  className="rounded-full bg-white px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#050611] transition hover:bg-white/90"
                >
                  Back Home
                </button>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[22px] border border-[#1f2136] bg-[#0b0d1a]/90 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.18em] text-[#8b90ad]">
                  Available Coupons
                </div>
                <div className="mt-1 text-[13px] text-[#9aa3cc]">
                  Collect one coupon or collect all available offers.
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadAll}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] uppercase tracking-[0.16em] transition hover:bg-white/10"
                >
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={collectAll}
                  className="rounded-full bg-[#1f7cff] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#2a86ff]"
                >
                  Collect All
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 rounded-[16px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-white/60">
                Loading…
              </div>
            ) : available.length === 0 ? (
              <div className="mt-6 rounded-[16px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-[#9aa3cc]">
                No active coupons right now.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {available.map((c) => {
                  const already = collectedCodeSet.has(
                    (c.code || "").toUpperCase()
                  );

                  return (
                    <div
                      key={c.id}
                      className="group relative overflow-hidden rounded-[20px] border border-[#2b2f45] bg-[linear-gradient(180deg,rgba(14,18,32,0.92)_0%,rgba(10,13,24,0.96)_100%)] p-5 transition duration-300 hover:border-[#1f7cff] hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:p-6"
                    >
                      <div className="absolute right-[-30px] top-[-30px] h-[120px] w-[120px] rounded-full bg-[#1f7cff]/10 blur-2xl" />

                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[18px] font-semibold text-white">
                            {c.title || "Coupon"}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[#9aa3cc]">
                            <span>Code:</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold tracking-[0.08em] text-white">
                              {c.code}
                            </span>
                          </div>

                          <div className="mt-3 text-[13px] text-[#c7d2fe]">
                            {fmtCoupon(c)}
                            {c.minOrder ? ` • Min Rs ${c.minOrder}` : ""}
                          </div>

                          {c.description ? (
                            <div className="mt-3 text-[13px] leading-6 text-[#9aa3cc]">
                              {c.description}
                            </div>
                          ) : null}

                          {c.endAt ? (
                            <div className="mt-3 text-[12px] text-[#8b90ad]">
                              Valid until:{" "}
                              {new Date(c.endAt).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                            already
                              ? "border-green-500/25 bg-green-500/15 text-green-300"
                              : "border-white/10 bg-white/10 text-white/80"
                          }`}
                        >
                          {already ? "COLLECTED" : "NEW"}
                        </span>
                      </div>

                      <div className="relative z-10 mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => collectOne(c.code)}
                          disabled={already}
                          className={`rounded-[12px] px-4 py-2.5 text-[12px] font-semibold transition ${
                            already
                              ? "cursor-not-allowed bg-white/10 text-white/40"
                              : "bg-white text-[#050611] hover:bg-white/90"
                          }`}
                        >
                          {already ? "Collected" : "Collect"}
                        </button>

                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(c.code)}
                          className="rounded-[12px] border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] transition hover:bg-white/10"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold text-white">
                  My Collected Coupons
                </h2>
                <p className="mt-1 text-[13px] text-[#9aa3cc]">
                  Your saved coupon codes ready to use in cart.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[16px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-white/60">
                Loading…
              </div>
            ) : collected.length === 0 ? (
              <div className="rounded-[16px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-[#9aa3cc]">
                No collected coupons yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {collected.map((r) => {
                  const c = r.coupon;

                  return (
                    <div
                      key={r.id}
                      className="rounded-[20px] border border-[#2b2f45] bg-[#0b0f1a]/70 p-5 transition hover:border-[#3b82f6]/50 sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[18px] font-semibold text-white">
                            {c.title || "Coupon"}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[#9aa3cc]">
                            <span>Code:</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold tracking-[0.08em] text-white">
                              {c.code}
                            </span>
                          </div>

                          <div className="mt-3 text-[13px] text-[#c7d2fe]">
                            {fmtCoupon({
                              type: c.type,
                              value: c.value,
                              maxDiscountCap: c.maxDiscountCap,
                            })}
                            {c.minOrder ? ` • Min Rs ${c.minOrder}` : ""}
                          </div>

                          {c.endAt ? (
                            <div className="mt-3 text-[12px] text-[#8b90ad]">
                              Valid until:{" "}
                              {new Date(c.endAt).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                            r.usedAt
                              ? "border-red-500/25 bg-red-500/15 text-red-300"
                              : "border-green-500/25 bg-green-500/15 text-green-300"
                          }`}
                        >
                          {r.usedAt ? "USED" : "COLLECTED"}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem("ufo_coupon_selected", c.code);
                            router.push("/cartpage");
                          }}
                          className="rounded-[12px] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#050611] transition hover:bg-white/90"
                        >
                          Use in Cart
                        </button>

                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(c.code)}
                          className="rounded-[12px] border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] transition hover:bg-white/10"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}