"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  DELIVERY_ENDPOINTS,
  DeliveryOrder,
  DeliveryOtpChannel,
  DeliveryStatus,
  formatDateLong,
  formatDateTime,
  formatNPR,
  getDeliveryStatusTone,
  getGoogleMapsUrl,
  hasLatLng,
  pickId,
  safeJson,
  safeStr,
} from "@/app/lib/delivery";

type TimelineStep = {
  label: string;
  date: string;
  status: "done" | "current" | "upcoming";
};

type ToastType = "success" | "error" | "info";

type Toast = {
  type: ToastType;
  message: string;
};

const panelClass =
  "rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const softPanelClass =
  "rounded-[22px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const inputClass =
  "w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white placeholder:text-[#7f879f] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10 disabled:cursor-not-allowed disabled:opacity-60";

function getInitials(name?: string) {
  const safe = safeStr(name).trim();
  if (!safe) return "CU";

  const parts = safe.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return initials || "CU";
}

function getColorDotClass(color?: string) {
  const c = safeStr(color).trim().toLowerCase();

  const colorMap: Record<string, string> = {
    black: "bg-black",
    "#000": "bg-black",
    "#000000": "bg-black",

    white: "bg-white",
    "#fff": "bg-white",
    "#ffffff": "bg-white",

    red: "bg-red-500",
    "#ef4444": "bg-red-500",

    blue: "bg-blue-500",
    "#3b82f6": "bg-blue-500",

    green: "bg-green-500",
    "#22c55e": "bg-green-500",

    yellow: "bg-yellow-400",
    "#eab308": "bg-yellow-400",

    gray: "bg-gray-500",
    grey: "bg-gray-500",
    "#808080": "bg-gray-500",

    pink: "bg-pink-500",
    "#ec4899": "bg-pink-500",

    purple: "bg-purple-500",
    "#a855f7": "bg-purple-500",

    orange: "bg-orange-500",
    "#f97316": "bg-orange-500",

    navy: "bg-blue-950",
    "navy blue": "bg-blue-950",
    "#000080": "bg-blue-950",

    brown: "bg-amber-900",
    maroon: "bg-red-900",
    cream: "bg-yellow-100",
    beige: "bg-stone-300",
  };

  return colorMap[c] || "bg-[#161824]";
}

