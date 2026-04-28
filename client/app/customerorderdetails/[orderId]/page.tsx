"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type ToastType = "success" | "error" | "info";

type OrderItem = {
  id: string;
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
  | "Shipped"
  | "Transit"
  | "Delivered"
  | "Cancelled";

type DeliveryAssignmentStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned";

type Order = {
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
    taxes: number;
    total: number;
  };
  deliveryAssignment?: {
    deliveryManId?: string;
    name?: string;
    phone?: string;
    email?: string;
    vehicleType?: string;
    note?: string;
    assignedAt?: string | null;
    pickedUpAt?: string | null;
    outForDeliveryAt?: string | null;
    deliveredAt?: string | null;
    failedAt?: string | null;
    returnedAt?: string | null;
    status?: DeliveryAssignmentStatus;
  } | null;
};

type ReviewDraft = {
  productId: string;
  productName: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const FALLBACK_PRODUCT_IMAGE = "/images/product-placeholder.png";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
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

function formatNPR(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
}

function getProductImage(src?: string) {
  const value = String(src || "").trim();
  return value || FALLBACK_PRODUCT_IMAGE;
}

function getColorDotClass(color?: string) {
  const c = String(color || "").trim().toLowerCase();

  const map: Record<string, string> = {
    black: "bg-black",
    "#000000": "bg-black",
    white: "bg-white",
    "#ffffff": "bg-white",
    red: "bg-red-500",
    "#ef4444": "bg-red-500",
    blue: "bg-blue-500",
    "#3b82f6": "bg-blue-500",
    green: "bg-green-500",
    "#22c55e": "bg-green-500",
    yellow: "bg-yellow-500",
    "#eab308": "bg-yellow-500",
    pink: "bg-pink-500",
    "#ec4899": "bg-pink-500",
    purple: "bg-purple-500",
    "#a855f7": "bg-purple-500",
    orange: "bg-orange-500",
    "#f97316": "bg-orange-500",
    gray: "bg-gray-500",
    grey: "bg-gray-500",
    "#808080": "bg-gray-500",
    navy: "bg-[#000080]",
    "navy blue": "bg-[#000080]",
    "#000080": "bg-[#000080]",
  };

  return map[c] || "bg-[#16191f]";
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return "";
  const m = disposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i);
  if (!m?.[1]) return "";
  return decodeURIComponent(m[1]);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    Pending: "bg-yellow-500/15 text-yellow-200 border-yellow-500/30",
    Confirmed: "bg-blue-500/15 text-blue-200 border-blue-500/30",
    Shipped: "bg-purple-500/15 text-purple-200 border-purple-500/30",
    Transit: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
    Delivered: "bg-green-500/15 text-green-200 border-green-500/30",
    Cancelled: "bg-red-500/15 text-red-200 border-red-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
        map[status] || map.Pending
      }`}
    >
      {status}
    </span>
  );
}

function DeliveryStatusBadge({
  status,
}: {
  status?: DeliveryAssignmentStatus | string;
}) {
  const value = String(status || "").trim();
  if (!value) return null;

  const map: Record<string, string> = {
    Assigned: "bg-slate-500/15 text-slate-200 border-slate-500/30",
    "Picked Up": "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
    "Out for Delivery": "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
    Delivered: "bg-green-500/15 text-green-200 border-green-500/30",
    "Failed Delivery": "bg-orange-500/15 text-orange-200 border-orange-500/30",
    Returned: "bg-red-500/15 text-red-200 border-red-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
        map[value] || "bg-slate-500/15 text-slate-200 border-slate-500/30"
      }`}
    >
      {value}
    </span>
  );
}

