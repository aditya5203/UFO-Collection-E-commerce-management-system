"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import AdminPageGuard from "../../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../../_components/adminPermissions";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const PLACEHOLDER = "/images/products/placeholder.png";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";
const dangerBtnClass =
  "rounded-full border border-red-400/30 bg-red-500/15 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-100 transition hover:-translate-y-0.5 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60";
const inputClass =
  "h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

type PaymentStatus = "Paid" | "Pending" | "Failed";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Transit"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

type DeliveryAssignmentStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned"
  | "Returned to Store";

type RequestStatus = "NONE" | "REQUESTED" | "APPROVED" | "REJECTED";

type ReturnStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP";

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

type ReturnRequestType =
  | "RETURN_REFUND"
  | "EXCHANGE"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "SIZE_COLOR_ISSUE"
  | "NOT_SATISFIED"
  | "OTHER";

type PreferredResolution = "REFUND" | "EXCHANGE" | "";

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
} | null;

type TimelineStep = {
  label: string;
  date: string;
  status: "done" | "current" | "upcoming";
};

type RiderRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  area?: string;
  isActive?: boolean;
};

type OrderItem = {
  productId?: string;
  variantId?: string;
  name?: string;
  size?: string;
  color?: string;
  colorLabel?: string;
  sku?: string;
  qty?: number;
  pricePaisa?: number;
  image?: string;
};

type OrderAddress = {
  label?: string;
  fullName?: string;
  phone?: string;
  street?: string;
  addressLine?: string;
  area?: string;
  district?: string;
  cityOrMunicipality?: string;
  city?: string;
  provinceId?: string;
  lat?: number;
  lng?: number;
};

type DeliveryAssignment = {
  taskType?: string;
  deliveryManId?: string;
  name?: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  note?: string;
  status?: DeliveryAssignmentStatus | string;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  returnedAt?: string | null;
  returnedToStoreAt?: string | null;
  pickupPhoto?: string;
  deliveryPhoto?: string;
  isOtpVerified?: boolean;
  otpVerifiedAt?: string | null;
};

