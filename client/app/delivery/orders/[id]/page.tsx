"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  DELIVERY_ENDPOINTS,
  DeliveryOrder,
  DeliveryOtpChannel,
  formatDateLong,
  formatDateTime,
  getDeliveryBlockedReason,
  getGoogleMapsUrl,
  hasLatLng,
  isDeliveryBlockedByOrderStatus,
  normalizeOrderStatus,
  pickId,
  safeJson,
  safeStr,
} from "@/app/lib/delivery";

import DeliveryOrderHero from "./_components/DeliveryOrderHero";
import DeliveryOrderItems from "./_components/DeliveryOrderItems";
import DeliverySidePanels from "./_components/DeliverySidePanels";
import DeliverySkeleton from "./_components/DeliverySkeleton";
import DeliveryTaskTimeline from "./_components/DeliveryTaskTimeline";
import { ToastView } from "./_components/DeliveryOrderShared";
import {
  DeliveryTaskType,
  TaskStatus,
  Toast,
  buildTimeline,
  getAllowedTransitions,
  getDefaultTaskFromOrder,
  getTaskAssignment,
  normalizeTaskType,
  panelClass,
  secondaryBtnClass,
} from "./_components/deliveryOrderTypes";

export default function DeliveryOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id;
  const taskFromUrl = normalizeTaskType(searchParams.get("task"));

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [otpSending, setOtpSending] = React.useState(false);
  const [otpVerifying, setOtpVerifying] = React.useState(false);
  const [order, setOrder] = React.useState<DeliveryOrder | null>(null);
  const [taskType, setTaskType] =
    React.useState<DeliveryTaskType>(taskFromUrl);
  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState<Toast | null>(null);

  const [deliveryStatus, setDeliveryStatus] =
    React.useState<TaskStatus>("Assigned");
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

        const resolvedTask =
          taskFromUrl !== "NORMAL_DELIVERY"
            ? taskFromUrl
            : getDefaultTaskFromOrder(nextOrder);

        setTaskType(resolvedTask);

        const assignment = getTaskAssignment(nextOrder, resolvedTask);

        setDeliveryStatus(
          (safeStr(assignment?.status) || "Assigned") as TaskStatus
        );
        setDeliveryNote(safeStr(assignment?.note));
      } catch {
        setError("Failed to load order");
        setOrder(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, taskFromUrl]
  );

  React.useEffect(() => {
    loadOrder("initial");
  }, [loadOrder]);

  const saveChanges = async () => {
    const orderId = pickId(order);
    if (!orderId) return;

    const assignment = getTaskAssignment(order, taskType);

    if (taskType === "NORMAL_DELIVERY" && isDeliveryBlockedByOrderStatus(order)) {
      setToast({
        type: "error",
        message: getDeliveryBlockedReason(order),
      });
      return;
    }

    const currentStatus = safeStr(assignment?.status) || "Assigned";
    const originalDeliveryNote = safeStr(assignment?.note).trim();

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

      let endpoint = `${DELIVERY_ENDPOINTS.orders}/${orderId}/status`;
      let body: Record<string, any> = {
        status: deliveryStatus,
        note: deliveryNote.trim(),
      };

      if (taskType === "RETURN_PICKUP" || taskType === "EXCHANGE_PICKUP") {
        endpoint = DELIVERY_ENDPOINTS.pickupTaskStatus(orderId);
        body = {
          taskType,
          status: deliveryStatus,
          note: deliveryNote.trim(),
        };
      }

      if (taskType === "REPLACEMENT_DELIVERY") {
        endpoint = DELIVERY_ENDPOINTS.replacementTaskStatus(orderId);
        body = {
          status: deliveryStatus,
          note: deliveryNote.trim(),
        };
      }

      const res = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setToast({
          type: "error",
          message: (json as any)?.message || "Failed to update delivery status",
        });
        return;
      }

      const updatedOrder = ((json as any)?.data ||
        (json as any)?.order ||
        order) as DeliveryOrder;

      setOrder(updatedOrder);

      const updatedAssignment = getTaskAssignment(updatedOrder, taskType);

      setDeliveryStatus(
        (safeStr(updatedAssignment?.status) || deliveryStatus) as TaskStatus
      );
      setDeliveryNote(safeStr(updatedAssignment?.note));
      setOtpMessage("");
      setOtpError("");

      setToast({
        type: "success",
        message:
          taskType === "NORMAL_DELIVERY"
            ? "Delivery status updated successfully."
            : "Task status updated successfully.",
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

    if (taskType !== "NORMAL_DELIVERY") {
      const message = "OTP is only required for normal customer delivery.";
      setOtpError(message);
      setToast({ type: "info", message });
      return;
    }

    if (isDeliveryBlockedByOrderStatus(order)) {
      const message = getDeliveryBlockedReason(order);
      setOtpError(message);
      setToast({ type: "error", message });
      return;
    }

    try {
      setOtpSending(true);
      setOtpError("");
      setOtpMessage("");
      setToast(null);

      const res = await fetch(`${DELIVERY_ENDPOINTS.orders}/${orderId}/send-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: otpChannel }),
      });

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

    if (taskType !== "NORMAL_DELIVERY") {
      const message = "OTP verification is only for normal delivery.";
      setOtpError(message);
      setToast({ type: "info", message });
      return;
    }

    if (isDeliveryBlockedByOrderStatus(order)) {
      const message = getDeliveryBlockedReason(order);
      setOtpError(message);
      setToast({ type: "error", message });
      return;
    }

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
          "Delivered") as TaskStatus
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
    return <DeliverySkeleton />;
  }

  if (!order) {
    return (
      <div className="-m-6 min-h-screen overflow-x-hidden bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
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

  const assignment = getTaskAssignment(order, taskType);

  const orderId = pickId(order);
  const placedOn = formatDateLong(order.createdAt);
  const assignedAt = formatDateLong(assignment?.assignedAt);

  const currentStatus = safeStr(assignment?.status) || "Assigned";

  const orderLifecycleStatus = normalizeOrderStatus(order?.orderStatus);

  const blockedByOrderStatus =
    taskType === "NORMAL_DELIVERY" && isDeliveryBlockedByOrderStatus(order);

  const blockedReason = getDeliveryBlockedReason(order);

  const allowedStatuses = blockedByOrderStatus
    ? [currentStatus as TaskStatus]
    : getAllowedTransitions(currentStatus, taskType);

  const originalDeliveryNote = safeStr(assignment?.note).trim();

  const hasStatusChanges =
    deliveryStatus !== currentStatus ||
    deliveryNote.trim() !== originalDeliveryNote;

  const timeline = buildTimeline(
    taskType,
    currentStatus,
    assignment,
    placedOn,
    assignedAt
  );

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
    blockedByOrderStatus ||
    currentStatus === "Delivered" ||
    currentStatus === "Returned" ||
    currentStatus === "Returned to Store";

  const canSendOtp =
    taskType === "NORMAL_DELIVERY" &&
    !blockedByOrderStatus &&
    currentStatus === "Out for Delivery";

  const otpVerified = Boolean(order?.deliveryAssignment?.isOtpVerified);
  const otpExpiresAt = safeStr(order?.deliveryAssignment?.otpExpiresAt);
  const otpSentTo = safeStr(order?.deliveryAssignment?.otpSentTo);
  const otpChannelUsed = safeStr(order?.deliveryAssignment?.otpChannel);

  return (
    <div className="-m-6 min-h-screen overflow-x-hidden bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)]" />

      <ToastView toast={toast} />

      <div className="relative max-w-full space-y-6 overflow-x-hidden">
        <DeliveryOrderHero
          orderCode={safeStr(order.orderCode)}
          orderId={orderId}
          taskType={taskType}
          currentStatus={currentStatus}
          orderLifecycleStatus={orderLifecycleStatus}
          assignedAt={assignedAt}
          assignedAtFull={formatDateTime(assignment?.assignedAt)}
          paymentMethod={safeStr(order.paymentMethod)}
          blockedByOrderStatus={blockedByOrderStatus}
          blockedReason={blockedReason}
          refreshing={refreshing}
          customerPhoneLink={customerPhoneLink}
          mapsLink={mapsLink}
          customerName={order.customer?.name || addrName || "-"}
          customerEmail={safeStr(order.customer?.email)}
          itemsCount={items.length}
          onRefresh={() => loadOrder("refresh")}
        />

        <div className="grid min-w-0 max-w-full gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
          <div className="min-w-0 space-y-5">
            <DeliveryOrderItems items={items} />

            <DeliveryTaskTimeline timeline={timeline} />
          </div>

          <DeliverySidePanels
            order={order}
            taskType={taskType}
            addr={addr}
            addrTitle={addrTitle}
            addrName={addrName}
            addrPhone={addrPhone}
            addrStreet={addrStreet}
            addrArea={addrArea}
            addrCity={addrCity}
            blockedByOrderStatus={blockedByOrderStatus}
            blockedReason={blockedReason}
            allowedStatuses={allowedStatuses}
            deliveryStatus={deliveryStatus}
            setDeliveryStatus={setDeliveryStatus}
            deliveryNote={deliveryNote}
            setDeliveryNote={setDeliveryNote}
            hasStatusChanges={hasStatusChanges}
            isFinalState={isFinalState}
            saving={saving}
            saveChanges={saveChanges}
            canSendOtp={canSendOtp}
            otpVerified={otpVerified}
            otpChannel={otpChannel}
            setOtpChannel={setOtpChannel}
            otpInput={otpInput}
            setOtpInput={setOtpInput}
            otpSending={otpSending}
            otpVerifying={otpVerifying}
            sendOtp={sendOtp}
            verifyOtp={verifyOtp}
            otpSentTo={otpSentTo}
            otpChannelUsed={otpChannelUsed}
            otpExpiresAt={otpExpiresAt}
            otpMessage={otpMessage}
            otpError={otpError}
            subtotalPaisa={subtotalPaisa}
            shippingPaisa={shippingPaisa}
            discountPaisa={discountPaisa}
            totalPaisa={totalPaisa}
          />
        </div>
      </div>
    </div>
  );
}