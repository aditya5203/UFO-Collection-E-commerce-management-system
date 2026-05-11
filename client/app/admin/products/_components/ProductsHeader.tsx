"use client";

import * as React from "react";
import {
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./productTypes";

type Props = {
  refreshing: boolean;
  canCreate: boolean;
  onRefresh: () => void;
  onCreate: () => void;
};

export default function ProductsHeader({
  refreshing,
  canCreate,
  onRefresh,
  onCreate,
}: Props) {
  return (
    <section
      className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
            Admin Catalog
          </div>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            Products
          </h1>

          <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            Manage products, pricing, media, categories, and variant-level stock
            by size and color from one premium catalog dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={secondaryBtnClass}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {canCreate ? (
            <button type="button" onClick={onCreate} className={primaryBtnClass}>
              Add Product
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}