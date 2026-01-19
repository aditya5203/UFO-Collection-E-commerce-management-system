// app/payment/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type CartItem = {
  id: string;
  name: string;
  size: string;
  price: number; // Rs
  qty: number;
  image: string;
};

type PayMethod = "card" | "esewa" | "khalti" | "fonepay" | "cod";

type CheckoutAddressLS = {
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;

  provinceId?: string;
  district?: string;
  cityOrMunicipality?: string;

  addressLine?: string;
  street?: string;
  postalCode?: string;
  phone?: string;

  savedAddressId?: string | null;
};

type OrderAddressAPI = {
  label?: "Home" | "Work" | "Other";
  fullName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
};

type OrderSummaryLS = {
  subtotal: number; // Rs
  shipping: number; // Rs
  discount: number; // Rs
  total: number; // Rs
  currency?: string;
  updatedAt?: string;
  couponCode?: string | null;
};

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

function getOrderSummary(): OrderSummaryLS | null {
  try {
    const raw = localStorage.getItem("ufo_order_summary");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      subtotal: Number(parsed.subtotal || 0),
      shipping: Number(parsed.shipping || 0),
      discount: Number(parsed.discount || 0),
      total: Number(parsed.total || 0),
      currency: parsed.currency || "NPR",
      updatedAt: parsed.updatedAt,
      couponCode: parsed.couponCode ?? null,
    };
  } catch {
    return null;
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = React.useState<CartItem[]>([]);
  const [cartReady, setCartReady] = React.useState(false);
  const [method, setMethod] = React.useState<PayMethod>("card");
  const [placing, setPlacing] = React.useState(false);

  const [summary, setSummary] = React.useState<OrderSummaryLS | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const apiBase = React.useMemo(() => joinUrl(API_BASE, "/api"), [API_BASE]);

  // ✅ Load cart
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ufo_cart");
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    } finally {
      setCartReady(true);
    }
  }, []);

  // ✅ Load order summary saved from CartPage
  React.useEffect(() => {
    const s = getOrderSummary();
    setSummary(s);
  }, []);

  // ✅ Use totals from summary (fallback to old calc if not found)
  const fallbackSubtotal = React.useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0);
  }, [items]);

  const fallbackShipping = cartReady && items.length ? 100 : 0;
  const fallbackTotal = fallbackSubtotal + fallbackShipping;

  const subtotal = summary ? summary.subtotal : fallbackSubtotal;
  const shipping = summary ? summary.shipping : fallbackShipping;
  const discount = summary ? summary.discount : 0;
  const total = summary ? summary.total : fallbackTotal;

  const savePaymentMeta = (label: string) => {
    try {
      localStorage.setItem("ufo_payment_method", label);
      localStorage.setItem("ufo_last_total_paisa", String(Math.round(total * 100)));
    } catch {}
  };

  const getCheckoutAddressLS = (): CheckoutAddressLS | undefined => {
    try {
      const raw =
        localStorage.getItem("checkout_address") ||
        localStorage.getItem("ufo_checkout_address") ||
        localStorage.getItem("ufo_address") ||
        "";

      if (!raw) return undefined;
      const addr = JSON.parse(raw);
      return addr && typeof addr === "object" ? (addr as CheckoutAddressLS) : undefined;
    } catch {
      return undefined;
    }
  };

  const mapToOrderAddress = (a?: CheckoutAddressLS): OrderAddressAPI | undefined => {
    if (!a) return undefined;

    const fullName = `${a.firstName || ""} ${a.lastName || ""}`.trim();
    const phone = String(a.phone || "").trim();

    const city = String(a.cityOrMunicipality || "").trim();
    const area = String(a.district || "").trim();
    const street = String(a.street || a.addressLine || "").trim();

    if (!fullName && !phone && !city && !area && !street) return undefined;

    return {
      label: "Home",
      fullName: fullName || "Customer",
      phone,
      city,
      area,
      street,
    };
  };

  const createOrder = async (
    paymentMethod: "COD" | "Khalti" | "eSewa",
    paymentRef?: string,
    paymentStatus?: "Paid" | "Pending" | "Failed"
  ) => {
    let safeItems: CartItem[] = items;
    if (!safeItems.length) {
      try {
        const raw = localStorage.getItem("ufo_cart");
        const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
        safeItems = Array.isArray(parsed) ? parsed : [];
      } catch {
        safeItems = [];
      }
    }

    if (!safeItems.length) throw new Error("Cart is empty");

    const addrLS = getCheckoutAddressLS();
    const mappedAddress = mapToOrderAddress(addrLS);

    const payload: any = {
      paymentMethod,
      paymentRef: paymentRef || undefined,
      paymentStatus: paymentStatus || undefined,

      // ✅ totals from cart summary
      shippingPaisa: Math.round(shipping * 100),

      // ✅ optional - include coupon info (if your backend supports)
      couponCode: summary?.couponCode || null,
      discountPaisa: Math.round(discount * 100),

      items: safeItems.map((it) => ({
        productId: it.id,
        size: it.size || "",
        qty: Math.max(1, Number(it.qty || 1)),
      })),
      address: mappedAddress,
    };

    const res = await fetch(joinUrl(apiBase, "/orders"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(json?.message || "Failed to create order");
    return json?.data as { id: string; orderCode: string; totalPaisa: number };
  };

  const finishToThankYou = (data: { id: string; orderCode: string; totalPaisa: number }) => {
    localStorage.setItem("ufo_last_order_id", data.id);
    localStorage.setItem("ufo_last_order_number", data.orderCode);
    localStorage.setItem("ufo_last_total_paisa", String(data.totalPaisa));
    localStorage.removeItem("ufo_cart");
    localStorage.removeItem("ufo_order_summary"); // ✅ clean
    router.replace("/ThankYou");
  };

  React.useEffect(() => {
    const status = searchParams.get("status");
    if (status === "failed") alert("Payment failed. Please try again.");
  }, [searchParams]);

  // (Khalti/eSewa finalize logic kept same, only uses `total` now)

  React.useEffect(() => {
    if (!cartReady) return;

    const pidx = searchParams.get("pidx");
    if (!pidx) return;

    const already = sessionStorage.getItem("khalti_finalized");
    if (already === "1") return;

    const run = async () => {
      try {
        setPlacing(true);
        sessionStorage.setItem("khalti_finalized", "1");

        const vr = await fetch(joinUrl(apiBase, "/payments/khalti/lookup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pidx }),
        });

        const vj = await vr.json().catch(() => ({} as any));
        if (!vr.ok) throw new Error(vj?.message || "Khalti lookup failed");
        if (!vj?.paid) throw new Error(`Khalti not completed (status: ${vj?.status || "Unknown"})`);

        savePaymentMeta("Khalti");

        const order = await createOrder("Khalti", pidx, "Paid");
        finishToThankYou(order);
      } catch (e: any) {
        console.error(e);
        sessionStorage.removeItem("khalti_finalized");
        alert(e?.message || "Failed to finalize Khalti payment");
      } finally {
        setPlacing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartReady, searchParams, apiBase]);

  React.useEffect(() => {
    if (!cartReady) return;

    const esewa = searchParams.get("esewa");
    const data = searchParams.get("data") || "";
    if (esewa !== "success" || !data) return;

    const already = sessionStorage.getItem("esewa_finalized");
    if (already === "1") return;

    const run = async () => {
      try {
        setPlacing(true);
        sessionStorage.setItem("esewa_finalized", "1");

        const vr = await fetch(joinUrl(apiBase, "/payments/esewa/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ data }),
        });

        const vj = await vr.json().catch(() => ({} as any));
        if (!vr.ok) throw new Error(vj?.message || "eSewa verify failed");

        const ref = String(vj?.transaction_uuid || vj?.payload?.transaction_uuid || "").trim() || "ESEWA_OK";
        savePaymentMeta("eSewa");

        const payStatus: "Paid" | "Pending" = vj?.statusOk ? "Paid" : "Pending";
        const order = await createOrder("eSewa", ref, payStatus);
        finishToThankYou(order);
      } catch (e: any) {
        console.error(e);
        sessionStorage.removeItem("esewa_finalized");
        alert(e?.message || "Failed to finalize eSewa payment");
      } finally {
        setPlacing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartReady, searchParams, apiBase]);

  const handleEsewaPay = () => {
    if (!cartReady) return;
    if (!items.length) return router.push("/collection");
    savePaymentMeta("eSewa");
    window.location.href = joinUrl(apiBase, `/payments/esewa/initiate?amount=${encodeURIComponent(String(total))}`);
  };

  const handleKhaltiPay = async () => {
    if (!cartReady) return;
    if (!items.length) return router.push("/collection");
    savePaymentMeta("Khalti");

    const res = await fetch(joinUrl(apiBase, "/payments/khalti/initiate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        amount: Math.round(total * 100),
        orderId: `ORDER_${Date.now()}`,
        orderName: "UFO Collection Order",
      }),
    });

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) return alert(data?.message || "Failed to initiate Khalti payment");
    if (data?.payment_url) window.location.href = data.payment_url;
    else alert("Khalti initiate did not return payment_url");
  };

  const handleContinue = async () => {
    if (!cartReady) return;
    if (!items.length) return router.push("/collection");

    if (method === "esewa") return handleEsewaPay();
    if (method === "khalti") return void handleKhaltiPay();

    if (method === "cod") {
      try {
        setPlacing(true);
        savePaymentMeta("Cash on Delivery");
        const order = await createOrder("COD", undefined, "Pending");
        finishToThankYou(order);
      } catch (e: any) {
        alert(e?.message || "Failed to place COD order");
      } finally {
        setPlacing(false);
      }
      return;
    }

    if (method === "fonepay") {
      savePaymentMeta("Fonepay (Demo)");
      router.push("/ThankYou");
      return;
    }

    savePaymentMeta("Credit Card (Demo)");
    router.push("/ThankYou");
  };

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
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
                <Image src="/images/logo.png" alt="UFO Collection logo" width={48} height={48} className="h-full w-full object-cover" priority />
              </div>
              <div className="text-[22px] font-bold uppercase tracking-[0.18em] text-white sm:text-[26px]">
                UFO Collection
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-[42px] md:flex">
            <Link href="/homepage" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">HOME</Link>
            <Link href="/collection" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">COLLECTION</Link>
            <Link href="/about" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">ABOUT</Link>
            <Link href="/contact" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">CONTACT</Link>
          </nav>

          <button type="button" onClick={() => router.push("/cartpage")} aria-label="Wishlist" title="Wishlist">
            <Image src="/images/wishlist.png" width={26} height={26} alt="" className="brightness-0 invert contrast-[2.8] saturate-[2.6]" />
          </button>
        </div>
      </header>

      {/* BODY */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1160px] px-4 pb-20 pt-10">
          <div className="mb-10 text-[14px] text-[#9aa3cc]">
            Cart <span className="mx-2">/</span>
            <span className="text-white">Payment</span>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_460px]">
            {/* LEFT */}
            <section className="max-w-[520px]">
              <h2 className="mb-6 text-[22px] font-semibold">Payment Information</h2>

              <input placeholder="Card Number" disabled={method !== "card"} className="input mb-4 disabled:opacity-50" />

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Expiry Date" disabled={method !== "card"} className="input disabled:opacity-50" />
                <input placeholder="CVV" disabled={method !== "card"} className="input disabled:opacity-50" />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { key: "card", label: "Credit Card" },
                  { key: "esewa", label: "Esewa" },
                  { key: "khalti", label: "Khalti" },
                  { key: "fonepay", label: "Fonepay" },
                  { key: "cod", label: "Cash on Delivery" },
                ].map((m) => {
                  const active = method === (m.key as PayMethod);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key as PayMethod)}
                      className={`rounded-[10px] border px-4 py-2 text-[14px] ${
                        active ? "border-[#1f7cff] bg-[#0b0f1a] text-white" : "border-[#2b2f45] bg-transparent text-[#9aa3cc]"
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
                    <span>Discount {summary?.couponCode ? `(${summary.couponCode})` : ""}</span>
                    <span className="text-green-400">- Rs. {discount}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#9aa3cc]">
                    <span>Total</span>
                    <span className="text-white">Rs. {total}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={placing || !cartReady}
                  className="mt-8 h-[50px] w-full rounded-[10px] bg-[#1f7cff] text-[14px] font-semibold text-white hover:bg-[#2a86ff] disabled:opacity-60"
                >
                  {placing ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </aside>
          </div>

          <div className="mt-24 flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-6 opacity-90">
              <a href="#" aria-label="Instagram" className="hover:opacity-100">
                <Image src="/images/instagram.png" width={18} height={18} alt="" className="brightness-0 invert" />
              </a>
              <a href="#" aria-label="Facebook" className="hover:opacity-100">
                <Image src="/images/facebook.png" width={18} height={18} alt="" className="brightness-0 invert" />
              </a>
            </div>

            <div className="text-[14px] text-[#93a0c8]">© 2025 UFO Collection — All Rights Reserved</div>
          </div>
        </div>
      </main>

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
