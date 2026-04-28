"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CollectionHeader from "@/components/layout/CollectionHeader";
import MainFooter from "@/components/layout/MainFooter";

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

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
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
  if (c.type === "FREESHIP") return "FREE SHIPPING";

  return "";
}

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 pb-8 pt-4 sm:px-5 sm:pb-10 sm:pt-6 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export default function DiscountsPage() {
  const router = useRouter();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api";

  const [available, setAvailable] = React.useState<AvailableCoupon[]>([]);
  const [collected, setCollected] = React.useState<CollectedRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState("");

  const collectedCodeSet = React.useMemo(() => {
    return new Set(
      collected
        .map((r) => (r?.coupon?.code || "").toUpperCase())
        .filter(Boolean)
    );
  }, [collected]);

  const showToast = React.useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const loadAll = React.useCallback(async () => {
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
      showToast("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, showToast]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const collectOne = async (code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) return;

    await fetch(`${API_BASE}/discounts/collect/${encodeURIComponent(c)}`, {
      method: "POST",
      credentials: "include",
    });

    showToast("Coupon collected.");
    await loadAll();
  };

  const collectAll = async () => {
    await fetch(`${API_BASE}/discounts/collect-all`, {
      method: "POST",
      credentials: "include",
    });

    showToast("All available coupons collected.");
    await loadAll();
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Coupon code copied.");
    } catch {
      showToast("Failed to copy code.");
    }
  };

  return (
    <>
      <CollectionHeader />

      {toast ? (
        <div className="fixed right-4 top-24 z-[9999] rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          {toast}
        </div>
      ) : null}

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                UFO Exclusive Offers
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Discount Coupons
              </h1>

              <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-[#a7aec4]">
                Collect available coupons and use them in your cart for product
                discounts, flat savings, and free shipping.
              </p>
            </div>

            <Link href="/cartpage" className={secondaryBtnClass}>
              Go to Cart
            </Link>
          </div>

          <section className={`${panelClass} overflow-hidden p-5 sm:p-6`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Available Coupons
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Collect Offers
                </h2>

                <p className="mt-2 text-[13px] text-[#a7aec4]">
                  Save one coupon or collect all active offers.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadAll}
                  className={secondaryBtnClass}
                >
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={collectAll}
                  className={primaryBtnClass}
                >
                  Collect All
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5"
                  >
                    <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
                    <div className="mt-4 h-7 w-56 animate-pulse rounded bg-white/5" />
                    <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/5" />
                    <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : available.length === 0 ? (
              <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-6 text-[#a7aec4]">
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
                      className="relative overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824] p-5 transition hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)] sm:p-6"
                    >
                      <div className="absolute right-[-40px] top-[-40px] h-[140px] w-[140px] rounded-full bg-[#d6c7ff]/10 blur-3xl" />

                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[18px] font-semibold text-white">
                            {c.title || "Coupon"}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[#a7aec4]">
                            <span>Code:</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold tracking-[0.08em] text-white">
                              {c.code}
                            </span>
                          </div>

                          <div className="mt-3 text-[14px] font-semibold text-[#d6c7ff]">
                            {fmtCoupon(c)}
                            {c.minOrder ? ` • Min Rs ${c.minOrder}` : ""}
                          </div>

                          {c.description ? (
                            <p className="mt-3 text-[13px] leading-6 text-[#a7aec4]">
                              {c.description}
                            </p>
                          ) : null}

                          {c.endAt ? (
                            <div className="mt-3 text-[12px] text-[#a7aec4]">
                              Valid until:{" "}
                              {new Date(c.endAt).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                            already
                              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-[#d6dbeb]"
                          }`}
                        >
                          {already ? "Collected" : "New"}
                        </span>
                      </div>

                      <div className="relative z-10 mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => collectOne(c.code)}
                          disabled={already}
                          className={`rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition ${
                            already
                              ? "cursor-not-allowed bg-white/10 text-white/40"
                              : "bg-white text-[#090a12] hover:-translate-y-0.5 hover:bg-white/90"
                          }`}
                        >
                          {already ? "Collected" : "Collect"}
                        </button>

                        <button
                          type="button"
                          onClick={() => copyCode(c.code)}
                          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
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

          <section className="mt-8">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Saved Offers
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  My Collected Coupons
                </h2>

                <p className="mt-2 text-[13px] text-[#a7aec4]">
                  Your saved coupon codes are ready to use in cart.
                </p>
              </div>
            </div>

            {loading ? (
              <div className={`${panelClass} p-6 text-[#a7aec4]`}>
                Loading collected coupons...
              </div>
            ) : collected.length === 0 ? (
              <div className={`${panelClass} p-6 text-[#a7aec4]`}>
                No collected coupons yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {collected.map((r) => {
                  const c = r.coupon;

                  return (
                    <div
                      key={r.id}
                      className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 transition hover:border-[#4a506b] sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[18px] font-semibold text-white">
                            {c.title || "Coupon"}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[#a7aec4]">
                            <span>Code:</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold tracking-[0.08em] text-white">
                              {c.code}
                            </span>
                          </div>

                          <div className="mt-3 text-[14px] font-semibold text-[#d6c7ff]">
                            {fmtCoupon({
                              type: c.type,
                              value: c.value,
                              maxDiscountCap: c.maxDiscountCap,
                            })}
                            {c.minOrder ? ` • Min Rs ${c.minOrder}` : ""}
                          </div>

                          {c.endAt ? (
                            <div className="mt-3 text-[12px] text-[#a7aec4]">
                              Valid until:{" "}
                              {new Date(c.endAt).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                            r.usedAt
                              ? "border-red-400/30 bg-red-500/10 text-red-300"
                              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          }`}
                        >
                          {r.usedAt ? "Used" : "Collected"}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem(
                              "ufo_coupon_selected",
                              c.code
                            );
                            router.push("/cartpage");
                          }}
                          disabled={Boolean(r.usedAt)}
                          className={`${primaryBtnClass} disabled:cursor-not-allowed`}
                        >
                          Use in Cart
                        </button>

                        <button
                          type="button"
                          onClick={() => copyCode(c.code)}
                          className={secondaryBtnClass}
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

      <MainFooter />
    </>
  );
}