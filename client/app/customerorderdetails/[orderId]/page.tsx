"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

import OrderToast from "./_components/OrderToast";
import OrderBreadcrumb from "./_components/OrderBreadcrumb";
import OrderHero from "./_components/OrderHero";
import OrderLoadingSkeleton from "./_components/OrderLoadingSkeleton";
import OrderTimelineCard from "./_components/OrderTimelineCard";
import OrderCustomerInfo from "./_components/OrderCustomerInfo";
import OrderItemsList from "./_components/OrderItemsList";
import OrderPaymentShippingInfo from "./_components/OrderPaymentShippingInfo";
import OrderSidebar from "./_components/OrderSidebar";
import OrderModals from "./_components/OrderModals";

type ToastType = "success" | "error" | "info";

type OrderItem = {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  size: string;
  color: string;
  colorLabel: string;
  qty: number;
  price: number;
  image: string;
};

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

type CancelRequestStatus = "NONE" | "REQUESTED" | "APPROVED" | "REJECTED";

type ReturnRequestStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP"
  | "RECEIVED";

type ReturnRequestType =
  | "RETURN_REFUND"
  | "EXCHANGE"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "SIZE_COLOR_ISSUE"
  | "NOT_SATISFIED"
  | "OTHER";

type PreferredResolution = "REFUND" | "EXCHANGE";

type RefundStatus =
  | "NONE"
  | "PENDING"
  | "PENDING_ACCOUNT_DETAILS"
  | "READY_TO_REFUND"
  | "PROCESSING"
  | "REFUNDED"
  | "FAILED";

type ExchangeStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP"
  | "RECEIVED"
  | "REPLACEMENT_ASSIGNED"
  | "REPLACEMENT_DELIVERED"
  | "COMPLETED";

type DeliveryAssignmentStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned"
  | "Returned to Store";

type DeliveryAssignment = {
  taskType?:
    | "NORMAL_DELIVERY"
    | "RETURN_PICKUP"
    | "EXCHANGE_PICKUP"
    | "REPLACEMENT_DELIVERY";
  deliveryManId?: string;
  name?: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  note?: string;
  pickupPhoto?: string;
  deliveryPhoto?: string;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  returnedAt?: string | null;
  returnedToStoreAt?: string | null;
  status?: DeliveryAssignmentStatus;
};

type Order = {
  id?: string;
  orderId: string;
  status: OrderStatus;
  customer: {
    name: string;
    email: string;
    shippingAddress: string;
  };
  items: OrderItem[];
  payment: {
    method: string;
  };
  shipping: {
    method: string;
    estimatedDelivery: string;
  };
  summary: {
    subtotal: number;
    shipping: number;
    discount?: number;
    taxes: number;
    total: number;
  };
  deliveryAssignment?: DeliveryAssignment | null;
  returnPickupAssignment?: DeliveryAssignment | null;
  exchangePickupAssignment?: DeliveryAssignment | null;
  replacementDeliveryAssignment?: DeliveryAssignment | null;
  cancelRequest?: {
    status: CancelRequestStatus;
    reason?: string;
    requestedAt?: string | null;
    resolvedAt?: string | null;
    adminNote?: string;
  };
  returnRequest?: {
    status: ReturnRequestStatus;
    type?: ReturnRequestType;
    preferredResolution?: PreferredResolution;
    reason?: string;
    images?: string[];
    requestedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    resolvedAt?: string | null;
    pickedUpAt?: string | null;
    receivedAt?: string | null;
    adminNote?: string;
  };
  refund?: {
    status: RefundStatus;
    amount?: number;
    amountPaisa?: number;
    method?: string;
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    walletNumber?: string;
    walletId?: string;
    requestedAt?: string | null;
    requestedDetailsAt?: string | null;
    detailsSubmittedAt?: string | null;
    processedAt?: string | null;
    refundedAt?: string | null;
    adminNote?: string;
    customerNote?: string;
    transactionRef?: string;
  };
  exchange?: {
    status: ExchangeStatus;
    reason?: string;
    images?: string[];
    requestedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    pickupAssignedAt?: string | null;
    pickedUpAt?: string | null;
    receivedAt?: string | null;
    replacementAssignedAt?: string | null;
    replacementDeliveredAt?: string | null;
    completedAt?: string | null;
    adminNote?: string;
  };
};