function mergeLiveOrder(prev: Order | null, payload: any): Order | null {
  if (!prev) return prev;

  const nextStatus = String(payload?.orderStatus || "").trim();
  const nextPaymentStatus = String(payload?.paymentStatus || "").trim();
  const nextDelivery = payload?.deliveryAssignment || null;

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
    deliveryAssignment: nextDelivery
      ? {
          deliveryManId: String(nextDelivery.deliveryManId || ""),
          name: String(nextDelivery.name || ""),
          phone: String(nextDelivery.phone || ""),
          email: String(nextDelivery.email || ""),
          vehicleType: String(nextDelivery.vehicleType || ""),
          note: String(nextDelivery.note || ""),
          assignedAt: nextDelivery.assignedAt || null,
          pickedUpAt: nextDelivery.pickedUpAt || null,
          outForDeliveryAt: nextDelivery.outForDeliveryAt || null,
          deliveredAt: nextDelivery.deliveredAt || null,
          failedAt: nextDelivery.failedAt || null,
          returnedAt: nextDelivery.returnedAt || null,
          status: (nextDelivery.status || "") as DeliveryAssignmentStatus,
        }
      : prev.deliveryAssignment || null,
  };
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white">
        {title}
      </h2>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-[#26293a] py-5 last:border-0 md:grid-cols-[220px_1fr]">
      <div className="text-[14px] text-[#a7aec4]">{label}</div>
      <div className="break-words text-[14px] font-medium text-white">
        {value}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`${panelClass} p-6 sm:p-7`}>
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-7 w-64 animate-pulse rounded-full bg-white/10" />
            <div className="mt-7 space-y-4">
              <div className="h-14 animate-pulse rounded-[18px] bg-white/10" />
              <div className="h-14 animate-pulse rounded-[18px] bg-white/10" />
              <div className="h-14 animate-pulse rounded-[18px] bg-white/10" />
            </div>
          </div>
        ))}
      </div>

      <div className={`${panelClass} h-[360px] p-6`}>
        <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-7 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-8 space-y-4">
          <div className="h-5 animate-pulse rounded-full bg-white/10" />
          <div className="h-5 animate-pulse rounded-full bg-white/10" />
          <div className="h-5 animate-pulse rounded-full bg-white/10" />
          <div className="h-12 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const steps: OrderStatus[] = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Transit",
    "Delivered",
  ];

  const currentIndex =
    status === "Cancelled" ? -1 : Math.max(0, steps.indexOf(status));

  return (
    <div className={`${panelClass} p-5 sm:p-7`}>
      <SectionTitle eyebrow="Progress" title="Order Timeline" />

      {status === "Cancelled" ? (
        <div className="mt-5 rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          This order has been cancelled.
        </div>
      ) : (
        <>
          <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-5">
            {steps.map((step, index) => {
              const done = index <= currentIndex;
              const active = index === currentIndex;

              return (
                <div key={step} className="relative">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-[13px] font-bold ${
                      done
                        ? "border-green-400/30 bg-green-500/15 text-green-200"
                        : "border-white/10 bg-white/5 text-[#7f879f]"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </div>

                  <div
                    className={`mt-3 text-[13px] font-semibold ${
                      active
                        ? "text-white"
                        : done
                          ? "text-green-200"
                          : "text-[#a7aec4]"
                    }`}
                  >
                    {step}
                  </div>

                  <div className="mt-1 text-[11px] text-[#7f879f]">
                    {active ? "Current status" : done ? "Completed" : "Pending"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-4 sm:hidden">
            {steps.map((step, index) => {
              const done = index <= currentIndex;
              const active = index === currentIndex;

              return (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-[12px] font-bold ${
                        done
                          ? "border-green-400/30 bg-green-500/15 text-green-200"
                          : "border-white/10 bg-white/5 text-[#7f879f]"
                      }`}
                    >
                      {done ? "✓" : index + 1}
                    </div>
                    {index !== steps.length - 1 ? (
                      <div className="mt-2 h-8 w-px bg-[#26293a]" />
                    ) : null}
                  </div>

                  <div className="pb-2">
                    <div
                      className={`text-[14px] font-semibold ${
                        active
                          ? "text-white"
                          : done
                            ? "text-green-200"
                            : "text-[#a7aec4]"
                      }`}
                    >
                      {step}
                    </div>
                    <div className="mt-1 text-[12px] text-[#7f879f]">
                      {active
                        ? "Current status"
                        : done
                          ? "Completed"
                          : "Pending"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DeliveryRiderCard({
  assignment,
}: {
  assignment: Order["deliveryAssignment"];
}) {
  if (!assignment?.name && !assignment?.status) return null;

  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <SectionTitle eyebrow="Delivery" title="Rider Details" />

      <div className="mt-5 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[15px] font-semibold text-white">
              {assignment?.name || "Delivery Partner"}
            </div>

            <div className="mt-1 text-[13px] text-[#a7aec4]">
              {assignment?.vehicleType || "Vehicle not assigned"}
            </div>
          </div>

          <DeliveryStatusBadge status={assignment?.status} />
        </div>

        <div className="mt-4 grid gap-3 text-[13px] text-[#a7aec4]">
          {assignment?.phone ? (
            <div>
              Phone: <span className="text-white">{assignment.phone}</span>
            </div>
          ) : null}

          {assignment?.email ? (
            <div>
              Email: <span className="text-white">{assignment.email}</span>
            </div>
          ) : null}

          {assignment?.note ? (
            <div>
              Note: <span className="text-white">{assignment.note}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function CustomerOrderDetailsPage() {
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
    []
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
        }
      );

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Failed to load order");

      setOrder(data?.order || null);
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

  const raiseTicket = (item: OrderItem) => {
    const q = new URLSearchParams({
      orderId: order?.orderId || orderIdFromUrl || "",
      productId: item.id,
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
      productId: item.id,
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
      if (!res.ok) throw new Error(data?.message || "Failed to submit review");

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
      if (!idOrCode) throw new Error("Order ID not found.");

      const res = await fetch(
        `${API}/orders/${encodeURIComponent(idOrCode)}/invoice`,
        {
          method: "GET",
          credentials: "include",
        }
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

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-8 text-[13px] text-[#a7aec4]">
            <Link href="/homepage" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/order-history" className="hover:text-white">
              Orders
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Order Details</span>
          </div>

          <section className={`${panelClass} overflow-hidden`}>
            <div className="relative px-5 py-8 sm:px-8 lg:px-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,199,255,0.14),transparent_38%)]" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                    Customer Order
                  </div>

                  <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[48px]">
                    Order Details
                  </h1>

                  <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[#a7aec4]">
                    Track your order, view delivery progress, download invoice,
                    raise support tickets, and submit product reviews after
                    delivery.
                  </p>
                </div>

                {!loading && !error && order ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={order.status} />

                    {order.deliveryAssignment?.status ? (
                      <DeliveryStatusBadge
                        status={order.deliveryAssignment.status}
                      />
                    ) : null}

                    <button
                      type="button"
                      onClick={copyOrderId}
                      className={secondaryBtnClass}
                    >
                      Copy Order ID
                    </button>

                    <button
                      type="button"
                      onClick={downloadInvoice}
                      disabled={invoiceLoading}
                      className={secondaryBtnClass}
                    >
                      {invoiceLoading ? "Downloading..." : "Download Invoice"}
                    </button>
                  </div>
                ) : null}
              </div>

              {!loading && !error && order ? (
                <div className="relative mt-7 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] text-[#a7aec4]">
                    Order ID:{" "}
                    <span className="font-semibold text-white">
                      {order.orderId}
                    </span>
                  </span>

                  <Link
                    href={`/order-tracking?code=${encodeURIComponent(
                      trackingNumber
                    )}`}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
                  >
                    Track Order
                  </Link>
                </div>
              ) : null}
            </div>
          </section>

          {loading ? <LoadingSkeleton /> : null}

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

                <OrderTimeline status={order.status} />

                <section className={`${panelClass} p-5 sm:p-7`}>
                  <SectionTitle
                    eyebrow="Customer"
                    title="Customer Information"
                  />

                  <div className="mt-5">
                    <InfoRow label="Name" value={order.customer.name} />
                    <InfoRow label="Email" value={order.customer.email} />
                    <InfoRow
                      label="Shipping Address"
                      value={
                        <span className="whitespace-pre-line">
                          {order.customer.shippingAddress}
                        </span>
                      }
                    />
                  </div>
                </section>

                <section className={`${panelClass} p-5 sm:p-7`}>
                  <SectionTitle eyebrow="Products" title="Items Purchased" />

                  <div className="mt-5 overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824]">
                    <div className="hidden grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_0.7fr] border-b border-[#26293a] px-5 py-4 text-[12px] uppercase tracking-[0.14em] text-[#a7aec4] md:grid">
                      <div>Product</div>
                      <div>Size</div>
                      <div>Color</div>
                      <div className="text-center">Qty</div>
                      <div>Total</div>
                    </div>

                    {order.items.map((it) => (
                      <div
                        key={`${it.id}-${it.size}-${it.color}`}
                        className="border-b border-[#26293a] p-5 transition hover:bg-white/[0.02] last:border-0"
                      >
                        <div className="hidden grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_0.7fr] items-center gap-4 md:grid">
                          <div className="flex items-center gap-4">
                            <div className="relative h-[72px] w-[72px] overflow-hidden rounded-[18px] border border-[#26293a] bg-[#0d0f17]">
                              <Image
                                src={getProductImage(it.image)}
                                alt={it.name || "Product image"}
                                fill
                                sizes="72px"
                                className="object-cover"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="line-clamp-1 font-semibold text-white">
                                {it.name}
                              </div>

                              <div className="mt-1 text-[12px] text-[#a7aec4]">
                                {formatNPR(it.price)} per item
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => raiseTicket(it)}
                                  disabled={order.status === "Cancelled"}
                                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Need Help?
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openReviewModal(it)}
                                  disabled={order.status !== "Delivered"}
                                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Write Review
                                </button>
                              </div>
                            </div>
                          </div>

                          <span className="text-[#a7aec4]">
                            {it.size || "-"}
                          </span>

                          <div className="flex items-center gap-2 text-[#a7aec4]">
                            <span
                              className={`h-4 w-4 rounded-full border border-white/30 ${getColorDotClass(
                                it.color || it.colorLabel
                              )}`}
                            />
                            <span>{it.colorLabel || it.color || "-"}</span>
                          </div>

                          <div className="text-center text-[#a7aec4]">
                            {it.qty}
                          </div>

                          <span className="font-semibold text-[#d6c7ff]">
                            {formatNPR(it.price * it.qty)}
                          </span>
                        </div>

                        <div className="flex gap-4 md:hidden">
                          <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[18px] border border-[#26293a] bg-[#0d0f17]">
                            <Image
                              src={getProductImage(it.image)}
                              alt={it.name || "Product image"}
                              fill
                              sizes="82px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 font-semibold text-white">
                              {it.name}
                            </div>

                            <div className="mt-2 grid gap-1 text-sm text-[#a7aec4]">
                              <div>Size: {it.size || "-"}</div>

                              <div className="flex items-center gap-2">
                                <span>Color:</span>
                                <span
                                  className={`h-4 w-4 rounded-full border border-white/30 ${getColorDotClass(
                                    it.color || it.colorLabel
                                  )}`}
                                />
                                <span>{it.colorLabel || it.color || "-"}</span>
                              </div>

                              <div>Qty: {it.qty}</div>
                              <div>Price: {formatNPR(it.price)}</div>
                              <div className="font-semibold text-[#d6c7ff]">
                                Total: {formatNPR(it.price * it.qty)}
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => raiseTicket(it)}
                                disabled={order.status === "Cancelled"}
                                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Need Help?
                              </button>

                              <button
                                type="button"
                                onClick={() => openReviewModal(it)}
                                disabled={order.status !== "Delivered"}
                                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Write Review
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`${panelClass} p-5 sm:p-7`}>
                  <SectionTitle eyebrow="Payment" title="Payment Information" />

                  <div className="mt-5">
                    <InfoRow label="Method" value={order.payment.method} />
                  </div>
                </section>

                <section className={`${panelClass} p-5 sm:p-7`}>
                  <SectionTitle
                    eyebrow="Shipping"
                    title="Shipping Information"
                  />

                  <div className="mt-5">
                    <InfoRow label="Method" value={order.shipping.method} />
                    <InfoRow
                      label="Estimated Delivery"
                      value={order.shipping.estimatedDelivery || "—"}
                    />

                    {order.deliveryAssignment?.status ? (
                      <InfoRow
                        label="Delivery Status"
                        value={
                          <DeliveryStatusBadge
                            status={order.deliveryAssignment.status}
                          />
                        }
                      />
                    ) : null}

                    {order.deliveryAssignment?.name ? (
                      <InfoRow
                        label="Delivery Rider"
                        value={`${order.deliveryAssignment.name}${
                          order.deliveryAssignment.phone
                            ? ` • ${order.deliveryAssignment.phone}`
                            : ""
                        }`}
                      />
                    ) : null}

                    {order.deliveryAssignment?.assignedAt ? (
                      <InfoRow
                        label="Assigned At"
                        value={formatDateTime(
                          order.deliveryAssignment.assignedAt
                        )}
                      />
                    ) : null}

                    {order.deliveryAssignment?.pickedUpAt ? (
                      <InfoRow
                        label="Picked Up At"
                        value={formatDateTime(
                          order.deliveryAssignment.pickedUpAt
                        )}
                      />
                    ) : null}

                    {order.deliveryAssignment?.outForDeliveryAt ? (
                      <InfoRow
                        label="Out for Delivery At"
                        value={formatDateTime(
                          order.deliveryAssignment.outForDeliveryAt
                        )}
                      />
                    ) : null}

                    {order.deliveryAssignment?.deliveredAt ? (
                      <InfoRow
                        label="Delivered At"
                        value={formatDateTime(
                          order.deliveryAssignment.deliveredAt
                        )}
                      />
                    ) : null}

                    <InfoRow
                      label="Track Order"
                      value={
                        <Link
                          href={`/order-tracking?code=${encodeURIComponent(
                            trackingNumber
                          )}`}
                          className="text-white underline underline-offset-4 hover:text-[#d6c7ff]"
                        >
                          Click here to track
                        </Link>
                      }
                    />
                  </div>
                </section>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-[104px] lg:self-start">
                <section className={`${panelClass} p-5 sm:p-6`}>
                  <div className="flex items-center justify-between gap-4">
                    <SectionTitle eyebrow="Receipt" title="Summary" />
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="mt-6 space-y-4 text-[14px] text-[#a7aec4]">
                    <div className="flex justify-between gap-4">
                      <span>Subtotal</span>
                      <span className="text-white">
                        {formatNPR(order.summary.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span>Shipping</span>
                      <span className="text-white">
                        {formatNPR(order.summary.shipping)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span>Taxes</span>
                      <span className="text-white">
                        {formatNPR(order.summary.taxes)}
                      </span>
                    </div>

                    <div className="h-px bg-[#26293a]" />

                    <div className="flex justify-between gap-4 text-[18px] font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-white">
                        {formatNPR(order.summary.total)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={downloadInvoice}
                    disabled={invoiceLoading}
                    className={`${primaryBtnClass} mt-7 w-full`}
                  >
                    {invoiceLoading ? "Downloading..." : "Download Invoice"}
                  </button>
                </section>

                <DeliveryRiderCard assignment={order.deliveryAssignment} />

                <section className={`${panelClass} p-5 sm:p-6`}>
                  <SectionTitle eyebrow="Support" title="Need help?" />

                  <p className="mt-3 text-[13px] leading-6 text-[#a7aec4]">
                    For damaged items, late delivery, wrong size, or other
                    issues, use the Need Help button beside each product.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      ["Secure", "Payment"],
                      ["Easy", "Return"],
                      ["COD", "Available"],
                    ].map(([a, b]) => (
                      <div
                        key={`${a}-${b}`}
                        className="rounded-[16px] border border-[#26293a] bg-[#161824] p-3 text-center"
                      >
                        <div className="text-[12px] font-semibold text-white">
                          {a}
                        </div>
                        <div className="text-[11px] text-[#a7aec4]">{b}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          ) : null}
        </div>
      </main>

      <MainFooter />

      {reviewOpen && draft ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Write a review modal"
        >
          <button
            type="button"
            onClick={closeReviewModal}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close modal backdrop"
            title="Close"
          />

          <div
            className={`${panelClass} relative max-h-[90vh] w-full max-w-[580px] overflow-y-auto p-6 sm:p-7`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Product Review
                </div>
                <div className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Write a Review
                </div>
                <div className="mt-2 text-sm text-[#a7aec4]">
                  Product:{" "}
                  <span className="font-medium text-white">
                    {draft.productName}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#a7aec4]">
                  Order: {draft.orderId}
                </div>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                disabled={reviewSaving}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Rating
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDraft({ ...draft, rating: n })}
                      className={`h-11 w-11 rounded-full border text-sm font-semibold transition ${
                        draft.rating >= n
                          ? "border-white bg-white text-[#090a12]"
                          : "border-white/15 bg-white/5 text-[#a7aec4] hover:bg-white/10"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Title
                </div>

                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="Short title (optional)"
                  maxLength={80}
                  className="mt-2 h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                />
              </div>

              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Comment
                </div>

                <textarea
                  value={draft.comment}
                  onChange={(e) =>
                    setDraft({ ...draft, comment: e.target.value })
                  }
                  placeholder="Write your experience..."
                  rows={5}
                  maxLength={500}
                  className="mt-2 w-full resize-none rounded-[20px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                />

                <div className="mt-2 text-right text-[11px] text-[#7f879f]">
                  {draft.comment.length}/500
                </div>
              </div>

              {reviewError ? (
                <div className="rounded-[18px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {reviewError}
                </div>
              ) : null}

              {reviewOk ? (
                <div className="rounded-[18px] border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                  {reviewOk}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={reviewSaving}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSaving}
                  className={primaryBtnClass}
                >
                  {reviewSaving ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}