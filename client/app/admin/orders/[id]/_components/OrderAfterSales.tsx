"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  AdminOrderDetail,
  AfterSalesAction,
  ExchangeStatus,
  RefundStatus,
  RequestStatus,
  ReturnStatus,
  dangerBtnClass,
  formatDateTime,
  formatNPR,
  getImageSrc,
  panelClass,
  prettyRequestType,
  prettyStatus,
  primaryBtnClass,
  secondaryBtnClass,
} from "./orderDetailsTypes";
import {
  AssignmentCard,
  LineItem,
  RequestCard,
  StatusPill,
} from "./OrderDetailsShared";

type Props = {
  order: AdminOrderDetail;
  canViewReturnsRefunds: boolean;
  cancelStatus: RequestStatus;
  returnStatus: ReturnStatus;
  refundStatus: RefundStatus;
  exchangeStatus: ExchangeStatus;
  isExchangeRequest: boolean;
  hasAfterSalesData: boolean;
  totalPaisa: number;
  requestActionLoading: boolean;
  openRequestAction: (action: AfterSalesAction) => void;
};

export default function OrderAfterSales({
  order,
  canViewReturnsRefunds,
  cancelStatus,
  returnStatus,
  refundStatus,
  exchangeStatus,
  isExchangeRequest,
  hasAfterSalesData,
  totalPaisa,
  requestActionLoading,
  openRequestAction,
}: Props) {
  if (!canViewReturnsRefunds) return null;

  return (
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
            Manage cancellation, return pickup, refund details, exchange pickup,
            and replacement delivery.
          </p>
        </div>

        <Link href="/admin/returns-refunds" className={secondaryBtnClass}>
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
                    onClick={() => openRequestAction("approveCancel")}
                    disabled={requestActionLoading}
                    className={primaryBtnClass}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => openRequestAction("rejectCancel")}
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
            title={isExchangeRequest ? "Exchange Request" : "Return Request"}
            status={returnStatus}
            reason={order.returnRequest?.reason}
            requestedAt={order.returnRequest?.requestedAt}
            resolvedAt={order.returnRequest?.resolvedAt || order.returnRequest?.receivedAt}
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
                  value={order.returnRequest?.preferredResolution || "-"}
                />

                {Array.isArray(order.returnRequest?.images) &&
                order.returnRequest.images.length ? (
                  <div className="mt-3">
                    <div className="mb-2 text-[12px] text-[#a7aec4]">
                      Evidence Images
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.returnRequest.images.map((img, index) => (
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
                      ))}
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
                    onClick={() => openRequestAction("approveReturn")}
                    disabled={requestActionLoading}
                    className={primaryBtnClass}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => openRequestAction("rejectReturn")}
                    disabled={requestActionLoading}
                    className={dangerBtnClass}
                  >
                    Reject
                  </button>
                </>
              ) : returnStatus === "APPROVED" && !isExchangeRequest ? (
                <button
                  type="button"
                  onClick={() => openRequestAction("assignReturnPickup")}
                  disabled={requestActionLoading}
                  className={primaryBtnClass}
                >
                  Assign Return Pickup
                </button>
              ) : returnStatus === "APPROVED" && isExchangeRequest ? (
                <button
                  type="button"
                  onClick={() => openRequestAction("assignExchangePickup")}
                  disabled={requestActionLoading}
                  className={primaryBtnClass}
                >
                  Assign Exchange Pickup
                </button>
              ) : ["PICKED_UP", "RECEIVED"].includes(returnStatus) ? (
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
            requestedAt={order.exchange?.requestedAt || order.returnRequest?.requestedAt}
            resolvedAt={order.exchange?.completedAt || order.exchange?.replacementDeliveredAt}
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
                  value={formatDateTime(order.exchange?.pickupAssignedAt)}
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
                  value={formatDateTime(order.exchange?.replacementAssignedAt)}
                />
                <LineItem
                  label="Replacement Delivered"
                  value={formatDateTime(order.exchange?.replacementDeliveredAt)}
                />
              </>
            }
            actions={
              exchangeStatus === "RECEIVED" ? (
                <button
                  type="button"
                  onClick={() => openRequestAction("assignReplacement")}
                  disabled={requestActionLoading}
                  className={primaryBtnClass}
                >
                  Assign Replacement Rider
                </button>
              ) : exchangeStatus === "REPLACEMENT_DELIVERED" ? (
                <button
                  type="button"
                  onClick={() => openRequestAction("completeExchange")}
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
          <RefundBlock
            order={order}
            refundStatus={refundStatus}
            totalPaisa={totalPaisa}
            requestActionLoading={requestActionLoading}
            openRequestAction={openRequestAction}
          />
        ) : null}

        {!hasAfterSalesData ? (
          <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4 text-[13px] text-[#a7aec4]">
            No cancellation, return, exchange, or refund request found for this
            order.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RefundBlock({
  order,
  refundStatus,
  totalPaisa,
  requestActionLoading,
  openRequestAction,
}: {
  order: AdminOrderDetail;
  refundStatus: RefundStatus;
  totalPaisa: number;
  requestActionLoading: boolean;
  openRequestAction: (action: AfterSalesAction) => void;
}) {
  return (
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
          value={formatNPR(Number(order.refund?.amountPaisa || totalPaisa))}
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
          value={formatDateTime(order.refund?.requestedDetailsAt)}
          valueClassName="text-emerald-100"
        />
        <LineItem
          label="Details Submitted"
          value={formatDateTime(order.refund?.detailsSubmittedAt)}
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
              onClick={() => openRequestAction("requestRefundDetails")}
              disabled={requestActionLoading}
              className={secondaryBtnClass}
            >
              Request Details
            </button>
          ) : null}

          {["PENDING", "PENDING_ACCOUNT_DETAILS", "READY_TO_REFUND"].includes(
            refundStatus
          ) ? (
            <button
              type="button"
              onClick={() => openRequestAction("markRefundProcessing")}
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
  );
}