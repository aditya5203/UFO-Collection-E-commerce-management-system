"use client";

import * as React from "react";
import { SummaryResponse, formatMoneyNPR } from "./dashboardTypes";
import { StatCard } from "./DashboardShared";

type Props = {
  summary: SummaryResponse["data"] | null;
};

export default function DashboardStats({ summary }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Orders"
        value={String(summary?.top?.totalOrders ?? 0)}
        helper="All customer orders"
        iconSrc="/images/admin/orders.png"
      />

      <StatCard
        label="Total Revenue"
        value={formatMoneyNPR(summary?.top?.totalRevenuePaisa ?? 0)}
        helper="Completed revenue"
        iconSrc="/images/admin/revenue.png"
      />

      <StatCard
        label="Total Customers"
        value={String(summary?.top?.totalCustomers ?? 0)}
        helper="Registered users"
        iconSrc="/images/admin/customer.png"
      />

      <StatCard
        label="Products Live"
        value={String(summary?.top?.totalProductsLive ?? 0)}
        helper="Active catalog items"
        iconSrc="/images/admin/product.png"
      />
    </section>
  );
}