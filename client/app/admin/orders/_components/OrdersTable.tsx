"use client";

import * as React from "react";
import Link from "next/link";
import {
  OrderRow,
  actionBtnClass,
  formatDateShort,
  formatNPR,
  getAfterSalesLabels,
  getTaskCards,
  normalizePaymentMethod,
  panelClass,
} from "./orderTypes";
import {
  AfterSalesBadge,
  EmptyState,
  MethodBadge,
  NoSearchResults,
  OrderBadge,
  OrderSkeleton,
  PaymentBadge,
  TaskBadge,
} from "./OrderShared";
import OrderVariantPreview from "./OrderVariantPreview";

type Props = {
  q: string;
  setQ: (value: string) => void;
  rows: OrderRow[];
  loading: boolean;
  searching: boolean;
  hasSearch: boolean;
  downloadingId: string;
  downloadInvoice: (orderId: string, orderCode?: string) => void;
};

export default function OrdersTable({
  q,
  setQ,
  rows,
  loading,
  searching,
  hasSearch,
  downloadingId,
  downloadInvoice,
}: Props) {
  return (
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
            <div className="mt-1 text-[12px] text-[#7f879f]">Searching...</div>
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
                <th className="px-5 py-4 text-right font-medium">Actions</th>
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
                      <div className="font-semibold text-white">{code}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{cname}</div>

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
                        <span className="text-[12px] text-[#7f879f]">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-[#a7aec4]">
                      {formatDateShort(o.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/orders/${o.id}`} className={actionBtnClass}>
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={() => downloadInvoice(o.id, o.orderCode)}
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
  );
}