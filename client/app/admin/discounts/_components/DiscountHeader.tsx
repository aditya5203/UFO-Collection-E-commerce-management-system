"use client";

import React from "react";
import { panelClass, primaryBtnClass } from "./discountTypes";
import { TabButton } from "./DiscountShared";

type Props = {
  tab: "coupons" | "collected";
  setTab: (tab: "coupons" | "collected") => void;
  canCreate: boolean;
  openCreate: () => void;
};

export default function DiscountHeader({
  tab,
  setTab,
  canCreate,
  openCreate,
}: Props) {
  return (
    <section
      className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
            Admin / Discounts
          </div>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            Discounts
          </h1>

          <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            Create coupon codes, manage discount rules, pause campaigns, check
            expiry dates, and track collected coupons used by customers at
            checkout.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <TabButton active={tab === "coupons"} onClick={() => setTab("coupons")}>
            Coupons
          </TabButton>

          <TabButton
            active={tab === "collected"}
            onClick={() => setTab("collected")}
          >
            Collected
          </TabButton>

          {tab === "coupons" && canCreate ? (
            <button type="button" onClick={openCreate} className={primaryBtnClass}>
              Create Coupon
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}