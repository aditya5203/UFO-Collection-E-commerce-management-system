import type { Socket } from "socket.io-client";

export type PaymentStatus = "Paid" | "Pending" | "Failed";

export type OrderStatus =
  | "Delivered"
  | "Transit"
  | "Shipped"
  | "Confirmed"
  | "Processing"
  | "Pending"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type PaymentMethod =
  | "eSewa"
  | "Khalti"
  | "CashOnDelivery"
  | "Card"
  | "BankTransfer"
  | "Other";

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

export type DeliveryAssignment = {
  taskType?: string;
  deliveryManId?: string;
  name?: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  status?: string;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  returnedToStoreAt?: string | null;
};

export type OrderItem = {
  productId?: string;
  variantId?: string;
  name?: string;
  size?: string;
  color?: string;
  colorLabel?: string;
  sku?: string;
  image?: string;
  qty?: number;
  pricePaisa?: number;
};

export type OrderRow = {
  id: string;
  orderCode?: string;
  totalPaisa: number;
  totalRs?: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: PaymentMethod | string;
  payment?: {
    method?: PaymentMethod | string;
    provider?: string;
    gateway?: string;
  };
  paymentProvider?: string;

  deliveryAssignment?: DeliveryAssignment | null;
  returnPickupAssignment?: DeliveryAssignment | null;
  exchangePickupAssignment?: DeliveryAssignment | null;
  replacementDeliveryAssignment?: DeliveryAssignment | null;

  cancelRequest?: {
    status?: RequestStatus | string;
    reason?: string;
    requestedAt?: string | null;
    resolvedAt?: string | null;
    adminNote?: string;
  };
  returnRequest?: {
    status?: ReturnStatus | string;
    type?: string;
    preferredResolution?: string;
    reason?: string;
    requestedAt?: string | null;
    receivedAt?: string | null;
    adminNote?: string;
  };
  refund?: {
    status?: RefundStatus | string;
    amountPaisa?: number;
    method?: string;
    refundedAt?: string | null;
  };
  exchange?: {
    status?: ExchangeStatus | string;
    requestedAt?: string | null;
    completedAt?: string | null;
  };

  items: OrderItem[];
};

export type ApiOrder = {
  _id?: string;
  id?: string;
  orderCode?: string;
  totalPaisa?: number | string;
  totalRs?: number | string;
  total?: number | string;
  paymentStatus?: string;
  orderStatus?: string;
  status?: string;
  createdAt?: string;
  customer?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
  };
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
  };
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: string;
  payment?: {
    method?: string;
    provider?: string;
    gateway?: string;
  };
  paymentProvider?: string;

  deliveryAssignment?: DeliveryAssignment | null;
  returnPickupAssignment?: DeliveryAssignment | null;
  exchangePickupAssignment?: DeliveryAssignment | null;
  replacementDeliveryAssignment?: DeliveryAssignment | null;

  cancelRequest?: OrderRow["cancelRequest"];
  returnRequest?: OrderRow["returnRequest"];
  refund?: OrderRow["refund"];
  exchange?: OrderRow["exchange"];

  items?: OrderItem[];
};

export type OrderListResponse = {
  success?: boolean;
  message?: string;
  data?:
    | ApiOrder[]
    | {
        orders?: ApiOrder[];
        items?: ApiOrder[];
        docs?: ApiOrder[];
        result?: ApiOrder[];
        data?: ApiOrder[];
      };
  orders?: ApiOrder[];
  items?: ApiOrder[];
  docs?: ApiOrder[];
  result?: ApiOrder[];
};

export type ToastType = "success" | "error" | "info";

export type ToastState = {
  type: ToastType;
  message: string;
} | null;

export type LoadMode = "initial" | "refresh" | "search" | "silent";

