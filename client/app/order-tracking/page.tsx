"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";

type StepKey = "PLACED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

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
    taxes?: number;
    total?: number;
  };

  items: OrderItem[];
};

const STEP_ORDER: StepKey[] = ["PLACED", "SHIPPED", "IN_TRANSIT", "DELIVERED"];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

const SOCKET_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function stepIndex(step: StepKey) {
  return STEP_ORDER.indexOf(step);
}

function progressPercent(active: StepKey) {
  const idx = stepIndex(active);
  if (idx <= 0) return 12;
  if (idx === 1) return 45;
  if (idx === 2) return 75;
  return 100;
}

function normalizeTrackingCode(raw: string) {
  const value = String(raw || "").trim();
  if (!value) return "";
  return value.startsWith("#") ? value : `#${value}`;
}

function cleanTrackingCode(raw: string) {
  return String(raw || "").trim().replace(/^#/, "");
}

function statusToStep(orderStatusRaw: string): StepKey {
  const s = String(orderStatusRaw || "").trim().toLowerCase();

  if (
    s === "delivered" ||
    s === "completed" ||
    s === "successfully delivered"
  ) {
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

  return "PLACED";
}

function safeStatusText(orderStatusRaw: string) {
  const raw = String(orderStatusRaw || "").trim();
  if (!raw) return "Pending";

  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
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

  if (
    s.includes("transit") ||
    s.includes("out for delivery")
  ) {
    return "border-sky-400/30 bg-sky-500/10 text-sky-300";
  }

  if (s.includes("shipped") || s.includes("dispatch")) {
    return "border-violet-400/30 bg-violet-500/10 text-violet-300";
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
      : step === "SHIPPED"
      ? "/images/truck.png"
      : step === "IN_TRANSIT"
      ? "/images/box.png"
      : "/images/home.png";

  const iconAlt =
    step === "PLACED"
      ? "Order placed"
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
      { key: "SHIPPED", title: "Shipped", date: "—" },
      { key: "IN_TRANSIT", title: "In Transit", date: "—" },
      { key: "DELIVERED", title: "Delivered", date: "—" },
    ],
    locationUpdates: "Enter your order code and click Track.",
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
      taxes: 0,
      total: 0,
    },
    items: [],
  };
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const socketRef = React.useRef<Socket | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<TrackingData>(buildDefaultTrackingData());

  const fetchTracking = React.useCallback(async (trackingValue: string) => {
    const cleaned = cleanTrackingCode(trackingValue);

    if (!cleaned) {
      setError("Please enter tracking number.");
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
              o.deliveredAt ||
                o.deliveryAssignment?.deliveredAt ||
                o.updatedAt
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
          : "Your order has been placed and is currently being processed.";

      const carrierInfo =
        String(o?.shipping?.method || "").trim() ||
        "Standard Shipping — UFO Collection";

      setData((prev) => ({
        ...prev,
        trackingNumber: String(o.orderCode || o.orderId || codeWithHash),
        currentStatus,
        estimatedDelivery,
        activeStep,
        timeline: [
          { key: "PLACED", title: "Order Placed", date: placedDate },
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
          taxes: Number(o?.summary?.taxes || 0),
          total: Number(o?.summary?.total || 0),
        },

        items: Array.isArray(o?.items) ? o.items : [],
      }));
    } catch (e: any) {
      setError(e?.message || "Failed to track order");
      setData((prev) => ({
        ...prev,
        currentStatus: "",
        estimatedDelivery: "—",
        activeStep: "PLACED",
        timeline: [
          { key: "PLACED", title: "Order Placed", date: "—" },
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
          taxes: 0,
          total: 0,
        },
        items: [],
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTrack = React.useCallback(async () => {
    await fetchTracking(data.trackingNumber);
  }, [data.trackingNumber, fetchTracking]);

  React.useEffect(() => {
    const code =
      searchParams.get("code") ||
      searchParams.get("tracking") ||
      searchParams.get("orderCode") ||
      "";

    if (!code) return;

    const clean = cleanTrackingCode(code);
    if (!clean) return;

    setData((prev) => ({
      ...prev,
      trackingNumber: clean,
    }));

    const timer = setTimeout(() => {
      fetchTracking(clean);
    }, 120);

    return () => clearTimeout(timer);
  }, [searchParams, fetchTracking]);

  React.useEffect(() => {
    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("order:updated", (payload: any) => {
      const payloadCode = cleanTrackingCode(payload?.orderCode || "");
      const currentCode = cleanTrackingCode(data.trackingNumber || "");

      if (!payloadCode || !currentCode) return;
      if (payloadCode !== currentCode) return;

      fetchTracking(payloadCode);
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [data.trackingNumber, fetchTracking]);

  const percent = progressPercent(data.activeStep);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert transition group-hover:invert-0"
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

          <nav className="hidden gap-10 md:flex">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <div className="w-[26px]" />
        </div>
      </header>

      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
          <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <div className="border-b border-white/10 px-6 py-6 sm:px-8 sm:py-8 lg:px-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="text-[30px] font-semibold tracking-[0.01em] sm:text-[36px]">
                    Order Tracking
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-white/60 sm:text-[15px]">
                    Track your order status, delivery progress, and shipment updates.
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

              <div className="mt-8 grid max-w-[780px] gap-5">
                <div>
                  <label htmlFor="trackingNumber" className="text-sm text-white/85">
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
                      className="h-[48px] w-full rounded-[10px] border border-white/15 bg-[#0b0f1a]/80 px-4 text-white outline-none transition placeholder:text-white/30 focus:border-white/35"
                      placeholder="Enter order code (e.g. 597320)"
                      autoComplete="off"
                    />

                    <button
                      type="button"
                      onClick={handleTrack}
                      disabled={loading}
                      className={[
                        "inline-flex h-[48px] shrink-0 items-center justify-center rounded-[10px] border border-white/15 bg-[#0b0f1a]/80 px-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition",
                        "hover:border-white/35 hover:bg-white/10",
                        loading ? "cursor-not-allowed opacity-60" : "",
                      ].join(" ")}
                    >
                      {loading ? "Tracking..." : "Track"}
                    </button>
                  </div>

                  {error ? (
                    <div className="mt-3 rounded-[10px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {error}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="currentStatus" className="text-sm text-white/85">
                    Current Status
                  </label>
                  <input
                    id="currentStatus"
                    value={data.currentStatus}
                    readOnly
                    className="mt-3 h-[48px] w-full rounded-[10px] border border-white/15 bg-[#0b0f1a]/80 px-4 text-white/90 outline-none"
                    placeholder="(auto from system)"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-8 lg:px-10">
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium text-white/85">Order Progress</div>
                  <div className="text-sm text-white/60">
                    Estimated Delivery: {data.estimatedDelivery}
                  </div>
                </div>

                <div className="mt-5 h-[8px] w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-[8px] rounded-full bg-[#1f7cff] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
                <div>
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <h2 className="text-[20px] font-semibold">Tracking Timeline</h2>

                    <div className="mt-8 space-y-0">
                      {data.timeline.map((t, idx) => {
                        const isLast = idx === data.timeline.length - 1;
                        const done = stepIndex(t.key) <= stepIndex(data.activeStep);

                        return (
                          <div key={t.key} className="relative flex gap-4 pb-7 last:pb-0">
                            {!isLast && (
                              <div
                                className={[
                                  "absolute left-[21px] top-[46px] h-[calc(100%-14px)] w-px",
                                  done ? "bg-white/30" : "bg-white/12",
                                ].join(" ")}
                              />
                            )}

                            <TimelineIcon step={t.key} active={data.activeStep} />

                            <div className="min-w-0 pt-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-[17px] font-semibold text-white/95">
                                  {t.title}
                                </div>

                                {t.key === data.activeStep ? (
                                  <span className="rounded-full border border-[#1f7cff]/25 bg-[#1f7cff]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7fb1ff]">
                                    Active
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-1 text-sm text-white/60">{t.date || "—"}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 rounded-[16px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <h2 className="text-[20px] font-semibold">Items in this Order</h2>

                    {data.items.length === 0 ? (
                      <div className="mt-4 rounded-[12px] border border-white/10 bg-[#0b0f1a]/50 p-4 text-sm text-white/60">
                        No order items found.
                      </div>
                    ) : (
                      <div className="mt-6 space-y-4">
                        {data.items.map((it, idx) => (
                          <div
                            key={`${it.id}-${it.size || ""}-${it.color || ""}-${idx}`}
                            className="flex gap-4 rounded-[14px] border border-white/10 bg-[#0b0f1a]/50 p-4"
                          >
                            <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px] border border-white/10 bg-black/20">
                              <Image
                                src={it.image}
                                alt={it.name}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="truncate text-[15px] font-semibold text-white">
                                    {it.name}
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/60">
                                    <span>Qty: {it.qty}</span>
                                    <span>Size: {it.size || "-"}</span>
                                    <span className="inline-flex items-center gap-2">
                                      Color:
                                      <span
                                        className="h-3.5 w-3.5 rounded-full border border-white/15"
                                        style={{ backgroundColor: it.color || "#16191f" }}
                                      />
                                      {it.colorLabel || it.color || "-"}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-sm font-medium text-white">
                                  Rs. {Number(it.price || 0) * Number(it.qty || 0)}
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-white/45">
                                Unit Price: Rs. {Number(it.price || 0)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <h2 className="text-[20px] font-semibold">Location Updates</h2>
                    <p className="mt-4 text-[15px] leading-7 text-white/72">
                      {data.locationUpdates}
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <h2 className="text-[20px] font-semibold">Customer Information</h2>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-white/50">Name</span>
                        <span className="text-white">{data.customer?.name || "—"}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-white/50">Email</span>
                        <span className="text-white break-all">{data.customer?.email || "—"}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-white/50">Shipping Address</span>
                        <span className="whitespace-pre-line text-white">
                          {data.customer?.shippingAddress || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <h2 className="text-[20px] font-semibold">Shipping Information</h2>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-white/50">Method</span>
                        <span className="text-white">
                          {data.shipping?.method || data.carrierInfo || "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-white/50">Estimated Delivery</span>
                        <span className="text-white">
                          {data.shipping?.estimatedDelivery || data.estimatedDelivery || "—"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-white/50">Tracking Code</span>
                        <span className="text-white">
                          {normalizeTrackingCode(data.trackingNumber) || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <h2 className="text-[20px] font-semibold">Payment & Summary</h2>

                    <div className="mt-4 space-y-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-white/50">Payment Method</span>
                        <span className="text-white">{data.payment?.method || "—"}</span>
                      </div>

                      <div className="h-px bg-white/10" />

                      <div className="flex justify-between text-white/70">
                        <span>Subtotal</span>
                        <span className="text-white">Rs. {data.summary?.subtotal || 0}</span>
                      </div>

                      <div className="flex justify-between text-white/70">
                        <span>Shipping</span>
                        <span className="text-white">Rs. {data.summary?.shipping || 0}</span>
                      </div>

                      <div className="flex justify-between text-white/70">
                        <span>Taxes</span>
                        <span className="text-white">Rs. {data.summary?.taxes || 0}</span>
                      </div>

                      <div className="flex justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>Rs. {data.summary?.total || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                    <h2 className="text-[20px] font-semibold">Need Help?</h2>
                    <p className="mt-4 text-[15px] leading-7 text-white/72">
                      If your delivery is delayed or you have any issue with this order,
                      please contact our support team from your account or visit the contact
                      page.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href="/contact"
                        className="inline-flex h-[40px] items-center justify-center rounded-[10px] border border-white/15 bg-white/[0.03] px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:border-white/30 hover:bg-white/[0.06]"
                      >
                        Contact Support
                      </Link>

                      <Link
                        href="/homepage"
                        className="inline-flex h-[40px] items-center justify-center rounded-[10px] border border-white/15 bg-white/[0.03] px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:border-white/30 hover:bg-white/[0.06]"
                      >
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 text-white/60">
            <div className="flex items-center gap-6">
              <span className="text-lg">◎</span>
              <span className="text-lg">◯</span>
            </div>
            <p className="text-sm text-white/50">© 2025 UFO Collection — All Rights Reserved</p>
          </div>
        </div>
      </main>
    </>
  );
}