function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getDeliveryStatusTone(String(children));

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function Dot({ status }: { status: TimelineStep["status"] }) {
  const base =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-bold";

  if (status === "done") {
    return (
      <div
        className={`${base} border-emerald-400/20 bg-emerald-500/15 text-emerald-300`}
      >
        ✓
      </div>
    );
  }

  if (status === "current") {
    return (
      <div
        className={`${base} border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#d6c7ff]`}
      >
        •
      </div>
    );
  }

  return (
    <div className={`${base} border-white/10 bg-white/[0.03] text-[#7f879f]`}>
      •
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  index,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={`${softPanelClass} relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#8b5cf6]/10 blur-2xl" />

      <div className="relative">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
          {label}
        </div>

        <div className="mt-3 break-words text-[20px] font-semibold tracking-[-0.03em] text-white">
          {value}
        </div>

        {hint ? (
          <div className="mt-2 break-words text-[12px] text-[#7f879f]">
            {hint}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function LineItem({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[#a7aec4]">{label}</span>
      <span className={`break-words text-right text-sm ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

function getAllowedTransitions(currentStatus: string): DeliveryStatus[] {
  const s = safeStr(currentStatus).toLowerCase();

  // Strict production flow:
  // Assigned → Picked Up → Out for Delivery → OTP Verify → Delivered
  if (!s || s === "assigned") {
    return ["Assigned", "Picked Up", "Failed Delivery", "Returned"];
  }

  if (s === "picked up") {
    return ["Picked Up", "Out for Delivery", "Failed Delivery", "Returned"];
  }

  // Delivered is not selectable here. Delivery must be completed by OTP verify.
  if (s === "out for delivery") {
    return ["Out for Delivery", "Failed Delivery", "Returned"];
  }

  if (s === "delivered") {
    return ["Delivered"];
  }

  if (s === "failed delivery") {
    return ["Failed Delivery", "Returned"];
  }

  if (s === "returned") {
    return ["Returned"];
  }

  return ["Assigned", "Picked Up", "Failed Delivery", "Returned"];
}

export default function DeliveryOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [otpSending, setOtpSending] = React.useState(false);
  const [otpVerifying, setOtpVerifying] = React.useState(false);
  const [order, setOrder] = React.useState<DeliveryOrder | null>(null);
  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState<Toast | null>(null);

  const [deliveryStatus, setDeliveryStatus] =
    React.useState<DeliveryStatus>("Assigned");
  const [deliveryNote, setDeliveryNote] = React.useState("");

  const [otpChannel, setOtpChannel] =
    React.useState<DeliveryOtpChannel>("phone");
  const [otpInput, setOtpInput] = React.useState("");
  const [otpMessage, setOtpMessage] = React.useState("");
  const [otpError, setOtpError] = React.useState("");

  React.useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadOrder = React.useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!id) return;

      try {
        if (mode === "initial") setLoading(true);
        if (mode === "refresh") setRefreshing(true);

        setError("");

        const res = await fetch(`${DELIVERY_ENDPOINTS.orders}/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          setError((json as any)?.message || "Order not found");
          setOrder(null);
          return;
        }

        const nextOrder = ((json as any)?.data || null) as DeliveryOrder | null;
        setOrder(nextOrder);

        setDeliveryStatus(
          (safeStr(nextOrder?.deliveryAssignment?.status) ||
            "Assigned") as DeliveryStatus
        );
        setDeliveryNote(safeStr(nextOrder?.deliveryAssignment?.note));
      } catch {
        setError("Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  React.useEffect(() => {
    loadOrder("initial");
  }, [loadOrder]);

  const saveChanges = async () => {
    const orderId = pickId(order);
    if (!orderId) return;

    const currentStatus = safeStr(order?.deliveryAssignment?.status) || "Assigned";
    const originalDeliveryNote = safeStr(order?.deliveryAssignment?.note).trim();

    const hasStatusChanges =
      deliveryStatus !== currentStatus ||
      deliveryNote.trim() !== originalDeliveryNote;

    if (!hasStatusChanges) {
      setToast({
        type: "info",
        message: "No delivery status changes to save.",
      });
      return;
    }

    try {
      setSaving(true);
      setToast(null);

      const res = await fetch(`${DELIVERY_ENDPOINTS.orders}/${orderId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: deliveryStatus,
          note: deliveryNote.trim(),
        }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setToast({
          type: "error",
          message: (json as any)?.message || "Failed to update delivery status",
        });
        return;
      }

      const updatedOrder = ((json as any)?.data || order) as DeliveryOrder;

      setOrder(updatedOrder);
      setDeliveryStatus(
        (safeStr(updatedOrder?.deliveryAssignment?.status) ||
          deliveryStatus) as DeliveryStatus
      );
      setDeliveryNote(safeStr(updatedOrder?.deliveryAssignment?.note));
      setOtpMessage("");
      setOtpError("");

      setToast({
        type: "success",
        message: "Delivery status updated successfully.",
      });

      router.refresh();
    } catch {
      setToast({
        type: "error",
        message: "Failed to update delivery status.",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendOtp = async () => {
    const orderId = pickId(order);
    if (!orderId) return;

    try {
      setOtpSending(true);
      setOtpError("");
      setOtpMessage("");
      setToast(null);

      const res = await fetch(
        `${DELIVERY_ENDPOINTS.orders}/${orderId}/send-otp`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: otpChannel }),
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        const message = (json as any)?.message || "Failed to send OTP";
        setOtpError(message);
        setToast({ type: "error", message });
        return;
      }

      const data = (json as any)?.data || {};
      let message = `OTP sent via ${otpChannel} to ${
        safeStr(data.sentTo) || "customer"
      }.`;

      if (otpChannel === "phone" && safeStr(data.devOtpPreview)) {
        message += ` Demo OTP: ${safeStr(data.devOtpPreview)}`;
      }

      setOtpMessage(message);
      setOtpInput("");
      setToast({ type: "success", message });

      await loadOrder("refresh");
    } catch {
      const message = "Failed to send OTP.";
      setOtpError(message);
      setToast({ type: "error", message });
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    const orderId = pickId(order);
    if (!orderId) return;

    const cleanOtp = otpInput.trim();

    if (!/^\d{4}$/.test(cleanOtp)) {
      const message = "Please enter a valid 4 digit OTP.";
      setOtpError(message);
      setToast({ type: "error", message });
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to verify OTP and mark this order as delivered?"
    );

    if (!confirmed) return;

    try {
      setOtpVerifying(true);
      setOtpError("");
      setOtpMessage("");
      setToast(null);

      const res = await fetch(
        `${DELIVERY_ENDPOINTS.orders}/${orderId}/verify-otp`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: cleanOtp }),
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        const message = (json as any)?.message || "Failed to verify OTP";
        setOtpError(message);
        setToast({ type: "error", message });
        return;
      }

      const updatedOrder = ((json as any)?.data || order) as DeliveryOrder;

      setOrder(updatedOrder);
      setDeliveryStatus(
        (safeStr(updatedOrder?.deliveryAssignment?.status) ||
          "Delivered") as DeliveryStatus
      );
      setDeliveryNote(safeStr(updatedOrder?.deliveryAssignment?.note));
      setOtpInput("");

      const message = "OTP verified successfully. Order marked as delivered.";
      setOtpMessage(message);
      setToast({ type: "success", message });

      router.refresh();
    } catch {
      const message = "Failed to verify OTP.";
      setOtpError(message);
      setToast({ type: "error", message });
    } finally {
      setOtpVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)]" />

        <div className="relative space-y-5">
          <SkeletonHero />

          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
            <div className="space-y-5">
              <SkeletonPanel rows={6} />
              <SkeletonPanel rows={5} />
            </div>

            <div className="space-y-5">
              <SkeletonPanel rows={4} />
              <SkeletonPanel rows={5} />
              <SkeletonPanel rows={4} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
        <div className="space-y-4">
          <div className={`${panelClass} p-8`}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#fca5a5]">
              Order Error
            </div>

            <div className="mt-2 text-[15px] text-white">
              {error || "Order not found"}
            </div>
          </div>

          <Link href="/delivery/orders" className={secondaryBtnClass}>
            Back
          </Link>
        </div>
      </div>
    );
  }

  const orderId = pickId(order);
  const placedOn = formatDateLong(order.createdAt);
  const assignedAt = formatDateLong(order?.deliveryAssignment?.assignedAt);

  const currentStatus = safeStr(order?.deliveryAssignment?.status) || "Assigned";
  const allowedStatuses = getAllowedTransitions(currentStatus);

  const originalDeliveryNote = safeStr(order?.deliveryAssignment?.note).trim();

  const hasStatusChanges =
    deliveryStatus !== currentStatus ||
    deliveryNote.trim() !== originalDeliveryNote;

  const timeline: TimelineStep[] = [
    { label: "Order Placed", date: placedOn, status: "done" },
    {
      label: "Assigned",
      date: assignedAt,
      status:
        currentStatus === "Assigned"
          ? "current"
          : assignedAt !== "-"
          ? "done"
          : "upcoming",
    },
    {
      label: "Picked Up",
      date: safeStr(order?.deliveryAssignment?.pickedUpAt)
        ? formatDateLong(order?.deliveryAssignment?.pickedUpAt)
        : "—",
      status:
        currentStatus === "Picked Up"
          ? "current"
          : [
              "Out for Delivery",
              "Delivered",
              "Failed Delivery",
              "Returned",
            ].includes(currentStatus)
          ? "done"
          : "upcoming",
    },
    {
      label: "Out for Delivery",
      date: safeStr(order?.deliveryAssignment?.outForDeliveryAt)
        ? formatDateLong(order?.deliveryAssignment?.outForDeliveryAt)
        : "—",
      status:
        currentStatus === "Out for Delivery"
          ? "current"
          : ["Delivered", "Failed Delivery", "Returned"].includes(currentStatus)
          ? "done"
          : "upcoming",
    },
    {
      label: "Delivered",
      date: safeStr(order?.deliveryAssignment?.deliveredAt)
        ? formatDateLong(order?.deliveryAssignment?.deliveredAt)
        : "—",
      status: currentStatus === "Delivered" ? "current" : "upcoming",
    },
  ];

  const addr = order.address || null;
  const addrTitle = addr?.label ? safeStr(addr.label) : "Shipping Address";
  const addrName =
    safeStr(addr?.fullName) || safeStr(order?.customer?.name) || "-";
  const addrPhone =
    safeStr(addr?.phone) || safeStr(order?.customer?.phone) || "-";
  const addrStreet = safeStr(addr?.street);
  const addrArea =
    safeStr(addr?.addressLine) ||
    safeStr(addr?.area) ||
    safeStr(addr?.district);
  const addrCity =
    safeStr(addr?.cityOrMunicipality) ||
    safeStr(addr?.city) ||
    safeStr(addr?.provinceId);

  const items = Array.isArray(order.items) ? order.items : [];

  const subtotalPaisa = items.reduce((sum: number, it: any) => {
    const qty = Number(it?.qty || 0);
    const pricePaisa = Number(it?.pricePaisa || 0);
    return sum + qty * pricePaisa;
  }, 0);

  const shippingPaisa = Number(order?.shippingPaisa || 0);
  const discountPaisa = Number(order?.discountPaisa || 0);
  const totalPaisa = Number(order?.totalPaisa || 0);

  const customerPhoneLink =
    addrPhone && addrPhone !== "-" ? `tel:${addrPhone}` : "";
  const mapsLink = hasLatLng(addr) ? getGoogleMapsUrl(addr) : "";

  const isFinalState =
    currentStatus === "Delivered" || currentStatus === "Returned";

  const canSendOtp = currentStatus === "Out for Delivery";
  const otpVerified = Boolean(order?.deliveryAssignment?.isOtpVerified);
  const otpExpiresAt = safeStr(order?.deliveryAssignment?.otpExpiresAt);
  const otpSentTo = safeStr(order?.deliveryAssignment?.otpSentTo);
  const otpChannelUsed = safeStr(order?.deliveryAssignment?.otpChannel);

  return (
    <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)]" />

      <ToastView toast={toast} />

      <div className="relative space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${panelClass} relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_34%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6 lg:p-7`}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#8b5cf6]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="break-words text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                Delivery <span className="mx-2 text-[#7f879f]">/</span> Orders{" "}
                <span className="mx-2 text-[#7f879f]">/</span>{" "}
                {order.orderCode || orderId}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="break-words text-[28px] font-semibold tracking-[-0.045em] text-white sm:text-[38px]">
                  {order.orderCode || orderId}
                </h1>

                <StatusPill>{currentStatus}</StatusPill>
              </div>

              <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                Placed on {placedOn}
                {order?.paymentMethod ? (
                  <>
                    <span className="mx-2 text-[#7f879f]">•</span>
                    <span>{safeStr(order.paymentMethod)}</span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadOrder("refresh")}
                disabled={refreshing}
                className={primaryBtnClass}
              >
                {refreshing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
                    Refreshing
                  </>
                ) : (
                  "Refresh"
                )}
              </button>

              {customerPhoneLink ? (
                <a href={customerPhoneLink} className={secondaryBtnClass}>
                  Call Customer
                </a>
              ) : null}

              {mapsLink ? (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={secondaryBtnClass}
                >
                  Open Map
                </a>
              ) : null}

              <Link href="/delivery/orders" className={secondaryBtnClass}>
                Back
              </Link>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              index={0}
              label="Customer"
              value={order.customer?.name || addrName || "-"}
              hint={order.customer?.email || "No email"}
            />

            <SummaryCard
              index={1}
              label="Items"
              value={String(items.length)}
              hint="Products in this order"
            />

            <SummaryCard
              index={2}
              label="Total"
              value={formatNPR(totalPaisa)}
              hint="Order collection amount"
            />

            <SummaryCard
              index={3}
              label="Assigned Date"
              value={assignedAt}
              hint={formatDateTime(order?.deliveryAssignment?.assignedAt)}
            />
          </div>
        </motion.section>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
          <div className="space-y-5">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className={`${panelClass} overflow-hidden`}
            >
              <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Products
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Ordered Items
                </h2>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Product, quantity, color, size, and pricing
                </p>
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[980px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Product</th>
                      <th className="px-5 py-4 font-medium">Size</th>
                      <th className="px-5 py-4 font-medium">Color</th>
                      <th className="px-5 py-4 text-center font-medium">
                        Qty
                      </th>
                      <th className="px-5 py-4 text-right font-medium">
                        Price
                      </th>
                      <th className="px-5 py-4 text-right font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.length ? (
                      items.map((it: any, i: number) => {
                        const colorValue = safeStr(it?.color);
                        const colorLabel = safeStr(it?.colorLabel);
                        const colorClass = getColorDotClass(
                          colorValue || colorLabel
                        );
                        const qty = Number(it?.qty || 0);
                        const pricePaisa = Number(it?.pricePaisa || 0);
                        const lineTotalPaisa = qty * pricePaisa;

                        return (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: i * 0.035,
                              duration: 0.3,
                              ease: "easeOut",
                            }}
                            className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                          >
                            <td className="px-5 py-4">
                              <div className="font-semibold text-white">
                                {it?.name || "-"}
                              </div>

                              {it?.productId ? (
                                <div className="mt-1 break-all text-xs text-[#7f879f]">
                                  Product ID: {it.productId}
                                </div>
                              ) : null}
                            </td>

                            <td className="px-5 py-4 text-[#d1d5db]">
                              {safeStr(it?.size) || "-"}
                            </td>

                            <td className="px-5 py-4">
                              {colorValue || colorLabel ? (
                                <div className="flex items-center gap-2 text-[#d1d5db]">
                                  <span
                                    className={`h-4 w-4 rounded-full border border-white/20 ${colorClass}`}
                                    aria-hidden="true"
                                  />
                                  <span>{colorLabel || colorValue}</span>
                                </div>
                              ) : (
                                <span className="text-[#d1d5db]">-</span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-center text-[#d1d5db]">
                              {qty || "-"}
                            </td>

                            <td className="px-5 py-4 text-right text-[#d1d5db]">
                              {formatNPR(pricePaisa)}
                            </td>

                            <td className="px-5 py-4 text-right font-semibold text-[#d6c7ff]">
                              {formatNPR(lineTotalPaisa)}
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-8 text-center text-[#a7aec4]"
                        >
                          No items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 lg:hidden">
                {items.length ? (
                  items.map((it: any, i: number) => {
                    const colorValue = safeStr(it?.color);
                    const colorLabel = safeStr(it?.colorLabel);
                    const colorClass = getColorDotClass(
                      colorValue || colorLabel
                    );
                    const qty = Number(it?.qty || 0);
                    const pricePaisa = Number(it?.pricePaisa || 0);
                    const lineTotalPaisa = qty * pricePaisa;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.035,
                          duration: 0.35,
                          ease: "easeOut",
                        }}
                        className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4"
                      >
                        <div className="font-semibold text-white">
                          {it?.name || "-"}
                        </div>

                        {it?.productId ? (
                          <div className="mt-1 break-all text-xs text-[#7f879f]">
                            Product ID: {it.productId}
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-3">
                          <MobileInfo
                            label="Size"
                            value={safeStr(it?.size) || "-"}
                          />

                          <MobileInfo
                            label="Color"
                            value={
                              colorValue || colorLabel ? (
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className={`h-4 w-4 rounded-full border border-white/20 ${colorClass}`}
                                    aria-hidden="true"
                                  />
                                  {colorLabel || colorValue}
                                </span>
                              ) : (
                                "-"
                              )
                            }
                          />

                          <MobileInfo label="Qty" value={qty || "-"} />

                          <MobileInfo
                            label="Price"
                            value={formatNPR(pricePaisa)}
                          />

                          <MobileInfo
                            label="Line Total"
                            value={formatNPR(lineTotalPaisa)}
                          />
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-8 text-center text-[13px] text-[#a7aec4]">
                    No items found.
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className={`${panelClass} p-5 sm:p-6`}
            >
              <div className="mb-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Progress
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Delivery Timeline
                </h2>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Current delivery progress of this order
                </p>
              </div>

              <div className="space-y-5">
                {timeline.map((t, index) => (
                  <motion.div
                    key={t.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.045,
                      duration: 0.32,
                      ease: "easeOut",
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <Dot status={t.status} />

                      {index !== timeline.length - 1 ? (
                        <div className="mt-2 h-10 w-px bg-[#26293a]" />
                      ) : null}
                    </div>

                    <div className="pt-1">
                      <div className="text-sm font-semibold text-white">
                        {t.label}
                      </div>

                      <div className="mt-1 text-xs text-[#a7aec4]">
                        {t.date}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>

          <div className="space-y-5">
            <SidePanel>
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-white/10 bg-white/[0.05] text-base font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.12)]">
                  {getInitials(order.customer?.name || addrName)}
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    Customer
                  </div>

                  <h2 className="mt-1 text-[20px] font-semibold text-white">
                    Customer Details
                  </h2>

                  <div className="mt-3 text-sm font-medium text-white">
                    {order.customer?.name || addrName || "-"}
                  </div>

                  <div className="mt-1 break-all text-sm text-[#a7aec4]">
                    {order.customer?.email || "-"}
                  </div>

                  {addrPhone ? (
                    <div className="mt-1 text-sm text-[#a7aec4]">
                      {addrPhone}
                    </div>
                  ) : null}
                </div>
              </div>
            </SidePanel>

            <SidePanel>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Address
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  {addrTitle}
                </h2>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Delivery information attached to this order
                </p>
              </div>

              {!addr ? (
                <div className="mt-5 rounded-[16px] border border-white/10 bg-white/[0.03] p-5 text-sm text-[#a7aec4]">
                  No shipping address found.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-base font-semibold text-white">
                      {addrName || "-"}
                    </div>

                    {addrPhone ? (
                      <div className="mt-1 text-sm text-[#a7aec4]">
                        {addrPhone}
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      <LineItem label="Street" value={addrStreet || "-"} />
                      <LineItem label="Area" value={addrArea || "-"} />
                      <LineItem label="City" value={addrCity || "-"} />
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                      Map Location
                    </div>

                    <div
                      className={`mt-2 break-words text-sm ${
                        hasLatLng(addr) ? "text-white" : "text-[#7f879f]"
                      }`}
                    >
                      {hasLatLng(addr)
                        ? `${Number(addr.lat).toFixed(6)}, ${Number(
                            addr.lng
                          ).toFixed(6)}`
                        : "No map location saved in this order"}
                    </div>

                    {hasLatLng(addr) ? (
                      <div className="mt-4">
                        <a
                          href={getGoogleMapsUrl(addr)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={secondaryBtnClass}
                        >
                          View on Google Maps
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </SidePanel>

            <SidePanel>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Payment
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Payment & Totals
                </h2>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Payment information and order amount breakdown
                </p>
              </div>

              <div className="mt-5 space-y-3 rounded-[16px] border border-white/10 bg-white/[0.03] p-5">
                <LineItem
                  label="Payment Method"
                  value={safeStr(order?.paymentMethod) || "-"}
                />

                <LineItem
                  label="Payment Reference"
                  value={safeStr(order?.paymentRef) || "-"}
                />

                <LineItem label="Subtotal" value={formatNPR(subtotalPaisa)} />

                <LineItem label="Shipping" value={formatNPR(shippingPaisa)} />

                <LineItem
                  label="Discount"
                  value={`- ${formatNPR(discountPaisa)}`}
                  valueClassName="text-emerald-300"
                />

                <div className="border-t border-[#26293a] pt-3">
                  <LineItem
                    label="Total"
                    value={formatNPR(totalPaisa)}
                    valueClassName="text-base font-bold text-[#d6c7ff]"
                  />
                </div>
              </div>
            </SidePanel>

            <SidePanel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    Status
                  </div>

                  <h2 className="mt-1 text-[20px] font-semibold text-white">
                    Update Delivery Status
                  </h2>

                  <p className="mt-1 text-[13px] text-[#a7aec4]">
                    Update your current delivery progress
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                    isFinalState
                      ? "border-white/10 bg-white/[0.03] text-[#a7aec4]"
                      : "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {isFinalState ? "Final State" : "Editable"}
                </span>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label
                    htmlFor="delivery-status"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Delivery Status
                  </label>

                  <select
                    id="delivery-status"
                    value={deliveryStatus}
                    onChange={(e) =>
                      setDeliveryStatus(e.target.value as DeliveryStatus)
                    }
                    disabled={isFinalState}
                    className={inputClass}
                  >
                    {allowedStatuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                        className="bg-[#0d0f17]"
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="delivery-note"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Delivery Note
                  </label>

                  <textarea
                    id="delivery-note"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    rows={4}
                    placeholder="Add delivery update note"
                    disabled={isFinalState}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-[#26293a] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Link href="/delivery/orders" className={secondaryBtnClass}>
                    Back
                  </Link>

                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={saving || isFinalState || !hasStatusChanges}
                    className={primaryBtnClass}
                  >
                    {saving ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
                        Saving
                      </>
                    ) : (
                      "Save Status"
                    )}
                  </button>
                </div>
              </div>
            </SidePanel>

            <SidePanel>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Verification
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Delivery OTP Verification
                </h2>

                <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">
                  When order is Out for Delivery, send OTP to customer by phone
                  or email and verify before completing delivery.
                </p>
              </div>

              {!canSendOtp && !otpVerified ? (
                <div className="mt-5 rounded-[16px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[13px] leading-6 text-amber-200">
                  OTP can be sent only when the order status is{" "}
                  <span className="font-semibold">Out for Delivery</span>.
                </div>
              ) : null}

              {otpVerified ? (
                <div className="mt-5 rounded-[16px] border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-[13px] leading-6 text-emerald-300">
                  OTP already verified for this order.
                </div>
              ) : null}

              <div className="mt-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="otp-channel"
                      className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                    >
                      OTP Channel
                    </label>

                    <select
                      id="otp-channel"
                      value={otpChannel}
                      onChange={(e) =>
                        setOtpChannel(e.target.value as DeliveryOtpChannel)
                      }
                      disabled={!canSendOtp || otpSending || isFinalState}
                      className={inputClass}
                    >
                      <option value="phone" className="bg-[#0d0f17]">
                        Phone
                      </option>

                      <option value="email" className="bg-[#0d0f17]">
                        Email
                      </option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={!canSendOtp || otpSending || isFinalState}
                      className="inline-flex w-full items-center justify-center rounded-full border border-amber-400/20 bg-amber-500/15 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-amber-300 transition hover:-translate-y-0.5 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {otpSending ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" />
                          Sending OTP
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="grid gap-3 text-sm">
                    <LineItem
                      label="OTP Verified"
                      value={otpVerified ? "Yes" : "No"}
                      valueClassName={
                        otpVerified ? "text-emerald-300" : "text-white"
                      }
                    />

                    <LineItem
                      label="Last Channel"
                      value={otpChannelUsed || "-"}
                    />

                    <LineItem label="Sent To" value={otpSentTo || "-"} />

                    <LineItem
                      label="Expires At"
                      value={otpExpiresAt ? formatDateTime(otpExpiresAt) : "-"}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="otp-input"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Enter Customer OTP
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="otp-input"
                      value={otpInput}
                      onChange={(e) => {
                        const onlyDigits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                        setOtpInput(onlyDigits);
                      }}
                      placeholder="Enter 4 digit OTP"
                      inputMode="numeric"
                      maxLength={4}
                      disabled={isFinalState || otpVerifying}
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={
                        isFinalState ||
                        otpVerifying ||
                        !/^\d{4}$/.test(otpInput.trim())
                      }
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {otpVerifying ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Verifying
                        </>
                      ) : (
                        "Verify & Deliver"
                      )}
                    </button>
                  </div>
                </div>

                {otpMessage ? (
                  <div className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">
                    {otpMessage}
                  </div>
                ) : null}

                {otpError ? (
                  <div className="rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {otpError}
                  </div>
                ) : null}
              </div>
            </SidePanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToastView({ toast }: { toast: Toast | null }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          className={[
            "fixed right-4 top-4 z-50 max-w-[380px] rounded-[18px] border px-4 py-3 text-sm font-semibold shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl",
            toast.type === "success"
              ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-100"
              : toast.type === "info"
              ? "border-blue-400/25 bg-blue-500/15 text-blue-100"
              : "border-red-400/25 bg-red-500/15 text-red-100",
          ].join(" ")}
        >
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SidePanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`${panelClass} p-5 sm:p-6`}
    >
      {children}
    </motion.section>
  );
}

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-[#0d0f17]/70 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f879f]">
        {label}
      </div>

      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className={`${panelClass} p-5 sm:p-6 lg:p-7`}>
      <div className="h-3 w-56 animate-pulse rounded bg-white/5" />
      <div className="mt-4 h-10 w-72 animate-pulse rounded bg-white/5" />
      <div className="mt-4 h-4 w-full max-w-[680px] animate-pulse rounded bg-white/5" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${softPanelClass} p-5`}>
            <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-7 w-32 animate-pulse rounded bg-white/5" />
            <div className="mt-3 h-3 w-24 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div className={`${panelClass} p-5 sm:p-6`}>
      <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
      <div className="mt-4 h-6 w-52 animate-pulse rounded bg-white/5" />

      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-[16px] bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}