type ReviewDraft = {
  productId: string;
  productName: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
};

type RefundDetailsDraft = {
  method: "BANK" | "KHALTI" | "ESEWA" | "FONEPAY";
  accountName: string;
  accountNumber: string;
  bankName: string;
  walletNumber: string;
  walletId: string;
  customerNote: string;
};

const API_BASE =
  API_BASE_URL;

const API = `${API_BASE}/api`;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return "";

  const m = disposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i);

  if (!m?.[1]) return "";

  return decodeURIComponent(m[1]);
}

function normalizeAssignment(nextDelivery: any): DeliveryAssignment | null {
  if (!nextDelivery) return null;

  return {
    taskType: nextDelivery.taskType || undefined,
    deliveryManId: String(nextDelivery.deliveryManId || ""),
    name: String(nextDelivery.name || ""),
    phone: String(nextDelivery.phone || ""),
    email: String(nextDelivery.email || ""),
    vehicleType: String(nextDelivery.vehicleType || ""),
    note: String(nextDelivery.note || ""),
    pickupPhoto: String(nextDelivery.pickupPhoto || ""),
    deliveryPhoto: String(nextDelivery.deliveryPhoto || ""),
    assignedAt: nextDelivery.assignedAt || null,
    pickedUpAt: nextDelivery.pickedUpAt || null,
    outForDeliveryAt: nextDelivery.outForDeliveryAt || null,
    deliveredAt: nextDelivery.deliveredAt || null,
    failedAt: nextDelivery.failedAt || null,
    returnedAt: nextDelivery.returnedAt || null,
    returnedToStoreAt: nextDelivery.returnedToStoreAt || null,
    status: (nextDelivery.status || "") as DeliveryAssignmentStatus,
  };
}

function mergeLiveOrder(prev: Order | null, payload: any): Order | null {
  if (!prev) return prev;

  const nextStatus = String(payload?.orderStatus || "").trim();
  const nextPaymentStatus = String(payload?.paymentStatus || "").trim();

  return {
    ...prev,
    status: nextStatus ? (nextStatus as OrderStatus) : prev.status,
    payment: {
      ...prev.payment,
      method:
        nextPaymentStatus.toLowerCase() === "paid" &&
        String(prev.payment?.method || "").toUpperCase() === "COD"
          ? "Cash on Delivery (Paid)"
          : prev.payment.method,
    },
    cancelRequest: payload?.cancelRequest || prev.cancelRequest,
    returnRequest: payload?.returnRequest || prev.returnRequest,
    refund: payload?.refund || prev.refund,
    exchange: payload?.exchange || prev.exchange,
    deliveryAssignment:
      normalizeAssignment(payload?.deliveryAssignment) ||
      prev.deliveryAssignment ||
      null,
    returnPickupAssignment:
      normalizeAssignment(payload?.returnPickupAssignment) ||
      prev.returnPickupAssignment ||
      null,
    exchangePickupAssignment:
      normalizeAssignment(payload?.exchangePickupAssignment) ||
      prev.exchangePickupAssignment ||
      null,
    replacementDeliveryAssignment:
      normalizeAssignment(payload?.replacementDeliveryAssignment) ||
      prev.replacementDeliveryAssignment ||
      null,
  };
}

