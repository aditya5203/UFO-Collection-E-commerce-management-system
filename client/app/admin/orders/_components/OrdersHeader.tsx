"use client";

import * as React from "react";
import Link from "next/link";
import { panelClass, secondaryBtnClass } from "./orderTypes";

type Props = {
  refreshing: boolean;
  onRefresh: () => void;
};

export default function OrdersHeader({ refreshing, onRefresh }: Props) {
  return (
    <section
      className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
            Admin Sales
          </div>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            Orders
          </h1>

          <p className="mt-2 max-w-[700px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            Track customer orders, payment status, delivery progress, return
            pickup, exchange pickup, replacement delivery, refunds, and purchased
            product variants in real time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/returns-refunds" className={secondaryBtnClass}>
            Returns & Refunds
          </Link>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={secondaryBtnClass}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    </section>
  );
}