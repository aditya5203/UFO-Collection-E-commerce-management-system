"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type StepKey = "PLACED" | "CONFIRMED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";
type ToastType = "success" | "error" | "info";

type OrderItem = {
  id: string;
  name: string;
  size?: string;
  color?: string;
  colorLabel?: string;
  qty: number;
  price: number;
  image: string;
};

type TrackingData = {
  trackingNumber: string;
  currentStatus: string;
  estimatedDelivery: string;
  activeStep: StepKey;
  timeline: Array<{ key: StepKey; title: string; date: string }>;
  locationUpdates: string;
  carrierInfo: string;
  orderId?: string;
  customer?: {
    name?: string;
    email?: string;
    shippingAddress?: string;
  };
  payment?: {
    method?: string;
  };
  shipping?: {
    method?: string;
    estimatedDelivery?: string;
  };
  summary?: {
    subtotal?: number;
    shipping?: number;
    discount?: number;
    taxes?: number;
    total?: number;
  };
  items: OrderItem[];
};

const STEP_ORDER: StepKey[] = [
  "PLACED",
  "CONFIRMED",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

const SOCKET_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const innerPanelClass = "rounded-[20px] border border-[#26293a] bg-[#161824]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function stepIndex(step: StepKey) {
  return STEP_ORDER.indexOf(step);
}

function progressWidthClass(active: StepKey) {
  const idx = stepIndex(active);
  if (idx <= 0) return "w-[10%]";
  if (idx === 1) return "w-[32%]";
  if (idx === 2) return "w-[55%]";
  if (idx === 3) return "w-[78%]";
  return "w-full";
}

function formatNPR(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
}

function colorDotClass(color?: string) {
  const c = String(color || "").trim().toLowerCase();

  if (c === "black" || c === "#000" || c === "#000000") return "bg-black";
  if (c === "white" || c === "#fff" || c === "#ffffff") return "bg-white";
  if (c === "red" || c === "#ff0000") return "bg-red-500";
  if (c === "blue" || c === "#0000ff") return "bg-blue-500";
  if (c === "green" || c === "#008000") return "bg-green-500";
  if (c === "yellow") return "bg-yellow-400";
  if (c === "purple") return "bg-purple-500";
  if (c === "pink") return "bg-pink-500";
  if (c === "gray" || c === "grey") return "bg-gray-500";
  if (c === "brown") return "bg-amber-900";
  if (c === "orange") return "bg-orange-500";

  return "bg-[#16191f]";
}

