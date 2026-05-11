"use client";

import * as React from "react";
import { MetricCard } from "./ProductShared";

type Props = {
  total: number;
  activeCount: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export default function ProductsStats({
  total,
  activeCount,
  lowStockCount,
  outOfStockCount,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total Products"
        value={String(total)}
        iconSrc="/images/admin/product.png"
      />

      <MetricCard
        label="Active"
        value={String(activeCount)}
        iconSrc="/images/admin/active.png"
      />

      <MetricCard
        label="Low Stock"
        value={String(lowStockCount)}
        iconSrc="/images/admin/stock.png"
      />

      <MetricCard
        label="Out of Stock"
        value={String(outOfStockCount)}
        iconSrc="/images/admin/inactive.png"
      />
    </section>
  );
}