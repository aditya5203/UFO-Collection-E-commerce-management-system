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

        <div className="flex h-[46px] w-full items-center rounded-full border border-white/10 bg-white/5 px-4 sm:min-w-[340px] xl:w-[380px]">
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
            placeholder="Search order, customer, status..."
            className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
          />
        </div>
      </div>

      {loading ? (
        <OrderSkeleton />
      ) : rows.length ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1180px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                  <th className="px-5 py-4 font-medium">Order</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Items</th>
                  <th className="px-5 py-4 font-medium">Payment & Total</th>
                  <th className="px-5 py-4 font-medium">Fulfillment</th>
                  <th className="px-5 py-4 font-medium">After Sales</th>
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
                      className="border-t border-[#26293a] transition hover:bg-white/[0.035]"
                    >
                      <td className="px-5 py-5">
                        <div className="font-semibold text-white">{code}</div>
                        <div className="mt-1 text-[12px] text-[#7f879f]">
                          {formatDateShort(o.createdAt)}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="max-w-[220px]">
                          <div className="line-clamp-1 font-semibold text-white">
                            {cname}
                          </div>

                          <div className="mt-1 line-clamp-1 text-[12px] text-[#7f879f]">
                            {cemail}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <OrderVariantPreview items={o.items} />
                      </td>

                      <td className="px-5 py-5">
                        <div className="space-y-2">
                          <div className="font-semibold text-[#d6c7ff]">
                            {formatNPR(o.totalPaisa)}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <MethodBadge>{methodLabel}</MethodBadge>

                            <PaymentBadge status={o.paymentStatus}>
                              {o.paymentStatus}
                            </PaymentBadge>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="space-y-3">
                          <OrderBadge status={o.orderStatus}>
                            {o.orderStatus}
                          </OrderBadge>

                          {taskCards.length ? (
                            <div className="flex max-w-[280px] flex-wrap gap-2">
                              {taskCards.slice(0, 2).map((task, index) => (
                                <TaskBadge
                                  key={`${task.title}-${index}`}
                                  title={task.title}
                                  status={task.status}
                                  name={task.name}
                                  tone={task.tone}
                                />
                              ))}

                              {taskCards.length > 2 ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-[#a7aec4]">
                                  +{taskCards.length - 2} more
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#7f879f]">
                              No task assigned
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        {afterSalesLabels.length ? (
                          <div className="flex max-w-[240px] flex-wrap gap-2">
                            {afterSalesLabels.slice(0, 2).map((item, index) => (
                              <AfterSalesBadge
                                key={`${item.label}-${index}`}
                                tone={item.tone}
                              >
                                {item.label}
                              </AfterSalesBadge>
                            ))}

                            {afterSalesLabels.length > 2 ? (
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-[#a7aec4]">
                                +{afterSalesLabels.length - 2} more
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#7f879f]">—</span>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className={actionBtnClass}
                          >
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

          <div className="grid gap-4 p-4 lg:hidden">
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
                <article
                  key={o.id}
                  className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#7f879f]">
                        Order
                      </div>

                      <div className="mt-1 font-semibold text-white">{code}</div>

                      <div className="mt-1 text-[12px] text-[#7f879f]">
                        {formatDateShort(o.createdAt)}
                      </div>
                    </div>

                    <OrderBadge status={o.orderStatus}>{o.orderStatus}</OrderBadge>
                  </div>

                  <div className="mt-4 rounded-[18px] border border-white/10 bg-black/10 p-3">
                    <div className="font-semibold text-white">{cname}</div>

                    <div className="mt-1 line-clamp-1 text-[12px] text-[#7f879f]">
                      {cemail}
                    </div>
                  </div>

                  <div className="mt-4">
                    <OrderVariantPreview items={o.items} />
                  </div>

                  <div className="mt-4 grid gap-3 rounded-[18px] border border-white/10 bg-black/10 p-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#7f879f]">
                        Payment & Total
                      </div>

                      <div className="mt-1 font-semibold text-[#d6c7ff]">
                        {formatNPR(o.totalPaisa)}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <MethodBadge>{methodLabel}</MethodBadge>

                        <PaymentBadge status={o.paymentStatus}>
                          {o.paymentStatus}
                        </PaymentBadge>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#7f879f]">
                        Delivery Tasks
                      </div>

                      {taskCards.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
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
                        <div className="mt-2 text-[12px] text-[#7f879f]">
                          No task assigned
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#7f879f]">
                        After Sales
                      </div>

                      {afterSalesLabels.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
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
                        <div className="mt-2 text-[12px] text-[#7f879f]">
                          —
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
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
                </article>
              );
            })}
          </div>
        </>
      ) : hasSearch ? (
        <NoSearchResults />
      ) : (
        <EmptyState />
      )}
    </section>
  );
}