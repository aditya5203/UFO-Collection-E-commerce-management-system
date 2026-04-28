"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
};

type PayMethod = "esewa" | "khalti" | "cod";
type ToastType = "success" | "error" | "info";

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
  lat?: number;
  lng?: number;
};

type OrderAddressAPI = {
  label?: "Home" | "Work" | "Other";
  fullName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  lat?: number;
  lng?: number;
};

type OrderSummaryLS = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency?: string;
  updatedAt?: string;
  couponCode?: string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

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

function normalizeNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function getCheckoutAddressLS(): CheckoutAddressLS | undefined {
  try {
    const raw =
      localStorage.getItem("checkout_address") ||
      localStorage.getItem("ufo_checkout_address") ||
      localStorage.getItem("ufo_address") ||
      "";

    if (!raw) return undefined;

    const addr = JSON.parse(raw);
    return addr && typeof addr === "object"
      ? (addr as CheckoutAddressLS)
      : undefined;
  } catch {
    return undefined;
  }
}

function mapToOrderAddress(a?: CheckoutAddressLS): OrderAddressAPI | undefined {
  if (!a) return undefined;

  const fullName = `${a.firstName || ""} ${a.lastName || ""}`.trim();
  const phone = String(a.phone || "").trim();
  const city = String(a.cityOrMunicipality || "").trim();
  const area = String(a.district || "").trim();
  const street = String(a.street || a.addressLine || "").trim();

  const lat = normalizeNumber(a.lat);
  const lng = normalizeNumber(a.lng);

  if (!fullName && !phone && !city && !area && !street) return undefined;

  return {
    label: "Home",
    fullName: fullName || "Customer",
    phone,
    city,
    area,
    street,
    lat,
    lng,
  };
}

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