function CustomerOrderDetailsPageContent() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderIdFromUrl = params?.orderId ? String(params.orderId) : "";

  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const backHref =
    from === "tracking"
      ? `/order-tracking?code=${encodeURIComponent(orderIdFromUrl)}`
      : from === "history"
        ? "/order-history"
        : from === "thankyou"
          ? "/ThankYou"
          : "/order-history";

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [invoiceLoading, setInvoiceLoading] = React.useState(false);
  const [invoiceError, setInvoiceError] = React.useState<string | null>(null);

  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewSaving, setReviewSaving] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [reviewOk, setReviewOk] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ReviewDraft | null>(null);

  const [requestModal, setRequestModal] = React.useState<
    "cancel" | "return" | null
  >(null);
  const [requestReason, setRequestReason] = React.useState("");
  const [requestType, setRequestType] =
    React.useState<ReturnRequestType>("RETURN_REFUND");
  const [preferredResolution, setPreferredResolution] =
    React.useState<PreferredResolution>("REFUND");
  const [requestSaving, setRequestSaving] = React.useState(false);
  const [requestError, setRequestError] = React.useState<string | null>(null);

  const [refundModalOpen, setRefundModalOpen] = React.useState(false);
  const [refundSaving, setRefundSaving] = React.useState(false);
  const [refundError, setRefundError] = React.useState<string | null>(null);
  const [refundDraft, setRefundDraft] = React.useState<RefundDetailsDraft>({
    method: "ESEWA",
    accountName: "",
    accountNumber: "",
    bankName: "",
    walletNumber: "",
    walletId: "",
    customerNote: "",
  });

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);
  const socketRef = React.useRef<Socket | null>(null);

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
    [],
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const loadOrder = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!orderIdFromUrl) {
        setOrder(null);
        setError("Order ID is missing in the URL.");
        showToast("Order ID is missing in the URL.", "error");
        return;
      }

      const meRes = await fetch(`${API}/auth/me`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (meRes.status === 401) {
        showToast("Please login to view order details.", "info");
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${API}/orders/my/${encodeURIComponent(orderIdFromUrl)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load order");
      }

      const loadedOrder = data?.order || null;

      setOrder(
        loadedOrder
          ? {
              ...loadedOrder,
              cancelRequest: loadedOrder.cancelRequest || { status: "NONE" },
              returnRequest: loadedOrder.returnRequest || { status: "NONE" },
              refund: loadedOrder.refund || { status: "NONE" },
              exchange: loadedOrder.exchange || { status: "NONE" },
              deliveryAssignment: loadedOrder.deliveryAssignment || null,
              returnPickupAssignment:
                loadedOrder.returnPickupAssignment || null,
              exchangePickupAssignment:
                loadedOrder.exchangePickupAssignment || null,
              replacementDeliveryAssignment:
                loadedOrder.replacementDeliveryAssignment || null,
            }
          : null,
      );
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [orderIdFromUrl, router, showToast]);

  React.useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  React.useEffect(() => {
    if (!orderIdFromUrl) return;

    const socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("order:updated", (payload: any) => {
      const payloadCode = String(payload?.orderCode || "").replace(/^#/, "");
      const urlCode = String(orderIdFromUrl || "").replace(/^#/, "");

      setOrder((prev) => {
        const currentCode = String(prev?.orderId || urlCode).replace(/^#/, "");

        if (payloadCode && currentCode && payloadCode === currentCode) {
          showToast("Order status updated in real time.", "info");
          return mergeLiveOrder(prev, payload);
        }

        return prev;
      });
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderIdFromUrl, showToast]);

  const trackingNumber = (order?.orderId || orderIdFromUrl).replace("#", "");

  const activeReturnStatuses = [
    "REQUESTED",
    "APPROVED",
    "PICKUP_ASSIGNED",
    "PICKED_UP",
    "RECEIVED",
  ];

  const activeExchangeStatuses = [
    "REQUESTED",
    "APPROVED",
    "PICKUP_ASSIGNED",
    "PICKED_UP",
    "RECEIVED",
    "REPLACEMENT_ASSIGNED",
    "REPLACEMENT_DELIVERED",
    "COMPLETED",
  ];

  const canRequestCancel =
    !!order &&
    ["Pending", "Confirmed", "Processing"].includes(order.status) &&
    order.cancelRequest?.status !== "REQUESTED" &&
    order.cancelRequest?.status !== "APPROVED";

  const canRequestReturn =
    !!order &&
    order.status === "Delivered" &&
    !activeReturnStatuses.includes(order.returnRequest?.status || "NONE") &&
    !activeExchangeStatuses.includes(order.exchange?.status || "NONE");

  const refundAmount =
    typeof order?.refund?.amountPaisa === "number" &&
    order.refund.amountPaisa > 0
      ? Math.round(order.refund.amountPaisa / 100)
      : order?.refund?.amount ?? order?.summary.total ?? 0;

  const copyOrderId = async () => {
    const value = order?.orderId || orderIdFromUrl;

    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      showToast("Order ID copied.", "success");
    } catch {
      showToast("Unable to copy Order ID.", "error");
    }
  };

  const openReturnModal = () => {
    setRequestModal("return");
    setRequestReason("");
    setRequestType("RETURN_REFUND");
    setPreferredResolution("REFUND");
    setRequestError(null);
  };

  const closeRequestModal = () => {
    if (requestSaving) return;

    setRequestModal(null);
    setRequestReason("");
    setRequestError(null);
  };

  const closeRefundModal = () => {
    if (refundSaving) return;

    setRefundModalOpen(false);
    setRefundError(null);
  };

  const submitOrderRequest = async () => {
    if (!order || !requestModal) return;

    if (!requestReason.trim()) {
      setRequestError("Please enter a reason.");
      showToast("Please enter a reason.", "error");
      return;
    }

    try {
      setRequestSaving(true);
      setRequestError(null);

      const idOrCode = order.orderId || orderIdFromUrl;

      const endpoint =
        requestModal === "cancel"
          ? `${API}/orders/my/${encodeURIComponent(idOrCode)}/cancel-request`
          : `${API}/orders/my/${encodeURIComponent(idOrCode)}/return-request`;

      const body =
        requestModal === "cancel"
          ? { reason: requestReason.trim() }
          : {
              reason: requestReason.trim(),
              type: requestType,
              preferredResolution,
              images: [],
            };

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit request");
      }

      showToast(
        requestModal === "cancel"
          ? "Cancellation request submitted."
          : preferredResolution === "EXCHANGE"
            ? "Exchange request submitted."
            : "Return & refund request submitted.",
        "success",
      );

      setRequestModal(null);
      setRequestReason("");
      await loadOrder();
    } catch (e: any) {
      const msg = e?.message || "Failed to submit request";
      setRequestError(msg);
      showToast(msg, "error");
    } finally {
      setRequestSaving(false);
    }
  };

  const submitRefundDetails = async () => {
    if (!order) return;

    try {
      setRefundSaving(true);
      setRefundError(null);

      if (refundDraft.method === "BANK") {
        if (
          !refundDraft.accountName.trim() ||
          !refundDraft.accountNumber.trim() ||
          !refundDraft.bankName.trim()
        ) {
          throw new Error(
            "Bank name, account holder name, and account number are required.",
          );
        }
      } else if (
        !refundDraft.walletNumber.trim() &&
        !refundDraft.walletId.trim()
      ) {
        throw new Error("Wallet number or wallet ID is required.");
      }

      const idOrCode = order.orderId || orderIdFromUrl;

      const res = await fetch(
        `${API}/orders/my/${encodeURIComponent(idOrCode)}/refund-details`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(refundDraft),
        },
      );

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit refund details");
      }

      showToast("Refund details submitted successfully.", "success");
      setRefundModalOpen(false);
      await loadOrder();
    } catch (e: any) {
      const msg = e?.message || "Failed to submit refund details";
      setRefundError(msg);
      showToast(msg, "error");
    } finally {
      setRefundSaving(false);
    }
  };

  const raiseTicket = (item: OrderItem) => {
    const q = new URLSearchParams({
      orderId: order?.orderId || orderIdFromUrl || "",
      productId: item.productId || item.id,
      productName: item.name,
      size: item.size || "",
      color: item.colorLabel || item.color || "",
    });

    router.push(`/support-ticket?${q.toString()}`);
  };

  const openReviewModal = (item: OrderItem) => {
    setReviewError(null);
    setReviewOk(null);

    setDraft({
      productId: item.productId || item.id,
      productName: item.name,
      orderId: order?.orderId || orderIdFromUrl || "",
      rating: 5,
      title: "",
      comment: "",
    });

    setReviewOpen(true);
  };

  const closeReviewModal = () => {
    if (reviewSaving) return;

    setReviewOpen(false);
    setDraft(null);
    setReviewError(null);
    setReviewOk(null);
  };

  const submitReview = async () => {
    if (!draft) return;

    if (!draft.comment.trim()) {
      setReviewError("Please write your review comment.");
      showToast("Please write your review comment.", "error");
      return;
    }

    if (draft.comment.trim().length < 5) {
      setReviewError("Review comment must be at least 5 characters.");
      showToast("Review comment must be at least 5 characters.", "error");
      return;
    }

    try {
      setReviewSaving(true);
      setReviewError(null);
      setReviewOk(null);

      const res = await fetch(`${API}/products/${draft.productId}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: draft.orderId,
          rating: draft.rating,
          title: draft.title.trim(),
          comment: draft.comment.trim(),
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit review");
      }

      setReviewOk("Review submitted successfully!");
      showToast("Review submitted successfully.", "success");
      window.dispatchEvent(new Event("ufo_review_updated"));

      window.setTimeout(() => {
        closeReviewModal();
      }, 900);
    } catch (e: any) {
      const msg = e?.message || "Failed to submit review";
      setReviewError(msg);
      showToast(msg, "error");
    } finally {
      setReviewSaving(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      setInvoiceLoading(true);
      setInvoiceError(null);

      const idOrCode = order?.orderId || orderIdFromUrl;

      if (!idOrCode) {
        throw new Error("Order ID not found.");
      }

      const res = await fetch(
        `${API}/orders/${encodeURIComponent(idOrCode)}/invoice`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.message || "Failed to download invoice");
      }

      const blob = await res.blob();

      const dispo = res.headers.get("content-disposition");

      const filename =
        getFilenameFromDisposition(dispo) || `invoice-${idOrCode}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      showToast("Invoice downloaded successfully.", "success");
    } catch (e: any) {
      const msg = e?.message || "Invoice download failed";
      setInvoiceError(msg);
      showToast(msg, "error");
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <>
      <CartHeader backHref={backHref} />

      <OrderToast toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <OrderBreadcrumb />

          <OrderHero
            order={order}
            loading={loading}
            error={error}
            trackingNumber={trackingNumber}
            invoiceLoading={invoiceLoading}
            copyOrderId={copyOrderId}
            downloadInvoice={downloadInvoice}
          />

          {loading ? <OrderLoadingSkeleton /> : null}

          {error ? (
            <div className="mt-8 rounded-[24px] border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              <div className="font-semibold">Unable to load order</div>

              <div className="mt-2 text-sm">{error}</div>

              <button
                type="button"
                onClick={loadOrder}
                className={`${secondaryBtnClass} mt-5`}
              >
                Try Again
              </button>
            </div>
          ) : null}

          {!loading && !error && !order ? (
            <div className={`${panelClass} mt-8 p-6 text-[#a7aec4]`}>
              Order not found.
            </div>
          ) : null}

          {!loading && !error && order ? (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-8">
                {invoiceError ? (
                  <div className="rounded-[20px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {invoiceError}
                  </div>
                ) : null}

                <OrderTimelineCard status={order.status} />

                <OrderCustomerInfo order={order} />

                <OrderItemsList
                  order={order}
                  raiseTicket={raiseTicket}
                  openReviewModal={openReviewModal}
                />

                <OrderPaymentShippingInfo
                  order={order}
                  trackingNumber={trackingNumber}
                />
              </div>

              <OrderSidebar
                order={order}
                refundAmount={refundAmount}
                invoiceLoading={invoiceLoading}
                canRequestCancel={canRequestCancel}
                canRequestReturn={canRequestReturn}
                downloadInvoice={downloadInvoice}
                openRefundDetails={() => {
                  setRefundError(null);
                  setRefundModalOpen(true);
                }}
                openCancelRequest={() => {
                  setRequestModal("cancel");
                  setRequestReason("");
                  setRequestError(null);
                }}
                openReturnModal={openReturnModal}
              />
            </div>
          ) : null}
        </div>
      </main>

      <MainFooter />

      <OrderModals
        order={order}
        orderIdFromUrl={orderIdFromUrl}
        requestModal={requestModal}
        requestReason={requestReason}
        setRequestReason={setRequestReason}
        requestType={requestType}
        setRequestType={setRequestType}
        preferredResolution={preferredResolution}
        setPreferredResolution={setPreferredResolution}
        requestSaving={requestSaving}
        requestError={requestError}
        closeRequestModal={closeRequestModal}
        submitOrderRequest={submitOrderRequest}
        refundModalOpen={refundModalOpen}
        refundDraft={refundDraft}
        setRefundDraft={setRefundDraft}
        refundSaving={refundSaving}
        refundError={refundError}
        closeRefundModal={closeRefundModal}
        submitRefundDetails={submitRefundDetails}
        reviewOpen={reviewOpen}
        draft={draft}
        setDraft={setDraft}
        reviewSaving={reviewSaving}
        reviewError={reviewError}
        reviewOk={reviewOk}
        closeReviewModal={closeReviewModal}
        submitReview={submitReview}
      />
    </>
  );
}

export default function CustomerOrderDetailsPage() {
  return (
    <React.Suspense fallback={null}>
      <CustomerOrderDetailsPageContent />
    </React.Suspense>
  );
}
