"use client";

import * as React from "react";
import { formatNPR } from "./orderTypes";
import { MetricCard } from "./OrderShared";

type Props = {
  totalOrders: number;
  paidCount: number;
  pendingCount: number;
  afterSalesCount: number;
  totalOrderValue: number;
};

export default function OrdersStats({
  totalOrders,
  paidCount,
  pendingCount,
  afterSalesCount,
  totalOrderValue,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Total Orders"
        value={String(totalOrders)}
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
  );
}