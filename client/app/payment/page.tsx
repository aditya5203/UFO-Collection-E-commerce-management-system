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

export default function PaymentPage() {
  const router = useRouter();

  // ✅ Load totals from cart (localStorage) — same cart you already use: "ufo_cart"
  const [items, setItems] = React.useState<CartItem[]>([]);
  const shipping = items.length ? 10 : 0;

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ufo_cart");
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  const subtotal = React.useMemo(
    () => items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0),
    [items]
  );

  const total = subtotal + shipping;

  const [method, setMethod] = React.useState<
    "card" | "esewa" | "khalti" | "fonepay" | "cod"
  >("card");

  // -------------------- HANDLERS --------------------

  const handleEsewaPay = () => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

    // ✅ Backend must have: GET /api/payments/esewa/initiate?amount=...
    window.location.href = `${apiBase}/payments/esewa/initiate?amount=${total}`;
  };

  const handleKhaltiPay = async () => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

    try {
      // ✅ Backend must have: POST /api/payments/khalti/initiate
      const res = await fetch(`${apiBase}/payments/khalti/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: Math.round(total * 100), // Khalti uses paisa
          orderId: `ORDER_${Date.now()}`,
          orderName: "UFO Collection Order",
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        alert(data?.message || "Failed to initiate Khalti payment");
        return;
      }

      if (data?.payment_url) {
        window.location.href = data.payment_url;
        return;
      }

      alert("Khalti initiate did not return payment_url");
    } catch (err) {
      console.error(err);
      alert("Something went wrong initiating Khalti payment");
    }
  };

  const handleContinue = () => {
    if (!items.length) {
      alert("Your cart is empty.");
      router.push("/collection");
      return;
    }

    if (method === "esewa") return handleEsewaPay();
    if (method === "khalti") return void handleKhaltiPay();

    // ✅ Cash on Delivery
    if (method === "cod") {
      // if you want, store chosen method for the ThankYou page
      try {
        localStorage.setItem("ufo_payment_method", "Cash on Delivery");
      } catch {}
      router.push("/ThankYou");
      return;
    }

    // Card / Fonepay (demo)
    router.push("/ThankYou");
  };

  return (
    <>
      {/* ================= HEADER (SAME STYLE AS YOUR CART/CHECKOUT) ================= */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          {/* Left: Back + Brand */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] bg-transparent px-3 py-[7px] text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back to checkout"
              title="Back to checkout"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt=""
                className="brightness-0 invert group-hover:brightness-100 group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-[10px]">
              <div className="h-[44px] w-[44px] overflow-hidden rounded-full border-2 border-white sm:h-[48px] sm:w-[48px]">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div className="text-[22px] font-bold uppercase tracking-[0.18em] text-white sm:text-[26px]">
                UFO Collection
              </div>
            </Link>
          </div>

          {/* Center: Nav (desktop only) ✅ */}
          <nav className="hidden items-center gap-[42px] md:flex">
            <Link
              href="/homepage"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          {/* Right: Wishlist */}
          <button
            type="button"
            onClick={() => router.push("/cartpage")}
            aria-label="Wishlist"
            title="Wishlist"
          >
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt=""
              className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
            />
          </button>
        </div>

        {/* Mobile Nav (below header) ✅ */}
        <div className="border-t border-[#14162a] bg-[rgba(5,6,17,0.92)] md:hidden">
          <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-3">
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

      {/* ================= BODY ================= */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1160px] px-4 pb-20 pt-10">
          {/* Breadcrumb */}
          <div className="mb-10 text-[14px] text-[#9aa3cc]">
            Cart <span className="mx-2">/</span>
            <span className="text-white">Payment</span>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_460px]">
            {/* LEFT */}
            <section className="max-w-[520px]">
              <h2 className="mb-6 text-[22px] font-semibold">
                Payment Information
              </h2>

              <label htmlFor="cardNumber" className="sr-only">
                Card Number
              </label>
              <input
                id="cardNumber"
                placeholder="Card Number"
                disabled={method !== "card"}
                className="input mb-4 disabled:opacity-50"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Expiry Date"
                  disabled={method !== "card"}
                  className="input disabled:opacity-50"
                />
                <input
                  placeholder="CVV"
                  disabled={method !== "card"}
                  className="input disabled:opacity-50"
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { key: "card", label: "Credit Card" },
                  { key: "esewa", label: "Esewa" },
                  { key: "khalti", label: "Khalti" },
                  { key: "fonepay", label: "Fonepay" },
                  { key: "cod", label: "Cash on Delivery" }, // ✅ NEW
                ].map((m) => {
                  const active = method === (m.key as any);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key as any)}
                      className={`rounded-[10px] border px-4 py-2 text-[14px] ${
                        active
                          ? "border-[#1f7cff] bg-[#0b0f1a] text-white"
                          : "border-[#2b2f45] bg-transparent text-[#9aa3cc]"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* RIGHT */}
            <aside>
              <h2 className="mb-6 text-[20px] font-semibold">Order Summary</h2>

              <div className="rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6">
                <div className="space-y-4 text-[14px]">
                  <div className="flex items-center justify-between text-[#9aa3cc]">
                    <span>Subtotal</span>
                    <span className="text-white">Rs. {subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#9aa3cc]">
                    <span>Shipping</span>
                    <span className="text-white">Rs. {shipping}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#9aa3cc]">
                    <span>Total</span>
                    <span className="text-white">Rs. {total}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="mt-8 h-[50px] w-full rounded-[10px] bg-[#1f7cff] text-[14px] font-semibold text-white hover:bg-[#2a86ff]"
                >
                  Pay Now
                </button>
              </div>
            </aside>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="mt-24 flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-6 opacity-90">
              <a href="#" aria-label="Instagram" className="hover:opacity-100">
                <Image
                  src="/images/instagram.png"
                  width={18}
                  height={18}
                  alt=""
                  className="brightness-0 invert"
                />
              </a>
              <a href="#" aria-label="Facebook" className="hover:opacity-100">
                <Image
                  src="/images/facebook.png"
                  width={18}
                  height={18}
                  alt=""
                  className="brightness-0 invert"
                />
              </a>
            </div>

            <div className="text-[14px] text-[#93a0c8]">
              © 2025 UFO Collection — All Rights Reserved
            </div>
          </div>
        </div>
      </main>

      {/* input styles (same as your checkout page style) */}
      <style jsx>{`
        .input {
          height: 48px;
          width: 100%;
          border-radius: 10px;
          border: 1px solid #2b2f45;
          background: #0b0f1a;
          padding: 0 16px;
          font-size: 14px;
          color: #ffffff;
          outline: none;
        }
        .input::placeholder {
          color: #7f88b3;
        }
      `}</style>
    </>
  );
}
