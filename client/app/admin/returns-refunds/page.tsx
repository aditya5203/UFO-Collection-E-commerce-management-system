"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import AdminPageGuard from "../_components/AdminPageGuard";

type ToastType = "success" | "error" | "info";

type RequestType = "CANCELLATION" | "RETURN" | "REFUND" | "EXCHANGE";

type RequestStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP"
  | "RECEIVED"
  | "PENDING"
  | "PENDING_ACCOUNT_DETAILS"
  | "READY_TO_REFUND"
  | "PROCESSING"
  | "REFUNDED"
  | "FAILED"
  | "REPLACEMENT_ASSIGNED"
  | "REPLACEMENT_DELIVERED"
  | "COMPLETED";

type RequestRow = {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  type: RequestType;
  status: RequestStatus;
  reason?: string;
  amountPaisa?: number;
  paymentMethod?: string;
  requestedAt?: string | null;
  resolvedAt?: string | null;
  adminNote?: string;
  requestType?: string;
  preferredResolution?: string;
  refundStatus?: string;
  exchangeStatus?: string;
  assignedRider?: string;
};

type DeliveryStaff = {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  status?: string;
  role?: string;
};

const API_BASE =
  API_BASE_URL;
const API = `${API_BASE}/api`;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";
const dangerBtnClass =
  "inline-flex items-center justify-center rounded-full border border-red-400/30 bg-red-500/15 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-100 transition hover:-translate-y-0.5 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60";

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function safeStr(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function formatNPR(value?: number) {
  const rupees = Number(value || 0) / 100;

  return `Rs. ${rupees.toLocaleString("en-NP", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeRequestType(value?: string): RequestType {
  const upper = safeStr(value).toUpperCase();

  if (upper === "CANCELLATION") return "CANCELLATION";
  if (upper === "RETURN") return "RETURN";
  if (upper === "EXCHANGE") return "EXCHANGE";

  return "REFUND";
}

function normalizeRequestStatus(value?: string): RequestStatus {
  const upper = safeStr(value || "REQUESTED").toUpperCase();

  const allowed: RequestStatus[] = [
    "NONE",
    "REQUESTED",
    "APPROVED",
    "REJECTED",
    "PICKUP_ASSIGNED",
    "PICKED_UP",
    "RECEIVED",
    "PENDING",
    "PENDING_ACCOUNT_DETAILS",
    "READY_TO_REFUND",
    "PROCESSING",
    "REFUNDED",
    "FAILED",
    "REPLACEMENT_ASSIGNED",
    "REPLACEMENT_DELIVERED",
    "COMPLETED",
  ];

  return allowed.includes(upper as RequestStatus)
    ? (upper as RequestStatus)
    : "REQUESTED";
}

function prettyRequestType(value?: string) {
  const v = safeStr(value).toUpperCase();
  const map: Record<string, string> = {
    RETURN_REFUND: "Return & Refund",
    EXCHANGE: "Exchange",
    DAMAGED: "Damaged",
    WRONG_ITEM: "Wrong Item",
    SIZE_COLOR_ISSUE: "Size/Color Issue",
    NOT_SATISFIED: "Not Satisfied",
    OTHER: "Other",
  };
  return map[v] || value || "—";
}

function normalizeRows(raw: any): RequestRow[] {
  const rows = raw?.requests || raw?.data || raw?.items || raw || [];

  if (!Array.isArray(rows)) return [];

  return rows.map((item: any, index: number) => {
    const order = item?.order || item;

    const orderId = safeStr(
      item?.orderId ||
        item?.order?._id ||
        item?.order?.id ||
        order?.id ||
        order?._id ||
        "",
    );

    return {
      id: safeStr(item?.id || item?._id || `${orderId || "request"}-${index}`),
      orderId,
      orderCode:
        safeStr(order?.orderCode) ||
        safeStr(order?.orderId) ||
        safeStr(item?.orderCode) ||
        "ORDER",
      customerName:
        safeStr(item?.customerName) ||
        safeStr(order?.customer?.name) ||
        safeStr(order?.user?.name) ||
        "Customer",
      customerEmail:
        safeStr(item?.customerEmail) ||
        safeStr(order?.customer?.email) ||
        safeStr(order?.user?.email) ||
        "",
      customerPhone:
        safeStr(item?.customerPhone) ||
        safeStr(order?.customer?.phone) ||
        safeStr(order?.user?.phone) ||
        "",
      type: normalizeRequestType(item?.type),
      status: normalizeRequestStatus(item?.status),
      reason: safeStr(item?.reason),
      amountPaisa:
        Number(
          item?.amountPaisa ??
            item?.refund?.amountPaisa ??
            item?.refundAmountPaisa ??
            order?.refund?.amountPaisa ??
            order?.totalPaisa ??
            0,
        ) || 0,
      paymentMethod:
        safeStr(item?.paymentMethod) ||
        safeStr(order?.paymentMethod) ||
        safeStr(order?.payment?.method) ||
        "COD",
      requestedAt: item?.requestedAt || order?.createdAt || null,
      resolvedAt: item?.resolvedAt || null,
      adminNote: safeStr(item?.adminNote),
      requestType: safeStr(item?.requestType),
      preferredResolution: safeStr(item?.preferredResolution),
      refundStatus: safeStr(item?.refundStatus || order?.refund?.status),
      exchangeStatus: safeStr(item?.exchangeStatus || order?.exchange?.status),
      assignedRider: safeStr(item?.assignedRider),
    };
  });
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || "REQUESTED";

  const tone =
    ["APPROVED", "REFUNDED", "RECEIVED", "COMPLETED"].includes(value)
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : ["REJECTED", "FAILED"].includes(value)
        ? "border-red-400/30 bg-red-500/10 text-red-200"
        : [
              "REQUESTED",
              "PENDING",
              "PENDING_ACCOUNT_DETAILS",
              "READY_TO_REFUND",
              "PROCESSING",
              "PICKUP_ASSIGNED",
              "PICKED_UP",
              "REPLACEMENT_ASSIGNED",
              "REPLACEMENT_DELIVERED",
            ].includes(value)
          ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"
          : "border-blue-400/30 bg-blue-500/10 text-blue-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function TypeBadge({ type }: { type: RequestType }) {
  const tone =
    type === "CANCELLATION"
      ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"
      : type === "RETURN"
        ? "border-blue-400/30 bg-blue-500/10 text-blue-200"
        : type === "EXCHANGE"
          ? "border-purple-400/30 bg-purple-500/10 text-purple-200"
          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone}`}
    >
      {type}
    </span>
  );
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  return (
    <div className="fixed right-4 top-6 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div className={`rounded-[18px] border px-4 py-3 text-sm ${tone}`}>
        <div className="flex items-start justify-between gap-3">
          <span>{toast.message}</span>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReturnsRefundsPage() {
  const [rows, setRows] = React.useState<RequestRow[]>([]);
  const [riders, setRiders] = React.useState<DeliveryStaff[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<"ALL" | RequestType>("ALL");
  const [query, setQuery] = React.useState("");
  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const [selected, setSelected] = React.useState<RequestRow | null>(null);
  const [adminNote, setAdminNote] = React.useState("");
  const [transactionRef, setTransactionRef] = React.useState("");
  const [deliveryManId, setDeliveryManId] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionType, setActionType] = React.useState<
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
    | "completeExchange"
    | null
  >(null);

  const showToast = React.useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadRequests = React.useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/admin/orders/returns-refunds`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load requests.");
      }

      setRows(normalizeRows(data));
    } catch (error: any) {
      showToast(error?.message || "Failed to load requests.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadRiders = React.useCallback(async () => {
    const possibleEndpoints = [
      `${API}/admin/delivery/staff`,
      `${API}/admin/delivery-staff`,
      `${API}/admin/delivery`,
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        const res = await fetch(endpoint, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) continue;

        const data = await safeJson(res);
        const raw = data?.data || data?.staff || data?.users || data || [];

        if (Array.isArray(raw)) {
          const normalized = raw
            .map((r: any) => ({
              id: safeStr(r.id || r._id),
              _id: safeStr(r._id),
              name: safeStr(r.name || r.fullName || "Delivery Rider"),
              email: safeStr(r.email),
              phone: safeStr(r.phone),
              vehicleType: safeStr(r.vehicleType),
              status: safeStr(r.status),
              role: safeStr(r.role),
            }))
            .filter((r: DeliveryStaff) => r.id);

          setRiders(normalized);
          return;
        }
      } catch {}
    }
  }, []);

  React.useEffect(() => {
    loadRequests();
    loadRiders();
  }, [loadRequests, loadRiders]);

  const filteredRows = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((row) => {
      const tabOk = tab === "ALL" || row.type === tab;
      const queryOk =
        !q ||
        row.orderCode.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        row.customerEmail.toLowerCase().includes(q) ||
        String(row.customerPhone || "").toLowerCase().includes(q) ||
        String(row.reason || "").toLowerCase().includes(q);

      return tabOk && queryOk;
    });
  }, [rows, tab, query]);

  const counts = React.useMemo(() => {
    return {
      ALL: rows.length,
      CANCELLATION: rows.filter((r) => r.type === "CANCELLATION").length,
      RETURN: rows.filter((r) => r.type === "RETURN").length,
      REFUND: rows.filter((r) => r.type === "REFUND").length,
      EXCHANGE: rows.filter((r) => r.type === "EXCHANGE").length,
    };
  }, [rows]);

  const openAction = (row: RequestRow, action: typeof actionType) => {
    setSelected(row);
    setActionType(action);
    setAdminNote("");
    setTransactionRef("");
    setDeliveryManId("");
  };

  const closeActionModal = () => {
    if (actionLoading) return;

    setSelected(null);
    setActionType(null);
    setAdminNote("");
    setTransactionRef("");
    setDeliveryManId("");
  };

  const submitAction = async () => {
    if (!selected || !actionType) return;

    if (!selected.orderId) {
      showToast("Order ID is missing for this request.", "error");
      return;
    }

    if (
      [
        "assignReturnPickup",
        "assignExchangePickup",
        "assignReplacement",
      ].includes(actionType) &&
      !deliveryManId
    ) {
      showToast("Please select a delivery rider.", "error");
      return;
    }

    const orderId = encodeURIComponent(selected.orderId);

    const map: Record<NonNullable<typeof actionType>, string> = {
      approveCancel: `${API}/admin/orders/${orderId}/cancel/approve`,
      rejectCancel: `${API}/admin/orders/${orderId}/cancel/reject`,
      approveReturn: `${API}/admin/orders/${orderId}/return/approve`,
      rejectReturn: `${API}/admin/orders/${orderId}/return/reject`,
      assignReturnPickup: `${API}/admin/orders/${orderId}/return/assign-pickup`,
      assignExchangePickup: `${API}/admin/orders/${orderId}/exchange/assign-pickup`,
      markReceived: `${API}/admin/orders/${orderId}/return/mark-received`,
      requestRefundDetails: `${API}/admin/orders/${orderId}/refund/request-details`,
      markRefundProcessing: `${API}/admin/orders/${orderId}/refund/processing`,
      markRefunded: `${API}/admin/orders/${orderId}/refund/mark-refunded`,
      assignReplacement: `${API}/admin/orders/${orderId}/exchange/assign-replacement`,
      completeExchange: `${API}/admin/orders/${orderId}/exchange/complete`,
    };

    try {
      setActionLoading(true);

      const body: Record<string, any> = {
        adminNote: adminNote.trim(),
      };

      if (
        [
          "assignReturnPickup",
          "assignExchangePickup",
          "assignReplacement",
        ].includes(actionType)
      ) {
        body.deliveryManId = deliveryManId;
        body.note = adminNote.trim();
      }

      if (actionType === "markRefunded") {
        body.transactionRef = transactionRef.trim();
      }

      const res = await fetch(map[actionType], {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Action failed.");
      }

      showToast("Request updated successfully.", "success");
      closeActionModal();
      await loadRequests();
    } catch (error: any) {
      showToast(error?.message || "Action failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const actionTitle =
    actionType === "approveCancel"
      ? "Approve Cancellation"
      : actionType === "rejectCancel"
        ? "Reject Cancellation"
        : actionType === "approveReturn"
          ? "Approve Return / Exchange"
          : actionType === "rejectReturn"
            ? "Reject Return / Exchange"
            : actionType === "assignReturnPickup"
              ? "Assign Return Pickup Rider"
              : actionType === "assignExchangePickup"
                ? "Assign Exchange Pickup Rider"
                : actionType === "markReceived"
                  ? "Mark Product Received"
                  : actionType === "requestRefundDetails"
                    ? "Request Refund Details"
                    : actionType === "markRefundProcessing"
                      ? "Mark Refund Processing"
                      : actionType === "markRefunded"
                        ? "Mark Refund Completed"
                        : actionType === "assignReplacement"
                          ? "Assign Replacement Delivery"
                          : actionType === "completeExchange"
                            ? "Complete Exchange"
                            : "Confirm Action";

  const requiresRider =
    actionType === "assignReturnPickup" ||
    actionType === "assignExchangePickup" ||
    actionType === "assignReplacement";

  const isDangerAction =
    actionType === "rejectCancel" || actionType === "rejectReturn";

  return (
    <AdminPageGuard permission="orderView">
      <main className={shellClass}>
        <ToastMessage toast={toast} onClose={() => setToast(null)} />

        <div className={containerClass}>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8d96b3]">
                Admin Panel
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
                Returns, Refunds & Exchanges
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a7aec4]">
                Manage cancellation, return pickup, refund details, refund
                processing, exchange pickup, and replacement delivery from one
                place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                loadRequests();
                loadRiders();
              }}
              className={secondaryBtnClass}
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["ALL", "All Requests", counts.ALL],
              ["CANCELLATION", "Cancellations", counts.CANCELLATION],
              ["RETURN", "Returns", counts.RETURN],
              ["REFUND", "Refunds", counts.REFUND],
              ["EXCHANGE", "Exchanges", counts.EXCHANGE],
            ].map(([key, label, count]) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => setTab(key as "ALL" | RequestType)}
                className={`rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 ${
                  tab === key
                    ? "border-white/25 bg-white/10"
                    : "border-[#26293a] bg-[#11121a]"
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d96b3]">
                  {String(label)}
                </div>

                <div className="mt-3 text-3xl font-semibold text-white">
                  {String(count)}
                </div>
              </button>
            ))}
          </div>

          <section className={`${panelClass} mt-6 p-5 sm:p-6`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Request List
                </h2>

                <p className="mt-1 text-sm text-[#a7aec4]">
                  Showing {filteredRows.length} request(s)
                </p>
              </div>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order, customer, email, phone, reason..."
                className="w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 py-3 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff] lg:max-w-[420px]"
              />
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1220px] border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-[#8d96b3]">
                    <th className="px-4 py-2">Order</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Issue</th>
                    <th className="px-4 py-2">Reason</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Rider</th>
                    <th className="px-4 py-2">Requested</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-10 text-center text-[#a7aec4]"
                      >
                        Loading requests...
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-10 text-center text-[#a7aec4]"
                      >
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={`${row.type}-${row.id}`}>
                        <td className="rounded-l-[18px] border-y border-l border-[#26293a] bg-[#161824] px-4 py-4">
                          {row.orderId ? (
                            <Link
                              href={`/admin/orders/${encodeURIComponent(
                                row.orderId,
                              )}`}
                              className="font-semibold text-white hover:text-[#d6c7ff]"
                            >
                              {row.orderCode}
                            </Link>
                          ) : (
                            <span className="font-semibold text-white">
                              {row.orderCode}
                            </span>
                          )}

                          <div className="mt-1 text-xs text-[#8d96b3]">
                            {row.paymentMethod || "COD"}
                          </div>
                        </td>

                        <td className="border-y border-[#26293a] bg-[#161824] px-4 py-4">
                          <div className="text-sm font-semibold text-white">
                            {row.customerName}
                          </div>

                          <div className="mt-1 text-xs text-[#8d96b3]">
                            {row.customerEmail || row.customerPhone || "No contact"}
                          </div>
                        </td>

                        <td className="border-y border-[#26293a] bg-[#161824] px-4 py-4">
                          <TypeBadge type={row.type} />
                        </td>

                        <td className="border-y border-[#26293a] bg-[#161824] px-4 py-4">
                          <div className="text-sm text-white">
                            {prettyRequestType(row.requestType)}
                          </div>
                          {row.preferredResolution ? (
                            <div className="mt-1 text-xs text-[#8d96b3]">
                              {row.preferredResolution}
                            </div>
                          ) : null}
                        </td>

                        <td className="max-w-[220px] border-y border-[#26293a] bg-[#161824] px-4 py-4">
                          <div className="line-clamp-2 text-sm text-[#a7aec4]">
                            {row.reason || "—"}
                          </div>
                        </td>

                        <td className="border-y border-[#26293a] bg-[#161824] px-4 py-4 text-sm font-semibold text-white">
                          {formatNPR(row.amountPaisa)}
                        </td>

                        <td className="border-y border-[#26293a] bg-[#161824] px-4 py-4">
                          <StatusBadge status={row.status} />
                        </td>

                        <td className="border-y border-[#26293a] bg-[#161824] px-4 py-4 text-sm text-[#a7aec4]">
                          {row.assignedRider || "—"}
                        </td>

                        <td className="border-y border-[#26293a] bg-[#161824] px-4 py-4 text-sm text-[#a7aec4]">
                          {formatDate(row.requestedAt)}
                        </td>

                        <td className="rounded-r-[18px] border-y border-r border-[#26293a] bg-[#161824] px-4 py-4">
                          <div className="flex min-w-[300px] flex-wrap justify-end gap-2">
                            {row.type === "CANCELLATION" &&
                            row.status === "REQUESTED" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openAction(row, "approveCancel")
                                  }
                                  disabled={!row.orderId}
                                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openAction(row, "rejectCancel")
                                  }
                                  disabled={!row.orderId}
                                  className="rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}

                            {row.type === "RETURN" &&
                            row.status === "REQUESTED" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openAction(row, "approveReturn")
                                  }
                                  disabled={!row.orderId}
                                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openAction(row, "rejectReturn")
                                  }
                                  disabled={!row.orderId}
                                  className="rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}

                            {row.type === "RETURN" &&
                            row.status === "APPROVED" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(row, "assignReturnPickup")
                                }
                                disabled={!row.orderId}
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Assign Pickup
                              </button>
                            ) : null}

                            {row.type === "RETURN" &&
                            (row.status === "PICKED_UP" ||
                              row.status === "RECEIVED") ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(row, "markReceived")
                                }
                                disabled={!row.orderId}
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Mark Received
                              </button>
                            ) : null}

                            {row.type === "EXCHANGE" &&
                            row.status === "REQUESTED" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openAction(row, "approveReturn")
                                  }
                                  disabled={!row.orderId}
                                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openAction(row, "rejectReturn")
                                  }
                                  disabled={!row.orderId}
                                  className="rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}

                            {row.type === "EXCHANGE" &&
                            row.status === "APPROVED" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(row, "assignExchangePickup")
                                }
                                disabled={!row.orderId}
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Assign Pickup
                              </button>
                            ) : null}

                            {row.type === "EXCHANGE" &&
                            (row.status === "PICKED_UP" ||
                              row.status === "RECEIVED") ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(row, "markReceived")
                                }
                                disabled={!row.orderId}
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Mark Received
                              </button>
                            ) : null}

                            {row.type === "EXCHANGE" &&
                            row.status === "RECEIVED" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(row, "assignReplacement")
                                }
                                disabled={!row.orderId}
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Assign Replacement
                              </button>
                            ) : null}

                            {row.type === "EXCHANGE" &&
                            row.status === "REPLACEMENT_DELIVERED" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(row, "completeExchange")
                                }
                                disabled={!row.orderId}
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Complete
                              </button>
                            ) : null}

                            {row.type === "REFUND" &&
                            row.status === "PENDING_ACCOUNT_DETAILS" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(row, "requestRefundDetails")
                                }
                                disabled={!row.orderId}
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Ask Details
                              </button>
                            ) : null}

                            {row.type === "REFUND" &&
                            ["PENDING", "READY_TO_REFUND", "PENDING_ACCOUNT_DETAILS"].includes(
                              row.status,
                            ) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(row, "markRefundProcessing")
                                }
                                disabled={!row.orderId}
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Processing
                              </button>
                            ) : null}

                            {row.type === "REFUND" &&
                            row.status !== "REFUNDED" ? (
                              <button
                                type="button"
                                onClick={() => openAction(row, "markRefunded")}
                                disabled={!row.orderId}
                                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#090a12] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Refunded
                              </button>
                            ) : null}

                            {row.orderId ? (
                              <Link
                                href={`/admin/orders/${encodeURIComponent(
                                  row.orderId,
                                )}`}
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                              >
                                View
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white opacity-50"
                              >
                                No ID
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {selected && actionType ? (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            <button
              type="button"
              onClick={closeActionModal}
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
                    {selected.orderCode}
                  </span>
                </p>

                <p className="mt-1">
                  Customer:{" "}
                  <span className="font-semibold text-white">
                    {selected.customerName}
                  </span>
                </p>

                <p className="mt-1">Type: {selected.type}</p>

                <p className="mt-1">
                  Issue: {prettyRequestType(selected.requestType)}
                </p>

                <p className="mt-1">Reason: {selected.reason || "—"}</p>

                <p className="mt-1">
                  Amount:{" "}
                  <span className="font-semibold text-white">
                    {formatNPR(selected.amountPaisa)}
                  </span>
                </p>
              </div>

              {requiresRider ? (
                <div className="mt-5">
                  <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                    Delivery Rider
                  </label>

                  <select
                    aria-label="Select delivery rider"
                    title="Select delivery rider"
                    value={deliveryManId}
                    onChange={(e) => setDeliveryManId(e.target.value)}
                    className="mt-2 h-[48px] w-full rounded-full ..."
                  >
                    <option value="">Select delivery rider</option>
                    {riders.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name}
                        {rider.phone ? ` • ${rider.phone}` : ""}
                        {rider.vehicleType ? ` • ${rider.vehicleType}` : ""}
                      </option>
                    ))}
                  </select>

                  {riders.length === 0 ? (
                    <p className="mt-2 text-xs text-yellow-100">
                      No delivery riders loaded. Check your delivery staff API
                      endpoint.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {actionType === "markRefunded" ? (
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
                  requiresRider
                    ? "Write pickup/delivery note for rider..."
                    : "Write optional admin note..."
                }
                className="mt-5 w-full resize-none rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
              />

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={closeActionModal}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={submitAction}
                  className={isDangerAction ? dangerBtnClass : primaryBtnClass}
                >
                  {actionLoading ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AdminPageGuard>
  );
}