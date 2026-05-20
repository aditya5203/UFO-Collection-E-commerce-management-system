"use client";

import { API_URL } from "@/lib/api";

import * as React from "react";

const API_BASE =
  API_URL;

type ToastType = "success" | "error" | "info";

export default function SubscribeOffer() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showToast("Please enter your email address.", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(
          data?.message || "Subscription failed. Please try again.",
          "error"
        );
        return;
      }

      const couponCode = String(data?.data?.couponCode || "WELCOME20")
        .trim()
        .toUpperCase();

      try {
        await fetch(
          `${API_BASE}/discounts/collect/${encodeURIComponent(couponCode)}`,
          {
            method: "POST",
            credentials: "include",
          }
        );
      } catch {
        // user may not be logged in, ignore
      }

      localStorage.setItem("ufo_coupon_selected", couponCode);
      window.dispatchEvent(new Event("ufo_coupon_updated"));

      showToast(
        data?.message ||
          `Subscribed successfully. Coupon ${couponCode} is ready for cart.`,
        "success"
      );

      setEmail("");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toastTone =
    toast?.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast?.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  return (
    <section className="relative border-y border-[#1b1e2b] bg-[#11121a] py-10 text-center sm:py-12">
      {toast ? (
        <div className="absolute left-1/2 top-4 z-20 w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2">
          <div
            className={`rounded-[16px] border px-4 py-3 text-[13px] font-medium shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${toastTone}`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
        <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-white sm:text-[30px]">
          Subscribe now &amp; get 20% off
        </h3>

        <p className="mx-auto mt-3 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
          Join our mailing list for early access to new drops, exclusive
          discounts, product updates, and styling inspiration.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-6 flex max-w-[760px] flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="h-[50px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
          />

          <button
            type="submit"
            disabled={loading}
            className={`rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] transition sm:px-6 sm:py-3 ${
              loading
                ? "cursor-not-allowed bg-white/20 text-white/50"
                : "bg-white text-[#090a12] hover:-translate-y-0.5 hover:bg-white/90"
            }`}
          >
            {loading ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}