type AdminOrderDetail = {
  id: string;
  _id?: string;
  orderCode?: string;
  createdAt?: string;
  confirmedAt?: string | null;
  processingAt?: string | null;
  shippedAt?: string | null;
  inTransitAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  returnedAt?: string | null;
  refundedAt?: string | null;
  paymentStatus?: PaymentStatus | string;
  orderStatus?: OrderStatus | string;
  status?: string;
  paymentMethod?: string;
  paymentRef?: string | null;
  customer?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  items?: OrderItem[];
  address?: OrderAddress | null;
  shippingAddress?: string;
  subtotalPaisa?: number;
  shippingPaisa?: number;
  discountPaisa?: number;
  totalPaisa?: number;

  deliveryAssignment?: DeliveryAssignment | null;
  returnPickupAssignment?: DeliveryAssignment | null;
  exchangePickupAssignment?: DeliveryAssignment | null;
  replacementDeliveryAssignment?: DeliveryAssignment | null;

  cancelRequest?: {
    status?: RequestStatus;
    reason?: string;
    requestedAt?: string | null;
    resolvedAt?: string | null;
    adminNote?: string;
  };

  returnRequest?: {
    status?: ReturnStatus;
    type?: ReturnRequestType | string;
    preferredResolution?: PreferredResolution | string;
    reason?: string;
    images?: string[];
    requestedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    pickedUpAt?: string | null;
    receivedAt?: string | null;
    resolvedAt?: string | null;
    adminNote?: string;
  };

  refund?: {
    status?: RefundStatus;
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
    transactionRef?: string;
    customerNote?: string;
  };

  exchange?: {
    status?: ExchangeStatus;
    reason?: string;
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

type AfterSalesAction =
  | "approveCancel"
  | "rejectCancel"
  | "approveReturn"
  | "rejectReturn"
  | "assignReturnPickup"
  | "assignExchangePickup"
  | "markReceived"
  | "requestRefundDetails"
  | "markRefundProcessing"
  | "markRefunded"
  | "assignReplacement"
  | "completeExchange";

function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;
  return `Rs. ${(safe / 100).toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: unknown) {
  if (!d) return "-";

  try {
    const date = new Date(String(d));
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

function formatDateTime(d: unknown) {
  if (!d) return "-";

  try {
    const date = new Date(String(d));
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function safeStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

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

function normalizePaymentStatus(value?: string): PaymentStatus {
  const v = safeStr(value).toLowerCase();

  if (v === "paid" || v === "success" || v === "successful") return "Paid";
  if (v === "failed") return "Failed";

  return "Pending";
}

function normalizeOrderStatus(value?: string): OrderStatus {
  const v = safeStr(value).toLowerCase();

  if (v === "confirmed") return "Confirmed";
  if (v === "processing") return "Processing";
  if (v === "shipped") return "Shipped";
  if (v === "transit" || v === "in transit") return "Transit";
  if (v === "delivered") return "Delivered";
  if (v === "cancelled" || v === "canceled") return "Cancelled";
  if (v === "returned") return "Returned";
  if (v === "refunded") return "Refunded";

  return "Pending";
}

function normalizeDeliveryStatus(value?: string): DeliveryAssignmentStatus {
  const v = safeStr(value).toLowerCase();

  if (v === "picked up") return "Picked Up";
  if (v === "out for delivery") return "Out for Delivery";
  if (v === "delivered") return "Delivered";
  if (v === "failed delivery") return "Failed Delivery";
  if (v === "returned") return "Returned";
  if (v === "returned to store") return "Returned to Store";

  return "Assigned";
}

function normalizeRequestStatus(value?: string): RequestStatus {
  const v = safeStr(value).toUpperCase();

  if (v === "REQUESTED") return "REQUESTED";
  if (v === "APPROVED") return "APPROVED";
  if (v === "REJECTED") return "REJECTED";

  return "NONE";
}

function normalizeReturnStatus(value?: string): ReturnStatus {
  const v = safeStr(value).toUpperCase();

  if (v === "REQUESTED") return "REQUESTED";
  if (v === "APPROVED") return "APPROVED";
  if (v === "REJECTED") return "REJECTED";
  if (v === "RECEIVED") return "RECEIVED";
  if (v === "PICKUP_ASSIGNED") return "PICKUP_ASSIGNED";
  if (v === "PICKED_UP") return "PICKED_UP";

  return "NONE";
}

function normalizeRefundStatus(value?: string): RefundStatus {
  const v = safeStr(value).toUpperCase();

  if (v === "PENDING") return "PENDING";
  if (v === "PENDING_ACCOUNT_DETAILS") return "PENDING_ACCOUNT_DETAILS";
  if (v === "READY_TO_REFUND") return "READY_TO_REFUND";
  if (v === "PROCESSING") return "PROCESSING";
  if (v === "REFUNDED") return "REFUNDED";
  if (v === "FAILED") return "FAILED";

  return "NONE";
}

function normalizeExchangeStatus(value?: string): ExchangeStatus {
  const v = safeStr(value).toUpperCase();

  if (v === "REQUESTED") return "REQUESTED";
  if (v === "APPROVED") return "APPROVED";
  if (v === "REJECTED") return "REJECTED";
  if (v === "PICKUP_ASSIGNED") return "PICKUP_ASSIGNED";
  if (v === "PICKED_UP") return "PICKED_UP";
  if (v === "RECEIVED") return "RECEIVED";
  if (v === "REPLACEMENT_ASSIGNED") return "REPLACEMENT_ASSIGNED";
  if (v === "REPLACEMENT_DELIVERED") return "REPLACEMENT_DELIVERED";
  if (v === "COMPLETED") return "COMPLETED";

  return "NONE";
}

function prettyStatus(value?: string) {
  return safeStr(value || "NONE").replaceAll("_", " ");
}

function prettyRequestType(value?: string) {
  const v = safeStr(value).toUpperCase();

  const map: Record<string, string> = {
    RETURN_REFUND: "Return & Refund",
    EXCHANGE: "Exchange",
    DAMAGED: "Damaged Product",
    WRONG_ITEM: "Wrong Item",
    SIZE_COLOR_ISSUE: "Size / Color Issue",
    NOT_SATISFIED: "Not Satisfied",
    OTHER: "Other",
  };

  return map[v] || value || "-";
}

function getStatusTone(status?: string) {
  const s = safeStr(status).toLowerCase();

  if (
    s === "paid" ||
    s === "delivered" ||
    s === "active" ||
    s === "assigned" ||
    s === "picked up" ||
    s === "out for delivery" ||
    s === "approved" ||
    s === "refunded" ||
    s === "received" ||
    s === "returned to store" ||
    s === "completed" ||
    s === "replacement delivered"
  ) {
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  }

  if (
    s === "pending" ||
    s === "confirmed" ||
    s === "processing" ||
    s === "shipped" ||
    s === "transit" ||
    s === "requested" ||
    s === "pickup assigned" ||
    s === "replacement assigned" ||
    s === "pending account details" ||
    s === "ready to refund"
  ) {
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  }

  if (
    s === "failed" ||
    s === "cancelled" ||
    s === "inactive" ||
    s === "failed delivery" ||
    s === "returned" ||
    s === "rejected"
  ) {
    return "border-red-400/20 bg-red-500/15 text-red-300";
  }

  return "border-white/10 bg-white/5 text-[#a7aec4]";
}

function hasLatLng(addr: unknown) {
  const a = addr as OrderAddress | null;

  return (
    typeof a?.lat === "number" &&
    Number.isFinite(a.lat) &&
    typeof a?.lng === "number" &&
    Number.isFinite(a.lng)
  );
}

function getGoogleMapsUrl(addr: unknown) {
  const a = addr as OrderAddress | null;
  if (!hasLatLng(a)) return "";

  return `https://www.google.com/maps?q=${a?.lat},${a?.lng}`;
}

function getImageSrc(image: string | undefined | null): string {
  if (!image) return PLACEHOLDER;

  const src = image.trim();
  if (!src) return PLACEHOLDER;
  if (src.startsWith("/")) return src;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const u = new URL(src);
      const allowed = new Set([
        "res.cloudinary.com",
        "localhost",
        "lh3.googleusercontent.com",
        "t3.ftcdn.net",
        "images.unsplash.com",
      ]);

      if (!allowed.has(u.hostname)) return PLACEHOLDER;

      return src;
    } catch {
      return PLACEHOLDER;
    }
  }

  return PLACEHOLDER;
}

function getOrderFromResponse(body: any): AdminOrderDetail | null {
  return (body?.data || body?.order || body || null) as AdminOrderDetail | null;
}

function getRidersFromResponse(body: any): any[] {
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.deliveryStaff)) return body.deliveryStaff;
  if (Array.isArray(body?.data?.deliveryStaff)) return body.data.deliveryStaff;
  if (Array.isArray(body)) return body;

  return [];
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function assignmentName(a?: DeliveryAssignment | null) {
  if (!a) return "-";
  return safeStr(a.name) || "Assigned rider";
}

function assignmentStatus(a?: DeliveryAssignment | null) {
  if (!a) return "Not Assigned";
  return safeStr(a.status) || "Assigned";
}

function assignmentContact(a?: DeliveryAssignment | null) {
  if (!a) return "";
  return [safeStr(a.phone), safeStr(a.vehicleType)].filter(Boolean).join(" • ");
}

