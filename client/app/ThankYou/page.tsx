"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type ToastType = "success" | "error" | "info";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-12 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90";
const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function StatusIcon() {
  return (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-[34px] text-green-300">
      ✓
    </div>
  );
}

function StepIndicator() {
  const steps = [
    { label: "Cart", href: "/cartpage", active: false },
    { label: "Information", href: "/checkout", active: false },
    { label: "Payment", href: "/payment", active: false },
    { label: "Confirmed", href: "/ThankYou", active: true },
  ];

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2 text-[13px] text-[#a7aec4]">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          {step.active ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white">
              {step.label}
            </span>
          ) : (
            <Link
              href={step.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition hover:text-white"
            >
              {step.label}
            </Link>
          )}

          {index < steps.length - 1 ? (
            <span className="text-[#50576f]">/</span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ThankYouPage() {
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = React.useState("");
  const [orderNumber, setOrderNumber] = React.useState("#000000");
  const [orderId, setOrderId] = React.useState("");
  const [totalPaisa, setTotalPaisa] = React.useState(0);

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const [estimatedDelivery] = React.useState(() => {
    const today = new Date();

    const from = new Date(today);
    from.setDate(today.getDate() + 3);

    const to = new Date(today);
    to.setDate(today.getDate() + 4);

    const sameMonth =
      from.getMonth() === to.getMonth() &&
      from.getFullYear() === to.getFullYear();

    if (sameMonth) {
      const month = from.toLocaleDateString("en-US", { month: "long" });
      return `${month} ${from.getDate()}–${to.getDate()}, ${to.getFullYear()}`;
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    return `${fmt(from)} – ${fmt(to)}`;
  });

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
        const t = localStorage.getItem("ufo_last_total");
        const rupees = t ? Number(t) : 0;
        setTotalPaisa(Number.isFinite(rupees) ? Math.round(rupees * 100) : 0);
      }

      const on = localStorage.getItem("ufo_last_order_number");
      if (on) setOrderNumber(on);

      const oid = localStorage.getItem("ufo_last_order_id");
      if (oid) setOrderId(oid);
    } catch {
      // ignore
    }
  }, []);

  const getOrderDetailsPath = () => {
  const cleanOrderNumber = String(orderNumber || "")
    .replace("#", "")
    .trim();

  if (cleanOrderNumber && cleanOrderNumber !== "000000") {
    return `/customerorderdetails/${encodeURIComponent(
      cleanOrderNumber
    )}?from=thankyou`;
  }

  if (orderId) {
    return `/customerorderdetails/${encodeURIComponent(
      orderId
    )}?from=thankyou`;
  }

  return "";
};

  const handleViewOrder = () => {
    const path = getOrderDetailsPath();

    if (!path) {
      showToast("Order not found. Please check Order History.", "error");
      window.setTimeout(() => {
        router.push("/order-history");
      }, 700);
      return;
    }

    router.push(path);
  };

  const handleTrackOrder = () => {
    const path = getOrderDetailsPath();

    if (!path) {
      showToast("Order not found. Redirecting to Order History.", "error");
      window.setTimeout(() => {
        router.push("/order-history");
      }, 700);
      return;
    }

    router.push(path);
  };

  return (
    <>
      <CartHeader backHref="/collection" />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <StepIndicator />

          <section className={`${panelClass} overflow-hidden`}>
            <div className="relative px-5 py-10 text-center sm:px-8 sm:py-14 lg:px-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_42%)]" />
              <div className="pointer-events-none absolute left-6 top-6 h-20 w-20 rounded-full bg-green-400/10 blur-2xl" />
              <div className="pointer-events-none absolute bottom-6 right-6 h-24 w-24 rounded-full bg-[#d6c7ff]/10 blur-2xl" />

              <div className="relative">
                <StatusIcon />
              </div>

              <div className="relative mt-5 text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Order Confirmed
              </div>

              <h1 className="relative mx-auto mt-3 max-w-[760px] text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[48px]">
                Thank You for Your Order!
              </h1>

              <p className="relative mx-auto mt-4 max-w-[720px] text-[14px] leading-7 text-[#a7aec4] sm:text-[15px]">
                Your order has been successfully placed. You will receive an
                email confirmation shortly with your order details.
              </p>

              <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleViewOrder}
                  className={secondaryBtnClass}
                >
                  View Order
                </button>

                <button
                  type="button"
                  onClick={handleTrackOrder}
                  className={secondaryBtnClass}
                >
                  Track Order
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/collection")}
                  className={primaryBtnClass}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className={`${panelClass} p-5 sm:p-7`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                    Receipt
                  </div>

                  <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                    Order Details
                  </h2>
                </div>

                <span className="w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[12px] font-semibold text-green-300">
                  Confirmed
                </span>
              </div>

              <div className="mt-6 divide-y divide-[#26293a]">
                {[
                  ["Order Number", orderNumber],
                  ["Estimated Delivery", estimatedDelivery],
                  ["Total", formatNPR(totalPaisa)],
                  ["Payment Method", paymentMethod || "Not available"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[220px_1fr]"
                  >
                    <div className="text-[14px] text-[#a7aec4]">{label}</div>

                    <div className="break-words text-[14px] font-medium text-white">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Need Help?
                </div>

                <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                  You can check your order status from order history or contact
                  support if you have any issue with your order.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/order-history")}
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                  >
                    Order History
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/contact")}
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>

            <aside
              className={`${panelClass} p-5 sm:p-6 lg:sticky lg:top-[104px] lg:self-start`}
            >
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Next Steps
              </div>

              <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white">
                What happens next?
              </h3>

              <div className="mt-5 space-y-4">
                {[
                  [
                    "1",
                    "Order confirmation",
                    "We confirm your order and payment details.",
                  ],
                  ["2", "Processing", "Your items will be packed carefully."],
                  [
                    "3",
                    "Delivery",
                    "Your order will be delivered to your address.",
                  ],
                ].map(([step, title, text]) => (
                  <div key={step} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[12px] font-semibold text-white">
                      {step}
                    </div>

                    <div>
                      <div className="text-[14px] font-semibold text-white">
                        {title}
                      </div>

                      <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
                        {text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[20px] border border-green-500/20 bg-green-500/10 p-4">
                <div className="text-[13px] font-semibold text-green-200">
                  Delivery Estimate
                </div>

                <div className="mt-1 text-[14px] text-white">
                  {estimatedDelivery}
                </div>

                <p className="mt-2 text-[12px] leading-5 text-green-100/80">
                  Delivery timing may vary depending on your location and order
                  processing time.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["Secure", "Payment"],
                  ["Easy", "Return"],
                  ["COD", "Available"],
                ].map(([a, b]) => (
                  <div
                    key={`${a}-${b}`}
                    className="rounded-[16px] border border-[#26293a] bg-[#161824] p-3 text-center"
                  >
                    <div className="text-[12px] font-semibold text-white">
                      {a}
                    </div>

                    <div className="text-[11px] text-[#a7aec4]">{b}</div>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </div>
      </main>

      <MainFooter />
    </>
  );
}