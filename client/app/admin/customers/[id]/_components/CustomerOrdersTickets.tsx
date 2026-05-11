"use client";

import Link from "next/link";
import * as React from "react";
import {
  actionBtnClass,
  formatDateShort,
  formatNPR,
  OrderRow,
  secondaryBtnClass,
  TabKey,
  TicketRow,
} from "./customerDetailsTypes";
import {
  OrderStatusPill,
  PaymentPill,
  TableShell,
  TicketStatusPill,
} from "./CustomerShared";

type Props = {
  tab: TabKey;
  canViewOrders: boolean;
  canViewTickets: boolean;

  orders: OrderRow[];
  ordersLoading: boolean;
  ordersError: string;
  onRefreshOrders: () => void;

  tickets: TicketRow[];
  ticketsLoading: boolean;
  ticketsError: string;
  onRefreshTickets: () => void;
};

export default function CustomerOrdersTickets({
  tab,
  canViewOrders,
  canViewTickets,
  orders,
  ordersLoading,
  ordersError,
  onRefreshOrders,
  tickets,
  ticketsLoading,
  ticketsError,
  onRefreshTickets,
}: Props) {
  return (
    <>
      {tab === "orders" && canViewOrders ? (
        <TableShell
          title="Orders"
          right={
            <button
              type="button"
              onClick={onRefreshOrders}
              className={secondaryBtnClass}
              disabled={ordersLoading}
            >
              {ordersLoading ? "Refreshing..." : "Refresh"}
            </button>
          }
        >
          {ordersError ? (
            <div className="px-5 py-4">
              <div className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
                {ordersError}
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                  <th className="px-5 py-4 font-medium">Order</th>
                  <th className="px-5 py-4 font-medium">Total</th>
                  <th className="px-5 py-4 font-medium">Payment</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Created</th>
                  <th className="px-5 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[#a7aec4]">
                      Loading...
                    </td>
                  </tr>
                ) : orders.length ? (
                  orders.map((o) => {
                    const code = o.orderCode || o.id;
                    const paisa = Number.isFinite(o.totalPaisa as number)
                      ? (o.totalPaisa as number)
                      : Math.round(Number(o.total || 0) * 100);

                    return (
                      <tr
                        key={o.id}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4 font-semibold text-white">
                          {code}
                        </td>

                        <td className="px-5 py-4 font-semibold text-[#d6c7ff]">
                          {formatNPR(paisa)}
                        </td>

                        <td className="px-5 py-4">
                          <PaymentPill status={o.paymentStatus}>
                            {o.paymentStatus}
                          </PaymentPill>
                        </td>

                        <td className="px-5 py-4">
                          <OrderStatusPill status={o.orderStatus}>
                            {o.orderStatus}
                          </OrderStatusPill>
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {formatDateShort(o.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link href={`/admin/orders/${o.id}`} className={actionBtnClass}>
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[#a7aec4]">
                      No orders for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      ) : null}

      {tab === "tickets" && canViewTickets ? (
        <TableShell
          title="Customer Tickets"
          right={
            <button
              type="button"
              onClick={onRefreshTickets}
              className={secondaryBtnClass}
              disabled={ticketsLoading}
            >
              {ticketsLoading ? "Refreshing..." : "Refresh"}
            </button>
          }
        >
          {ticketsError ? (
            <div className="px-5 py-4">
              <div className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
                {ticketsError}
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                  <th className="px-5 py-4 font-medium">Ticket</th>
                  <th className="px-5 py-4 font-medium">Subject</th>
                  <th className="px-5 py-4 font-medium">Issue Type</th>
                  <th className="px-5 py-4 font-medium">Product</th>
                  <th className="px-5 py-4 font-medium">Order</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Submitted</th>
                  <th className="px-5 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {ticketsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-[#a7aec4]">
                      Loading tickets...
                    </td>
                  </tr>
                ) : tickets.length ? (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 font-semibold text-white">
                        {ticket.ticketCode || ticket.ticketId || ticket.id}
                      </td>

                      <td className="px-5 py-4 text-white">
                        <div className="max-w-[260px] truncate">
                          {ticket.subject || "-"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        {ticket.issueType || "-"}
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        <div className="max-w-[240px] truncate">
                          {ticket.productName || "-"}
                        </div>

                        <div className="mt-1 text-[11px] text-[#7f879f]">
                          Size: {ticket.size || "-"} • Color: {ticket.color || "-"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        {ticket.orderId || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <TicketStatusPill status={ticket.status}>
                          {ticket.status}
                        </TicketStatusPill>
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        {formatDateShort(ticket.submittedAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/customer-tickets/${ticket.id}`}
                          className={actionBtnClass}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-[#a7aec4]">
                      No tickets found for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableShell>
      ) : null}
    </>
  );
}