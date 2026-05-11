"use client";

import { StatusBadge, DeliveryStatusBadge } from "./OrderHero";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function formatNPR(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
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

function prettyRequestType(value?: string) {
  const v = String(value || "").toUpperCase();

  const map: Record<string, string> = {
    RETURN_REFUND: "Return & Refund",
    EXCHANGE: "Exchange Product",
    DAMAGED: "Damaged Product",
    WRONG_ITEM: "Wrong Item Received",
    SIZE_COLOR_ISSUE: "Size / Color Issue",
    NOT_SATISFIED: "Not Satisfied",
    OTHER: "Other",
  };

  return map[v] || "Return & Refund";
}

function prettyRefundMethod(value?: string) {
  const v = String(value || "").toUpperCase();

  const map: Record<string, string> = {
    BANK: "Bank Transfer",
    KHALTI: "Khalti",
    ESEWA: "eSewa",
    FONEPAY: "Fonepay",
    COD: "Cash on Delivery",
    MANUAL: "Manual",
  };

  return map[v] || value || "—";
}

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
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

function SmallStatusBadge({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "slate" | "yellow" | "blue" | "green" | "red" | "purple" | "orange";
}) {
  const map: Record<string, string> = {
    slate: "border-slate-500/30 bg-slate-500/15 text-slate-100",
    yellow: "border-yellow-500/30 bg-yellow-500/15 text-yellow-100",
    blue: "border-blue-500/30 bg-blue-500/15 text-blue-100",
    green: "border-green-500/30 bg-green-500/15 text-green-100",
    red: "border-red-500/30 bg-red-500/15 text-red-100",
    purple: "border-purple-500/30 bg-purple-500/15 text-purple-100",
    orange: "border-orange-500/30 bg-orange-500/15 text-orange-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold ${map[tone]}`}
    >
      {label}
    </span>
  );
}

function RequestStatusPanel({
  order,
  refundAmount,
  onOpenRefundDetails,
}: {
  order: any;
  refundAmount: number;
  onOpenRefundDetails: () => void;
}) {
  const hasCancel =
    order.cancelRequest?.status && order.cancelRequest.status !== "NONE";
  const hasReturn =
    order.returnRequest?.status && order.returnRequest.status !== "NONE";
  const hasRefund = order.refund?.status && order.refund.status !== "NONE";
  const hasExchange =
    order.exchange?.status && order.exchange.status !== "NONE";

  if (!hasCancel && !hasReturn && !hasRefund && !hasExchange) return null;

  return (
    <div className="mt-5 space-y-3">
      {hasCancel ? (
        <div className="rounded-[18px] border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          <div className="flex flex-wrap items-center gap-2">
            <span>Cancellation Status:</span>
            <SmallStatusBadge
              label={order.cancelRequest?.status || "NONE"}
              tone="yellow"
            />
          </div>

          {order.cancelRequest?.reason ? (
            <div className="mt-2 text-yellow-100/80">
              Reason: {order.cancelRequest.reason}
            </div>
          ) : null}

          {order.cancelRequest?.adminNote ? (
            <div className="mt-2 text-yellow-100/80">
              Admin Note: {order.cancelRequest.adminNote}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasReturn ? (
        <div className="rounded-[18px] border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
          <div className="flex flex-wrap items-center gap-2">
            <span>Return Request:</span>
            <SmallStatusBadge
              label={order.returnRequest?.status || "NONE"}
              tone="blue"
            />
          </div>

          <div className="mt-2 text-blue-100/80">
            Type: {prettyRequestType(order.returnRequest?.type)}
          </div>

          <div className="mt-2 text-blue-100/80">
            Preferred Solution:{" "}
            {order.returnRequest?.preferredResolution === "EXCHANGE"
              ? "Exchange Product"
              : "Refund Money"}
          </div>

          {order.returnRequest?.reason ? (
            <div className="mt-2 text-blue-100/80">
              Reason: {order.returnRequest.reason}
            </div>
          ) : null}

          {order.returnRequest?.adminNote ? (
            <div className="mt-2 text-blue-100/80">
              Admin Note: {order.returnRequest.adminNote}
            </div>
          ) : null}

          {order.returnRequest?.requestedAt ? (
            <div className="mt-2 text-blue-100/70">
              Requested: {formatDateTime(order.returnRequest.requestedAt)}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasExchange ? (
        <div className="rounded-[18px] border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-100">
          <div className="flex flex-wrap items-center gap-2">
            <span>Exchange Status:</span>
            <SmallStatusBadge
              label={order.exchange?.status || "NONE"}
              tone="purple"
            />
          </div>

          {order.exchange?.reason ? (
            <div className="mt-2 text-purple-100/80">
              Reason: {order.exchange.reason}
            </div>
          ) : null}

          {order.exchange?.adminNote ? (
            <div className="mt-2 text-purple-100/80">
              Admin Note: {order.exchange.adminNote}
            </div>
          ) : null}

          {order.exchange?.replacementAssignedAt ? (
            <div className="mt-2 text-purple-100/70">
              Replacement Assigned:{" "}
              {formatDateTime(order.exchange.replacementAssignedAt)}
            </div>
          ) : null}

          {order.exchange?.completedAt ? (
            <div className="mt-2 text-purple-100/70">
              Completed: {formatDateTime(order.exchange.completedAt)}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasRefund ? (
        <div className="rounded-[18px] border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100">
          <div className="flex flex-wrap items-center gap-2">
            <span>Refund Status:</span>
            <SmallStatusBadge
              label={order.refund?.status || "NONE"}
              tone="green"
            />
          </div>

          <div className="mt-2 text-green-100/80">
            Amount: {formatNPR(refundAmount)}
          </div>

          {order.refund?.method ? (
            <div className="mt-2 text-green-100/80">
              Method: {prettyRefundMethod(order.refund.method)}
            </div>
          ) : null}

          {order.refund?.transactionRef ? (
            <div className="mt-2 text-green-100/80">
              Transaction Ref: {order.refund.transactionRef}
            </div>
          ) : null}

          {order.refund?.adminNote ? (
            <div className="mt-2 text-green-100/80">
              Admin Note: {order.refund.adminNote}
            </div>
          ) : null}

          {order.refund?.status === "PENDING_ACCOUNT_DETAILS" ? (
            <button
              type="button"
              onClick={onOpenRefundDetails}
              className={`${primaryBtnClass} mt-4 w-full`}
            >
              Submit Refund Details
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DeliveryRiderCard({
  title = "Rider Details",
  assignment,
}: {
  title?: string;
  assignment?: any;
}) {
  if (!assignment?.name && !assignment?.status) return null;

  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <SectionTitle eyebrow="Delivery" title={title} />

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

          {assignment?.assignedAt ? (
            <div>
              Assigned:{" "}
              <span className="text-white">
                {formatDateTime(assignment.assignedAt)}
              </span>
            </div>
          ) : null}

          {assignment?.pickedUpAt ? (
            <div>
              Picked Up:{" "}
              <span className="text-white">
                {formatDateTime(assignment.pickedUpAt)}
              </span>
            </div>
          ) : null}

          {assignment?.returnedToStoreAt ? (
            <div>
              Returned to Store:{" "}
              <span className="text-white">
                {formatDateTime(assignment.returnedToStoreAt)}
              </span>
            </div>
          ) : null}

          {assignment?.deliveredAt ? (
            <div>
              Delivered:{" "}
              <span className="text-white">
                {formatDateTime(assignment.deliveredAt)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function OrderSidebar({
  order,
  refundAmount,
  invoiceLoading,
  canRequestCancel,
  canRequestReturn,
  downloadInvoice,
  openRefundDetails,
  openCancelRequest,
  openReturnModal,
}: {
  order: any;
  refundAmount: number;
  invoiceLoading: boolean;
  canRequestCancel: boolean;
  canRequestReturn: boolean;
  downloadInvoice: () => void;
  openRefundDetails: () => void;
  openCancelRequest: () => void;
  openReturnModal: () => void;
}) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-[104px] lg:self-start">
      <section className={`${panelClass} p-5 sm:p-6`}>
        <div className="flex items-center justify-between gap-4">
          <SectionTitle eyebrow="Receipt" title="Summary" />
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-6 space-y-4 text-[14px] text-[#a7aec4]">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span className="text-white">{formatNPR(order.summary.subtotal)}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span>Shipping</span>
            <span className="text-white">{formatNPR(order.summary.shipping)}</span>
          </div>

          {Number(order.summary.discount || 0) > 0 ? (
            <div className="flex justify-between gap-4">
              <span>Discount</span>
              <span className="text-green-200">
                - {formatNPR(order.summary.discount)}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between gap-4">
            <span>Taxes</span>
            <span className="text-white">{formatNPR(order.summary.taxes)}</span>
          </div>

          <div className="h-px bg-[#26293a]" />

          <div className="flex justify-between gap-4 text-[18px] font-semibold">
            <span className="text-white">Total</span>
            <span className="text-white">{formatNPR(order.summary.total)}</span>
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

      <section className={`${panelClass} p-5 sm:p-6`}>
        <SectionTitle eyebrow="After Sales" title="Cancellation, Return & Exchange" />

        <p className="mt-3 text-[13px] leading-6 text-[#a7aec4]">
          Cancel before shipping, or after delivery request return, refund, or
          exchange. Admin will review, assign pickup, and update the process.
        </p>

        <RequestStatusPanel
          order={order}
          refundAmount={refundAmount}
          onOpenRefundDetails={openRefundDetails}
        />

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={openCancelRequest}
            disabled={!canRequestCancel}
            className={`${secondaryBtnClass} w-full`}
          >
            Request Cancellation
          </button>

          <button
            type="button"
            onClick={openReturnModal}
            disabled={!canRequestReturn}
            className={`${secondaryBtnClass} w-full`}
          >
            Request Return / Exchange
          </button>

          {!canRequestCancel && !canRequestReturn ? (
            <div className="text-[12px] leading-5 text-[#7f879f]">
              Cancellation is available before shipping. Return or exchange is
              available only after delivery and only when no active request
              exists.
            </div>
          ) : null}
        </div>
      </section>

      <DeliveryRiderCard title="Delivery Rider" assignment={order.deliveryAssignment} />
      <DeliveryRiderCard title="Return Pickup Rider" assignment={order.returnPickupAssignment} />
      <DeliveryRiderCard title="Exchange Pickup Rider" assignment={order.exchangePickupAssignment} />
      <DeliveryRiderCard title="Replacement Delivery Rider" assignment={order.replacementDeliveryAssignment} />

      <section className={`${panelClass} p-5 sm:p-6`}>
        <SectionTitle eyebrow="Support" title="Need help?" />

        <p className="mt-3 text-[13px] leading-6 text-[#a7aec4]">
          For damaged items, late delivery, wrong size, or other issues, use the
          Need Help button beside each product.
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
              <div className="text-[12px] font-semibold text-white">{a}</div>
              <div className="text-[11px] text-[#a7aec4]">{b}</div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}