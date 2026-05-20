"use client";

import { API_BASE_URL, API_URL } from "@/lib/api";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

import TrackingToast from "./_components/TrackingToast";
import TrackingHeaderCard from "./_components/TrackingHeaderCard";
import TrackingEmptyState from "./_components/TrackingEmptyState";
import TrackingSkeleton from "./_components/TrackingSkeleton";
import TrackingDetailsGrid from "./_components/TrackingDetailsGrid";

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

const API_BASE =
  API_URL;

const SOCKET_BASE =
  API_BASE_URL;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

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

  if (
    s === "shipped" ||
    s === "dispatch" ||
    s === "dispatched" ||
    s === "picked up" ||
    s === "picked_up"
  ) {
    return "SHIPPED";
  }

  if (s === "confirmed" || s === "processing" || s === "assigned") {
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

function OrderTrackingPageContent() {
  const searchParams = useSearchParams();

  const socketRef = React.useRef<Socket | null>(null);
  const trackingNumberRef = React.useRef("");
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [hasTracked, setHasTracked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<TrackingData>(
    buildDefaultTrackingData(),
  );

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const codeFromQuery =
    searchParams.get("code") ||
    searchParams.get("tracking") ||
    searchParams.get("orderCode") ||
    "";

  const from = searchParams.get("from") || "";

  const backOrderId =
    data.orderId || cleanTrackingCode(codeFromQuery || data.trackingNumber);

  const backHref =
    from === "profile"
      ? "/profile"
      : from === "orders"
        ? "/order-history"
        : from === "details" || from === "tracking-details"
          ? `/customerorderdetails/${encodeURIComponent(backOrderId)}?from=tracking`
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
    [],
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
          `${API_BASE}/orders/track/${encodeURIComponent(cleaned)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
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
                  o.updatedAt,
              )
            : "—";

        const deliveredDate =
          activeStep === "DELIVERED"
            ? fmtDate(
                o.deliveredAt ||
                  o.deliveryAssignment?.deliveredAt ||
                  o.updatedAt,
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
    [showToast],
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

  const trackingCode = normalizeTrackingCode(data.trackingNumber);
  const cleanCode = cleanTrackingCode(data.trackingNumber);
  const canViewOrder = Boolean(data.orderId || cleanCode);

  return (
    <>
      <CartHeader backHref={backHref} />

      <TrackingToast toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <TrackingHeaderCard
            data={data}
            loading={loading}
            error={error}
            trackingCode={trackingCode}
            cleanCode={cleanCode}
            canViewOrder={canViewOrder}
            onTrackingNumberChange={(value) =>
              setData((prev) => ({
                ...prev,
                trackingNumber: value,
              }))
            }
            onTrack={handleTrack}
            onCopy={copyTrackingCode}
          />

          <div className="px-0 py-8">
            {!hasTracked && !loading ? (
              <TrackingEmptyState />
            ) : loading ? (
              <TrackingSkeleton />
            ) : (
              <TrackingDetailsGrid data={data} trackingCode={trackingCode} />
            )}
          </div>
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