function ColorSwatch({ color }: { color: string }) {
  const ref = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.style.backgroundColor = color;
  }, [color]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="h-4 w-4 shrink-0 rounded-full border border-white/20"
    />
  );
}

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
  const [orderStatus, setOrderStatus] =
    React.useState<OrderStatus>("Pending");

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
    [],
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
          body?.profile?.permissions,
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
      normalizeOrderStatus(nextOrder?.orderStatus || nextOrder?.status),
    );
    setDeliveryManId(safeStr(nextOrder?.deliveryAssignment?.deliveryManId));
    setDeliveryNote(safeStr(nextOrder?.deliveryAssignment?.note));
    setDeliveryStatus(
      normalizeDeliveryStatus(nextOrder?.deliveryAssignment?.status),
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
    [id, showToast, syncOrderState],
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
    order?.orderStatus || order?.status,
  );
  const originalDeliveryManId = safeStr(order?.deliveryAssignment?.deliveryManId);
  const originalDeliveryNote = safeStr(order?.deliveryAssignment?.note).trim();
  const originalDeliveryStatus = normalizeDeliveryStatus(
    order?.deliveryAssignment?.status,
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
        "error",
      );
      return;
    }

    if (
      (orderStatus === "Delivered" || deliveryStatus === "Delivered") &&
      !otpVerified
    ) {
      showToast(
        "Delivered status requires delivery OTP verification. Use delivery OTP flow.",
        "error",
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
        "error",
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
      "error",
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
          <div className={`${panelClass} p-6`}>
            <div className="h-3 w-36 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-9 w-64 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-4 w-full max-w-[680px] animate-pulse rounded bg-white/5" />
          </div>
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
                orderStatus,
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
                orderStatus,
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
  const addrTitle = addr?.label ? safeStr(addr.label) : "Shipping Address";
  const addrName = safeStr(addr?.fullName);
  const addrPhone = safeStr(addr?.phone);
  const addrStreet = safeStr(addr?.street);
  const addrArea =
    safeStr(addr?.addressLine) ||
    safeStr(addr?.area) ||
    safeStr(addr?.district);
  const addrCity =
    safeStr(addr?.cityOrMunicipality) ||
    safeStr(addr?.city) ||
    safeStr(addr?.provinceId);

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

  const assignedRiderName =
    safeStr(order?.deliveryAssignment?.name) || "Not assigned";
  const assignedRiderPhone = safeStr(order?.deliveryAssignment?.phone);
  const assignedRiderVehicle = safeStr(order?.deliveryAssignment?.vehicleType);
  const assignedAt = order?.deliveryAssignment?.assignedAt
    ? formatDateTime(order?.deliveryAssignment?.assignedAt)
    : "-";

  const deliveredBlocked = !otpVerified;

  return (
    <AdminPageGuard permission="orderView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <Toast toast={toast} />

        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Orders / {order.orderCode || order.id}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                    {order.orderCode || order.id}
                  </h1>

                  <StatusPill>{paymentStatus}</StatusPill>
                  <StatusPill>{orderStatus}</StatusPill>

                  {order?.deliveryAssignment?.status ? (
                    <StatusPill>{order.deliveryAssignment.status}</StatusPill>
                  ) : null}

                  {returnStatus !== "NONE" ? (
                    <StatusPill>Return {prettyStatus(returnStatus)}</StatusPill>
                  ) : null}

                  {exchangeStatus !== "NONE" ? (
                    <StatusPill>
                      Exchange {prettyStatus(exchangeStatus)}
                    </StatusPill>
                  ) : null}

                  {refundStatus !== "NONE" ? (
                    <StatusPill>Refund {prettyStatus(refundStatus)}</StatusPill>
                  ) : null}
                </div>

                <p className="mt-2 max-w-[700px] text-[13px] leading-7 text-[#a7aec4]">
                  Placed on {placedOn}
                  {order?.paymentMethod ? (
                    <>
                      <span className="mx-2">•</span>
                      <span>{safeStr(order.paymentMethod)}</span>
                    </>
                  ) : null}
                </p>

                {!otpVerified &&
                (orderStatus === "Delivered" ||
                  deliveryStatus === "Delivered") ? (
                  <div className="mt-4 rounded-[16px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[13px] leading-6 text-amber-200">
                    Delivered status requires delivery OTP verification.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => loadOrder("refresh")}
                  disabled={refreshing}
                  className={secondaryBtnClass}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  type="button"
                  onClick={downloadInvoice}
                  disabled={downloadingInvoice}
                  className={secondaryBtnClass}
                >
                  {downloadingInvoice ? "Downloading..." : "Invoice"}
                </button>

                {customerId ? (
                  <Link
                    href={`/admin/customers/${customerId}?tab=addresses`}
                    className={secondaryBtnClass}
                  >
                    Customer Addresses
                  </Link>
                ) : null}

                <Link href="/admin/orders" className={secondaryBtnClass}>
                  Back
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Customer"
              value={order.customer?.name || "-"}
              hint={order.customer?.email || "No email"}
              iconSrc="/images/admin/customer.png"
            />

            <SummaryCard
              label="Items"
              value={String(items.length)}
              hint="Products / variants in this order"
              iconSrc="/images/admin/product.png"
            />

            <SummaryCard
              label="Total"
              value={formatNPR(totalPaisa)}
              hint="Final charged amount"
              iconSrc="/images/admin/revenue.png"
            />

            <SummaryCard
              label="Order Date"
              value={formatDate(order.createdAt)}
              hint={formatDateTime(order.createdAt)}
              iconSrc="/images/admin/calendar.png"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
            <div className="space-y-6">
              {canViewReturnsRefunds ? (
                <section className={`${panelClass} p-5 sm:p-6`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                        After Sales
                      </div>

                      <h2 className="mt-1 text-[20px] font-semibold text-white">
                        Returns, Refunds, Exchange & Cancellation
                      </h2>

                      <p className="mt-1 text-[13px] text-[#a7aec4]">
                        Manage cancellation, return pickup, refund details,
                        exchange pickup, and replacement delivery.
                      </p>
                    </div>

                    <Link
                      href="/admin/returns-refunds"
                      className={secondaryBtnClass}
                    >
                      View All
                    </Link>
                  </div>

                  <div className="mt-6 space-y-4">
                    {cancelStatus !== "NONE" ? (
                      <RequestCard
                        title="Cancellation Request"
                        status={cancelStatus}
                        reason={order.cancelRequest?.reason}
                        requestedAt={order.cancelRequest?.requestedAt}
                        resolvedAt={order.cancelRequest?.resolvedAt}
                        adminNote={order.cancelRequest?.adminNote}
                        tone={
                          cancelStatus === "REQUESTED"
                            ? "amber"
                            : cancelStatus === "APPROVED"
                              ? "green"
                              : "red"
                        }
                        actions={
                          cancelStatus === "REQUESTED" ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openRequestAction("approveCancel")
                                }
                                disabled={requestActionLoading}
                                className={primaryBtnClass}
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openRequestAction("rejectCancel")
                                }
                                disabled={requestActionLoading}
                                className={dangerBtnClass}
                              >
                                Reject
                              </button>
                            </>
                          ) : null
                        }
                      />
                    ) : null}

                    {returnStatus !== "NONE" ? (
                      <RequestCard
                        title={
                          isExchangeRequest
                            ? "Exchange Request"
                            : "Return Request"
                        }
                        status={returnStatus}
                        reason={order.returnRequest?.reason}
                        requestedAt={order.returnRequest?.requestedAt}
                        resolvedAt={
                          order.returnRequest?.resolvedAt ||
                          order.returnRequest?.receivedAt
                        }
                        adminNote={order.returnRequest?.adminNote}
                        tone={
                          returnStatus === "REQUESTED"
                            ? "blue"
                            : returnStatus === "REJECTED"
                              ? "red"
                              : "green"
                        }
                        extra={
                          <>
                            <LineItem
                              label="Issue Type"
                              value={prettyRequestType(order.returnRequest?.type)}
                            />
                            <LineItem
                              label="Preferred Resolution"
                              value={
                                order.returnRequest?.preferredResolution || "-"
                              }
                            />

                            {Array.isArray(order.returnRequest?.images) &&
                            order.returnRequest.images.length ? (
                              <div className="mt-3">
                                <div className="mb-2 text-[12px] text-[#a7aec4]">
                                  Evidence Images
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {order.returnRequest.images.map(
                                    (img, index) => (
                                      <a
                                       key={`${img}-${index}`}
                                      href={img}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`Open evidence image ${index + 1}`}
                                      title={`Open evidence image ${index + 1}`}
                                      className="relative h-16 w-16 overflow-hidden rounded-[14px] border border-white/10 bg-white/5"
                                      >
                                     <Image
                                      src={getImageSrc(img)}
                                      alt={`Evidence image ${index + 1}`}
                                      fill
                                      sizes="64px"
                                      className="object-cover"
                                      />
                                     </a>
                                    ),
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </>
                        }
                        actions={
                          returnStatus === "REQUESTED" ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openRequestAction("approveReturn")
                                }
                                disabled={requestActionLoading}
                                className={primaryBtnClass}
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openRequestAction("rejectReturn")
                                }
                                disabled={requestActionLoading}
                                className={dangerBtnClass}
                              >
                                Reject
                              </button>
                            </>
                          ) : returnStatus === "APPROVED" &&
                            !isExchangeRequest ? (
                            <button
                              type="button"
                              onClick={() =>
                                openRequestAction("assignReturnPickup")
                              }
                              disabled={requestActionLoading}
                              className={primaryBtnClass}
                            >
                              Assign Return Pickup
                            </button>
                          ) : returnStatus === "APPROVED" &&
                            isExchangeRequest ? (
                            <button
                              type="button"
                              onClick={() =>
                                openRequestAction("assignExchangePickup")
                              }
                              disabled={requestActionLoading}
                              className={primaryBtnClass}
                            >
                              Assign Exchange Pickup
                            </button>
                          ) : ["PICKED_UP", "RECEIVED"].includes(
                              returnStatus,
                            ) ? (
                            <button
                              type="button"
                              onClick={() => openRequestAction("markReceived")}
                              disabled={requestActionLoading}
                              className={primaryBtnClass}
                            >
                              Mark Product Received
                            </button>
                          ) : null
                        }
                      />
                    ) : null}

                    {order.returnPickupAssignment ? (
                      <AssignmentCard
                        title="Return Pickup Assignment"
                        assignment={order.returnPickupAssignment}
                      />
                    ) : null}

                    {order.exchangePickupAssignment ? (
                      <AssignmentCard
                        title="Exchange Pickup Assignment"
                        assignment={order.exchangePickupAssignment}
                      />
                    ) : null}

                    {exchangeStatus !== "NONE" ? (
                      <RequestCard
                        title="Exchange Flow"
                        status={exchangeStatus}
                        reason={order.exchange?.reason || order.returnRequest?.reason}
                        requestedAt={
                          order.exchange?.requestedAt ||
                          order.returnRequest?.requestedAt
                        }
                        resolvedAt={
                          order.exchange?.completedAt ||
                          order.exchange?.replacementDeliveredAt
                        }
                        adminNote={order.exchange?.adminNote}
                        tone={
                          exchangeStatus === "REJECTED"
                            ? "red"
                            : exchangeStatus === "COMPLETED"
                              ? "green"
                              : "blue"
                        }
                        extra={
                          <>
                            <LineItem
                              label="Pickup Assigned"
                              value={formatDateTime(
                                order.exchange?.pickupAssignedAt,
                              )}
                            />
                            <LineItem
                              label="Old Product Picked"
                              value={formatDateTime(order.exchange?.pickedUpAt)}
                            />
                            <LineItem
                              label="Received at Store"
                              value={formatDateTime(order.exchange?.receivedAt)}
                            />
                            <LineItem
                              label="Replacement Assigned"
                              value={formatDateTime(
                                order.exchange?.replacementAssignedAt,
                              )}
                            />
                            <LineItem
                              label="Replacement Delivered"
                              value={formatDateTime(
                                order.exchange?.replacementDeliveredAt,
                              )}
                            />
                          </>
                        }
                        actions={
                          exchangeStatus === "RECEIVED" ? (
                            <button
                              type="button"
                              onClick={() =>
                                openRequestAction("assignReplacement")
                              }
                              disabled={requestActionLoading}
                              className={primaryBtnClass}
                            >
                              Assign Replacement Rider
                            </button>
                          ) : exchangeStatus === "REPLACEMENT_DELIVERED" ? (
                            <button
                              type="button"
                              onClick={() =>
                                openRequestAction("completeExchange")
                              }
                              disabled={requestActionLoading}
                              className={primaryBtnClass}
                            >
                              Complete Exchange
                            </button>
                          ) : null
                        }
                      />
                    ) : null}

                    {order.replacementDeliveryAssignment ? (
                      <AssignmentCard
                        title="Replacement Delivery Assignment"
                        assignment={order.replacementDeliveryAssignment}
                      />
                    ) : null}

                    {refundStatus !== "NONE" ? (
                      <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-[14px] font-semibold text-emerald-100">
                            Refund Status
                          </div>

                          <StatusPill>{prettyStatus(refundStatus)}</StatusPill>
                        </div>

                        <div className="mt-4 space-y-2 text-[13px] leading-6 text-emerald-100/80">
                          <LineItem
                            label="Amount"
                            value={formatNPR(
                              Number(order.refund?.amountPaisa || totalPaisa),
                            )}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Method"
                            value={order.refund?.method || order.paymentMethod || "-"}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Account Name"
                            value={order.refund?.accountName || "-"}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Account Number"
                            value={order.refund?.accountNumber || "-"}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Bank"
                            value={order.refund?.bankName || "-"}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Wallet Number"
                            value={order.refund?.walletNumber || "-"}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Wallet ID"
                            value={order.refund?.walletId || "-"}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Details Requested"
                            value={formatDateTime(
                              order.refund?.requestedDetailsAt,
                            )}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Details Submitted"
                            value={formatDateTime(
                              order.refund?.detailsSubmittedAt,
                            )}
                            valueClassName="text-emerald-100"
                          />

                          <LineItem
                            label="Refunded At"
                            value={formatDateTime(order.refund?.refundedAt)}
                            valueClassName="text-emerald-100"
                          />

                          {order.refund?.transactionRef ? (
                            <LineItem
                              label="Transaction Ref"
                              value={order.refund.transactionRef}
                              valueClassName="text-emerald-100"
                            />
                          ) : null}

                          {order.refund?.customerNote ? (
                            <LineItem
                              label="Customer Note"
                              value={order.refund.customerNote}
                              valueClassName="text-emerald-100"
                            />
                          ) : null}

                          {order.refund?.adminNote ? (
                            <LineItem
                              label="Admin Note"
                              value={order.refund.adminNote}
                              valueClassName="text-emerald-100"
                            />
                          ) : null}
                        </div>

                        {refundStatus !== "REFUNDED" ? (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {refundStatus === "PENDING_ACCOUNT_DETAILS" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openRequestAction("requestRefundDetails")
                                }
                                disabled={requestActionLoading}
                                className={secondaryBtnClass}
                              >
                                Request Details
                              </button>
                            ) : null}

                            {[
                              "PENDING",
                              "PENDING_ACCOUNT_DETAILS",
                              "READY_TO_REFUND",
                            ].includes(refundStatus) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openRequestAction("markRefundProcessing")
                                }
                                disabled={requestActionLoading}
                                className={secondaryBtnClass}
                              >
                                Mark Processing
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => openRequestAction("markRefunded")}
                              disabled={requestActionLoading}
                              className={primaryBtnClass}
                            >
                              Mark Refunded
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {!hasAfterSalesData ? (
                      <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4 text-[13px] text-[#a7aec4]">
                        No cancellation, return, exchange, or refund request
                        found for this order.
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className={`${panelClass} overflow-hidden`}>
                <SectionHeader
                  eyebrow="Order Items"
                  title="Ordered Products"
                  description="Product variant, SKU, quantity, color, size, and pricing"
                />

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-[13px]">
                    <thead>
                      <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                        <th className="px-5 py-4 font-medium">Product</th>
                        <th className="px-5 py-4 font-medium">Variant / SKU</th>
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
                        items.map((it: OrderItem, i: number) => {
                          const productId = safeStr(it?.productId);
                          const variantId = safeStr(it?.variantId);
                          const sku = safeStr(it?.sku);
                          const colorValue = safeStr(it?.color);
                          const colorLabel = safeStr(it?.colorLabel);
                          const qty = Number(it?.qty || 0);
                          const pricePaisa = Number(it?.pricePaisa || 0);
                          const lineTotalPaisa = qty * pricePaisa;

                          return (
                            <tr
                              key={`${productId}-${variantId || i}`}
                              className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative h-14 w-14 overflow-hidden rounded-[18px] border border-white/10 bg-[#0d0f17]">
                                    <Image
                                      src={getImageSrc(it?.image)}
                                      alt={it?.name || "Product"}
                                      fill
                                      sizes="56px"
                                      className="object-cover"
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="line-clamp-1 font-semibold text-white">
                                      {it?.name || "-"}
                                    </div>

                                    {productId ? (
                                      <div className="mt-1 max-w-[260px] truncate text-[11px] text-[#7f879f]">
                                        Product ID: {productId}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  {sku ? (
                                    <div className="inline-flex max-w-[260px] rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff]">
                                      <span className="truncate">SKU: {sku}</span>
                                    </div>
                                  ) : (
                                    <div className="text-[12px] text-[#7f879f]">
                                      No SKU
                                    </div>
                                  )}

                                  {variantId ? (
                                    <div className="max-w-[260px] truncate text-[11px] text-[#7f879f]">
                                      Variant ID: {variantId}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-[#7f879f]">
                                      Legacy stock item
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                {safeStr(it?.size) ? (
                                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white">
                                    {safeStr(it.size)}
                                  </span>
                                ) : (
                                  <span className="text-[#a7aec4]">-</span>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                {colorValue || colorLabel ? (
                                  <div className="flex items-center gap-2">
                                    {colorValue ? (
                                      <ColorSwatch color={colorValue} />
                                    ) : null}

                                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
                                      {colorLabel || colorValue}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[#a7aec4]">-</span>
                                )}
                              </td>

                              <td className="px-5 py-4 text-center text-[#a7aec4]">
                                {qty || "-"}
                              </td>

                              <td className="px-5 py-4 text-right text-[#a7aec4]">
                                {formatNPR(pricePaisa)}
                              </td>

                              <td className="px-5 py-4 text-right font-semibold text-[#d6c7ff]">
                                {formatNPR(lineTotalPaisa)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="border-t border-[#26293a]">
                          <td
                            colSpan={7}
                            className="px-5 py-10 text-center text-[#a7aec4]"
                          >
                            No items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={`${panelClass} p-5 sm:p-6`}>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    Lifecycle
                  </div>

                  <h2 className="mt-1 text-[20px] font-semibold text-white">
                    Order Timeline
                  </h2>

                  <p className="mt-1 text-[13px] text-[#a7aec4]">
                    Current lifecycle status of this order
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  {timeline.map((t, index) => (
                    <div key={t.label} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <TimelineDot status={t.status} />

                        {index !== timeline.length - 1 ? (
                          <div className="mt-2 h-10 w-px bg-[#26293a]" />
                        ) : null}
                      </div>

                      <div className="pt-1">
                        <div className="text-[14px] font-semibold text-white">
                          {t.label}
                        </div>

                        <div className="mt-1 text-[12px] text-[#a7aec4]">
                          {t.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <InfoPanel title="Customer Details" eyebrow="Customer">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-white/10 bg-white/5 text-[15px] font-bold text-white">
                    {getInitials(order.customer?.name)}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-white">
                      {order.customer?.name || "-"}
                    </div>

                    <div className="mt-1 break-all text-[13px] text-[#a7aec4]">
                      {order.customer?.email || "-"}
                    </div>

                    {order.customer?.phone ? (
                      <div className="mt-1 text-[13px] text-[#a7aec4]">
                        {order.customer.phone}
                      </div>
                    ) : null}
                  </div>
                </div>
              </InfoPanel>

              <InfoPanel title={addrTitle} eyebrow="Delivery Address">
                {!addr ? (
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-[13px] text-[#a7aec4]">
                    {order.shippingAddress || "No shipping address found."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="font-semibold text-white">
                        {addrName || "-"}
                      </div>

                      {addrPhone ? (
                        <div className="mt-1 text-[13px] text-[#a7aec4]">
                          {addrPhone}
                        </div>
                      ) : null}

                      <div className="mt-4 space-y-3">
                        <LineItem label="Street" value={addrStreet || "-"} />
                        <LineItem label="Area" value={addrArea || "-"} />
                        <LineItem label="City" value={addrCity || "-"} />
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                        Map Location
                      </div>

                      <div
                        className={`mt-2 text-[13px] ${
                          hasLatLng(addr) ? "text-white" : "text-[#7f879f]"
                        }`}
                      >
                        {hasLatLng(addr)
                          ? `${Number(addr.lat).toFixed(6)}, ${Number(
                              addr.lng,
                            ).toFixed(6)}`
                          : "No map location saved in this order"}
                      </div>

                      {hasLatLng(addr) ? (
                        <a
                          href={getGoogleMapsUrl(addr)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${secondaryBtnClass} mt-4 inline-flex`}
                        >
                          View Map
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}
              </InfoPanel>

              <InfoPanel title="Normal Delivery Assignment" eyebrow="Rider">
                <div className="space-y-5">
                  <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[13px] font-semibold text-white">
                      Current Rider
                    </div>

                    <div className="mt-2 text-[13px] text-[#a7aec4]">
                      {assignedRiderName}
                    </div>

                    <div className="mt-1 text-[13px] text-[#7f879f]">
                      {assignedRiderPhone || "-"}
                    </div>

                    <div className="mt-1 text-[12px] text-[#7f879f]">
                      {assignedRiderVehicle || "-"}
                    </div>

                    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                      <LineItem label="Assigned At" value={assignedAt} />

                      <LineItem
                        label="Delivery Status"
                        value={
                          order?.deliveryAssignment?.status ? (
                            <StatusPill>
                              {order.deliveryAssignment.status}
                            </StatusPill>
                          ) : (
                            "-"
                          )
                        }
                      />

                      <LineItem
                        label="OTP Verified"
                        value={otpVerified ? "Yes" : "No"}
                        valueClassName={
                          otpVerified ? "text-emerald-300" : "text-[#a7aec4]"
                        }
                      />
                    </div>
                  </div>

                  <Field label="Delivery Rider" htmlFor="delivery-rider">
                    <select
                      id="delivery-rider"
                      name="deliveryRider"
                      title="Delivery rider"
                      aria-label="Delivery rider"
                      value={deliveryManId}
                      onChange={(e) => setDeliveryManId(e.target.value)}
                      disabled={!canUpdate || ridersLoading}
                      className={inputClass}
                    >
                      <option value="" className="bg-[#11121a]">
                        {ridersLoading
                          ? "Loading riders..."
                          : "Select delivery rider"}
                      </option>

                      {riders.map((rider) => (
                        <option
                          key={rider.id}
                          value={rider.id}
                          className="bg-[#11121a]"
                        >
                          {rider.name || "Unnamed"}{" "}
                          {rider.area ? `- ${rider.area}` : ""}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Delivery Status" htmlFor="delivery-status">
                    <select
                      id="delivery-status"
                      name="deliveryStatus"
                      title="Delivery status"
                      aria-label="Delivery status"
                      value={deliveryStatus}
                      onChange={(e) =>
                        setDeliveryStatus(
                          e.target.value as DeliveryAssignmentStatus,
                        )
                      }
                      disabled={!canUpdate}
                      className={inputClass}
                    >
                      <option value="Assigned" className="bg-[#11121a]">
                        Assigned
                      </option>
                      <option value="Picked Up" className="bg-[#11121a]">
                        Picked Up
                      </option>
                      <option value="Out for Delivery" className="bg-[#11121a]">
                        Out for Delivery
                      </option>
                      <option
                        value="Delivered"
                        className="bg-[#11121a]"
                        disabled={deliveredBlocked}
                      >
                        Delivered {deliveredBlocked ? "(OTP required)" : ""}
                      </option>
                      <option value="Failed Delivery" className="bg-[#11121a]">
                        Failed Delivery
                      </option>
                      <option value="Returned" className="bg-[#11121a]">
                        Returned
                      </option>
                    </select>
                  </Field>

                  <Field label="Delivery Note" htmlFor="delivery-note">
                    <textarea
                      id="delivery-note"
                      name="deliveryNote"
                      title="Delivery note"
                      aria-label="Delivery note"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      disabled={!canUpdate}
                      rows={4}
                      placeholder="Call customer before arrival, gate instructions, landmark, etc."
                      className={`${inputClass} min-h-[110px] resize-none py-3`}
                    />
                  </Field>
                </div>
              </InfoPanel>

              <InfoPanel title="Payment & Totals" eyebrow="Billing">
                <div className="space-y-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
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

                  <div className="border-t border-white/10 pt-3">
                    <LineItem
                      label="Total"
                      value={formatNPR(totalPaisa)}
                      valueClassName="text-[16px] font-bold text-white"
                    />
                  </div>
                </div>
              </InfoPanel>

              <InfoPanel title="Update Order" eyebrow="Management">
                <div className="mb-5 flex justify-end">
                  {canUpdate ? (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                      Editable
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
                      Read only
                    </span>
                  )}
                </div>

                <div className="space-y-5">
                  <Field label="Payment Status" htmlFor="order-payment-status">
                    <select
                      id="order-payment-status"
                      name="orderPaymentStatus"
                      title="Payment status"
                      aria-label="Payment status"
                      value={paymentStatus}
                      onChange={(e) =>
                        setPaymentStatus(e.target.value as PaymentStatus)
                      }
                      disabled={!canUpdate}
                      className={inputClass}
                    >
                      <option value="Paid" className="bg-[#11121a]">
                        Paid
                      </option>
                      <option value="Pending" className="bg-[#11121a]">
                        Pending
                      </option>
                      <option value="Failed" className="bg-[#11121a]">
                        Failed
                      </option>
                    </select>
                  </Field>

                  <Field label="Order Status" htmlFor="order-status">
                    <select
                      id="order-status"
                      name="orderStatus"
                      title="Order status"
                      aria-label="Order status"
                      value={orderStatus}
                      onChange={(e) =>
                        setOrderStatus(e.target.value as OrderStatus)
                      }
                      disabled={!canUpdate}
                      className={inputClass}
                    >
                      <option value="Pending" className="bg-[#11121a]">
                        Pending
                      </option>
                      <option value="Confirmed" className="bg-[#11121a]">
                        Confirmed
                      </option>
                      <option value="Processing" className="bg-[#11121a]">
                        Processing
                      </option>
                      <option value="Shipped" className="bg-[#11121a]">
                        Shipped
                      </option>
                      <option value="Transit" className="bg-[#11121a]">
                        Transit
                      </option>
                      <option
                        value="Delivered"
                        className="bg-[#11121a]"
                        disabled={deliveredBlocked}
                      >
                        Delivered {deliveredBlocked ? "(OTP required)" : ""}
                      </option>
                      <option value="Cancelled" className="bg-[#11121a]">
                        Cancelled
                      </option>
                      <option value="Returned" className="bg-[#11121a]">
                        Returned
                      </option>
                      <option value="Refunded" className="bg-[#11121a]">
                        Refunded
                      </option>
                    </select>
                  </Field>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                    <Link href="/admin/orders" className={secondaryBtnClass}>
                      Back
                    </Link>

                    {canUpdate ? (
                      <button
                        type="button"
                        onClick={saveChanges}
                        disabled={saving || !hasChanges}
                        className={primaryBtnClass}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    ) : (
                      <div className="text-[13px] text-[#a7aec4]">
                        Update permission required
                      </div>
                    )}
                  </div>

                  {deliveryChanged && !deliveryManId ? (
                    <div className="rounded-[16px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[13px] leading-6 text-amber-200">
                      Select a delivery rider before saving delivery assignment
                      changes.
                    </div>
                  ) : null}

                  {!hasChanges ? (
                    <div className="text-[12px] text-[#7f879f]">
                      No unsaved changes.
                    </div>
                  ) : null}
                </div>
              </InfoPanel>
            </div>
          </div>
        </div>

        {activeRequestAction ? (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            <button
              type="button"
              onClick={closeRequestActionModal}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              aria-label="Close modal"
            />

            <div
              className={`${panelClass} relative max-h-[90vh] w-full max-w-[580px] overflow-y-auto p-6`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8d96b3]">
                Confirm Action
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-white">
                {actionTitle}
              </h2>

              <div className="mt-4 rounded-[18px] border border-[#26293a] bg-[#161824] p-4 text-sm text-[#a7aec4]">
                <p>
                  Order:{" "}
                  <span className="font-semibold text-white">
                    {order.orderCode || order.id}
                  </span>
                </p>

                <p className="mt-1">
                  Customer:{" "}
                  <span className="font-semibold text-white">
                    {order.customer?.name || "-"}
                  </span>
                </p>

                {activeRequestAction === "markRefunded" ? (
                  <p className="mt-1">
                    Refund Amount:{" "}
                    <span className="font-semibold text-white">
                      {formatNPR(Number(order.refund?.amountPaisa || totalPaisa))}
                    </span>
                  </p>
                ) : null}
              </div>

              {riderRequired ? (
                <div className="mt-5">
                  <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4]">
                    Delivery Rider
                  </label>

                  <select
                    id="request-action-delivery-rider"
                    name="requestActionDeliveryRider"
                    title="Select delivery rider"
                    aria-label="Select delivery rider"
                    value={selectedRiderId}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    disabled={ridersLoading}
                    className={inputClass}
                  >
                    <option value="" className="bg-[#11121a]">
                      {ridersLoading ? "Loading riders..." : "Select rider"}
                    </option>

                    {riders.map((rider) => (
                      <option
                        key={rider.id}
                        value={rider.id}
                        className="bg-[#11121a]"
                      >
                        {rider.name || "Unnamed"}
                        {rider.phone ? ` • ${rider.phone}` : ""}
                        {rider.vehicleType ? ` • ${rider.vehicleType}` : ""}
                      </option>
                    ))}
                  </select>

                  {riders.length === 0 ? (
                    <div className="mt-2 text-[12px] text-amber-200">
                      No active rider found. Please activate delivery staff first.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeRequestAction === "markRefunded" ? (
                <input
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  maxLength={120}
                  placeholder="Transaction reference e.g. KHALTI-REF-12345"
                  className="mt-5 h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                />
              ) : null}

              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder={
                  riderRequired
                    ? "Write pickup/delivery note for rider..."
                    : "Write optional admin note..."
                }
                className="mt-5 w-full resize-none rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
              />

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={requestActionLoading}
                  onClick={closeRequestActionModal}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={requestActionLoading}
                  onClick={submitRequestAction}
                  className={
                    activeRequestAction === "rejectCancel" ||
                    activeRequestAction === "rejectReturn"
                      ? dangerBtnClass
                      : primaryBtnClass
                  }
                >
                  {requestActionLoading ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminPageGuard>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div
      className={[
        "fixed right-5 top-5 z-[1200] max-w-[380px] rounded-[18px] border px-5 py-4 text-[13px] font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur",
        toast.type === "success"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
          : toast.type === "info"
            ? "border-blue-400/20 bg-blue-500/15 text-blue-200"
            : "border-red-400/20 bg-red-500/15 text-red-200",
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getStatusTone(String(children));

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function TimelineDot({ status }: { status: TimelineStep["status"] }) {
  const base =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[13px] font-bold shadow-sm";

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
        className={`${base} border-[#d6c7ff]/30 bg-[#d6c7ff]/15 text-[#d6c7ff]`}
      >
        •
      </div>
    );
  }

  return (
    <div className={`${base} border-white/10 bg-white/5 text-[#7f879f]`}>
      •
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 line-clamp-1 text-[20px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>

          {hint ? (
            <div className="mt-2 line-clamp-1 text-[12px] text-[#7f879f]">
              {hint}
            </div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
      <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
        {eyebrow}
      </div>

      <h2 className="mt-1 text-[20px] font-semibold text-white">{title}</h2>

      {description ? (
        <p className="mt-1 text-[13px] text-[#a7aec4]">{description}</p>
      ) : null}
    </div>
  );
}

function InfoPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          {eyebrow}
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4]"
      >
        {label}
      </label>

      {children}
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
      <span className="text-[13px] text-[#a7aec4]">{label}</span>

      <span className={`text-right text-[13px] ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

function AssignmentCard({
  title,
  assignment,
}: {
  title: string;
  assignment?: DeliveryAssignment | null;
}) {
  if (!assignment) return null;

  return (
    <div className="rounded-[20px] border border-purple-400/20 bg-purple-500/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-purple-100">{title}</div>
        <StatusPill>{assignmentStatus(assignment)}</StatusPill>
      </div>

      <div className="mt-4 space-y-2">
        <LineItem
          label="Rider"
          value={assignmentName(assignment)}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Contact"
          value={assignmentContact(assignment) || "-"}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Assigned At"
          value={formatDateTime(assignment.assignedAt)}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Picked Up At"
          value={formatDateTime(assignment.pickedUpAt)}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Returned To Store"
          value={formatDateTime(assignment.returnedToStoreAt)}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Delivered At"
          value={formatDateTime(assignment.deliveredAt)}
          valueClassName="text-purple-100"
        />
        {assignment.note ? (
          <LineItem
            label="Note"
            value={assignment.note}
            valueClassName="text-purple-100"
          />
        ) : null}
      </div>
    </div>
  );
}

function RequestCard({
  title,
  status,
  reason,
  requestedAt,
  resolvedAt,
  adminNote,
  actions,
  extra,
  tone = "neutral",
}: {
  title: string;
  status: string;
  reason?: string;
  requestedAt?: string | null;
  resolvedAt?: string | null;
  adminNote?: string;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
  tone?: "neutral" | "amber" | "blue" | "green" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-400/20 bg-amber-500/10"
      : tone === "blue"
        ? "border-blue-400/20 bg-blue-500/10"
        : tone === "green"
          ? "border-emerald-400/20 bg-emerald-500/10"
          : tone === "red"
            ? "border-red-400/20 bg-red-500/10"
            : "border-[#26293a] bg-[#161824]";

  return (
    <div className={`rounded-[20px] border p-4 ${toneClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-white">{title}</div>

        <StatusPill>{prettyStatus(status)}</StatusPill>
      </div>

      <div className="mt-4 space-y-2 text-[13px] leading-6 text-[#a7aec4]">
        <LineItem label="Reason" value={reason || "—"} />
        <LineItem label="Requested At" value={formatDateTime(requestedAt)} />

        {resolvedAt ? (
          <LineItem label="Resolved At" value={formatDateTime(resolvedAt)} />
        ) : null}

        {adminNote ? <LineItem label="Admin Note" value={adminNote} /> : null}

        {extra}
      </div>

      {actions ? <div className="mt-4 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}