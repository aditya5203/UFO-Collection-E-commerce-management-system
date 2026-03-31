"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  name: string;
  size: string;
  color: string;
  colorLabel: string;
  price: number;
  qty: number;
  image: string;
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
  if (c.type === "FREESHIP") return "FREE SHIPPING";
  return "";
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

  const shipping = 100;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api";

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ufo_cart");
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  const saveCart = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem("ufo_cart", JSON.stringify(next));
    window.dispatchEvent(new Event("ufo_cart_updated"));
  };

  const subtotal = React.useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

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
    const safe = Math.max(1, Math.min(99, qty || 1));
    const next = items.map((it) =>
      it.id === id && it.size === size && it.color === color
        ? { ...it, qty: safe }
        : it
    );
    saveCart(next);
  };

  const removeItem = (id: string, size: string, color: string) => {
    const next = items.filter(
      (it) => !(it.id === id && it.size === size && it.color === color)
    );
    saveCart(next);
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
      const appliedCode =
        String(
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

  const clearAppliedCoupon = React.useCallback(() => {
    setDiscountAmount(0);
    setAppliedCouponCode("");
    setAppliedCouponLabel("");
    setCouponMessage("");
    localStorage.removeItem("ufo_coupon_selected");
  }, []);

  const autoApplyBestCoupon = React.useCallback(async () => {
    if (!items.length) {
      clearAppliedCoupon();
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
      const collectedRows: CollectedCouponRow[] = Array.isArray(collectedJson?.data)
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
        clearAppliedCoupon();
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
        ? [
            preferredCode,
            ...uniqueCodes.filter((code) => code !== preferredCode),
          ]
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

          if (preferredCode && code === preferredCode) {
            bestDiscountRs = result.discountRs;
            bestCode = code;
            bestLabel = fmtCoupon({
              type: row.coupon.type,
              value: row.coupon.value,
              maxDiscountCap: row.coupon.maxDiscountCap,
            });
            break;
          }

          if (result.discountRs > bestDiscountRs) {
            bestDiscountRs = result.discountRs;
            bestCode = code;
            bestLabel = fmtCoupon({
              type: row.coupon.type,
              value: row.coupon.value,
              maxDiscountCap: row.coupon.maxDiscountCap,
            });
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
        setCouponMessage(`Best available coupon applied automatically.`);
        localStorage.setItem("ufo_coupon_selected", bestCode);
      } else {
        clearAppliedCoupon();
      }
    } catch {
      clearAppliedCoupon();
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [API_BASE, items, validateCoupon, clearAppliedCoupon]);

  React.useEffect(() => {
    autoApplyBestCoupon();
  }, [autoApplyBestCoupon]);

  const applyManualCoupon = async () => {
    if (!items.length || !discount.trim()) return;

    setIsApplyingCoupon(true);
    setCouponMessage("");

    try {
      const result = await validateCoupon(discount.trim());

      if (!result.ok || result.discountRs <= 0) {
        setDiscountAmount(0);
        setAppliedCouponCode("");
        setAppliedCouponLabel("");
        setCouponMessage("Coupon is invalid or not applicable for this cart.");
        return;
      }

      setDiscount(result.appliedCode || discount.trim().toUpperCase());
      setDiscountAmount(result.discountRs);
      setAppliedCouponCode(result.appliedCode || discount.trim().toUpperCase());
      setAppliedCouponLabel("Coupon applied successfully.");
      setCouponMessage("Coupon applied successfully.");
      localStorage.setItem(
        "ufo_coupon_selected",
        (result.appliedCode || discount.trim()).toUpperCase()
      );
    } catch {
      setDiscountAmount(0);
      setAppliedCouponCode("");
      setAppliedCouponLabel("");
      setCouponMessage("Failed to apply coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex min-h-[80px] w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push("/collection")}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#050611]"
              aria-label="Back to collection"
              title="Back to collection"
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

            <Link
              href="/homepage"
              className="flex min-w-0 items-center gap-2 sm:gap-3"
            >
              <div className="h-[42px] w-[42px] overflow-hidden rounded-full border-2 border-white sm:h-[48px] sm:w-[48px]">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
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
              className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            title="Wishlist"
            className="shrink-0"
          >
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
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <h1 className="text-[28px] font-semibold sm:text-[32px] lg:text-[36px]">
            Shopping Cart
          </h1>
          <div className="mt-5 h-px bg-[#2b2f45]" />

          {items.length === 0 ? (
            <div className="mt-8 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-[#9aa3cc] sm:mt-10 sm:p-8">
              <p className="text-sm sm:text-base">Your cart is empty.</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => router.push("/collection")}
                  className="rounded bg-white px-4 py-2 text-sm font-medium text-[#050611] sm:text-base"
                  aria-label="Go to collection"
                  title="Go to collection"
                >
                  Go to Collection
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
              <section className="overflow-hidden rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60">
                <div className="hidden grid-cols-[1.5fr_0.7fr_0.9fr_0.9fr_0.6fr_0.25fr] gap-4 border-b border-[#2b2f45] px-6 py-4 text-sm text-[#dfe3ff] md:grid">
                  <div>Product</div>
                  <div>Size</div>
                  <div>Color</div>
                  <div className="text-center">Quantity</div>
                  <div>Price</div>
                  <div />
                </div>

                {items.map((it) => (
                  <div
                    key={`${it.id}-${it.size}-${it.color}`}
                    className="border-b border-[#1b2034] px-4 py-5 last:border-0 sm:px-5 md:px-6 md:py-6"
                  >
                    <div className="hidden grid-cols-[1.5fr_0.7fr_0.9fr_0.9fr_0.6fr_0.25fr] items-center gap-4 md:grid">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-full border border-[#2b2f45]">
                          <Image
                            src={it.image}
                            alt={it.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="truncate">{it.name}</span>
                      </div>

                      <span>{it.size}</span>

                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-[#3a3f58]"
                          style={{ backgroundColor: it.color || "#16191f" }}
                        />
                        <span className="truncate">
                          {it.colorLabel || "Color"}
                        </span>
                      </div>

                      <div className="flex justify-center">
                        <label
                          htmlFor={`qty-${it.id}-${it.size}-${it.color}`}
                          className="sr-only"
                        >
                          Quantity for {it.name}
                        </label>
                        <input
                          id={`qty-${it.id}-${it.size}-${it.color}`}
                          type="number"
                          min={1}
                          max={99}
                          value={it.qty}
                          onChange={(e) =>
                            updateQty(
                              it.id,
                              it.size,
                              it.color,
                              Number(e.target.value)
                            )
                          }
                          className="w-[82px] rounded border border-[#3a3f58] bg-transparent px-3 py-2 text-white outline-none transition focus:border-[#c9b9ff]"
                        />
                      </div>

                      <span>Rs. {it.price}</span>

                      <button
                        type="button"
                        onClick={() => removeItem(it.id, it.size, it.color)}
                        className="flex justify-center"
                        aria-label={`Remove ${it.name} from cart`}
                        title={`Remove ${it.name}`}
                      >
                        <Image
                          src="/images/delete.png"
                          width={28}
                          height={28}
                          alt="Remove icon"
                          className="brightness-0 invert"
                        />
                      </button>
                    </div>

                    <div className="flex gap-4 md:hidden">
                      <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[12px] border border-[#2b2f45] sm:h-[88px] sm:w-[88px]">
                        <Image
                          src={it.image}
                          alt={it.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-medium sm:text-base">
                          {it.name}
                        </div>

                        <div className="mt-2 grid gap-1 text-sm text-[#9aa3cc]">
                          <div>Size: {it.size}</div>

                          <div className="flex items-center gap-2">
                            <span>Color:</span>
                            <span
                              className="h-4 w-4 rounded-full border border-[#3a3f58]"
                              style={{ backgroundColor: it.color || "#16191f" }}
                            />
                            <span className="truncate">
                              {it.colorLabel || "Color"}
                            </span>
                          </div>

                          <div>Price: Rs. {it.price}</div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <label
                            htmlFor={`mobile-qty-${it.id}-${it.size}-${it.color}`}
                            className="sr-only"
                          >
                            Quantity for {it.name}
                          </label>
                          <input
                            id={`mobile-qty-${it.id}-${it.size}-${it.color}`}
                            type="number"
                            min={1}
                            max={99}
                            value={it.qty}
                            onChange={(e) =>
                              updateQty(
                                it.id,
                                it.size,
                                it.color,
                                Number(e.target.value)
                              )
                            }
                            className="w-[92px] rounded border border-[#3a3f58] bg-transparent px-3 py-2 text-white outline-none transition focus:border-[#c9b9ff]"
                          />

                          <button
                            type="button"
                            onClick={() => removeItem(it.id, it.size, it.color)}
                            className="rounded border border-[#2b2f45] px-3 py-2 text-sm text-white transition hover:bg-white/5"
                            aria-label={`Remove ${it.name} from cart`}
                            title={`Remove ${it.name}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <aside className="xl:sticky xl:top-[104px]">
                <h2 className="text-[22px] font-semibold">Order Summary</h2>

                <div className="mt-5 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label htmlFor="discount-code" className="sr-only">
                      Discount code
                    </label>
                    <input
                      id="discount-code"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value.toUpperCase())}
                      placeholder="Discount code (optional)"
                      className="w-full rounded-[10px] border border-[#2b2f45] bg-[#070a12] px-4 py-3 text-white placeholder:text-[#7c86b1] outline-none transition focus:border-[#c9b9ff]"
                    />
                    <button
                      type="button"
                      onClick={applyManualCoupon}
                      disabled={isApplyingCoupon}
                      className="rounded-[10px] border border-[#2b2f45] bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[96px]"
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply"}
                    </button>
                  </div>

                  <div className="mt-3 text-[12px] leading-5 text-[#9aa3cc]">
                    Tip: Collect coupons from{" "}
                    <Link href="/discounts" className="underline text-white">
                      Discounts
                    </Link>{" "}
                    and the best valid coupon will auto-apply here.
                  </div>

                  {appliedCouponCode ? (
                    <div className="mt-4 rounded-[10px] border border-green-500/20 bg-green-500/10 px-4 py-3">
                      <div className="text-[12px] uppercase tracking-[0.14em] text-green-300">
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
                    </div>
                  ) : null}

                  {couponMessage ? (
                    <div className="mt-4 text-[12px] text-[#9aa3cc]">
                      {couponMessage}
                    </div>
                  ) : null}

                  <div className="mt-8 space-y-4 text-sm text-[#9aa3cc] sm:text-[15px]">
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

                    <div className="h-px bg-[#222741]" />

                    <div className="flex items-center justify-between gap-4 text-base font-semibold sm:text-lg">
                      <span className="text-white">Total</span>
                      <span className="text-right text-white">Rs. {total}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const orderSummary = {
                        subtotal,
                        shipping: items.length ? shipping : 0,
                        discount: discountAmount,
                        total,
                        currency: "NPR",
                        updatedAt: new Date().toISOString(),
                        couponCode: appliedCouponCode || discount.trim() || null,
                      };

                      localStorage.setItem(
                        "ufo_order_summary",
                        JSON.stringify(orderSummary)
                      );

                      router.push("/checkout");
                    }}
                    className="mt-8 w-full rounded-[10px] bg-[#1f7cff] py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:text-base"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}