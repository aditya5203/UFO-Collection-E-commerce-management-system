"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type CartItem = {
  id: string;
  name: string;
  size: string;
  color: string;
  colorLabel: string;
  price: number;
  qty: number;
  image: string;
  stock?: number;
};

type CollectedCouponRow = {
  id: string;
  status: "COLLECTED" | "USED";
  usedAt?: string | null;
  coupon: {
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
};

type Toast = {
  id: number;
  type: "success" | "error";
  message: string;
  undo?: () => void;
};

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

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

function normalizeColorKey(color: string) {
  return String(color || "").trim().toLowerCase();
}

function getColorSwatchClass(color: string) {
  const c = normalizeColorKey(color);

  const map: Record<string, string> = {
    black: "bg-black",
    "#000000": "bg-black",
    "#16191f": "bg-black",
    "#111827": "bg-black",
    white: "bg-white",
    "#ffffff": "bg-white",
    red: "bg-red-500",
    "#ef4444": "bg-red-500",
    blue: "bg-blue-500",
    "#3b82f6": "bg-blue-500",
    navy: "bg-blue-900",
    "navy blue": "bg-blue-900",
    "#000080": "bg-blue-900",
    green: "bg-green-500",
    "#22c55e": "bg-green-500",
    yellow: "bg-yellow-400",
    "#eab308": "bg-yellow-400",
    gray: "bg-gray-500",
    grey: "bg-gray-500",
    "#808080": "bg-gray-500",
    "#9ca3af": "bg-gray-400",
    pink: "bg-pink-500",
    "#ec4899": "bg-pink-500",
    purple: "bg-purple-500",
    "#a855f7": "bg-purple-500",
    orange: "bg-orange-500",
    "#f97316": "bg-orange-500",
  };

  return map[c] || "bg-neutral-800";
}

function hasRealStockValue(stock: unknown) {
  return typeof stock === "number" && Number.isFinite(stock);
}

export default function CartPage() {
  const router = useRouter();

  const [items, setItems] = React.useState<CartItem[]>([]);
  const [discount, setDiscount] = React.useState("");
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = React.useState("");
  const [appliedCouponLabel, setAppliedCouponLabel] = React.useState("");
  const [couponMessage, setCouponMessage] = React.useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);

  const [authChecked, setAuthChecked] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);

  const shipping = 100;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api";

  const showToast = React.useCallback(
    (type: "success" | "error", message: string, undo?: () => void) => {
      const nextToast = { id: Date.now(), type, message, undo };
      setToast(nextToast);

      window.setTimeout(() => {
        setToast((current) => (current?.id === nextToast.id ? null : current));
      }, 3000);
    },
    []
  );

  React.useEffect(() => {
    let alive = true;

    async function checkAuth() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!alive) return;
        setIsLoggedIn(res.ok);
      } catch {
        if (!alive) return;
        setIsLoggedIn(false);
      } finally {
        if (!alive) return;
        setAuthChecked(true);
      }
    }

    checkAuth();

    return () => {
      alive = false;
    };
  }, [API_BASE]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ufo_cart");
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  const saveCart = React.useCallback((next: CartItem[]) => {
    setItems(next);
    localStorage.setItem("ufo_cart", JSON.stringify(next));
    window.dispatchEvent(new Event("ufo_cart_updated"));
  }, []);

  const subtotal = React.useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0),
        0
      ),
    [items]
  );

  const hasStockIssue = React.useMemo(() => {
    return items.some((it) => {
      if (!hasRealStockValue(it.stock)) return false;

      const stock = Number(it.stock);
      const qty = Number(it.qty || 0);

      return stock <= 0 || qty > stock;
    });
  }, [items]);

  const total = Math.max(
    0,
    subtotal + (items.length ? shipping : 0) - discountAmount
  );

  const updateQty = (
    id: string,
    size: string,
    color: string,
    qty: number
  ) => {
    const item = items.find(
      (it) => it.id === id && it.size === size && it.color === color
    );

    const hasKnownStock = hasRealStockValue(item?.stock);
    const stock = Number(item?.stock || 0);

    const safe = hasKnownStock
      ? Math.max(1, Math.min(stock > 0 ? stock : 1, qty || 1))
      : Math.max(1, Math.min(99, qty || 1));

    if (hasKnownStock && stock <= 0) {
      showToast("error", "This item is out of stock. Please remove it.");
    } else if (hasKnownStock && qty > stock) {
      showToast("error", `Only ${stock} item(s) available in stock.`);
    }

    const next = items.map((it) =>
      it.id === id && it.size === size && it.color === color
        ? { ...it, qty: safe }
        : it
    );

    saveCart(next);
  };

  const removeItem = (id: string, size: string, color: string) => {
    const removedItem = items.find(
      (it) => it.id === id && it.size === size && it.color === color
    );

    const next = items.filter(
      (it) => !(it.id === id && it.size === size && it.color === color)
    );

    saveCart(next);

    if (removedItem) {
      showToast("success", "Item removed.", () => {
        saveCart([...next, removedItem]);
      });
    }
  };

  const buildValidatePayload = React.useCallback(
    (couponCode: string) => ({
      couponCode,
      items: items.map((i) => ({
        productId: i.id,
        qty: i.qty,
      })),
      shippingPaisa: shipping * 100,
    }),
    [items]
  );

  const validateCoupon = React.useCallback(
    async (couponCode: string) => {
      const res = await fetch(`${API_BASE}/discounts/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildValidatePayload(couponCode.trim())),
      });

      const json = await safeJson(res);

      const discountPaisa = Number(json?.data?.discountPaisa || 0);
      const appliedCode = String(
        json?.data?.couponCode ||
          json?.data?.appliedCouponCode ||
          couponCode ||
          ""
      ).trim();

      return {
        ok: res.ok,
        json,
        discountPaisa,
        discountRs: Math.round(discountPaisa / 100),
        appliedCode,
      };
    },
    [API_BASE, buildValidatePayload]
  );

  const clearAppliedCoupon = React.useCallback(
    (silent = false) => {
      setDiscount("");
      setDiscountAmount(0);
      setAppliedCouponCode("");
      setAppliedCouponLabel("");
      setCouponMessage("");
      localStorage.removeItem("ufo_coupon_selected");

      if (!silent) {
        showToast("success", "Coupon removed.");
      }
    },
    [showToast]
  );

  const autoApplyBestCoupon = React.useCallback(async () => {
    if (!items.length) {
      clearAppliedCoupon(true);
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const preferredCode =
        localStorage.getItem("ufo_coupon_selected")?.trim().toUpperCase() || "";

      const collectedRes = await fetch(`${API_BASE}/discounts/my-collected`, {
        credentials: "include",
        cache: "no-store",
      });

      const collectedJson = await safeJson(collectedRes);
      const collectedRows: CollectedCouponRow[] = Array.isArray(
        collectedJson?.data
      )
        ? collectedJson.data
        : [];

      const validCollected = collectedRows.filter(
        (row) =>
          row?.status === "COLLECTED" &&
          !row?.usedAt &&
          row?.coupon?.code &&
          (!row?.coupon?.endAt ||
            new Date(row.coupon.endAt).getTime() >= Date.now())
      );

      if (!validCollected.length) {
        clearAppliedCoupon(true);
        return;
      }

      const uniqueCodes = Array.from(
        new Set(
          validCollected
            .map((row) => row.coupon.code.trim().toUpperCase())
            .filter(Boolean)
        )
      );

      const orderedCodes = preferredCode
        ? [preferredCode, ...uniqueCodes.filter((code) => code !== preferredCode)]
        : uniqueCodes;

      let bestDiscountRs = 0;
      let bestCode = "";
      let bestLabel = "";

      for (const code of orderedCodes) {
        try {
          const result = await validateCoupon(code);

          if (!result.ok || result.discountRs <= 0) continue;

          const row = validCollected.find(
            (r) => r.coupon.code.trim().toUpperCase() === code
          );

          if (!row) continue;

          const label = fmtCoupon({
            type: row.coupon.type,
            value: row.coupon.value,
            maxDiscountCap: row.coupon.maxDiscountCap,
          });

          if (preferredCode && code === preferredCode) {
            bestDiscountRs = result.discountRs;
            bestCode = code;
            bestLabel = label;
            break;
          }

          if (result.discountRs > bestDiscountRs) {
            bestDiscountRs = result.discountRs;
            bestCode = code;
            bestLabel = label;
          }
        } catch {
          // ignore invalid coupon
        }
      }

      if (bestDiscountRs > 0 && bestCode) {
        setDiscount(bestCode);
        setDiscountAmount(bestDiscountRs);
        setAppliedCouponCode(bestCode);
        setAppliedCouponLabel(bestLabel);
        setCouponMessage("Best available coupon applied automatically.");
        localStorage.setItem("ufo_coupon_selected", bestCode);
      } else {
        clearAppliedCoupon(true);
      }
    } catch {
      clearAppliedCoupon(true);
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [API_BASE, items, validateCoupon, clearAppliedCoupon]);

  React.useEffect(() => {
    autoApplyBestCoupon();
  }, [autoApplyBestCoupon]);

  const applyManualCoupon = async () => {
    if (!items.length || !discount.trim()) {
      showToast("error", "Please enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponMessage("");

    try {
      const result = await validateCoupon(discount.trim());

      if (!result.ok || result.discountRs <= 0) {
        setDiscountAmount(0);
        setAppliedCouponCode("");
        setAppliedCouponLabel("");
        setCouponMessage("Coupon is invalid or not applicable for this cart.");
        showToast("error", "Coupon failed.");
        return;
      }

      const code = result.appliedCode || discount.trim().toUpperCase();

      setDiscount(code);
      setDiscountAmount(result.discountRs);
      setAppliedCouponCode(code);
      setAppliedCouponLabel("Coupon applied successfully.");
      setCouponMessage("Coupon applied successfully.");

      localStorage.setItem("ufo_coupon_selected", code);
      showToast("success", "Coupon applied.");
    } catch {
      setDiscountAmount(0);
      setAppliedCouponCode("");
      setAppliedCouponLabel("");
      setCouponMessage("Failed to apply coupon.");
      showToast("error", "Failed to apply coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const proceedToCheckout = () => {
    if (hasStockIssue) {
      showToast(
        "error",
        "Some cart items are out of stock or exceed available stock."
      );
      return;
    }

    if (!authChecked) {
      showToast("error", "Checking login status. Please try again.");
      return;
    }

    const orderSummary = {
      subtotal,
      shipping: items.length ? shipping : 0,
      discount: discountAmount,
      total,
      currency: "NPR",
      updatedAt: new Date().toISOString(),
      couponCode: appliedCouponCode || discount.trim() || null,
    };

    localStorage.setItem("ufo_order_summary", JSON.stringify(orderSummary));

    if (!isLoggedIn) {
      localStorage.setItem("ufo_redirect_after_login", "/checkout");
      showToast("error", "Redirecting to login...");
      router.push("/login");
      return;
    }

    router.push("/checkout");
  };

  return (
    <>
      <CartHeader />

      {toast ? (
        <div className="fixed right-4 top-24 z-[9999]">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur ${
              toast.type === "error"
                ? "border-red-400/30 bg-red-500/20 text-red-100"
                : "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
            }`}
          >
            <span>{toast.message}</span>

            {toast.undo ? (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white transition hover:bg-white/10"
              >
                Undo
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Your Bag
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Shopping Cart
              </h1>

              <p className="mt-2 text-[13px] text-[#a7aec4]">
                Review your selected products before checkout.
              </p>
            </div>

            <Link href="/collection" className={secondaryBtnClass}>
              Continue Shopping
            </Link>
          </div>

          {items.length === 0 ? (
            <div className={`${panelClass} p-8 text-center sm:p-12`}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/5">
                <Image
                  src="/images/cart-empty.png"
                  alt="Empty cart"
                  width={44}
                  height={44}
                  className="opacity-90"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-[28px]">🛒</span>
              </div>

              <h2 className="mt-5 text-[24px] font-semibold text-white">
                Your cart is empty
              </h2>

              <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-7 text-[#a7aec4]">
                Browse the latest UFO Collection products and add your favorite
                items to your cart.
              </p>

              <button
                type="button"
                onClick={() => router.push("/collection")}
                className={`${primaryBtnClass} mt-6`}
              >
                Go to Collection
              </button>
            </div>
          ) : (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
              <section className={`${panelClass} overflow-hidden`}>
                <div className="hidden grid-cols-[1.5fr_0.65fr_0.85fr_0.9fr_0.9fr_0.35fr] gap-4 border-b border-[#26293a] px-6 py-4 text-[12px] uppercase tracking-[0.14em] text-[#a7aec4] md:grid">
                  <div>Product</div>
                  <div>Size</div>
                  <div>Color</div>
                  <div className="text-center">Quantity</div>
                  <div>Total</div>
                  <div />
                </div>

                {items.map((it) => {
                  const hasKnownStock = hasRealStockValue(it.stock);
                  const stock = Number(it.stock || 0);
                  const qty = Number(it.qty || 0);
                  const itemTotal = Number(it.price || 0) * qty;

                  const itemHasStockIssue =
                    hasKnownStock && (stock <= 0 || qty > stock);

                  const lowStockText =
                    hasKnownStock && stock > 0 && stock <= 5
                      ? `Only ${stock} left 🔥`
                      : "";

                  return (
                    <div
                      key={`${it.id}-${it.size}-${it.color}`}
                      className={`border-b px-4 py-5 last:border-0 sm:px-5 md:px-6 md:py-6 ${
                        itemHasStockIssue
                          ? "border-red-400/20 bg-red-500/5"
                          : "border-[#1b2034]"
                      }`}
                    >
                      <div className="hidden grid-cols-[1.5fr_0.65fr_0.85fr_0.9fr_0.9fr_0.35fr] items-center gap-4 md:grid">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[18px] border border-[#2b2f45] bg-[#0d0f17]">
                            <Image
                              src={it.image}
                              alt={it.name}
                              fill
                              className={`object-cover ${
                                itemHasStockIssue ? "opacity-50 grayscale" : ""
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="truncate font-medium text-white">
                              {it.name}
                            </div>

                            <div className="mt-1 text-[12px] text-[#a7aec4]">
                              Rs. {it.price} × {it.qty} = Rs. {itemTotal}
                            </div>

                            {hasKnownStock ? (
                              <div
                                className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                                  itemHasStockIssue
                                    ? "text-red-300"
                                    : lowStockText
                                      ? "text-orange-300"
                                      : "text-emerald-300"
                                }`}
                              >
                                {stock <= 0
                                  ? "Out of Stock"
                                  : lowStockText || `${stock} in stock`}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <span className="text-[#d6dbeb]">{it.size}</span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`h-4 w-4 rounded-full border border-[#3a3f58] ${getColorSwatchClass(
                              it.color
                            )}`}
                          />

                          <span className="truncate text-[#d6dbeb]">
                            {it.colorLabel || "Color"}
                          </span>
                        </div>

                        <div className="flex justify-center">
                          <div className="flex items-center rounded-full border border-[#3a3f58] bg-[#0d0f17] p-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateQty(
                                  it.id,
                                  it.size,
                                  it.color,
                                  Number(it.qty || 1) - 1
                                )
                              }
                              disabled={hasKnownStock && stock <= 0}
                              className="h-8 w-8 rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Decrease quantity for ${it.name}`}
                            >
                              -
                            </button>

                            <span className="min-w-[38px] text-center text-sm font-semibold text-white">
                              {it.qty}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQty(
                                  it.id,
                                  it.size,
                                  it.color,
                                  Number(it.qty || 1) + 1
                                )
                              }
                              disabled={hasKnownStock && stock <= 0}
                              className="h-8 w-8 rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Increase quantity for ${it.name}`}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-[#d6c7ff]">
                            Rs. {itemTotal}
                          </div>

                          <div className="mt-1 text-[11px] text-[#a7aec4]">
                            Rs. {it.price} × {it.qty}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(it.id, it.size, it.color)}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-red-500/15"
                          aria-label={`Remove ${it.name} from cart`}
                        >
                          <Image
                            src="/images/delete.png"
                            width={18}
                            height={18}
                            alt="Remove icon"
                            className="brightness-0 invert"
                          />
                        </button>
                      </div>

                      <div className="flex gap-4 md:hidden">
                        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[18px] border border-[#2b2f45] bg-[#0d0f17]">
                          <Image
                            src={it.image}
                            alt={it.name}
                            fill
                            className={`object-cover ${
                              itemHasStockIssue ? "opacity-50 grayscale" : ""
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold text-white">
                            {it.name}
                          </div>

                          {hasKnownStock ? (
                            <div
                              className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                                itemHasStockIssue
                                  ? "text-red-300"
                                  : lowStockText
                                    ? "text-orange-300"
                                    : "text-emerald-300"
                              }`}
                            >
                              {stock <= 0
                                ? "Out of Stock"
                                : lowStockText || `${stock} in stock`}
                            </div>
                          ) : null}

                          <div className="mt-2 grid gap-1 text-sm text-[#a7aec4]">
                            <div>Size: {it.size}</div>

                            <div className="flex items-center gap-2">
                              <span>Color:</span>

                              <span
                                className={`h-4 w-4 rounded-full border border-[#3a3f58] ${getColorSwatchClass(
                                  it.color
                                )}`}
                              />

                              <span className="truncate">
                                {it.colorLabel || "Color"}
                              </span>
                            </div>

                            <div className="font-semibold text-[#d6c7ff]">
                              Rs. {it.price} × {it.qty} = Rs. {itemTotal}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="flex items-center rounded-full border border-[#3a3f58] bg-[#0d0f17] p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQty(
                                    it.id,
                                    it.size,
                                    it.color,
                                    Number(it.qty || 1) - 1
                                  )
                                }
                                disabled={hasKnownStock && stock <= 0}
                                className="h-8 w-8 rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Decrease quantity for ${it.name}`}
                              >
                                -
                              </button>

                              <span className="min-w-[38px] text-center text-sm font-semibold text-white">
                                {it.qty}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQty(
                                    it.id,
                                    it.size,
                                    it.color,
                                    Number(it.qty || 1) + 1
                                  )
                                }
                                disabled={hasKnownStock && stock <= 0}
                                className="h-8 w-8 rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Increase quantity for ${it.name}`}
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(it.id, it.size, it.color)
                              }
                              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-red-500/15"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              <aside className="xl:sticky xl:top-[104px]">
                <div className={`${panelClass} p-5 sm:p-6`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                        Summary
                      </div>

                      <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                        Order Summary
                      </h2>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-[#a7aec4]">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {hasStockIssue ? (
                    <div className="mt-5 rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
                      Some cart items are out of stock or exceed available
                      stock. Please update or remove them before checkout.
                    </div>
                  ) : null}

                  <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                    <div className="flex flex-col gap-3">
                      <label htmlFor="discount-code" className="sr-only">
                        Discount code
                      </label>

                      <input
                        id="discount-code"
                        value={discount}
                        onChange={(e) =>
                          setDiscount(e.target.value.toUpperCase())
                        }
                        placeholder="Discount code"
                        className="h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-white outline-none placeholder:text-[#7c86b1] transition focus:border-[#d6c7ff]"
                      />

                      <button
                        type="button"
                        onClick={applyManualCoupon}
                        disabled={isApplyingCoupon}
                        className={secondaryBtnClass}
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply Coupon"}
                      </button>
                    </div>

                    <div className="mt-3 text-[12px] leading-5 text-[#a7aec4]">
                      Collect coupons from{" "}
                      <Link href="/discounts" className="text-white underline">
                        Discounts
                      </Link>{" "}
                      and the best valid coupon will auto-apply here.
                    </div>

                    {appliedCouponCode ? (
                      <div className="mt-4 rounded-[16px] border border-green-500/20 bg-green-500/10 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-green-300">
                          Applied Coupon
                        </div>

                        <div className="mt-1 text-sm font-semibold text-white">
                          {appliedCouponCode}
                        </div>

                        {appliedCouponLabel ? (
                          <div className="mt-1 text-xs text-green-200">
                            {appliedCouponLabel}
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => clearAppliedCoupon(false)}
                          className="mt-3 rounded-full border border-green-300/20 px-3 py-1 text-xs font-semibold text-green-100 transition hover:bg-green-500/10"
                        >
                          Remove Coupon
                        </button>
                      </div>
                    ) : null}

                    {couponMessage ? (
                      <div className="mt-4 text-[12px] text-[#a7aec4]">
                        {couponMessage}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 space-y-4 text-sm text-[#a7aec4] sm:text-[15px]">
                    <div className="flex items-center justify-between gap-4">
                      <span>Subtotal</span>
                      <span className="text-right text-white">
                        Rs. {subtotal}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span>Shipping</span>
                      <span className="text-right text-white">
                        Rs. {items.length ? shipping : 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span>Discount</span>
                      <span className="text-right text-green-400">
                        - Rs. {discountAmount}
                      </span>
                    </div>

                    <div className="h-px bg-[#26293a]" />

                    <div className="flex items-center justify-between gap-4 text-[18px] font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-right text-white">Rs. {total}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={proceedToCheckout}
                    disabled={hasStockIssue || !authChecked}
                    className={`${primaryBtnClass} mt-8 w-full justify-center`}
                  >
                    {hasStockIssue
                      ? "Fix Stock Issues"
                      : !authChecked
                        ? "Checking..."
                        : "Proceed to Checkout"}
                  </button>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      ["/images/payment.png", "Secure", "Payment"],
                      ["/images/return.png", "Easy", "Return"],
                      ["/images/cod.png", "COD", "Available"],
                    ].map(([icon, a, b]) => (
                      <div
                        key={`${a}-${b}`}
                        className="rounded-[16px] border border-[#26293a] bg-[#161824] p-3 text-center"
                      >
                        <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                          <Image
                            src={icon}
                            alt={`${a} ${b}`}
                            width={18}
                            height={18}
                            className="object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>

                        <div className="text-[12px] font-semibold text-white">
                          {a}
                        </div>

                        <div className="text-[11px] text-[#a7aec4]">{b}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <MainFooter />
    </>
  );
}