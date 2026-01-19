"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  name: string;
  size: string;
  price: number;
  qty: number;
  image: string;
};

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default function CartPage() {
  const router = useRouter();

  const [items, setItems] = React.useState<CartItem[]>([]);
  const [discount, setDiscount] = React.useState(""); // optional manual input
  const [discountAmount, setDiscountAmount] = React.useState(0); // Rs
  const shipping = 100;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8080/api";

  // ✅ Load cart from localStorage
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
  };

  const subtotal = React.useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  // ✅ total after discount
  const total = Math.max(0, subtotal + (items.length ? shipping : 0) - discountAmount);

  const updateQty = (id: string, size: string, qty: number) => {
    const safe = Math.max(1, Math.min(99, qty || 1));
    const next = items.map((it) =>
      it.id === id && it.size === size ? { ...it, qty: safe } : it
    );
    saveCart(next);
  };

  const removeItem = (id: string, size: string) => {
    const next = items.filter((it) => !(it.id === id && it.size === size));
    saveCart(next);
  };

  // ✅ Auto-apply discount from backend (best collected coupon)
  React.useEffect(() => {
    if (!items.length) {
      setDiscountAmount(0);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/discounts/validate`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponCode: "", // backend decides best (or returns 0 if none collected)
            items: items.map((i) => ({
              productId: i.id,
              qty: i.qty,
            })),
            shippingPaisa: shipping * 100,
          }),
        });

        const json = await safeJson(res);
        const dp = Number(json?.data?.discountPaisa || 0);
        setDiscountAmount(Math.round(dp / 100)); // paisa -> Rs
      } catch {
        setDiscountAmount(0);
      }
    };

    run();
  }, [API_BASE, items]);

  // ✅ Optional: manual apply with discount input
  const applyManualCoupon = async () => {
    if (!items.length) return;

    try {
      const res = await fetch(`${API_BASE}/discounts/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: discount.trim(),
          items: items.map((i) => ({
            productId: i.id,
            qty: i.qty,
          })),
          shippingPaisa: shipping * 100,
        }),
      });

      const json = await safeJson(res);
      const dp = Number(json?.data?.discountPaisa || 0);
      setDiscountAmount(Math.round(dp / 100));
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/collection")}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
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

      {/* PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <h1 className="text-[36px] font-semibold">Shopping Cart</h1>
          <div className="mt-6 h-px bg-[#2b2f45]" />

          {/* EMPTY CART */}
          {items.length === 0 ? (
            <div className="mt-10 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-8 text-[#9aa3cc]">
              Your cart is empty.
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => router.push("/collection")}
                  className="rounded bg-white px-4 py-2 text-[#050611]"
                  aria-label="Go to collection"
                  title="Go to collection"
                >
                  Go to Collection
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* CART TABLE */}
              <section className="mt-10 rounded-[10px] border border-[#2b2f45] bg-[#0b0f1a]/60">
                <div className="hidden md:grid grid-cols-[1.2fr_0.6fr_0.9fr_0.6fr_0.25fr] px-6 py-4 border-b border-[#2b2f45] text-[#dfe3ff]">
                  <div>Product</div>
                  <div>Size</div>
                  <div className="text-center">Quantity</div>
                  <div>Price</div>
                  <div />
                </div>

                {items.map((it) => (
                  <div
                    key={`${it.id}-${it.size}`}
                    className="border-b border-[#1b2034] px-6 py-6 last:border-0"
                  >
                    {/* Desktop Row */}
                    <div className="hidden md:grid grid-cols-[1.2fr_0.6fr_0.9fr_0.6fr_0.25fr] items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-[46px] w-[46px] overflow-hidden rounded-full border border-[#2b2f45]">
                          <Image src={it.image} alt={it.name} fill className="object-cover" />
                        </div>
                        <span>{it.name}</span>
                      </div>

                      <span>{it.size}</span>

                      <div className="flex justify-center">
                        <label htmlFor={`qty-${it.id}-${it.size}`} className="sr-only">
                          Quantity for {it.name}
                        </label>
                        <input
                          id={`qty-${it.id}-${it.size}`}
                          type="number"
                          min={1}
                          max={99}
                          value={it.qty}
                          onChange={(e) => updateQty(it.id, it.size, Number(e.target.value))}
                          className="w-[80px] rounded border border-[#3a3f58] bg-transparent px-3 py-2 text-white"
                        />
                      </div>

                      <span>Rs. {it.price}</span>

                      <button
                        type="button"
                        onClick={() => removeItem(it.id, it.size)}
                        className="flex justify-center"
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

                    {/* Mobile Row */}
                    <div className="md:hidden flex gap-4">
                      <div className="relative h-[62px] w-[62px] overflow-hidden rounded-[12px] border border-[#2b2f45]">
                        <Image src={it.image} alt={it.name} fill className="object-cover" />
                      </div>

                      <div className="flex-1">
                        <div className="font-medium">{it.name}</div>
                        <div className="mt-1 text-[#9aa3cc] text-sm">Size: {it.size}</div>
                        <div className="mt-1 text-[#9aa3cc] text-sm">Price: Rs. {it.price}</div>

                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={it.qty}
                            onChange={(e) => updateQty(it.id, it.size, Number(e.target.value))}
                            className="w-[90px] rounded border border-[#3a3f58] bg-transparent px-3 py-2 text-white"
                          />

                          <button
                            type="button"
                            onClick={() => removeItem(it.id, it.size)}
                            className="rounded border border-[#2b2f45] px-3 py-2 text-sm text-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* ORDER SUMMARY */}
              <aside className="mt-12 max-w-[460px] ml-auto">
                <h2 className="text-[22px] font-semibold">Order Summary</h2>

                <div className="mt-6 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6">
                  <div className="flex gap-3">
                    <input
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="Discount code (optional)"
                      className="w-full rounded-[10px] border border-[#2b2f45] bg-[#070a12] px-4 py-3 text-white placeholder:text-[#7c86b1]"
                    />
                    <button
                      type="button"
                      onClick={applyManualCoupon}
                      className="rounded-[10px] border border-[#2b2f45] bg-white/5 px-4 text-sm hover:bg-white/10"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="mt-3 text-[12px] text-[#9aa3cc]">
                    Tip: Collect coupons from{" "}
                    <Link href="/discounts" className="underline text-white">
                      Discounts
                    </Link>{" "}
                    and they will auto-apply here.
                  </div>

                  <div className="mt-8 space-y-4 text-[#9aa3cc]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-white">Rs. {subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-white">Rs. {items.length ? shipping : 0}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span className="text-green-400">- Rs. {discountAmount}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="text-white">Rs. {total}</span>
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
                        couponCode: discount.trim() || null,
                      };

                      localStorage.setItem("ufo_order_summary", JSON.stringify(orderSummary));
                      router.push("/checkout");
                    }}
                    className="mt-8 w-full rounded-[10px] bg-[#1f7cff] py-3 font-semibold"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </aside>
            </>
          )}
        </div>
      </main>
    </>
  );
}
