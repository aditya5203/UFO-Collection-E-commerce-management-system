"use client";

import Link from "next/link";
import * as React from "react";
import {
  CustomerRow,
  CustomerStatus,
  formatDateShort,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./customerDetailsTypes";
import { Badge, CustomerStatusPill, StatCard } from "./CustomerShared";

type Props = {
  customer: CustomerRow;
  customerStatus: CustomerStatus;
  ordersCount: number;
  onRefresh: () => void;
};

export default function CustomerHeaderStats({
  customer,
  customerStatus,
  ordersCount,
  onRefresh,
}: Props) {
  return (
    <>
      <section
        className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Admin / Customers / Details
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                {customer.name || "-"}
              </h1>

              <Badge text={customer.role || "customer"} />
              <CustomerStatusPill status={customerStatus} />
            </div>

            <p className="mt-2 max-w-[680px] text-[13px] leading-7 text-[#a7aec4]">
              {customer.email || "-"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={onRefresh} className={primaryBtnClass}>
              Refresh
            </button>

            <Link href="/admin/customers" className={secondaryBtnClass}>
              Back
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Created At"
          value={formatDateShort(customer.createdAt)}
          hint="Account creation date"
          iconSrc="/images/admin/calendar.png"
        />

        <StatCard
          label="Last Login"
          value={formatDateShort(customer.lastLogin)}
          hint="Last time user logged in"
          iconSrc="/images/admin/clock.png"
        />

        <StatCard
          label="Total Orders"
          value={String(ordersCount)}
          hint="Lifetime orders"
          iconSrc="/images/admin/orders.png"
        />
      </section>
    </>
  );
}