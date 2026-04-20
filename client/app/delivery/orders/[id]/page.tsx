"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getDeliveryStatusTone(String(children));
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
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
        className={`${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`}
      >
        ✓
      </div>
    );
  }

  if (status === "current") {
    return (
      <div className={`${base} border-[#2563eb]/40 bg-[#2563eb]/10 text-[#93c5fd]`}>
        •
      </div>
    );
  }

  return (
    <div className={`${base} border-[#111827] bg-[#020617] text-[#6b7280]`}>
      •
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-[14px] border border-[#111827] bg-[#020617] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
        {label}
      </div>
      <div className="mt-2 break-words text-lg font-bold text-white">{value}</div>
      {hint ? <div className="mt-1 text-sm text-[#9ca3af]">{hint}</div> : null}
    </div>
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
      <span className="text-sm text-[#9ca3af]">{label}</span>
      <span className={`break-words text-right text-sm ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

function getAllowedTransitions(currentStatus: string): DeliveryStatus[] {
  const s = safeStr(currentStatus).toLowerCase();

  if (!s || s === "assigned") {
    return ["Assigned", "Picked Up", "Out for Delivery", "Failed Delivery", "Returned"];
  }

  if (s === "picked up") {
    return ["Picked Up", "Out for Delivery", "Failed Delivery", "Returned"];
  }

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

  return ["Assigned", "Picked Up", "Out for Delivery", "Failed Delivery", "Returned"];
}

export default function DeliveryOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [otpSending, setOtpSending] = React.useState(false);
  const [otpVerifying, setOtpVerifying] = React.useState(false);
  const [order, setOrder] = React.useState<DeliveryOrder | null>(null);
  const [error, setError] = React.useState("");

  const [deliveryStatus, setDeliveryStatus] =
    React.useState<DeliveryStatus>("Assigned");
  const [deliveryNote, setDeliveryNote] = React.useState("");

  const [otpChannel, setOtpChannel] = React.useState<DeliveryOtpChannel>("phone");
  const [otpInput, setOtpInput] = React.useState("");
  const [otpMessage, setOtpMessage] = React.useState("");
  const [otpError, setOtpError] = React.useState("");

  const loadOrder = React.useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
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
        (safeStr(nextOrder?.deliveryAssignment?.status) || "Assigned") as DeliveryStatus
      );
      setDeliveryNote(safeStr(nextOrder?.deliveryAssignment?.note));
    } catch {
      setError("Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const saveChanges = async () => {
    const orderId = pickId(order);
    if (!orderId) return;

    try {
      setSaving(true);

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
        alert((json as any)?.message || "Failed to update delivery status");
        return;
      }

      const updatedOrder = ((json as any)?.data || order) as DeliveryOrder;
      setOrder(updatedOrder);
      setDeliveryStatus(
        (safeStr(updatedOrder?.deliveryAssignment?.status) || deliveryStatus) as DeliveryStatus
      );
      setDeliveryNote(safeStr(updatedOrder?.deliveryAssignment?.note));
      setOtpMessage("");
      setOtpError("");
      alert("Delivery status updated successfully");
      router.refresh();
    } catch {
      alert("Failed to update delivery status");
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

      const res = await fetch(`${DELIVERY_ENDPOINTS.orders}/${orderId}/send-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: otpChannel }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setOtpError((json as any)?.message || "Failed to send OTP");
        return;
      }

      const data = (json as any)?.data || {};
      let message = `OTP sent via ${otpChannel} to ${safeStr(data.sentTo) || "customer"}.`;

      if (otpChannel === "phone" && safeStr(data.devOtpPreview)) {
        message += ` Demo OTP: ${safeStr(data.devOtpPreview)}`;
      }

      setOtpMessage(message);
      setOtpInput("");
      await loadOrder();
    } catch {
      setOtpError("Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    const orderId = pickId(order);
    if (!orderId) return;

    try {
      setOtpVerifying(true);
      setOtpError("");
      setOtpMessage("");

      const res = await fetch(`${DELIVERY_ENDPOINTS.orders}/${orderId}/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpInput.trim() }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setOtpError((json as any)?.message || "Failed to verify OTP");
        return;
      }

      const updatedOrder = ((json as any)?.data || order) as DeliveryOrder;
      setOrder(updatedOrder);
      setDeliveryStatus(
        (safeStr(updatedOrder?.deliveryAssignment?.status) || "Delivered") as DeliveryStatus
      );
      setDeliveryNote(safeStr(updatedOrder?.deliveryAssignment?.note));
      setOtpInput("");
      setOtpMessage("OTP verified successfully. Order marked as delivered.");
      router.refresh();
    } catch {
      setOtpError("Failed to verify OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[14px] border border-[#111827] bg-[#020617] p-8 text-[#9ca3af]">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="rounded-[14px] border border-[#111827] bg-[#020617] p-8 text-[#9ca3af]">
          {error || "Order not found"}
        </div>
        <Link
          href="/delivery/orders"
          className="inline-flex rounded-lg border border-[#111827] bg-[#020617] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b1220]"
        >
          Back
        </Link>
      </div>
    );
  }

  const orderId = pickId(order);
  const placedOn = formatDateLong(order.createdAt);
  const assignedAt = formatDateLong(order?.deliveryAssignment?.assignedAt);

  const currentStatus = safeStr(order?.deliveryAssignment?.status) || "Assigned";
  const allowedStatuses = getAllowedTransitions(currentStatus);

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
          : ["Out for Delivery", "Delivered", "Failed Delivery", "Returned"].includes(
              currentStatus
            )
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
  const addrName = safeStr(addr?.fullName) || safeStr(order?.customer?.name) || "-";
  const addrPhone = safeStr(addr?.phone) || safeStr(order?.customer?.phone) || "-";
  const addrStreet = safeStr(addr?.street);
  const addrArea =
    safeStr(addr?.addressLine) || safeStr(addr?.area) || safeStr(addr?.district);
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

  const customerPhoneLink = addrPhone && addrPhone !== "-" ? `tel:${addrPhone}` : "";
  const mapsLink = hasLatLng(addr) ? getGoogleMapsUrl(addr) : "";

  const isFinalState =
    currentStatus === "Delivered" || currentStatus === "Returned";

  const canSendOtp = currentStatus === "Out for Delivery" && !isFinalState;
  const otpVerified = Boolean(order?.deliveryAssignment?.isOtpVerified);
  const otpExpiresAt = safeStr(order?.deliveryAssignment?.otpExpiresAt);
  const otpSentTo = safeStr(order?.deliveryAssignment?.otpSentTo);
  const otpChannelUsed = safeStr(order?.deliveryAssignment?.otpChannel);

  return (
    <div className="space-y-6">
      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="break-words text-[12px] text-[#9ca3af]">
              Delivery <span className="mx-2">/</span> Orders{" "}
              <span className="mx-2">/</span> {order.orderCode || orderId}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words text-[22px] font-semibold text-white md:text-[28px]">
                {order.orderCode || orderId}
              </h1>
              <StatusPill>{currentStatus}</StatusPill>
            </div>

            <p className="text-[13px] text-[#9ca3af]">
              Placed on {placedOn}
              {order?.paymentMethod ? (
                <>
                  <span className="mx-2">•</span>
                  <span>{safeStr(order.paymentMethod)}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {customerPhoneLink ? (
              <a
                href={customerPhoneLink}
                className="inline-flex rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/15"
              >
                Call Customer
              </a>
            ) : null}

            {mapsLink ? (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/15"
              >
                Open Map
              </a>
            ) : null}

            <Link
              href="/delivery/orders"
              className="inline-flex rounded-lg border border-[#111827] bg-[#020617] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b1220]"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Customer"
            value={order.customer?.name || addrName || "-"}
            hint={order.customer?.email || "No email"}
          />
          <SummaryCard
            label="Items"
            value={String(items.length)}
            hint="Products in this order"
          />
          <SummaryCard
            label="Total"
            value={formatNPR(totalPaisa)}
            hint="Order collection amount"
          />
          <SummaryCard
            label="Assigned Date"
            value={assignedAt}
            hint={formatDateTime(order?.deliveryAssignment?.assignedAt)}
          />
        </div>
      </section>

      <div className="grid gap-[18px] 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
        <div className="space-y-6">
          <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
            <div className="mb-2">
              <h2 className="text-[16px] font-medium text-white">
                Ordered Items
              </h2>
              <p className="mt-1 text-[12px] text-[#9ca3af]">
                Product, quantity, color, size, and pricing
              </p>
            </div>

            <div className="mt-[10px] overflow-x-auto">
              <table className="w-full min-w-[980px] text-[13px]">
                <thead>
                  <tr className="border-b border-[#111827] text-left text-[12px] text-[#9ca3af]">
                    <th className="px-[12px] py-[10px]">Product</th>
                    <th className="px-[12px] py-[10px]">Size</th>
                    <th className="px-[12px] py-[10px]">Color</th>
                    <th className="px-[12px] py-[10px] text-center">Qty</th>
                    <th className="px-[12px] py-[10px] text-right">Price</th>
                    <th className="px-[12px] py-[10px] text-right">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length ? (
                    items.map((it: any, i: number) => {
                      const colorValue = safeStr(it?.color);
                      const colorLabel = safeStr(it?.colorLabel);
                      const qty = Number(it?.qty || 0);
                      const pricePaisa = Number(it?.pricePaisa || 0);
                      const lineTotalPaisa = qty * pricePaisa;

                      return (
                        <tr key={i} className="border-t border-[#111827]">
                          <td className="px-[12px] py-[12px]">
                            <div className="font-medium text-white">
                              {it?.name || "-"}
                            </div>
                            {it?.productId ? (
                              <div className="mt-1 break-all text-xs text-[#6b7280]">
                                Product ID: {it.productId}
                              </div>
                            ) : null}
                          </td>

                          <td className="px-[12px] py-[12px] text-[#d1d5db]">
                            {safeStr(it?.size) || "-"}
                          </td>

                          <td className="px-[12px] py-[12px]">
                            {colorValue || colorLabel ? (
                              <div className="flex items-center gap-2 text-[#d1d5db]">
                                <span
                                  className="h-4 w-4 rounded-full border border-[#374151]"
                                  style={{
                                    backgroundColor: colorValue || "#16191f",
                                  }}
                                />
                                <span>{colorLabel || colorValue}</span>
                              </div>
                            ) : (
                              <span className="text-[#d1d5db]">-</span>
                            )}
                          </td>

                          <td className="px-[12px] py-[12px] text-center text-[#d1d5db]">
                            {qty || "-"}
                          </td>

                          <td className="px-[12px] py-[12px] text-right text-[#d1d5db]">
                            {formatNPR(pricePaisa)}
                          </td>

                          <td className="px-[12px] py-[12px] text-right font-medium text-white">
                            {formatNPR(lineTotalPaisa)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-[12px] py-[18px] text-[#9ca3af]">
                        No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
            <h2 className="text-[16px] font-medium text-white">
              Delivery Timeline
            </h2>
            <p className="mt-1 text-[12px] text-[#9ca3af]">
              Current delivery progress of this order
            </p>

            <div className="mt-6 space-y-5">
              {timeline.map((t, index) => (
                <div key={t.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Dot status={t.status} />
                    {index !== timeline.length - 1 ? (
                      <div className="mt-2 h-10 w-px bg-[#111827]" />
                    ) : null}
                  </div>

                  <div className="pt-1">
                    <div className="text-sm font-medium text-white">{t.label}</div>
                    <div className="mt-1 text-xs text-[#9ca3af]">{t.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] border border-[#111827] bg-[#0b1220] text-base font-bold text-white">
                {getInitials(order.customer?.name || addrName)}
              </div>

              <div className="min-w-0">
                <h2 className="text-[16px] font-medium text-white">
                  Customer Details
                </h2>
                <div className="mt-2 text-sm text-white">
                  {order.customer?.name || addrName || "-"}
                </div>
                <div className="mt-1 break-all text-sm text-[#9ca3af]">
                  {order.customer?.email || "-"}
                </div>
                {addrPhone ? (
                  <div className="mt-1 text-sm text-[#9ca3af]">{addrPhone}</div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
            <div>
              <h2 className="text-[16px] font-medium text-white">{addrTitle}</h2>
              <p className="mt-1 text-[12px] text-[#9ca3af]">
                Delivery information attached to this order
              </p>
            </div>

            {!addr ? (
              <div className="mt-5 rounded-[14px] border border-[#111827] bg-[#0b1220] p-5 text-sm text-[#9ca3af]">
                No shipping address found.
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-5">
                  <div className="text-base font-medium text-white">
                    {addrName || "-"}
                  </div>

                  {addrPhone ? (
                    <div className="mt-1 text-sm text-[#9ca3af]">{addrPhone}</div>
                  ) : null}

                  <div className="mt-4 space-y-2">
                    <LineItem label="Street" value={addrStreet || "-"} />
                    <LineItem label="Area" value={addrArea || "-"} />
                    <LineItem label="City" value={addrCity || "-"} />
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                    Map Location
                  </div>

                  <div
                    className={`mt-2 break-words text-sm ${
                      hasLatLng(addr) ? "text-white" : "text-[#6b7280]"
                    }`}
                  >
                    {hasLatLng(addr)
                      ? `${Number(addr.lat).toFixed(6)}, ${Number(addr.lng).toFixed(6)}`
                      : "No map location saved in this order"}
                  </div>

                  {hasLatLng(addr) ? (
                    <div className="mt-4">
                      <a
                        href={getGoogleMapsUrl(addr)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-200 hover:bg-blue-500/15"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
            <h2 className="text-[16px] font-medium text-white">
              Payment & Totals
            </h2>
            <p className="mt-1 text-[12px] text-[#9ca3af]">
              Payment information and order amount breakdown
            </p>

            <div className="mt-5 space-y-3 rounded-[14px] border border-[#111827] bg-[#0b1220] p-5">
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
              <div className="border-t border-[#111827] pt-3">
                <LineItem
                  label="Total"
                  value={formatNPR(totalPaisa)}
                  valueClassName="text-base font-bold text-white"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[16px] font-medium text-white">
                  Update Delivery Status
                </h2>
                <p className="mt-1 text-[12px] text-[#9ca3af]">
                  Update your current delivery progress
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                  isFinalState
                    ? "border-[#111827] bg-[#0b1220] text-[#9ca3af]"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {isFinalState ? "Final State" : "Editable"}
              </span>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="delivery-status"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]"
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
                  className="w-full rounded-[14px] border border-[#111827] bg-[#020617] px-4 py-3 text-sm text-white outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status} className="bg-[#020617]">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="delivery-note"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]"
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
                  className="w-full resize-none rounded-[14px] border border-[#111827] bg-[#020617] px-4 py-3 text-sm text-white placeholder:text-[#6b7280] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-[#111827] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/delivery/orders"
                  className="inline-flex justify-center rounded-lg border border-[#111827] bg-[#020617] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b1220]"
                >
                  Back
                </Link>

                <button
                  onClick={saveChanges}
                  disabled={saving || isFinalState}
                  className="rounded-lg bg-[#2563eb] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Status"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
            <div className="flex flex-col gap-2">
              <h2 className="text-[16px] font-medium text-white">
                Delivery OTP Verification
              </h2>
              <p className="text-[12px] text-[#9ca3af]">
                When order is Out for Delivery, send OTP to customer by phone or email and verify before completing delivery.
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="otp-channel"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]"
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
                    className="w-full rounded-[14px] border border-[#111827] bg-[#020617] px-4 py-3 text-sm text-white outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="phone" className="bg-[#020617]">
                      Phone
                    </option>
                    <option value="email" className="bg-[#020617]">
                      Email
                    </option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={sendOtp}
                    disabled={!canSendOtp || otpSending || isFinalState}
                    className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {otpSending ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-4">
                <div className="grid gap-2 text-sm">
                  <LineItem label="OTP Verified" value={otpVerified ? "Yes" : "No"} />
                  <LineItem label="Last Channel" value={otpChannelUsed || "-"} />
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
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]"
                >
                  Enter Customer OTP
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="otp-input"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 4 digit OTP"
                    disabled={isFinalState || otpVerifying}
                    className="w-full rounded-[14px] border border-[#111827] bg-[#020617] px-4 py-3 text-sm text-white placeholder:text-[#6b7280] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    onClick={verifyOtp}
                    disabled={isFinalState || otpVerifying || !otpInput.trim()}
                    className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {otpVerifying ? "Verifying..." : "Verify & Deliver"}
                  </button>
                </div>
              </div>

              {otpMessage ? (
                <div className="rounded-[14px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {otpMessage}
                </div>
              ) : null}

              {otpError ? (
                <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {otpError}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}