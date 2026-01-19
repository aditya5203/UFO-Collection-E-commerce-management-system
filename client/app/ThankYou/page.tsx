// app/ThankYou/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type VerifyState = "idle" | "checking" | "paid" | "failed";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

export default function ThankYouPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const pidx = sp.get("pidx");

  // ✅ ONE env everywhere
  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const apiBase = React.useMemo(() => joinUrl(BASE, "/api"), [BASE]);

  const [verifyState, setVerifyState] = React.useState<VerifyState>("idle");
  const [verifyMsg, setVerifyMsg] = React.useState<string>("");

  const [paymentMethod, setPaymentMethod] = React.useState<string>("");

  // saved from PaymentPage after DB order creation
  const [orderNumber, setOrderNumber] = React.useState<string>("#0000000");
  const [orderId, setOrderId] = React.useState<string>("");

  // ✅ Estimated delivery: today + 3–4 days
  const [estimatedDelivery] = React.useState<string>(() => {
    const today = new Date();

    const from = new Date(today);
    from.setDate(today.getDate() + 3);

    const to = new Date(today);
    to.setDate(today.getDate() + 4);

    const sameMonth =
      from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();

    if (sameMonth) {
      // Example: "January 5–6, 2026"
      const month = from.toLocaleDateString("en-US", { month: "long" });
      return `${month} ${from.getDate()}–${to.getDate()}, ${to.getFullYear()}`;
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    // Example: "January 30, 2026 – February 2, 2026"
    return `${fmt(from)} – ${fmt(to)}`;
  });

  // ✅ store total as paisa
  const [totalPaisa, setTotalPaisa] = React.useState<number>(0);

  const formatNPR = (paisa: number) => {
    const safe = Number.isFinite(paisa) ? paisa : 0;
    return `Rs. ${(safe / 100).toFixed(2)}`;
  };

  React.useEffect(() => {
    try {
      const pm = localStorage.getItem("ufo_payment_method") || "";
      setPaymentMethod(pm);

      const tp = localStorage.getItem("ufo_last_total_paisa");
      if (tp) {
        const v = Number(tp);
        setTotalPaisa(Number.isFinite(v) ? Math.round(v) : 0);
      } else {
        // fallback: if older value stored in rupees
        const t = localStorage.getItem("ufo_last_total");
        const rupees = t ? Number(t) : 0;
        setTotalPaisa(Number.isFinite(rupees) ? Math.round(rupees * 100) : 0);
      }

      const on = localStorage.getItem("ufo_last_order_number");
      if (on) setOrderNumber(on);

      const oid = localStorage.getItem("ufo_last_order_id");
      if (oid) setOrderId(oid);
    } catch {}
  }, []);

  React.useEffect(() => {
    // ✅ No pidx => treat as success (COD / eSewa)
    if (!pidx) {
      setVerifyState("paid");
      return;
    }

    const verifyKhalti = async () => {
      setVerifyState("checking");
      setVerifyMsg("Verifying Khalti payment...");

      try {
        const res = await fetch(joinUrl(apiBase, "/payments/khalti/lookup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pidx }),
        });

        const data = await res.json().catch(() => ({} as any));

        if (res.ok && data?.paid) {
          setVerifyState("paid");
          setVerifyMsg("");

          // ✅ clear cart after successful payment
          try {
            localStorage.removeItem("ufo_cart");
          } catch {}

          return;
        }

        setVerifyState("failed");
        setVerifyMsg("Payment not completed.");
        router.replace(`/payment?status=failed&pidx=${encodeURIComponent(pidx)}`);
      } catch {
        setVerifyState("failed");
        setVerifyMsg("Payment verification failed.");
        router.replace(`/payment?status=failed&pidx=${encodeURIComponent(pidx)}`);
      }
    };

    verifyKhalti();
  }, [pidx, apiBase, router]);

  const handleViewOrder = () => {
    if (!orderId) {
      alert("Order ID not found. Please check Order History.");
      router.push("/order-history"); // change to your actual page if different
      return;
    }
    router.push(`/customerorderdetails/${encodeURIComponent(orderId)}`);
  };

  if (verifyState === "checking") {
    return (
      <main className="min-h-screen bg-[#070a12] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-[520px] rounded-[14px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-8 text-center">
          <h1 className="text-[22px] font-semibold">Please wait…</h1>
          <p className="mt-3 text-[14px] text-[#9aa3cc]">{verifyMsg}</p>
        </div>
      </main>
    );
  }

  if (verifyState === "failed") {
    return (
      <main className="min-h-screen bg-[#070a12] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-[520px] rounded-[14px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-8 text-center">
          <h1 className="text-[22px] font-semibold">Payment Failed</h1>
          <p className="mt-3 text-[14px] text-[#9aa3cc]">
            We couldn’t confirm your payment. Please try again.
          </p>
          <button
            type="button"
            onClick={() => router.push("/payment")}
            className="mt-6 h-[46px] w-full rounded-[10px] bg-[#1f7cff] text-[14px] font-semibold text-white hover:bg-[#2a86ff]"
          >
            Go to Payment
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] bg-transparent px-3 py-[7px] text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
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

      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1160px] px-4 pb-20 pt-14">
          <div className="h-px w-full bg-[#2b2f45]" />

          <div className="mx-auto mt-12 max-w-[920px] text-center">
            <h1 className="text-[34px] font-semibold max-sm:text-[28px]">
              Thank You for Your Order!
            </h1>
            <p className="mx-auto mt-3 max-w-[720px] text-[14px] text-[#9aa3cc]">
              Your order has been successfully placed. You will receive an email
              confirmation shortly with your order details.
            </p>

            {paymentMethod ? (
              <p className="mt-4 text-[13px] text-[#93a0c8]">
                Payment Method: <span className="text-white">{paymentMethod}</span>
              </p>
            ) : null}

            {pidx ? (
              <p className="mt-2 text-[13px] text-[#93a0c8]">
                Khalti Ref: <span className="text-white">{pidx}</span>
              </p>
            ) : null}
          </div>

          <div className="mx-auto mt-12 max-w-[920px] text-left">
            <h2 className="text-[18px] font-semibold">Order Details</h2>
            <div className="mt-5 h-px w-full bg-[#2b2f45]" />

            <div className="divide-y divide-[#2b2f45]">
              <div className="grid grid-cols-[220px_1fr] py-6 max-sm:grid-cols-1 max-sm:gap-2">
                <div className="text-[14px] text-[#9aa3cc]">Order Number</div>
                <div className="text-[14px] text-white">{orderNumber}</div>
              </div>

              <div className="grid grid-cols-[220px_1fr] py-6 max-sm:grid-cols-1 max-sm:gap-2">
                <div className="text-[14px] text-[#9aa3cc]">
                  Estimated Delivery
                </div>
                <div className="text-[14px] text-white">{estimatedDelivery}</div>
              </div>

              <div className="grid grid-cols-[220px_1fr] py-6 max-sm:grid-cols-1 max-sm:gap-2">
                <div className="text-[14px] text-[#9aa3cc]">Total</div>
                <div className="text-[14px] text-white">{formatNPR(totalPaisa)}</div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-14 flex max-w-[920px] items-center justify-center gap-6">
            <button
              type="button"
              onClick={handleViewOrder}
              className="h-[46px] w-[190px] rounded-[10px] bg-[#243245] text-[14px] font-semibold text-white hover:bg-[#2b3b52]"
            >
              View Order
            </button>

            <button
              type="button"
              onClick={() => router.push("/collection")}
              className="h-[46px] w-[240px] rounded-[10px] bg-[#1f7cff] text-[14px] font-semibold text-white hover:bg-[#2a86ff]"
            >
              Continue Shopping
            </button>
          </div>

          <div className="mt-28 flex flex-col items-center gap-6 text-center">
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
    </>
  );
}
