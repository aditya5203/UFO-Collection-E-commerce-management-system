"use client";

import * as React from "react";
import Link from "next/link";
import {
  SummaryResponse,
  formatDate,
  formatMoneyNPR,
  normalizeStatus,
  panelClass,
  secondaryBtnClass,
} from "./dashboardTypes";
import { Badge } from "./DashboardShared";

type Props = {
  summary: SummaryResponse["data"] | null;
};

export default function RecentOrdersTable({ summary }: Props) {
  return (
    <div className={`${panelClass} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-[#26293a] px-5 py-4 sm:px-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Orders
          </div>

          <div className="mt-1 text-[20px] font-semibold text-white">
            Recent Orders
          </div>
        </div>

        <Link href="/admin/orders" className={secondaryBtnClass}>
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
              <th className="px-5 py-4 font-medium">Order ID</th>
              <th className="px-5 py-4 font-medium">Customer</th>
              <th className="px-5 py-4 font-medium">Total</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Date</th>
            </tr>
          </thead>

          <tbody>
            {(summary?.recentOrders || []).map((o) => {
              const status = normalizeStatus(o.orderStatus);

              return (
                <Tr
                  key={o.id || o.orderCode}
                  id={o.orderCode || o.id}
                  name={o.customerName || "Customer"}
                  email={o.customerEmail}
                  total={formatMoneyNPR(o.totalPaisa)}
                  date={formatDate(o.createdAt)}
                  badge={
                    <Badge
                      variant={
                        status === "delivered"
                          ? "delivered"
                          : status === "shipped"
                            ? "shipped"
                            : status === "cancelled"
                              ? "cancelled"
                              : "pending"
                      }
                    >
                      {o.orderStatus || "Pending"}
                    </Badge>
                  }
                />
              );
            })}
          </tbody>
        </table>

        {(!summary?.recentOrders || summary.recentOrders.length === 0) && (
          <div className="px-6 py-8 text-center text-[13px] text-[#a7aec4]">
            No recent orders yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Tr({
  id,
  name,
  email,
  total,
  date,
  badge,
}: {
  id: string;
  name: string;
  email?: string;
  total: string;
  date: string;
  badge: React.ReactNode;
}) {
  return (
    <tr className="border-t border-[#26293a] transition hover:bg-white/[0.03]">
      <td className="px-5 py-4">
        <div className="font-semibold text-white">{id}</div>
      </td>

      <td className="px-5 py-4">
        <div className="font-medium text-white">{name}</div>

        {email ? (
          <div className="mt-1 text-[12px] text-[#7f879f]">{email}</div>
        ) : null}
      </td>

      <td className="px-5 py-4 font-semibold text-[#d6c7ff]">{total}</td>
      <td className="px-5 py-4">{badge}</td>
      <td className="px-5 py-4 text-[#a7aec4]">{date || "-"}</td>
    </tr>
  );
}