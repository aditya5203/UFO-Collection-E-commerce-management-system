"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";
import CartToast from "./_components/CartToast";
import CartHero from "./_components/CartHero";
import EmptyCart from "./_components/EmptyCart";
import CartItems from "./_components/CartItems";
import OrderSummary from "./_components/OrderSummary";

type CartItem = {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  size: string;
  color: string;
  colorLabel: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  qty: number;
  image: string;
  stock?: number;
  totalProductStock?: number;
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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

const CART_KEY = "ufo_cart";
const SELECTED_COUPON_KEY = "ufo_coupon_selected";
const ORDER_SUMMARY_KEY = "ufo_order_summary";
const REDIRECT_AFTER_LOGIN_KEY = "ufo_redirect_after_login";
const LAST_PRODUCT_ID_KEY = "last_product_id";

const shipping = 100;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

function formatNpr(value: number) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(Number(value || 0))))}`;
}

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
    const cap = c.maxDiscountCap ? ` Max ${formatNpr(c.maxDiscountCap)}` : "";
    return `${c.value}% OFF${cap ? ` (${cap})` : ""}`;
  }

  if (c.type === "FLAT") return `${formatNpr(c.value)} OFF`;
  if (c.type === "FREESHIP") return "FREE SHIPPING";

  return "Coupon applied";
}

function normalizeColorKey(color: string) {
  return String(color || "").trim().toLowerCase();
}

function hasRealStockValue(stock: unknown) {
  return typeof stock === "number" && Number.isFinite(stock);
}

function getCartItemKey(
  item: Pick<CartItem, "id" | "variantId" | "size" | "color">
) {
  if (item.variantId) return `variant:${item.variantId}`;

  return `product:${item.id}|size:${item.size}|color:${normalizeColorKey(
    item.color
  )}`;
}

function sanitizeCartItems(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item: any) => {
      const productId = String(item?.productId || item?.id || "").trim();
      const variantId = String(item?.variantId || "").trim();

      const price = Math.max(0, Number(item?.price || 0));

      const compareAtPrice =
        item?.compareAtPrice == null || item?.compareAtPrice === ""
          ? undefined
          : Math.max(0, Number(item.compareAtPrice || 0));

      const fallbackDiscount =
        compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : 0;

      const discountPercent =
        compareAtPrice && compareAtPrice > price
          ? Math.min(
              Math.max(
                Math.round(Number(item?.discountPercent || fallbackDiscount)),
                0
              ),
              100
            )
          : undefined;

      return {
        id: productId,
        productId,
        variantId: variantId || undefined,
        name: String(item?.name || "Product").trim(),
        size: String(item?.size || "").trim().toUpperCase(),
        color: String(item?.color || "").trim(),
        colorLabel: String(item?.colorLabel || "").trim(),
        sku: String(item?.sku || "").trim() || undefined,
        price,
        compareAtPrice,
        discountPercent,
        qty: Math.max(1, Math.min(99, Number(item?.qty || 1))),
        image: String(item?.image || "").trim(),
        stock: hasRealStockValue(item?.stock) ? Number(item.stock) : undefined,
        totalProductStock: hasRealStockValue(item?.totalProductStock)
          ? Number(item.totalProductStock)
          : undefined,
      };
    })
    .filter((item) => item.id && item.price >= 0);
}

export default function CartPage() {
  const router = useRouter();
  const { t } = useI18n();

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
  const [backHref, setBackHref] = React.useState("/collection");

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
    try {
      const lastProductId = localStorage.getItem(LAST_PRODUCT_ID_KEY);

      if (lastProductId) {
        setBackHref(`/product/${lastProductId}`);
      }
    } catch {
      setBackHref("/collection");
    }
  }, []);

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
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      setItems(sanitizeCartItems(parsed));
    } catch {
      setItems([]);
    }
  }, []);

  const saveCart = React.useCallback((nextItems: CartItem[]) => {
    const cleanItems = sanitizeCartItems(nextItems);

    setItems(cleanItems);
    localStorage.setItem(CART_KEY, JSON.stringify(cleanItems));
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

  const itemSavings = React.useMemo(
    () =>
      items.reduce((sum, item) => {
        const compareAtPrice = Number(item.compareAtPrice || 0);
        const price = Number(item.price || 0);
        const qty = Number(item.qty || 0);

        if (compareAtPrice > price) {
          return sum + (compareAtPrice - price) * qty;
        }

        return sum;
      }, 0),
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

  const clearAppliedCoupon = React.useCallback(
    (silent = false) => {
      setDiscount("");
      setDiscountAmount(0);
      setAppliedCouponCode("");
      setAppliedCouponLabel("");
      setCouponMessage("");
      localStorage.removeItem(SELECTED_COUPON_KEY);

      if (!silent) {
        showToast("success", t("cart.couponRemoved"));
      }
    },
    [showToast, t]
  );

  const buildValidatePayload = React.useCallback(
    (couponCode: string) => ({
      couponCode,
      items: items.map((i) => ({
        productId: i.productId || i.id,
        variantId: i.variantId || null,
        qty: i.qty,
      })),
      shippingPaisa: shipping * 100,
    }),
    [items]
  );

  const validateCoupon = React.useCallback(
    async (couponCode: string) => {
      const cleanCode = couponCode.trim().toUpperCase();

      const res = await fetch(`${API_BASE}/discounts/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildValidatePayload(cleanCode)),
      });

      const json = await safeJson(res);
      const applied = json?.data?.applied || null;

      const discountPaisa = Number(json?.data?.discountPaisa || 0);
      const appliedCode = String(
        applied?.code ||
          json?.data?.couponCode ||
          json?.data?.appliedCouponCode ||
          cleanCode ||
          ""
      )
        .trim()
        .toUpperCase();

      return {
        ok: res.ok,
        json,
        applied,
        discountPaisa,
        discountRs: Math.round(discountPaisa / 100),
        appliedCode,
      };
    },
    [buildValidatePayload]
  );

  const autoApplyBestCoupon = React.useCallback(async () => {
    if (!items.length) {
      clearAppliedCoupon(true);
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const preferredCode =
        localStorage.getItem(SELECTED_COUPON_KEY)?.trim().toUpperCase() || "";

      const collectedRes = await fetch(`${API_BASE}/discounts/my-collected`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!collectedRes.ok) {
        clearAppliedCoupon(true);
        return;
      }

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
          // Ignore invalid coupon while finding best coupon.
        }
      }

      if (bestDiscountRs > 0 && bestCode) {
        setDiscount(bestCode);
        setDiscountAmount(bestDiscountRs);
        setAppliedCouponCode(bestCode);
        setAppliedCouponLabel(bestLabel);
        setCouponMessage(t("cart.bestCouponApplied"));
        localStorage.setItem(SELECTED_COUPON_KEY, bestCode);
      } else {
        clearAppliedCoupon(true);
      }
    } catch {
      clearAppliedCoupon(true);
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [items, validateCoupon, clearAppliedCoupon, t]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      autoApplyBestCoupon();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [autoApplyBestCoupon]);

  const updateQty = (itemKey: string, qty: number) => {
    const item = items.find((it) => getCartItemKey(it) === itemKey);

    const hasKnownStock = hasRealStockValue(item?.stock);
    const stock = Number(item?.stock || 0);

    const safe = hasKnownStock
      ? Math.max(1, Math.min(stock > 0 ? stock : 1, qty || 1))
      : Math.max(1, Math.min(99, qty || 1));

    if (hasKnownStock && stock <= 0) {
      showToast("error", t("cart.selectedVariantOutOfStock"));
    } else if (hasKnownStock && qty > stock) {
      showToast(
        "error",
        `${t("cart.onlyLeft")} ${stock} ${t("cart.onlyItemsAvailable")}`
      );
    }

    const next = items.map((it) =>
      getCartItemKey(it) === itemKey ? { ...it, qty: safe } : it
    );

    saveCart(next);
  };

  const removeItem = (itemKey: string) => {
    const removedItem = items.find((it) => getCartItemKey(it) === itemKey);
    const next = items.filter((it) => getCartItemKey(it) !== itemKey);

    saveCart(next);

    if (removedItem) {
      showToast("success", t("cart.itemRemoved"), () => {
        saveCart([...next, removedItem]);
      });
    }
  };

  const applyManualCoupon = async () => {
    if (!items.length || !discount.trim()) {
      showToast("error", t("cart.enterCouponCode"));
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
        setCouponMessage(result.json?.message || t("cart.invalidCoupon"));
        showToast("error", t("cart.couponFailed"));
        return;
      }

      const code = result.appliedCode || discount.trim().toUpperCase();
      const applied = result.applied;

      setDiscount(code);
      setDiscountAmount(result.discountRs);
      setAppliedCouponCode(code);

      if (applied) {
        setAppliedCouponLabel(
          fmtCoupon({
            type: applied.type,
            value: Number(applied.value || 0),
            maxDiscountCap: applied.maxDiscountCap ?? null,
          })
        );
      } else {
        setAppliedCouponLabel(t("cart.couponAppliedSuccess"));
      }

      setCouponMessage(t("cart.couponAppliedSuccess"));
      localStorage.setItem(SELECTED_COUPON_KEY, code);
      showToast("success", t("cart.couponApplied"));
    } catch (err: any) {
      setDiscountAmount(0);
      setAppliedCouponCode("");
      setAppliedCouponLabel("");
      setCouponMessage(err?.message || t("cart.failedApplyCoupon"));
      showToast("error", t("cart.failedApplyCoupon"));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const proceedToCheckout = () => {
    if (!items.length) {
      showToast("error", t("cart.cartEmpty"));
      return;
    }

    if (hasStockIssue) {
      showToast("error", t("cart.cartStockIssue"));
      return;
    }

    if (!authChecked) {
      showToast("error", t("cart.checkingLogin"));
      return;
    }

    const orderSummary = {
      subtotal,
      shipping: items.length ? shipping : 0,
      discount: discountAmount,
      itemSavings,
      total,
      currency: "NPR",
      updatedAt: new Date().toISOString(),
      couponCode: appliedCouponCode || discount.trim().toUpperCase() || null,
      items: items.map((item) => ({
        productId: item.productId || item.id,
        variantId: item.variantId || null,
        name: item.name,
        size: item.size,
        color: item.color,
        colorLabel: item.colorLabel,
        sku: item.sku || null,
        price: item.price,
        compareAtPrice: item.compareAtPrice ?? null,
        discountPercent: item.discountPercent ?? 0,
        qty: item.qty,
        image: item.image,
        stock: item.stock ?? null,
      })),
    };

    localStorage.setItem(ORDER_SUMMARY_KEY, JSON.stringify(orderSummary));

    if (!isLoggedIn) {
      localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, "/checkout");
      showToast("error", t("cart.redirectingLogin"));
      router.push("/login");
      return;
    }

    router.push("/checkout");
  };

  return (
    <>
      <CartHeader backHref={backHref} />

      <CartToast toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <CartHero />

          {items.length === 0 ? (
            <EmptyCart onGoToCollection={() => router.push("/collection")} />
          ) : (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
              <CartItems
                items={items}
                updateQty={updateQty}
                removeItem={removeItem}
              />

              <OrderSummary
                itemsLength={items.length}
                hasStockIssue={hasStockIssue}
                discount={discount}
                setDiscount={setDiscount}
                applyManualCoupon={applyManualCoupon}
                isApplyingCoupon={isApplyingCoupon}
                appliedCouponCode={appliedCouponCode}
                appliedCouponLabel={appliedCouponLabel}
                clearAppliedCoupon={clearAppliedCoupon}
                couponMessage={couponMessage}
                subtotal={subtotal}
                itemSavings={itemSavings}
                shippingAmount={items.length ? shipping : 0}
                discountAmount={discountAmount}
                total={total}
                authChecked={authChecked}
                proceedToCheckout={proceedToCheckout}
              />
            </div>
          )}
        </div>
      </main>

      <MainFooter />
    </>
  );
}