function normalizeTrackingCode(raw: string) {
  const value = String(raw || "").trim();
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value}`;
}

function cleanTrackingCode(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/^#/, "");
}

function statusToStep(orderStatusRaw: string): StepKey {
  const s = String(orderStatusRaw || "").trim().toLowerCase();

  if (s === "delivered" || s === "completed" || s === "successfully delivered") {
    return "DELIVERED";
  }

  if (
    s === "in_transit" ||
    s === "in transit" ||
    s === "intransit" ||
    s === "transit" ||
    s === "out_for_delivery" ||
    s === "out for delivery"
  ) {
    return "IN_TRANSIT";
  }

  if (s === "shipped" || s === "dispatch" || s === "dispatched") {
    return "SHIPPED";
  }

  if (s === "confirmed") {
    return "CONFIRMED";
  }

  return "PLACED";
}

function safeStatusText(orderStatusRaw: string) {
  const raw = String(orderStatusRaw || "").trim();
  if (!raw) return "Pending";

  return raw.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function fmtDate(input?: any) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusBadgeClasses(status: string) {
  const s = String(status || "").trim().toLowerCase();

  if (s.includes("delivered") || s.includes("completed")) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  }

  if (s.includes("transit") || s.includes("out for delivery")) {
    return "border-sky-400/30 bg-sky-500/10 text-sky-300";
  }

  if (s.includes("shipped") || s.includes("dispatch")) {
    return "border-violet-400/30 bg-violet-500/10 text-violet-300";
  }

  if (s.includes("confirm")) {
    return "border-blue-400/30 bg-blue-500/10 text-blue-300";
  }

  if (s.includes("cancel")) {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  return "border-amber-400/30 bg-amber-500/10 text-amber-300";
}

function TimelineIcon({ step, active }: { step: StepKey; active: StepKey }) {
  const done = stepIndex(step) <= stepIndex(active);

  const iconSrc =
    step === "PLACED"
      ? "/images/check.png"
      : step === "CONFIRMED"
        ? "/images/check.png"
        : step === "SHIPPED"
          ? "/images/truck.png"
          : step === "IN_TRANSIT"
            ? "/images/box.png"
            : "/images/home.png";

  const iconAlt =
    step === "PLACED"
      ? "Order placed"
      : step === "CONFIRMED"
        ? "Order confirmed"
        : step === "SHIPPED"
          ? "Shipped"
          : step === "IN_TRANSIT"
            ? "In transit"
            : "Delivered";

  return (
    <div
      className={[
        "relative z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_8px_30px_rgba(0,0,0,0.22)] transition-all",
        done
          ? "border-white/55 bg-white/10"
          : "border-white/15 bg-[#0c1220]",
      ].join(" ")}
      aria-hidden
    >
      <Image
        src={iconSrc}
        alt={iconAlt}
        width={20}
        height={20}
        className={done ? "brightness-0 invert" : "brightness-0 invert opacity-40"}
      />
    </div>
  );
}

function buildDefaultTrackingData(): TrackingData {
  return {
    trackingNumber: "",
    currentStatus: "",
    estimatedDelivery: "—",
    activeStep: "PLACED",
    timeline: [
      { key: "PLACED", title: "Order Placed", date: "—" },
      { key: "CONFIRMED", title: "Confirmed", date: "—" },
      { key: "SHIPPED", title: "Shipped", date: "—" },
      { key: "IN_TRANSIT", title: "In Transit", date: "—" },
      { key: "DELIVERED", title: "Delivered", date: "—" },
    ],
    locationUpdates: "Enter your order code and click Track.",
    carrierInfo: "Standard Shipping — UFO Collection",
    orderId: "",
    customer: {
      name: "",
      email: "",
      shippingAddress: "",
    },
    payment: {
      method: "",
    },
    shipping: {
      method: "",
      estimatedDelivery: "",
    },
    summary: {
      subtotal: 0,
      shipping: 0,
      discount: 0,
      taxes: 0,
      total: 0,
    },
    items: [],
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

function TrackingEmptyState() {
  return (
    <div className={`${panelClass} p-8 text-center sm:p-10`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[26px]">
        📦
      </div>

      <h2 className="mt-5 text-[24px] font-semibold text-white">
        Track your order
      </h2>

      <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-7 text-[#a7aec4]">
        Enter your order code to view real-time delivery progress, product
        details, and payment summary.
      </p>
    </div>
  );
}

function TrackingSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div className={`${innerPanelClass} p-5 sm:p-6`}>
        <div className="h-6 w-44 animate-pulse rounded bg-white/5" />
        <div className="mt-8 space-y-7">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-11 w-11 animate-pulse rounded-full bg-white/5" />
              <div className="flex-1 pt-1">
                <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${innerPanelClass} p-5 sm:p-6`}>
            <div className="h-5 w-44 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-20 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderTrackingPageContent() {
  const searchParams = useSearchParams();

  const socketRef = React.useRef<Socket | null>(null);
  const trackingNumberRef = React.useRef("");

  const [loading, setLoading] = React.useState(false);
  const [hasTracked, setHasTracked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<TrackingData>(
    buildDefaultTrackingData()
  );

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeFromQuery =
    searchParams.get("code") ||
    searchParams.get("tracking") ||
    searchParams.get("orderCode") ||
    "";

  const from = searchParams.get("from") || "";

  const backHref =
  from === "profile"
    ? "/profile"
    : from === "orders"
      ? "/order-history"
      : from === "details" || from === "tracking-details"
        ? `/customerorderdetails/${encodeURIComponent(
            cleanTrackingCode(codeFromQuery || data.trackingNumber)
          )}`
        : "/collection";

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  React.useEffect(() => {
    trackingNumberRef.current = data.trackingNumber;
  }, [data.trackingNumber]);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const fetchTracking = React.useCallback(
    async (trackingValue: string, silent = false) => {
      const cleaned = cleanTrackingCode(trackingValue);

      if (!cleaned) {
        setError("Please enter tracking number.");
        showToast("Please enter tracking number.", "error");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const codeWithHash = normalizeTrackingCode(cleaned);

        const res = await fetch(
          `${API_BASE}/orders/track/${encodeURIComponent(codeWithHash)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const json = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          throw new Error(json?.message || "Order not found");
        }

        const o: any = json?.order || {};

        const currentStatus = safeStatusText(o.orderStatus || o.status);
        const activeStep = statusToStep(currentStatus);
        const placedDate = fmtDate(o.createdAt);

        const confirmedDate =
          activeStep === "CONFIRMED" ||
          activeStep === "SHIPPED" ||
          activeStep === "IN_TRANSIT" ||
          activeStep === "DELIVERED"
            ? fmtDate(o.confirmedAt || o.updatedAt)
            : "—";

        const shippedDate =
          activeStep === "SHIPPED" ||
          activeStep === "IN_TRANSIT" ||
          activeStep === "DELIVERED"
            ? fmtDate(o.shippedAt || o.updatedAt)
            : "—";

        const inTransitDate =
          activeStep === "IN_TRANSIT" || activeStep === "DELIVERED"
            ? fmtDate(
                o.inTransitAt ||
                  o.deliveryAssignment?.outForDeliveryAt ||
                  o.outForDeliveryAt ||
                  o.updatedAt
              )
            : "—";

        const deliveredDate =
          activeStep === "DELIVERED"
            ? fmtDate(
                o.deliveredAt || o.deliveryAssignment?.deliveredAt || o.updatedAt
              )
            : "—";

        const estimatedDelivery =
          String(o?.shipping?.estimatedDelivery || "").trim() || "—";

        const locationUpdates =
          activeStep === "DELIVERED"
            ? "Your order has been delivered successfully. Thank you for shopping with UFO Collection."
            : activeStep === "IN_TRANSIT"
              ? "Your order is currently in transit and moving through the delivery network."
              : activeStep === "SHIPPED"
                ? "Good news! Your order has been shipped and will arrive soon."
                : activeStep === "CONFIRMED"
                  ? "Your order has been confirmed and is being prepared for shipment."
                  : "Your order has been placed and is currently being processed.";

        const carrierInfo =
          String(o?.shipping?.method || "").trim() ||
          "Standard Shipping — UFO Collection";

        setData((prev) => ({
          ...prev,
          trackingNumber: String(o.orderCode || o.orderId || codeWithHash),
          orderId: String(o.id || o._id || o.orderId || ""),
          currentStatus,
          estimatedDelivery,
          activeStep,
          timeline: [
            { key: "PLACED", title: "Order Placed", date: placedDate },
            { key: "CONFIRMED", title: "Confirmed", date: confirmedDate },
            { key: "SHIPPED", title: "Shipped", date: shippedDate },
            { key: "IN_TRANSIT", title: "In Transit", date: inTransitDate },
            { key: "DELIVERED", title: "Delivered", date: deliveredDate },
          ],
          locationUpdates,
          carrierInfo,
          customer: {
            name: o?.customer?.name || "",
            email: o?.customer?.email || "",
            shippingAddress: o?.customer?.shippingAddress || "",
          },
          payment: {
            method: o?.payment?.method || "",
          },
          shipping: {
            method: o?.shipping?.method || "",
            estimatedDelivery: o?.shipping?.estimatedDelivery || "",
          },
          summary: {
            subtotal: Number(o?.summary?.subtotal || 0),
            shipping: Number(o?.summary?.shipping || 0),
            discount: Number(o?.summary?.discount || 0),
            taxes: Number(o?.summary?.taxes || 0),
            total: Number(o?.summary?.total || 0),
          },
          items: Array.isArray(o?.items) ? o.items : [],
        }));

        setHasTracked(true);

        if (!silent) {
          showToast("Tracking details loaded successfully.", "success");
        }
      } catch (e: any) {
        const msg = e?.message || "Failed to track order";
        setError(msg);
        showToast(msg, "error");

        setData((prev) => ({
          ...prev,
          currentStatus: "",
          estimatedDelivery: "—",
          activeStep: "PLACED",
          timeline: [
            { key: "PLACED", title: "Order Placed", date: "—" },
            { key: "CONFIRMED", title: "Confirmed", date: "—" },
            { key: "SHIPPED", title: "Shipped", date: "—" },
            { key: "IN_TRANSIT", title: "In Transit", date: "—" },
            { key: "DELIVERED", title: "Delivered", date: "—" },
          ],
          locationUpdates: "We could not find tracking details for this order.",
          carrierInfo: "Standard Shipping — UFO Collection",
          customer: {
            name: "",
            email: "",
            shippingAddress: "",
          },
          payment: {
            method: "",
          },
          shipping: {
            method: "",
            estimatedDelivery: "",
          },
          summary: {
            subtotal: 0,
            shipping: 0,
            discount: 0,
            taxes: 0,
            total: 0,
          },
          items: [],
        }));

        setHasTracked(true);
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const handleTrack = React.useCallback(async () => {
    await fetchTracking(data.trackingNumber);
  }, [data.trackingNumber, fetchTracking]);

  const copyTrackingCode = async () => {
    const code = normalizeTrackingCode(data.trackingNumber);
    if (!code) {
      showToast("No tracking code to copy.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      showToast("Tracking code copied.", "success");
    } catch {
      showToast("Unable to copy tracking code.", "error");
    }
  };

  React.useEffect(() => {
    if (!codeFromQuery) return;

    const clean = cleanTrackingCode(codeFromQuery);
    if (!clean) return;

    setData((prev) => ({
      ...prev,
      trackingNumber: clean,
    }));

    const timer = setTimeout(() => {
      fetchTracking(clean, true);
    }, 120);

    return () => clearTimeout(timer);
  }, [codeFromQuery, fetchTracking]);

  React.useEffect(() => {
    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("order:updated", (payload: any) => {
      const payloadCode = cleanTrackingCode(payload?.orderCode || "");
      const currentCode = cleanTrackingCode(trackingNumberRef.current || "");

      if (!payloadCode || !currentCode) return;
      if (payloadCode !== currentCode) return;

      showToast("Live order update received.", "info");
      fetchTracking(payloadCode, true);
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchTracking, showToast]);

  const percentClass = progressWidthClass(data.activeStep);
  const trackingCode = normalizeTrackingCode(data.trackingNumber);
  const cleanCode = cleanTrackingCode(data.trackingNumber);
  const canViewOrder = Boolean(data.orderId || cleanCode);

  return (
    <>
      <CartHeader backHref={backHref} />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-8 text-[13px] text-[#a7aec4]">
            <Link href="/homepage" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/order-history" className="hover:text-white">
              Orders
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Tracking</span>
          </div>

          <section className={`${panelClass} overflow-hidden`}>
            <div className="relative border-b border-[#26293a] px-5 py-8 sm:px-8 lg:px-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,199,255,0.14),transparent_38%)]" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                    Delivery Tracking
                  </div>

                  <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[48px]">
                    Order Tracking
                  </h1>

                  <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[#a7aec4]">
                    Track your order status, delivery progress, shipment
                    updates, and order summary in real time.
                  </p>
                </div>

                {data.currentStatus ? (
                  <div
                    className={[
                      "inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
                      getStatusBadgeClasses(data.currentStatus),
                    ].join(" ")}
                  >
                    {data.currentStatus}
                  </div>
                ) : null}
              </div>

              <div className="relative mt-8 grid max-w-[840px] gap-5">
                <div>
                  <label
                    htmlFor="trackingNumber"
                    className="text-sm text-[#cfd3ff]"
                  >
                    Tracking Number
                  </label>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="trackingNumber"
                      value={data.trackingNumber}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          trackingNumber: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) {
                          handleTrack();
                        }
                      }}
                      className="h-[50px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                      placeholder="Enter order code, e.g. 597320"
                      autoComplete="off"
                    />

                    <button
                      type="button"
                      onClick={handleTrack}
                      disabled={loading}
                      className={`${primaryBtnClass} shrink-0`}
                    >
                      {loading ? "Tracking..." : "Track"}
                    </button>

                    <button
                      type="button"
                      onClick={copyTrackingCode}
                      className={`${secondaryBtnClass} shrink-0`}
                    >
                      Copy
                    </button>
                  </div>

                  {error ? (
                    <div className="mt-3 rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                    </div>
                  ) : null}
                </div>

                {trackingCode ? (
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] text-[#a7aec4]">
                      Tracking Code:{" "}
                      <span className="font-semibold text-white">
                        {trackingCode}
                      </span>
                    </span>

                    {canViewOrder ? (
                      <Link
                        href={`/customerorderdetails/${encodeURIComponent(
                          cleanCode
                        )}?from=tracking`}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
                      >
                        View Order Details
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="px-5 py-8 sm:px-8 lg:px-10">
              {!hasTracked && !loading ? (
                <TrackingEmptyState />
              ) : loading ? (
                <TrackingSkeleton />
              ) : (
                <>
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-medium text-white">
                        Order Progress
                      </div>
                      <div className="text-sm text-[#a7aec4]">
                        Estimated Delivery: {data.estimatedDelivery}
                      </div>
                    </div>

                    <div className="mt-5 h-[8px] w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-[8px] rounded-full bg-[#d6c7ff] transition-all duration-500 ${percentClass}`}
                      />
                    </div>
                  </div>

                  <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
                    <div>
                      <div className={`${innerPanelClass} p-5 sm:p-6`}>
                        <h2 className="text-[20px] font-semibold">
                          Tracking Timeline
                        </h2>

                        <div className="mt-8 space-y-0">
                          {data.timeline.map((t, idx) => {
                            const isLast = idx === data.timeline.length - 1;
                            const done =
                              stepIndex(t.key) <= stepIndex(data.activeStep);

                            return (
                              <div
                                key={t.key}
                                className="relative flex gap-4 pb-7 last:pb-0"
                              >
                                {!isLast && (
                                  <div
                                    className={[
                                      "absolute left-[21px] top-[46px] h-[calc(100%-14px)] w-px",
                                      done ? "bg-white/30" : "bg-white/12",
                                    ].join(" ")}
                                  />
                                )}

                                <TimelineIcon
                                  step={t.key}
                                  active={data.activeStep}
                                />

                                <div className="min-w-0 pt-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-[17px] font-semibold text-white">
                                      {t.title}
                                    </div>

                                    {t.key === data.activeStep ? (
                                      <span className="rounded-full border border-[#d6c7ff]/25 bg-[#d6c7ff]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d6c7ff]">
                                        Active
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="mt-1 text-sm text-[#a7aec4]">
                                    {t.date || "—"}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`${innerPanelClass} mt-6 p-5 sm:p-6`}>
                        <h2 className="text-[20px] font-semibold">
                          Items in this Order
                        </h2>

                        {data.items.length === 0 ? (
                          <div className="mt-4 rounded-[16px] border border-white/10 bg-[#0d0f17] p-4 text-sm text-[#a7aec4]">
                            No order items found.
                          </div>
                        ) : (
                          <div className="mt-6 space-y-4">
                            {data.items.map((it, idx) => (
                              <div
                                key={`${it.id}-${it.size || ""}-${
                                  it.color || ""
                                }-${idx}`}
                                className="flex gap-4 rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4"
                              >
                                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[14px] border border-[#26293a] bg-black/20">
                                  <Image
                                    src={it.image || "/images/placeholder.png"}
                                    alt={it.name || "Product"}
                                    fill
                                    sizes="72px"
                                    className="object-cover"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="truncate text-[15px] font-semibold text-white">
                                        {it.name}
                                      </div>

                                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#a7aec4]">
                                        <span>Qty: {it.qty}</span>
                                        <span>Size: {it.size || "-"}</span>

                                        <span className="inline-flex items-center gap-2">
                                          Color:
                                          <span
                                            className={`h-3.5 w-3.5 rounded-full border border-white/15 ${colorDotClass(
                                              it.color
                                            )}`}
                                          />
                                          {it.colorLabel || it.color || "-"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-sm font-medium text-white">
                                      {formatNPR(
                                        Number(it.price || 0) *
                                          Number(it.qty || 0)
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-2 text-xs text-[#7f879f]">
                                    Unit Price: {formatNPR(Number(it.price || 0))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className={`${innerPanelClass} p-5 sm:p-6`}>
                        <h2 className="text-[20px] font-semibold">
                          Location Updates
                        </h2>
                        <p className="mt-4 text-[15px] leading-7 text-[#a7aec4]">
                          {data.locationUpdates}
                        </p>
                      </div>

                      <div className={`${innerPanelClass} p-5 sm:p-6`}>
                        <h2 className="text-[20px] font-semibold">
                          Customer Information
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-[#7f879f]">Name</span>
                            <span className="text-white">
                              {data.customer?.name || "—"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[#7f879f]">Email</span>
                            <span className="break-all text-white">
                              {data.customer?.email || "—"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[#7f879f]">
                              Shipping Address
                            </span>
                            <span className="whitespace-pre-line text-white">
                              {data.customer?.shippingAddress || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`${innerPanelClass} p-5 sm:p-6`}>
                        <h2 className="text-[20px] font-semibold">
                          Shipping Information
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-[#7f879f]">Method</span>
                            <span className="text-white">
                              {data.shipping?.method || data.carrierInfo || "—"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[#7f879f]">
                              Estimated Delivery
                            </span>
                            <span className="text-white">
                              {data.shipping?.estimatedDelivery ||
                                data.estimatedDelivery ||
                                "—"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[#7f879f]">
                              Tracking Code
                            </span>
                            <span className="text-white">
                              {trackingCode || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`${innerPanelClass} p-5 sm:p-6`}>
                        <h2 className="text-[20px] font-semibold">
                          Payment & Summary
                        </h2>

                        <div className="mt-4 space-y-4 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-[#7f879f]">
                              Payment Method
                            </span>
                            <span className="text-white">
                              {data.payment?.method || "—"}
                            </span>
                          </div>

                          <div className="h-px bg-[#26293a]" />

                          <div className="flex justify-between text-[#a7aec4]">
                            <span>Subtotal</span>
                            <span className="text-white">
                              {formatNPR(data.summary?.subtotal)}
                            </span>
                          </div>

                          <div className="flex justify-between text-[#a7aec4]">
                            <span>Shipping</span>
                            <span className="text-white">
                              {formatNPR(data.summary?.shipping)}
                            </span>
                          </div>

                          {Number(data.summary?.discount || 0) > 0 ? (
                            <div className="flex justify-between text-[#a7aec4]">
                              <span>Discount</span>
                              <span className="text-emerald-300">
                                - {formatNPR(data.summary?.discount)}
                              </span>
                            </div>
                          ) : null}

                          <div className="flex justify-between text-[#a7aec4]">
                            <span>Taxes</span>
                            <span className="text-white">
                              {formatNPR(data.summary?.taxes)}
                            </span>
                          </div>

                          <div className="h-px bg-[#26293a]" />

                          <div className="flex justify-between text-base font-semibold">
                            <span>Total</span>
                            <span>{formatNPR(data.summary?.total)}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`${innerPanelClass} p-5 sm:p-6`}>
                        <h2 className="text-[20px] font-semibold">
                          Need Help?
                        </h2>

                        <p className="mt-4 text-[15px] leading-7 text-[#a7aec4]">
                          If your delivery is delayed or you have any issue with
                          this order, please contact our support team.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Link href="/contact" className={secondaryBtnClass}>
                            Contact Support
                          </Link>

                          <Link href="/collection" className={primaryBtnClass}>
                            Continue Shopping
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <MainFooter />
    </>
  );
}

export default function OrderTrackingPage() {
  return (
    <React.Suspense fallback={null}>
      <OrderTrackingPageContent />
    </React.Suspense>
  );
}