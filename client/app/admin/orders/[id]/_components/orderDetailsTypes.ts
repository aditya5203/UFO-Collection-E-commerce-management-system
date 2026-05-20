import { API_BASE_URL } from "@/lib/api";
export const API_BASE =
  API_BASE_URL;

export const PLACEHOLDER = "/images/products/placeholder.png";

export const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerBtnClass =
  "rounded-full border border-red-400/30 bg-red-500/15 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-100 transition hover:-translate-y-0.5 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60";

export const inputClass =
  "h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

export type PaymentStatus = "Paid" | "Pending" | "Failed";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Transit"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type DeliveryAssignmentStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned"
  | "Returned to Store";

export type RequestStatus = "NONE" | "REQUESTED" | "APPROVED" | "REJECTED";

export type ReturnStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP";

export type RefundStatus =
  | "NONE"
  | "PENDING"
  | "PENDING_ACCOUNT_DETAILS"
  | "READY_TO_REFUND"
  | "PROCESSING"
  | "REFUNDED"
  | "FAILED";

export type ExchangeStatus =
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

export type ReturnRequestType =
  | "RETURN_REFUND"
  | "EXCHANGE"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "SIZE_COLOR_ISSUE"
  | "NOT_SATISFIED"
  | "OTHER";

export type PreferredResolution = "REFUND" | "EXCHANGE" | "";

export type ToastType = "success" | "error" | "info";

export type ToastState = {
  type: ToastType;
  message: string;
} | null;

export type TimelineStep = {
  label: string;
  date: string;
  status: "done" | "current" | "upcoming";
};

export type RiderRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  area?: string;
  isActive?: boolean;
};

export type OrderItem = {
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

export type OrderAddress = {
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

export type DeliveryAssignment = {
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

export type AdminOrderDetail = {
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

export type AfterSalesAction =
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

export function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;

  return `Rs. ${(safe / 100).toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(d: unknown) {
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

export function formatDateTime(d: unknown) {
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

export function safeStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export function getInitials(name?: string) {
  const safe = safeStr(name).trim();
  if (!safe) return "CU";

  const parts = safe.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return initials || "CU";
}

export function normalizePaymentStatus(value?: string): PaymentStatus {
  const v = safeStr(value).toLowerCase();

  if (v === "paid" || v === "success" || v === "successful") return "Paid";
  if (v === "failed") return "Failed";

  return "Pending";
}

export function normalizeOrderStatus(value?: string): OrderStatus {
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

export function normalizeDeliveryStatus(
  value?: string
): DeliveryAssignmentStatus {
  const v = safeStr(value).toLowerCase();

  if (v === "picked up") return "Picked Up";
  if (v === "out for delivery") return "Out for Delivery";
  if (v === "delivered") return "Delivered";
  if (v === "failed delivery") return "Failed Delivery";
  if (v === "returned") return "Returned";
  if (v === "returned to store") return "Returned to Store";

  return "Assigned";
}

export function normalizeRequestStatus(value?: string): RequestStatus {
  const v = safeStr(value).toUpperCase();

  if (v === "REQUESTED") return "REQUESTED";
  if (v === "APPROVED") return "APPROVED";
  if (v === "REJECTED") return "REJECTED";

  return "NONE";
}

export function normalizeReturnStatus(value?: string): ReturnStatus {
  const v = safeStr(value).toUpperCase();

  if (v === "REQUESTED") return "REQUESTED";
  if (v === "APPROVED") return "APPROVED";
  if (v === "REJECTED") return "REJECTED";
  if (v === "RECEIVED") return "RECEIVED";
  if (v === "PICKUP_ASSIGNED") return "PICKUP_ASSIGNED";
  if (v === "PICKED_UP") return "PICKED_UP";

  return "NONE";
}

export function normalizeRefundStatus(value?: string): RefundStatus {
  const v = safeStr(value).toUpperCase();

  if (v === "PENDING") return "PENDING";
  if (v === "PENDING_ACCOUNT_DETAILS") return "PENDING_ACCOUNT_DETAILS";
  if (v === "READY_TO_REFUND") return "READY_TO_REFUND";
  if (v === "PROCESSING") return "PROCESSING";
  if (v === "REFUNDED") return "REFUNDED";
  if (v === "FAILED") return "FAILED";

  return "NONE";
}

export function normalizeExchangeStatus(value?: string): ExchangeStatus {
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

export function prettyStatus(value?: string) {
  return safeStr(value || "NONE").replaceAll("_", " ");
}

export function prettyRequestType(value?: string) {
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

export function getStatusTone(status?: string) {
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

export function hasLatLng(addr: unknown) {
  const a = addr as OrderAddress | null;

  return (
    typeof a?.lat === "number" &&
    Number.isFinite(a.lat) &&
    typeof a?.lng === "number" &&
    Number.isFinite(a.lng)
  );
}

export function getGoogleMapsUrl(addr: unknown) {
  const a = addr as OrderAddress | null;
  if (!hasLatLng(a)) return "";

  return `https://www.google.com/maps?q=${a?.lat},${a?.lng}`;
}

export function getImageSrc(image: string | undefined | null): string {
  if (!image) return PLACEHOLDER;

  const src = image.trim();
  if (!src) return PLACEHOLDER;
  if (src.startsWith("/")) return src;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const u = new URL(src);
      const allowed = new Set([
        "res.cloudinary.com",
        "lh3.googleusercontent.com",
        "t3.ftcdn.net",
        "images.unsplash.com",
      ]);

      const isApiUploadHost =
        u.pathname.startsWith("/uploads/") &&
        API_BASE &&
        (() => {
          try {
            return u.host === new URL(API_BASE).host;
          } catch {
            return false;
          }
        })();

      if (!allowed.has(u.hostname) && !isApiUploadHost) return PLACEHOLDER;

      return src;
    } catch {
      return PLACEHOLDER;
    }
  }

  return PLACEHOLDER;
}

export function getOrderFromResponse(body: any): AdminOrderDetail | null {
  return (body?.data || body?.order || body || null) as AdminOrderDetail | null;
}

export function getRidersFromResponse(body: any): any[] {
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.deliveryStaff)) return body.deliveryStaff;
  if (Array.isArray(body?.data?.deliveryStaff)) return body.data.deliveryStaff;
  if (Array.isArray(body)) return body;

  return [];
}

export async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function assignmentName(a?: DeliveryAssignment | null) {
  if (!a) return "-";
  return safeStr(a.name) || "Assigned rider";
}

export function assignmentStatus(a?: DeliveryAssignment | null) {
  if (!a) return "Not Assigned";
  return safeStr(a.status) || "Assigned";
}

export function assignmentContact(a?: DeliveryAssignment | null) {
  if (!a) return "";
  return [safeStr(a.phone), safeStr(a.vehicleType)].filter(Boolean).join(" • ");
}
