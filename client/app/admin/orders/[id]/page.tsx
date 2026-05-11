"use client";

import * as React from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import AdminPageGuard from "../../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../../_components/adminPermissions";

import OrderAfterSales from "./_components/OrderAfterSales";
import OrderDetailsHeader from "./_components/OrderDetailsHeader";
import OrderSidePanels from "./_components/OrderSidePanels";
import OrderSummaryItemsTimeline from "./_components/OrderSummaryItemsTimeline";
import RequestActionModal from "./_components/RequestActionModal";
import { LoadingSkeleton, Toast } from "./_components/OrderDetailsShared";
import {
  API_BASE,
  AdminOrderDetail,
  AfterSalesAction,
  DeliveryAssignmentStatus,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  RiderRow,
  TimelineStep,
  ToastState,
  ToastType,
  formatDate,
  getOrderFromResponse,
  getRidersFromResponse,
  normalizeDeliveryStatus,
  normalizeExchangeStatus,
  normalizeOrderStatus,
  normalizePaymentStatus,
  normalizeRefundStatus,
  normalizeRequestStatus,
  normalizeReturnStatus,
  panelClass,
  safeJson,
  safeStr,
  secondaryBtnClass,
  shellClass,
} from "./_components/orderDetailsTypes";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = React.useState(false);

  const [order, setOrder] = React.useState<AdminOrderDetail | null>(null);
  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState<ToastState>(null);

  const [paymentStatus, setPaymentStatus] =
    React.useState<PaymentStatus>("Pending");
  const [orderStatus, setOrderStatus] = React.useState<OrderStatus>("Pending");

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  const [riders, setRiders] = React.useState<RiderRow[]>([]);
  const [ridersLoading, setRidersLoading] = React.useState(false);

  const [deliveryManId, setDeliveryManId] = React.useState("");
  const [deliveryNote, setDeliveryNote] = React.useState("");
  const [deliveryStatus, setDeliveryStatus] =
    React.useState<DeliveryAssignmentStatus>("Assigned");

  const [requestActionLoading, setRequestActionLoading] = React.useState(false);
  const [adminNote, setAdminNote] = React.useState("");
  const [transactionRef, setTransactionRef] = React.useState("");
  const [selectedRiderId, setSelectedRiderId] = React.useState("");
  const [activeRequestAction, setActiveRequestAction] =
    React.useState<AfterSalesAction | null>(null);

  const canUpdate = hasPermission(role, permissions, "orderUpdate");
  const canViewReturnsRefunds =
    hasPermission(role, permissions, "returnsRefundsView") ||
    hasPermission(role, permissions, "orderView");

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
    },
    []
  );

  React.useEffect(() => {
    if (!toast) return;

    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    let mounted = true;

    const loadAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const body = (await safeJson(res)) as AdminSettingsResponse;
        const nextRole = (body?.profile?.role || "admin") as
          | "admin"
          | "superadmin";

        const nextPermissions = normalizeAdminPermissions(
          nextRole,
          body?.profile?.permissions
        );

        if (!mounted) return;

        setRole(nextRole);
        setPermissions(nextPermissions);
      } catch {}
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const loadRiders = async () => {
      try {
        setRidersLoading(true);

        const res = await fetch(`${API_BASE}/api/admin/delivery-staff?search=`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          throw new Error((json as any)?.message || "Failed to load riders");
        }

        const data = getRidersFromResponse(json);

        const normalized: RiderRow[] = data
          .map((item: any) => ({
            id: safeStr(item?.id || item?._id),
            name: safeStr(item?.name),
            email: safeStr(item?.email),
            phone: safeStr(item?.phone),
            vehicleType: safeStr(item?.vehicleType),
            vehicleNumber: safeStr(item?.vehicleNumber),
            area: safeStr(item?.area || item?.deliveryArea),
            isActive:
              typeof item?.isActive === "boolean"
                ? item.isActive
                : String(item?.status || "").toLowerCase() === "active" ||
                  Boolean(item?.active),
          }))
          .filter((item: RiderRow) => item.id && item.isActive);

        if (mounted) setRiders(normalized);
      } catch {
        if (mounted) setRiders([]);
      } finally {
        if (mounted) setRidersLoading(false);
      }
    };

    loadRiders();

    return () => {
      mounted = false;
    };
  }, []);

  const syncOrderState = React.useCallback((nextOrder: AdminOrderDetail) => {
    setOrder(nextOrder);
    setPaymentStatus(normalizePaymentStatus(nextOrder?.paymentStatus));
    setOrderStatus(
      normalizeOrderStatus(nextOrder?.orderStatus || nextOrder?.status)
    );
    setDeliveryManId(safeStr(nextOrder?.deliveryAssignment?.deliveryManId));
    setDeliveryNote(safeStr(nextOrder?.deliveryAssignment?.note));
    setDeliveryStatus(
      normalizeDeliveryStatus(nextOrder?.deliveryAssignment?.status)
    );
  }, []);

  const loadOrder = React.useCallback(
    async (mode: "initial" | "refresh" | "silent" = "initial") => {
      if (!id) return;

      try {
        if (mode === "initial") setLoading(true);
        if (mode === "refresh") setRefreshing(true);

        setError("");

        const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          setError((json as any)?.message || "Order not found");
          setOrder(null);
          return;
        }

        const nextOrder = getOrderFromResponse(json);

        if (!nextOrder) {
          setError("Order response was empty");
          setOrder(null);
          return;
        }

        syncOrderState(nextOrder);

        if (mode === "refresh") {
          showToast("Order refreshed successfully.", "success");
        }
      } catch {
        setError("Failed to load order");
        setOrder(null);

        if (mode === "refresh") {
          showToast("Failed to refresh order.", "error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, showToast, syncOrderState]
  );

  React.useEffect(() => {
    loadOrder("initial");
  }, [loadOrder]);

  React.useEffect(() => {
    if (!id) return;

    const socket: Socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("order:updated", (payload: any) => {
      const updatedOrderId = safeStr(payload?.orderId);
      const updatedOrderCode = safeStr(payload?.orderCode);
      const currentId = safeStr(id);
      const currentOrderId = safeStr(order?.id);
      const currentOrderCode = safeStr(order?.orderCode);

      const matches =
        updatedOrderId === currentId ||
        updatedOrderId === currentOrderId ||
        updatedOrderCode === currentId ||
        updatedOrderCode === currentOrderCode;

      if (matches) {
        loadOrder("silent");
      }
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
    };
  }, [id, order?.id, order?.orderCode, loadOrder]);

  const originalPaymentStatus = normalizePaymentStatus(order?.paymentStatus);
  const originalOrderStatus = normalizeOrderStatus(
    order?.orderStatus || order?.status
  );
  const originalDeliveryManId = safeStr(order?.deliveryAssignment?.deliveryManId);
  const originalDeliveryNote = safeStr(order?.deliveryAssignment?.note).trim();
  const originalDeliveryStatus = normalizeDeliveryStatus(
    order?.deliveryAssignment?.status
  );

  const deliveryChanged =
    deliveryManId !== originalDeliveryManId ||
    deliveryNote.trim() !== originalDeliveryNote ||
    deliveryStatus !== originalDeliveryStatus;

  const baseChanged =
    paymentStatus !== originalPaymentStatus ||
    orderStatus !== originalOrderStatus;

  const hasChanges = baseChanged || deliveryChanged;

  const otpVerified = Boolean(order?.deliveryAssignment?.isOtpVerified);

  const cancelStatus = normalizeRequestStatus(order?.cancelRequest?.status);
  const returnStatus = normalizeReturnStatus(order?.returnRequest?.status);
  const refundStatus = normalizeRefundStatus(order?.refund?.status);
  const exchangeStatus = normalizeExchangeStatus(order?.exchange?.status);

  const returnRequestType = safeStr(order?.returnRequest?.type);
  const preferredResolution = safeStr(order?.returnRequest?.preferredResolution);
  const isExchangeRequest =
    preferredResolution.toUpperCase() === "EXCHANGE" ||
    returnRequestType.toUpperCase() === "EXCHANGE" ||
    exchangeStatus !== "NONE";

  const hasAfterSalesData =
    cancelStatus !== "NONE" ||
    returnStatus !== "NONE" ||
    refundStatus !== "NONE" ||
    exchangeStatus !== "NONE";

  const saveChanges = async () => {
    if (!order?.id) return;

    if (!canUpdate) {
      showToast("You do not have permission to update orders.", "error");
      return;
    }

    if (!hasChanges) {
      showToast("No changes to save.", "info");
      return;
    }

    if (deliveryChanged && !deliveryManId) {
      showToast(
        "Please select a delivery rider before updating delivery details.",
        "error"
      );
      return;
    }

    if (
      (orderStatus === "Delivered" || deliveryStatus === "Delivered") &&
      !otpVerified
    ) {
      showToast(
        "Delivered status requires delivery OTP verification. Use delivery OTP flow.",
        "error"
      );
      return;
    }

    try {
      setSaving(true);
      setToast(null);

      const payload: {
        paymentStatus: PaymentStatus;
        orderStatus: OrderStatus;
        deliveryAssignment?: {
          deliveryManId: string;
          note: string;
          status: DeliveryAssignmentStatus;
        };
      } = {
        paymentStatus,
        orderStatus,
      };

      if (deliveryChanged) {
        payload.deliveryAssignment = {
          deliveryManId,
          note: deliveryNote.trim(),
          status: deliveryStatus,
        };
      }

      const res = await fetch(`${API_BASE}/api/admin/orders/${order.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        showToast((json as any)?.message || "Failed to save changes", "error");
        return;
      }

      const updated = getOrderFromResponse(json);

      if (updated) {
        syncOrderState(updated);
      } else {
        await loadOrder("silent");
      }

      showToast("Order updated successfully.", "success");
    } catch {
      showToast("Failed to save changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  const openRequestAction = (action: AfterSalesAction) => {
    if (!canViewReturnsRefunds) {
      showToast(
        "You do not have permission to manage returns and refunds.",
        "error"
      );
      return;
    }

    setAdminNote("");
    setTransactionRef("");
    setSelectedRiderId("");
    setActiveRequestAction(action);
  };

  const closeRequestActionModal = () => {
    if (requestActionLoading) return;

    setActiveRequestAction(null);
    setAdminNote("");
    setTransactionRef("");
    setSelectedRiderId("");
  };

  const submitRequestAction = async () => {
    if (!order || !activeRequestAction) return;

    if (!canViewReturnsRefunds) {
      showToast(
        "You do not have permission to manage returns and refunds.",
        "error"
      );
      return;
    }

    const orderId = safeStr(order.id || order._id || order.orderCode);

    if (!orderId) {
      showToast("Order ID is missing.", "error");
      return;
    }

    const actualAction: AfterSalesAction = activeRequestAction;

    const riderRequired =
      actualAction === "assignReturnPickup" ||
      actualAction === "assignExchangePickup" ||
      actualAction === "assignReplacement";

    if (riderRequired && !selectedRiderId) {
      showToast("Please select a delivery rider.", "error");
      return;
    }

    const encodedId = encodeURIComponent(orderId);

    const map: Record<AfterSalesAction, string> = {
      approveCancel: `${API_BASE}/api/admin/orders/${encodedId}/cancel/approve`,
      rejectCancel: `${API_BASE}/api/admin/orders/${encodedId}/cancel/reject`,
      approveReturn: `${API_BASE}/api/admin/orders/${encodedId}/return/approve`,
      rejectReturn: `${API_BASE}/api/admin/orders/${encodedId}/return/reject`,
      assignReturnPickup: `${API_BASE}/api/admin/orders/${encodedId}/return/assign-pickup`,
      assignExchangePickup: `${API_BASE}/api/admin/orders/${encodedId}/exchange/assign-pickup`,
      markReceived: `${API_BASE}/api/admin/orders/${encodedId}/return/mark-received`,
      requestRefundDetails: `${API_BASE}/api/admin/orders/${encodedId}/refund/request-details`,
      markRefundProcessing: `${API_BASE}/api/admin/orders/${encodedId}/refund/processing`,
      markRefunded: `${API_BASE}/api/admin/orders/${encodedId}/refund/mark-refunded`,
      assignReplacement: `${API_BASE}/api/admin/orders/${encodedId}/exchange/assign-replacement`,
      completeExchange: `${API_BASE}/api/admin/orders/${encodedId}/exchange/complete`,
    };

    try {
      setRequestActionLoading(true);

      const body: Record<string, any> = {
        adminNote: adminNote.trim(),
      };

      if (riderRequired) {
        body.deliveryManId = selectedRiderId;
        body.note = adminNote.trim();
      }

      if (actualAction === "markRefunded") {
        body.transactionRef = transactionRef.trim();
      }

      let res = await fetch(map[actualAction], {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let json = await safeJson(res);

      const message = safeStr((json as any)?.message).toLowerCase();

      if (
        !res.ok &&
        actualAction === "assignReturnPickup" &&
        message.includes("exchange request")
      ) {
        res = await fetch(map.assignExchangePickup, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        json = await safeJson(res);
      }

      if (!res.ok) {
        showToast((json as any)?.message || "Action failed.", "error");
        return;
      }

      showToast("Request updated successfully.", "success");
      closeRequestActionModal();
      await loadOrder("silent");
    } catch {
      showToast("Action failed.", "error");
    } finally {
      setRequestActionLoading(false);
    }
  };

  const downloadInvoice = async () => {
    if (!order?.id) return;

    try {
      setDownloadingInvoice(true);

      const target = encodeURIComponent(order.id);

      const res = await fetch(`${API_BASE}/api/orders/${target}/invoice`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error((body as any)?.message || "Failed to download invoice");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const fileBase = safeStr(order.orderCode || order.id).replace("#", "");
      const a = document.createElement("a");

      a.href = url;
      a.download = `invoice-${fileBase || "order"}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      showToast("Invoice downloaded successfully.", "success");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to download invoice.";

      showToast(message, "error");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const actionTitle =
    activeRequestAction === "approveCancel"
      ? "Approve Cancellation"
      : activeRequestAction === "rejectCancel"
        ? "Reject Cancellation"
        : activeRequestAction === "approveReturn"
          ? isExchangeRequest
            ? "Approve Exchange"
            : "Approve Return"
          : activeRequestAction === "rejectReturn"
            ? isExchangeRequest
              ? "Reject Exchange"
              : "Reject Return"
            : activeRequestAction === "assignReturnPickup"
              ? isExchangeRequest
                ? "Assign Exchange Pickup Rider"
                : "Assign Return Pickup Rider"
              : activeRequestAction === "assignExchangePickup"
                ? "Assign Exchange Pickup Rider"
                : activeRequestAction === "markReceived"
                  ? "Mark Product Received"
                  : activeRequestAction === "requestRefundDetails"
                    ? "Request Refund Details"
                    : activeRequestAction === "markRefundProcessing"
                      ? "Mark Refund Processing"
                      : activeRequestAction === "markRefunded"
                        ? "Mark Refund Completed"
                        : activeRequestAction === "assignReplacement"
                          ? "Assign Replacement Delivery"
                          : activeRequestAction === "completeExchange"
                            ? "Complete Exchange"
                            : "Confirm Action";

  const riderRequired =
    activeRequestAction === "assignReturnPickup" ||
    activeRequestAction === "assignExchangePickup" ||
    activeRequestAction === "assignReplacement";

  if (loading) {
    return (
      <AdminPageGuard permission="orderView">
        <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
          <LoadingSkeleton />
        </div>
      </AdminPageGuard>
    );
  }

  if (!order) {
    return (
      <AdminPageGuard permission="orderView">
        <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
          <Toast toast={toast} />

          <div className="space-y-4">
            <div className={`${panelClass} p-6 text-[14px] text-red-200`}>
              {error || "Order not found"}
            </div>

            <Link href="/admin/orders" className={secondaryBtnClass}>
              Back
            </Link>
          </div>
        </div>
      </AdminPageGuard>
    );
  }

  const placedOn = formatDate(order.createdAt);

  const timeline: TimelineStep[] = [
    { label: "Order Placed", date: placedOn, status: "done" },
    {
      label: "Order Confirmed",
      date: order.confirmedAt ? formatDate(order.confirmedAt) : "—",
      status:
        orderStatus === "Confirmed" || orderStatus === "Processing"
          ? "current"
          : ["Shipped", "Transit", "Delivered", "Returned", "Refunded"].includes(
                orderStatus
              )
            ? "done"
            : "upcoming",
    },
    {
      label: "Order Processing",
      date: order.processingAt ? formatDate(order.processingAt) : "—",
      status:
        orderStatus === "Processing"
          ? "current"
          : ["Shipped", "Transit", "Delivered", "Returned", "Refunded"].includes(
                orderStatus
              )
            ? "done"
            : "upcoming",
    },
    {
      label: "Order Shipped",
      date: order.shippedAt ? formatDate(order.shippedAt) : "—",
      status:
        orderStatus === "Shipped"
          ? "current"
          : ["Transit", "Delivered", "Returned", "Refunded"].includes(orderStatus)
            ? "done"
            : "upcoming",
    },
    {
      label: "Order In Transit",
      date: order.inTransitAt ? formatDate(order.inTransitAt) : "—",
      status:
        orderStatus === "Transit"
          ? "current"
          : ["Delivered", "Returned", "Refunded"].includes(orderStatus)
            ? "done"
            : "upcoming",
    },
    {
      label: "Order Delivered",
      date: order.deliveredAt ? formatDate(order.deliveredAt) : "—",
      status:
        orderStatus === "Delivered"
          ? "current"
          : ["Returned", "Refunded"].includes(orderStatus)
            ? "done"
            : "upcoming",
    },
  ];

  const addr = order.address || null;
  const customerId = order?.customer?.id || order?.customer?._id || "";
  const items = Array.isArray(order.items) ? order.items : [];

  const subtotalPaisa =
    Number(order?.subtotalPaisa || 0) ||
    items.reduce((sum: number, it: OrderItem) => {
      const qty = Number(it?.qty || 0);
      const pricePaisa = Number(it?.pricePaisa || 0);
      return sum + qty * pricePaisa;
    }, 0);

  const shippingPaisa = Number(order?.shippingPaisa || 0);
  const discountPaisa = Number(order?.discountPaisa || 0);
  const totalPaisa = Number(order?.totalPaisa || 0);

  const deliveredBlocked = !otpVerified;

  return (
    <AdminPageGuard permission="orderView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <Toast toast={toast} />

        <div className="space-y-6">
          <OrderDetailsHeader
            order={order}
            paymentStatus={paymentStatus}
            orderStatus={orderStatus}
            deliveryStatus={deliveryStatus}
            returnStatus={returnStatus}
            exchangeStatus={exchangeStatus}
            refundStatus={refundStatus}
            otpVerified={otpVerified}
            placedOn={placedOn}
            refreshing={refreshing}
            downloadingInvoice={downloadingInvoice}
            customerId={customerId}
            onRefresh={() => loadOrder("refresh")}
            onDownloadInvoice={downloadInvoice}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
            <div className="space-y-6">
              <OrderAfterSales
                order={order}
                canViewReturnsRefunds={canViewReturnsRefunds}
                cancelStatus={cancelStatus}
                returnStatus={returnStatus}
                refundStatus={refundStatus}
                exchangeStatus={exchangeStatus}
                isExchangeRequest={isExchangeRequest}
                hasAfterSalesData={hasAfterSalesData}
                totalPaisa={totalPaisa}
                requestActionLoading={requestActionLoading}
                openRequestAction={openRequestAction}
              />

              <OrderSummaryItemsTimeline
                order={order}
                items={items}
                timeline={timeline}
                totalPaisa={totalPaisa}
              />
            </div>

            <OrderSidePanels
              order={order}
              addr={addr}
              riders={riders}
              ridersLoading={ridersLoading}
              canUpdate={canUpdate}
              paymentStatus={paymentStatus}
              setPaymentStatus={setPaymentStatus}
              orderStatus={orderStatus}
              setOrderStatus={setOrderStatus}
              deliveryManId={deliveryManId}
              setDeliveryManId={setDeliveryManId}
              deliveryNote={deliveryNote}
              setDeliveryNote={setDeliveryNote}
              deliveryStatus={deliveryStatus}
              setDeliveryStatus={setDeliveryStatus}
              otpVerified={otpVerified}
              deliveredBlocked={deliveredBlocked}
              deliveryChanged={deliveryChanged}
              hasChanges={hasChanges}
              saving={saving}
              saveChanges={saveChanges}
              subtotalPaisa={subtotalPaisa}
              shippingPaisa={shippingPaisa}
              discountPaisa={discountPaisa}
              totalPaisa={totalPaisa}
            />
          </div>
        </div>

        <RequestActionModal
          activeRequestAction={activeRequestAction}
          actionTitle={actionTitle}
          order={order}
          totalPaisa={totalPaisa}
          riderRequired={riderRequired}
          riders={riders}
          ridersLoading={ridersLoading}
          selectedRiderId={selectedRiderId}
          setSelectedRiderId={setSelectedRiderId}
          transactionRef={transactionRef}
          setTransactionRef={setTransactionRef}
          adminNote={adminNote}
          setAdminNote={setAdminNote}
          requestActionLoading={requestActionLoading}
          closeRequestActionModal={closeRequestActionModal}
          submitRequestAction={submitRequestAction}
        />
      </div>
    </AdminPageGuard>
  );
}