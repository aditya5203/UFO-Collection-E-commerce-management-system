"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../_components/AdminPageGuard";

type PaymentStatus = "Paid" | "Pending" | "Failed";

type OrderStatus =
  | "Delivered"
  | "Transit"
  | "Shipped"
  | "Confirmed"
  | "Processing"
  | "Pending"
  | "Cancelled"
  | "Returned"
  | "Refunded";

type PaymentMethod =
  | "eSewa"
  | "Khalti"
  | "CashOnDelivery"
  | "Card"
  | "BankTransfer"
  | "Other";

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

type DeliveryAssignment = {
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

type OrderItem = {
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

type OrderRow = {
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

type ApiOrder = {
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

type OrderListResponse = {
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

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
} | null;

type LoadMode = "initial" | "refresh" | "search" | "silent";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";
const actionBtnClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function safeStr(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function formatDateShort(iso?: string) {
  if (!iso) return "-";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toISOString().slice(0, 10);
}

function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;

  return `Rs. ${(safe / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizePaymentStatus(status?: string): PaymentStatus {
  const s = String(status || "").trim().toLowerCase();

  if (s === "paid" || s === "success" || s === "completed") return "Paid";
  if (s === "failed" || s === "cancelled" || s === "rejected") return "Failed";

  return "Pending";
}

function normalizeOrderStatus(status?: string): OrderStatus {
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

function normalizePaymentMethod(v?: string) {
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

function normalizeOrderItems(items?: OrderItem[]) {
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

function getOrderArray(body: OrderListResponse | ApiOrder[]): ApiOrder[] {
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

function getOrderTotalPaisa(order: ApiOrder) {
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

function mapDeliveryAssignment(
  deliveryAssignment?: DeliveryAssignment | null,
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

function mapOrder(order: ApiOrder): OrderRow {
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
      order.exchangePickupAssignment,
    ),
    replacementDeliveryAssignment: mapDeliveryAssignment(
      order.replacementDeliveryAssignment,
    ),

    cancelRequest: order.cancelRequest || { status: "NONE" },
    returnRequest: order.returnRequest || { status: "NONE" },
    refund: order.refund || { status: "NONE" },
    exchange: order.exchange || { status: "NONE" },

    items: normalizeOrderItems(order.items),
  };
}

function getAfterSalesLabels(order: OrderRow) {
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
        returnStatus,
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

function getTaskCards(order: OrderRow) {
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

export default function OrdersPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<OrderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState("");
  const [downloadingId, setDownloadingId] = React.useState<string>("");
  const [toast, setToast] = React.useState<ToastState>(null);

  const didSearchMountRef = React.useRef(false);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
    },
    [],
  );

  React.useEffect(() => {
    if (!toast) return;

    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const load = React.useCallback(
    async (search: string, mode: LoadMode = "initial") => {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      if (mode === "search") setSearching(true);

      setError("");

      try {
        const res = await fetch(
          `${API_BASE}/api/admin/orders?search=${encodeURIComponent(search)}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        const body = (await safeJson(res)) as OrderListResponse | ApiOrder[];

        if (!res.ok) {
          const message = Array.isArray(body)
            ? "Failed to load orders"
            : body?.message || "Failed to load orders";

          setRows([]);
          setError(message);

          if (mode === "refresh") showToast(message, "error");
          return;
        }

        const mapped = getOrderArray(body).map(mapOrder).filter((o) => o.id);

        setRows(mapped);

        if (mode === "refresh") {
          showToast("Orders refreshed successfully.", "success");
        }
      } catch {
        setRows([]);
        setError("Network error while loading orders");

        if (mode === "refresh") {
          showToast("Network error while loading orders", "error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setSearching(false);
      }
    },
    [showToast],
  );

  React.useEffect(() => {
    load("", "initial");
  }, [load]);

  React.useEffect(() => {
    if (!didSearchMountRef.current) {
      didSearchMountRef.current = true;
      return;
    }

    const t = window.setTimeout(() => {
      load(q, "search");
    }, 350);

    return () => window.clearTimeout(t);
  }, [q, load]);

  React.useEffect(() => {
    const socket: Socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("order:updated", () => {
      load(q, "silent");
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
    };
  }, [load, q]);

  const downloadInvoice = async (orderId: string, orderCode?: string) => {
    try {
      setDownloadingId(orderId);

      const target = encodeURIComponent(orderId);

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

      const fileBase = (orderCode || orderId || "invoice").replace("#", "");
      const a = document.createElement("a");

      a.href = url;
      a.download = `invoice-${fileBase}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      showToast("Invoice downloaded successfully.", "success");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to download invoice";

      showToast(message, "error");
    } finally {
      setDownloadingId("");
    }
  };

  const paidCount = rows.filter((o) => o.paymentStatus === "Paid").length;
  const pendingCount = rows.filter((o) => o.orderStatus === "Pending").length;
  const afterSalesCount = rows.filter((o) => getAfterSalesLabels(o).length > 0)
    .length;

  const totalOrderValue = rows.reduce((sum, o) => {
    return sum + Number(o.totalPaisa || 0);
  }, 0);

  const itemCount = rows.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((inner, item) => inner + Number(item.qty || 0), 0)
    );
  }, 0);

  const hasSearch = q.trim().length > 0;

  return (
    <AdminPageGuard permission="orderView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin Sales
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Orders
                </h1>

                <p className="mt-2 max-w-[700px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Track customer orders, payment status, delivery progress,
                  return pickup, exchange pickup, replacement delivery, refunds,
                  and purchased product variants in real time.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/admin/returns-refunds" className={secondaryBtnClass}>
                  Returns & Refunds
                </Link>

                <button
                  type="button"
                  onClick={() => load(q, "refresh")}
                  disabled={refreshing}
                  className={secondaryBtnClass}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Total Orders"
              value={String(rows.length)}
              iconSrc="/images/admin/orders.png"
            />

            <MetricCard
              label="Paid Orders"
              value={String(paidCount)}
              iconSrc="/images/admin/paid.png"
            />

            <MetricCard
              label="Pending Orders"
              value={String(pendingCount)}
              iconSrc="/images/admin/pending.png"
            />

            <MetricCard
              label="After Sales"
              value={String(afterSalesCount)}
              iconSrc="/images/admin/support.png"
            />

            <MetricCard
              label="Total Value"
              value={formatNPR(totalOrderValue)}
              iconSrc="/images/admin/revenue.png"
            />
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-[#26293a] px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Order List
                </div>

                <div className="mt-1 text-[20px] font-semibold text-white">
                  Customer Orders
                </div>

                {searching ? (
                  <div className="mt-1 text-[12px] text-[#7f879f]">
                    Searching...
                  </div>
                ) : null}
              </div>

              <div className="flex h-[46px] min-w-[280px] items-center rounded-full border border-white/10 bg-white/5 px-4">
                <label htmlFor="order-search" className="sr-only">
                  Search order or customer
                </label>

                <input
                  id="order-search"
                  name="orderSearch"
                  title="Search order or customer"
                  aria-label="Search order or customer"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search order, customer, status, refund..."
                  className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
                />
              </div>
            </div>

            {loading ? (
              <OrderSkeleton />
            ) : rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1780px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Order ID</th>
                      <th className="px-5 py-4 font-medium">Customer</th>
                      <th className="px-5 py-4 font-medium">Items / Variants</th>
                      <th className="px-5 py-4 font-medium">Total</th>
                      <th className="px-5 py-4 font-medium">Payment</th>
                      <th className="px-5 py-4 font-medium">Order Status</th>
                      <th className="px-5 py-4 font-medium">Delivery Tasks</th>
                      <th className="px-5 py-4 font-medium">After Sales</th>
                      <th className="px-5 py-4 font-medium">Created</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((o) => {
                      const code = o.orderCode || o.id;
                      const cname = o.customer?.name || o.customerName || "-";
                      const cemail = o.customer?.email || o.customerEmail || "-";

                      const methodRaw =
                        (o.paymentMethod as string) ||
                        (o.payment?.method as string) ||
                        o.payment?.provider ||
                        o.payment?.gateway ||
                        o.paymentProvider ||
                        "";

                      const methodLabel = normalizePaymentMethod(methodRaw);
                      const downloading = downloadingId === o.id;

                      const afterSalesLabels = getAfterSalesLabels(o);
                      const taskCards = getTaskCards(o);

                      return (
                        <tr
                          key={o.id}
                          className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">
                              {code}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">
                              {cname}
                            </div>

                            <div className="mt-1 text-[12px] text-[#7f879f]">
                              {cemail}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <OrderVariantPreview items={o.items} />
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#d6c7ff]">
                            {formatNPR(o.totalPaisa)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-2">
                              <MethodBadge>{methodLabel}</MethodBadge>
                              <PaymentBadge status={o.paymentStatus}>
                                {o.paymentStatus}
                              </PaymentBadge>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <OrderBadge status={o.orderStatus}>
                              {o.orderStatus}
                            </OrderBadge>
                          </td>

                          <td className="px-5 py-4">
                            {taskCards.length ? (
                              <div className="flex max-w-[360px] flex-wrap gap-2">
                                {taskCards.map((task, index) => (
                                  <TaskBadge
                                    key={`${task.title}-${index}`}
                                    title={task.title}
                                    status={task.status}
                                    name={task.name}
                                    tone={task.tone}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#7f879f]">
                                No task assigned
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {afterSalesLabels.length ? (
                              <div className="flex max-w-[320px] flex-wrap gap-2">
                                {afterSalesLabels.map((item, index) => (
                                  <AfterSalesBadge
                                    key={`${item.label}-${index}`}
                                    tone={item.tone}
                                  >
                                    {item.label}
                                  </AfterSalesBadge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#7f879f]">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-[#a7aec4]">
                            {formatDateShort(o.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className={actionBtnClass}
                              >
                                View
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  downloadInvoice(o.id, o.orderCode)
                                }
                                disabled={downloading}
                                className={actionBtnClass}
                              >
                                {downloading ? "Downloading" : "Invoice"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : hasSearch ? (
              <NoSearchResults />
            ) : (
              <EmptyState />
            )}
          </section>
        </div>

        {toast ? <Toast toast={toast} /> : null}
      </div>
    </AdminPageGuard>
  );
}

function OrderVariantPreview({ items }: { items: OrderItem[] }) {
  if (!items.length) {
    return <span className="text-[12px] text-[#7f879f]">No items</span>;
  }

  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const first = items[0];

  return (
    <div className="max-w-[260px]">
      <div className="flex items-center gap-3">
        {first.image ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-white/5">
            <Image
              src={first.image}
              alt={first.name || "Product"}
              fill
              className="object-cover"
              sizes="44px"
            />
          </div>
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-white/10 bg-white/5 text-[18px]">
            📦
          </div>
        )}

        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">
            {first.name || "Product"}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#a7aec4]">
            <span>{first.colorLabel || first.color || "Color"}</span>
            <span>•</span>
            <span>{first.size || "Size"}</span>
            <span>•</span>
            <span>Qty {first.qty || 0}</span>
          </div>

          {first.sku ? (
            <div className="mt-1 max-w-[220px] truncate text-[10px] uppercase tracking-[0.12em] text-[#7f879f]">
              SKU: {first.sku}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a7aec4]">
          {items.length} product{items.length === 1 ? "" : "s"}
        </span>

        <span className="rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff]">
          {totalQty} item{totalQty === 1 ? "" : "s"}
        </span>

        {items.length > 1 ? (
          <span className="text-[10px] text-[#7f879f]">
            +{items.length - 1} more
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function MethodBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

function PaymentBadge({
  status,
  children,
}: {
  status: PaymentStatus;
  children: React.ReactNode;
}) {
  const styles: Record<PaymentStatus, string> = {
    Paid: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    Pending: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    Failed: "border-red-400/20 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles[status] || styles.Pending,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function OrderBadge({
  status,
  children,
}: {
  status: OrderStatus;
  children: React.ReactNode;
}) {
  const styles: Record<OrderStatus, string> = {
    Delivered: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    Transit: "border-violet-400/20 bg-violet-500/15 text-violet-300",
    Shipped: "border-blue-400/20 bg-blue-500/15 text-blue-300",
    Processing: "border-purple-400/20 bg-purple-500/15 text-purple-300",
    Confirmed: "border-cyan-400/20 bg-cyan-500/15 text-cyan-300",
    Pending: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    Cancelled: "border-red-400/20 bg-red-500/15 text-red-300",
    Returned: "border-red-400/20 bg-red-500/15 text-red-300",
    Refunded: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles[status] || styles.Pending,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function TaskBadge({
  title,
  status,
  name,
  tone,
}: {
  title: string;
  status: string;
  name?: string;
  tone: "blue" | "orange" | "purple" | "green";
}) {
  const toneClass =
    tone === "orange"
      ? "border-orange-400/20 bg-orange-500/10 text-orange-200"
      : tone === "purple"
        ? "border-purple-400/20 bg-purple-500/10 text-purple-200"
        : tone === "green"
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
          : "border-blue-400/20 bg-blue-500/10 text-blue-200";

  return (
    <div
      className={`rounded-[14px] border px-3 py-2 text-[11px] ${toneClass}`}
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 opacity-90">{status || "Assigned"}</div>
      {name ? <div className="mt-1 max-w-[140px] truncate opacity-70">{name}</div> : null}
    </div>
  );
}

function AfterSalesBadge({
  tone,
  children,
}: {
  tone: "amber" | "blue" | "green" | "red" | "purple";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
      : tone === "blue"
        ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
        : tone === "green"
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
          : tone === "purple"
            ? "border-purple-400/20 bg-purple-500/10 text-purple-200"
            : "border-red-400/20 bg-red-500/10 text-red-200";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        toneClass,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/orders.png"
          alt="Orders"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No orders found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        New customer orders will appear here automatically.
      </p>
    </div>
  );
}

function NoSearchResults() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px]">
        🔎
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No matching orders
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Try searching by order code, customer name, customer email, return,
        refund, exchange, or delivery status.
      </p>
    </div>
  );
}

function Toast({ toast }: { toast: Exclude<ToastState, null> }) {
  return (
    <div
      className={[
        "fixed bottom-5 right-5 z-[1200] max-w-[360px] rounded-[18px] border px-5 py-4 text-[13px] font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur",
        toast.type === "success"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
          : toast.type === "error"
            ? "border-red-400/20 bg-red-500/15 text-red-200"
            : "border-[#8b5cf6]/30 bg-[#8b5cf6]/15 text-[#e9ddff]",
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}