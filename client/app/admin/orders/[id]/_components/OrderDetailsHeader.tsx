"use client";

import Link from "next/link";
import * as React from "react";
import {
  AdminOrderDetail,
  DeliveryAssignmentStatus,
  ExchangeStatus,
  OrderStatus,
  PaymentStatus,
  RefundStatus,
  ReturnStatus,
  panelClass,
  prettyStatus,
  safeStr,
  secondaryBtnClass,
} from "./orderDetailsTypes";
import { StatusPill } from "./OrderDetailsShared";

type Props = {
  order: AdminOrderDetail;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryAssignmentStatus;
  returnStatus: ReturnStatus;
  exchangeStatus: ExchangeStatus;
  refundStatus: RefundStatus;
  otpVerified: boolean;
  placedOn: string;
  refreshing: boolean;
  downloadingInvoice: boolean;
  customerId: string;
  onRefresh: () => void;
  onDownloadInvoice: () => void;
};

export default function OrderDetailsHeader({
  order,
  paymentStatus,
  orderStatus,
  deliveryStatus,
  returnStatus,
  exchangeStatus,
  refundStatus,
  otpVerified,
  placedOn,
  refreshing,
  downloadingInvoice,
  customerId,
  onRefresh,
  onDownloadInvoice,
}: Props) {
  return (
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
              <StatusPill>Exchange {prettyStatus(exchangeStatus)}</StatusPill>
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
          (orderStatus === "Delivered" || deliveryStatus === "Delivered") ? (
            <div className="mt-4 rounded-[16px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[13px] leading-6 text-amber-200">
              Delivered status requires delivery OTP verification.
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={secondaryBtnClass}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={onDownloadInvoice}
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
  );
}