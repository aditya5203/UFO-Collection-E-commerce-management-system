"use client";

import React from "react";
import Link from "next/link";
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

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function fmtCoupon(c: { type: string; value: number; maxDiscountCap?: number | null }) {
  if (c.type === "PERCENT") {
    const cap = c.maxDiscountCap ? ` (Max Rs ${c.maxDiscountCap})` : "";
    return `${c.value}% OFF${cap}`;
  }
  if (c.type === "FLAT") return `Rs ${c.value} OFF`;
  if (c.type === "FREESHIP") return `FREE SHIPPING`;
  return "";
}

export default function DiscountsPage() {
  const router = useRouter();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8080/api";

  const [available, setAvailable] = React.useState<AvailableCoupon[]>([]);
  const [collected, setCollected] = React.useState<CollectedRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const collectedCodeSet = React.useMemo(() => {
    return new Set(collected.map((r) => (r?.coupon?.code || "").toUpperCase()).filter(Boolean));
  }, [collected]);

  const loadAll = async () => {
    try {
      setLoading(true);

      // public available coupons
      const aRes = await fetch(`${API_BASE}/discounts/available`, { cache: "no-store" });
      const aJson = await safeJson(aRes);
      setAvailable(Array.isArray(aJson?.data) ? aJson.data : []);

      // my collected (requires login)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <main className="min-h-screen bg-[#070a12] text-white">
      <div className="mx-auto max-w-[1160px] px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold">Discount Coupons</h1>
            <p className="mt-1 text-[13px] text-[#9aa3cc]">
              Collect coupons and they will auto-apply in your cart.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/cart"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[13px] uppercase tracking-[0.16em] hover:bg-white/10"
            >
              Go to Cart
            </Link>
            <button
              onClick={() => router.push("/homepage")}
              className="rounded-full bg-white px-5 py-2 text-[13px] uppercase tracking-[0.16em] text-[#050611] hover:bg-white/90"
            >
              Back Home
            </button>
          </div>
        </div>

        {/* AVAILABLE */}
        <div className="mt-8 rounded-[18px] border border-[#1f2136] bg-[#0b0d1a] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[12px] uppercase tracking-[0.18em] text-[#8b90ad]">
                Available Coupons
              </div>
              <div className="mt-1 text-[13px] text-[#9aa3cc]">
                You can collect one or collect all.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadAll}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] hover:bg-white/10"
              >
                Refresh
              </button>

              <button
                onClick={collectAll}
                className="rounded-full bg-[#1f7cff] px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
              >
                Collect All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 text-white/60">Loading…</div>
          ) : available.length === 0 ? (
            <div className="mt-6 rounded-[14px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-[#9aa3cc]">
              No active coupons right now.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {available.map((c) => {
                const already = collectedCodeSet.has((c.code || "").toUpperCase());
                return (
                  <div
                    key={c.id}
                    className="rounded-[16px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[16px] font-semibold">{c.title || "Coupon"}</div>
                        <div className="mt-1 text-[13px] text-[#9aa3cc]">
                          Code: <span className="text-white font-semibold">{c.code}</span>
                        </div>
                        <div className="mt-1 text-[12px] text-[#9aa3cc]">
                          {fmtCoupon(c)}
                          {c.minOrder ? ` • Min Rs ${c.minOrder}` : ""}
                        </div>
                        {c.description ? (
                          <div className="mt-2 text-[12px] text-[#9aa3cc]">{c.description}</div>
                        ) : null}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                          already
                            ? "bg-green-500/15 text-green-300 border border-green-500/25"
                            : "bg-white/10 text-white/80 border border-white/10"
                        }`}
                      >
                        {already ? "COLLECTED" : "NEW"}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => collectOne(c.code)}
                        disabled={already}
                        className={`rounded-[12px] px-4 py-2 text-[12px] font-semibold ${
                          already
                            ? "bg-white/10 text-white/40 cursor-not-allowed"
                            : "bg-white text-[#050611]"
                        }`}
                      >
                        {already ? "Collected" : "Collect"}
                      </button>

                      <button
                        onClick={() => navigator.clipboard.writeText(c.code)}
                        className="rounded-[12px] border border-white/15 bg-white/5 px-4 py-2 text-[12px] hover:bg-white/10"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MY COLLECTED */}
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold">My Collected Coupons</h2>
          </div>

          {loading ? (
            <div className="text-white/60">Loading…</div>
          ) : collected.length === 0 ? (
            <div className="rounded-[14px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-[#9aa3cc]">
              No collected coupons yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {collected.map((r) => {
                const c = r.coupon;
                return (
                  <div
                    key={r.id}
                    className="rounded-[16px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[16px] font-semibold">{c.title || "Coupon"}</div>
                        <div className="mt-1 text-[13px] text-[#9aa3cc]">
                          Code: <span className="text-white font-semibold">{c.code}</span>
                        </div>
                        <div className="mt-1 text-[12px] text-[#9aa3cc]">
                          {fmtCoupon({ type: c.type, value: c.value, maxDiscountCap: c.maxDiscountCap })}
                          {c.minOrder ? ` • Min Rs ${c.minOrder}` : ""}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                          r.usedAt
                            ? "bg-red-500/15 text-red-300 border border-red-500/25"
                            : "bg-green-500/15 text-green-300 border border-green-500/25"
                        }`}
                      >
                        {r.usedAt ? "USED" : "COLLECTED"}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => {
                          localStorage.setItem("ufo_coupon_selected", c.code);
                          router.push("/cart");
                        }}
                        className="rounded-[12px] bg-white px-4 py-2 text-[12px] font-semibold text-[#050611]"
                      >
                        Use in Cart
                      </button>

                      <button
                        onClick={() => navigator.clipboard.writeText(c.code)}
                        className="rounded-[12px] border border-white/15 bg-white/5 px-4 py-2 text-[12px] hover:bg-white/10"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