export type AdminSocket = Socket;

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const actionBtnClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function safeStr(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export function formatDateShort(iso?: string) {
  if (!iso) return "-";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toISOString().slice(0, 10);
}

export function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;

  return `Rs. ${(safe / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function normalizePaymentStatus(status?: string): PaymentStatus {
  const s = String(status || "").trim().toLowerCase();

  if (s === "paid" || s === "success" || s === "completed") return "Paid";
  if (s === "failed" || s === "cancelled" || s === "rejected") return "Failed";

  return "Pending";
}

export function normalizeOrderStatus(status?: string): OrderStatus {
  const s = String(status || "").trim().toLowerCase();

  if (s === "delivered") return "Delivered";
  if (s === "transit" || s === "in transit" || s === "out for delivery") {
    return "Transit";
  }
  if (s === "shipped") return "Shipped";
  if (s === "processing") return "Processing";
  if (s === "confirmed") return "Confirmed";
  if (s === "cancelled" || s === "canceled") return "Cancelled";
  if (s === "returned") return "Returned";
  if (s === "refunded") return "Refunded";

  return "Pending";
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

export function normalizePaymentMethod(v?: string) {
  const s = (v || "").toLowerCase().trim();

  if (!s) return "—";
  if (s.includes("esewa") || s === "e-sewa") return "eSewa";
  if (s.includes("khalti")) return "Khalti";
  if (s.includes("cod") || s.includes("cash")) return "Cash on Delivery";
  if (s.includes("card") || s.includes("visa") || s.includes("master")) {
    return "Card";
  }
  if (s.includes("bank") || s.includes("transfer")) return "Bank Transfer";

  return "Other";
}

export function normalizeOrderItems(items?: OrderItem[]) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    productId: String(item.productId || ""),
    variantId: String(item.variantId || ""),
    name: String(item.name || ""),
    size: String(item.size || ""),
    color: String(item.color || ""),
    colorLabel: String(item.colorLabel || ""),
    sku: String(item.sku || ""),
    image: String(item.image || ""),
    qty: Math.max(0, Number(item.qty || 0)),
    pricePaisa: Math.max(0, Number(item.pricePaisa || 0)),
  }));
}

export function getOrderArray(body: OrderListResponse | ApiOrder[]): ApiOrder[] {
  if (Array.isArray(body)) return body;

  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.orders)) return body.orders;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.docs)) return body.docs;
  if (Array.isArray(body.result)) return body.result;

  if (body.data && Array.isArray(body.data.orders)) return body.data.orders;
  if (body.data && Array.isArray(body.data.items)) return body.data.items;
  if (body.data && Array.isArray(body.data.docs)) return body.data.docs;
  if (body.data && Array.isArray(body.data.result)) return body.data.result;
  if (body.data && Array.isArray(body.data.data)) return body.data.data;

  return [];
}

export function getOrderTotalPaisa(order: ApiOrder) {
  if (order.totalPaisa !== undefined && order.totalPaisa !== null) {
    return Math.round(Number(order.totalPaisa) || 0);
  }

  if (order.totalRs !== undefined && order.totalRs !== null) {
    return Math.round((Number(order.totalRs) || 0) * 100);
  }

  if (order.total !== undefined && order.total !== null) {
    const value = Number(order.total) || 0;

    if (value > 10000) return Math.round(value);
    return Math.round(value * 100);
  }

  return 0;
}

export function mapDeliveryAssignment(
  deliveryAssignment?: DeliveryAssignment | null
): DeliveryAssignment | null {
  if (!deliveryAssignment) return null;

  return {
    taskType: safeStr(deliveryAssignment.taskType),
    deliveryManId: safeStr(deliveryAssignment.deliveryManId),
    name: safeStr(deliveryAssignment.name),
    phone: safeStr(deliveryAssignment.phone),
    email: safeStr(deliveryAssignment.email),
    vehicleType: safeStr(deliveryAssignment.vehicleType),
    status: safeStr(deliveryAssignment.status),
    assignedAt: deliveryAssignment.assignedAt || null,
    pickedUpAt: deliveryAssignment.pickedUpAt || null,
    outForDeliveryAt: deliveryAssignment.outForDeliveryAt || null,
    deliveredAt: deliveryAssignment.deliveredAt || null,
    returnedToStoreAt: deliveryAssignment.returnedToStoreAt || null,
  };
}

export function mapOrder(order: ApiOrder): OrderRow {
  const customer = order.customer || order.user;

  return {
    id: String(order._id || order.id || ""),
    orderCode: order.orderCode,
    totalPaisa: getOrderTotalPaisa(order),
    totalRs:
      order.totalRs !== undefined && order.totalRs !== null
        ? Number(order.totalRs) || 0
        : undefined,
    paymentStatus: normalizePaymentStatus(order.paymentStatus),
    orderStatus: normalizeOrderStatus(order.orderStatus || order.status),
    createdAt: String(order.createdAt || ""),
    customer: customer
      ? {
          id: String(customer._id || customer.id || ""),
          name: customer.name,
          email: customer.email,
        }
      : undefined,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    paymentMethod: order.paymentMethod,
    payment: order.payment,
    paymentProvider: order.paymentProvider,

    deliveryAssignment: mapDeliveryAssignment(order.deliveryAssignment),
    returnPickupAssignment: mapDeliveryAssignment(order.returnPickupAssignment),
    exchangePickupAssignment: mapDeliveryAssignment(
      order.exchangePickupAssignment
    ),
    replacementDeliveryAssignment: mapDeliveryAssignment(
      order.replacementDeliveryAssignment
    ),

    cancelRequest: order.cancelRequest || { status: "NONE" },
    returnRequest: order.returnRequest || { status: "NONE" },
    refund: order.refund || { status: "NONE" },
    exchange: order.exchange || { status: "NONE" },

    items: normalizeOrderItems(order.items),
  };
}

export function getAfterSalesLabels(order: OrderRow) {
  const labels: Array<{
    label: string;
    tone: "amber" | "blue" | "green" | "red" | "purple";
  }> = [];

  const cancelStatus = normalizeRequestStatus(order.cancelRequest?.status);
  const returnStatus = normalizeReturnStatus(order.returnRequest?.status);
  const refundStatus = normalizeRefundStatus(order.refund?.status);
  const exchangeStatus = normalizeExchangeStatus(order.exchange?.status);

  if (cancelStatus !== "NONE") {
    labels.push({
      label: `Cancel ${prettyStatus(cancelStatus)}`,
      tone:
        cancelStatus === "REQUESTED"
          ? "amber"
          : cancelStatus === "APPROVED"
            ? "green"
            : "red",
    });
  }

  if (returnStatus !== "NONE") {
    const isExchange =
      safeStr(order.returnRequest?.preferredResolution).toUpperCase() ===
        "EXCHANGE" ||
      safeStr(order.returnRequest?.type).toUpperCase() === "EXCHANGE" ||
      exchangeStatus !== "NONE";

    labels.push({
      label: `${isExchange ? "Exchange" : "Return"} ${prettyStatus(
        returnStatus
      )}`,
      tone:
        returnStatus === "REQUESTED"
          ? "blue"
          : returnStatus === "REJECTED"
            ? "red"
            : "green",
    });
  }

  if (exchangeStatus !== "NONE") {
    labels.push({
      label: `Exchange ${prettyStatus(exchangeStatus)}`,
      tone:
        exchangeStatus === "COMPLETED"
          ? "green"
          : exchangeStatus === "REJECTED"
            ? "red"
            : "purple",
    });
  }

  if (refundStatus !== "NONE") {
    labels.push({
      label: `Refund ${prettyStatus(refundStatus)}`,
      tone:
        refundStatus === "REFUNDED"
          ? "green"
          : refundStatus === "FAILED"
            ? "red"
            : "amber",
    });
  }

  return labels;
}

export function getTaskCards(order: OrderRow) {
  const cards: Array<{
    title: string;
    status: string;
    name?: string;
    tone: "blue" | "orange" | "purple" | "green";
  }> = [];

  if (order.deliveryAssignment) {
    cards.push({
      title: "Delivery",
      status: order.deliveryAssignment.status || "Assigned",
      name: order.deliveryAssignment.name,
      tone: "blue",
    });
  }

  if (order.returnPickupAssignment) {
    cards.push({
      title: "Return Pickup",
      status: order.returnPickupAssignment.status || "Assigned",
      name: order.returnPickupAssignment.name,
      tone: "orange",
    });
  }

  if (order.exchangePickupAssignment) {
    cards.push({
      title: "Exchange Pickup",
      status: order.exchangePickupAssignment.status || "Assigned",
      name: order.exchangePickupAssignment.name,
      tone: "purple",
    });
  }

  if (order.replacementDeliveryAssignment) {
    cards.push({
      title: "Replacement",
      status: order.replacementDeliveryAssignment.status || "Assigned",
      name: order.replacementDeliveryAssignment.name,
      tone: "green",
    });
  }

  return cards;
}