function StepIndicator() {
  const steps = [
    { label: "Cart", href: "/cartpage", active: false },
    { label: "Information", href: "/checkout", active: false },
    { label: "Payment", href: "/payment", active: true },
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

function PaymentIcon({ method }: { method: PayMethod }) {
  const src =
    method === "esewa"
      ? "/images/esewa.png"
      : method === "khalti"
        ? "/images/khalti.png"
        : "/images/cod.png";

  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/5">
      <Image
        src={src}
        alt={method}
        fill
        className="object-contain p-2"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = React.useState<CartItem[]>([]);
  const [cartReady, setCartReady] = React.useState(false);
  const [method, setMethod] = React.useState<PayMethod>("esewa");
  const [placing, setPlacing] = React.useState(false);

  const [summary, setSummary] = React.useState<OrderSummaryLS | null>(null);
  const [address, setAddress] = React.useState<CheckoutAddressLS | undefined>();

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  const apiBase = React.useMemo(() => joinUrl(API_BASE, "/api"), []);

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

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ufo_cart");
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
      showToast("Failed to load cart items.", "error");
    } finally {
      setCartReady(true);
    }
  }, [showToast]);

  React.useEffect(() => {
    setSummary(getOrderSummary());
    setAddress(getCheckoutAddressLS());
  }, []);

  const fallbackSubtotal = React.useMemo(() => {
    return items.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0),
      0
    );
  }, [items]);

  const fallbackShipping = cartReady && items.length ? 100 : 0;
  const fallbackTotal = fallbackSubtotal + fallbackShipping;

  const subtotal = summary ? summary.subtotal : fallbackSubtotal;
  const shipping = summary ? summary.shipping : fallbackShipping;
  const discount = summary ? summary.discount : 0;
  const total = summary ? summary.total : fallbackTotal;

  const selectedMethodLabel =
    method === "esewa"
      ? "eSewa"
      : method === "khalti"
        ? "Khalti"
        : "Cash on Delivery";

  const fullName = `${address?.firstName || ""} ${
    address?.lastName || ""
  }`.trim();

  const savePaymentMeta = (label: string) => {
    try {
      localStorage.setItem("ufo_payment_method", label);
      localStorage.setItem(
        "ufo_last_total_paisa",
        String(Math.round(total * 100))
      );
    } catch {
      // ignore
    }
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

    if (!safeItems.length) throw new Error("Cart is empty.");

    const addrLS = getCheckoutAddressLS();
    const mappedAddress = mapToOrderAddress(addrLS);

    const payload: any = {
      paymentMethod,
      paymentRef: paymentRef || undefined,
      paymentStatus: paymentStatus || undefined,

      shippingPaisa: Math.round(shipping * 100),
      couponCode: summary?.couponCode || null,
      discountPaisa: Math.round(discount * 100),

      items: safeItems.map((it) => ({
        productId: it.id,
        size: it.size || "",
        color: it.color || "",
        colorLabel: it.colorLabel || "",
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

    if (!res.ok) {
      throw new Error(json?.message || "Failed to create order.");
    }

    return json?.data as {
      id: string;
      orderCode: string;
      totalPaisa: number;
    };
  };

  const finishToThankYou = (data: {
    id: string;
    orderCode: string;
    totalPaisa: number;
  }) => {
    localStorage.setItem("ufo_last_order_id", data.id);
    localStorage.setItem("ufo_last_order_number", data.orderCode);
    localStorage.setItem("ufo_last_total_paisa", String(data.totalPaisa));
    localStorage.removeItem("ufo_cart");
    localStorage.removeItem("ufo_order_summary");
    window.dispatchEvent(new Event("ufo_cart_updated"));
    router.replace("/ThankYou");
  };

  React.useEffect(() => {
    const status = searchParams.get("status");

    if (status === "failed") {
      showToast("Payment failed. Please try again.", "error");
    }
  }, [searchParams, showToast]);

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
        showToast("Verifying Khalti payment...", "info");

        const vr = await fetch(joinUrl(apiBase, "/payments/khalti/lookup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pidx }),
        });

        const vj = await vr.json().catch(() => ({} as any));

        if (!vr.ok) throw new Error(vj?.message || "Khalti lookup failed.");

        if (!vj?.paid) {
          throw new Error(
            `Khalti not completed. Status: ${vj?.status || "Unknown"}`
          );
        }

        savePaymentMeta("Khalti");

        const order = await createOrder("Khalti", pidx, "Paid");
        finishToThankYou(order);
      } catch (e: any) {
        console.error(e);
        sessionStorage.removeItem("khalti_finalized");
        showToast(e?.message || "Failed to finalize Khalti payment.", "error");
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
        showToast("Verifying eSewa payment...", "info");

        const vr = await fetch(joinUrl(apiBase, "/payments/esewa/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ data }),
        });

        const vj = await vr.json().catch(() => ({} as any));

        if (!vr.ok) throw new Error(vj?.message || "eSewa verify failed.");

        const ref =
          String(
            vj?.transaction_uuid || vj?.payload?.transaction_uuid || ""
          ).trim() || "ESEWA_OK";

        savePaymentMeta("eSewa");

        const payStatus: "Paid" | "Pending" = vj?.statusOk ? "Paid" : "Pending";
        const order = await createOrder("eSewa", ref, payStatus);
        finishToThankYou(order);
      } catch (e: any) {
        console.error(e);
        sessionStorage.removeItem("esewa_finalized");
        showToast(e?.message || "Failed to finalize eSewa payment.", "error");
      } finally {
        setPlacing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartReady, searchParams, apiBase]);

  const handleEsewaPay = () => {
    if (!cartReady || placing) return;

    if (!items.length) {
      showToast("Your cart is empty. Redirecting to collection.", "info");
      router.push("/collection");
      return;
    }

    savePaymentMeta("eSewa");
    showToast("Redirecting to eSewa...", "info");

    window.location.href = joinUrl(
      apiBase,
      `/payments/esewa/initiate?amount=${encodeURIComponent(String(total))}`
    );
  };

  const handleKhaltiPay = async () => {
    if (!cartReady || placing) return;

    if (!items.length) {
      showToast("Your cart is empty. Redirecting to collection.", "info");
      router.push("/collection");
      return;
    }

    try {
      setPlacing(true);
      savePaymentMeta("Khalti");
      showToast("Starting Khalti payment...", "info");

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

      if (!res.ok) {
        showToast(data?.message || "Failed to initiate Khalti payment.", "error");
        return;
      }

      if (data?.payment_url) {
        window.location.href = data.payment_url;
        return;
      }

      showToast("Khalti did not return payment URL.", "error");
    } catch (e: any) {
      showToast(e?.message || "Failed to initiate Khalti payment.", "error");
    } finally {
      setPlacing(false);
    }
  };

  const handleContinue = async () => {
    if (!cartReady || placing) return;

    if (!items.length) {
      showToast("Your cart is empty. Redirecting to collection.", "info");
      router.push("/collection");
      return;
    }

    if (method === "esewa") return handleEsewaPay();
    if (method === "khalti") return void handleKhaltiPay();

    try {
      setPlacing(true);
      savePaymentMeta("Cash on Delivery");
      showToast("Placing Cash on Delivery order...", "info");

      const order = await createOrder("COD", undefined, "Pending");
      finishToThankYou(order);
    } catch (e: any) {
      showToast(e?.message || "Failed to place COD order.", "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <CartHeader />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <StepIndicator />

          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Payment
            </div>

            <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
              Choose Payment Method
            </h1>

            <p className="mt-2 max-w-[640px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
              Select your preferred payment option and complete your UFO
              Collection order securely.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
            <section className={`${panelClass} p-5 sm:p-7`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                    Method
                  </div>
                  <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                    Payment Options
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-[#a7aec4]">
                  {selectedMethodLabel}
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {[
                  {
                    key: "esewa" as PayMethod,
                    label: "eSewa",
                    subtitle: "Pay securely using your eSewa wallet.",
                    badge: "Online",
                  },
                  {
                    key: "khalti" as PayMethod,
                    label: "Khalti",
                    subtitle: "Redirects to Khalti for secure wallet payment.",
                    badge: "Online",
                  },
                  {
                    key: "cod" as PayMethod,
                    label: "Cash on Delivery",
                    subtitle: "Pay in cash when your order is delivered.",
                    badge: "COD",
                  },
                ].map((m) => {
                  const active = method === m.key;

                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key)}
                      disabled={placing}
                      className={`flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition ${
                        active
                          ? "border-white bg-white/10 shadow-[0_20px_60px_rgba(255,255,255,0.06)]"
                          : "border-[#26293a] bg-[#161824] hover:border-[#4a506b] hover:bg-white/5"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <PaymentIcon method={m.key} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">
                            {m.label}
                          </span>

                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c8cde0]">
                            {m.badge}
                          </span>
                        </div>

                        <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">
                          {m.subtitle}
                        </p>
                      </div>

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          active
                            ? "border-white bg-white"
                            : "border-[#5b6380] bg-transparent"
                        }`}
                      >
                        {active ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#090a12]" />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Payment Note
                </div>

                <p className="mt-2 text-[13px] leading-7 text-[#a7aec4]">
                  {method === "esewa" &&
                    "You will be redirected to eSewa to complete payment securely. After successful payment, your order will be created automatically."}
                  {method === "khalti" &&
                    "You will be redirected to Khalti to complete payment securely. After verification, your order will be confirmed."}
                  {method === "cod" &&
                    "Your order will be placed immediately and payment will be collected during delivery."}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Secure", "Payment"],
                  ["Verified", "Order"],
                  ["Nepal", "Wallets"],
                ].map(([a, b]) => (
                  <div
                    key={`${a}-${b}`}
                    className="rounded-[16px] border border-[#26293a] bg-[#161824] p-4 text-center"
                  >
                    <div className="text-[13px] font-semibold text-white">
                      {a}
                    </div>
                    <div className="mt-1 text-[11px] text-[#a7aec4]">{b}</div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="lg:sticky lg:top-[104px] lg:self-start">
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

                <div className="mt-6 space-y-4 text-sm text-[#a7aec4] sm:text-[15px]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Subtotal</span>
                    <span className="text-right text-white">Rs. {subtotal}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Shipping</span>
                    <span className="text-right text-white">Rs. {shipping}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>
                      Discount{" "}
                      {summary?.couponCode ? `(${summary.couponCode})` : ""}
                    </span>
                    <span className="text-right text-green-400">
                      - Rs. {discount}
                    </span>
                  </div>

                  <div className="h-px bg-[#26293a]" />

                  <div className="flex items-center justify-between gap-4 text-[18px] font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-right text-white">Rs. {total}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                    Delivery To
                  </div>

                  {address ? (
                    <div className="mt-3 space-y-2 text-[13px] leading-6 text-[#a7aec4]">
                      <div className="font-semibold text-white">
                        {fullName || "Customer"}
                      </div>
                      {address.phone ? <div>{address.phone}</div> : null}
                      <div>
                        {[address.addressLine, address.street]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div>
                        {[address.cityOrMunicipality, address.district, "Nepal"]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-[13px] leading-6 text-yellow-100">
                      No delivery address found. Please return to checkout.
                    </div>
                  )}

                  <Link
                    href="/checkout"
                    className="mt-4 inline-flex text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d6c7ff] hover:underline"
                  >
                    Edit Address
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={placing || !cartReady}
                  className={`${primaryBtnClass} mt-6 w-full justify-center`}
                >
                  {placing
                    ? "Processing..."
                    : method === "cod"
                      ? "Place COD Order"
                      : `Pay with ${selectedMethodLabel}`}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  disabled={placing}
                  className={`${secondaryBtnClass} mt-3 w-full justify-center`}
                >
                  Back to Information
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MainFooter />
    </>
  );
}