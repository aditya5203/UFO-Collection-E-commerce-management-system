"use client";

import * as React from "react";
import {
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./analyticsTypes";

type Props = {
  loading: boolean;
  refreshing: boolean;
  onExportOpen: () => void;
  onRefresh: () => void;
};

export default function AnalyticsHeader({
  loading,
  refreshing,
  onExportOpen,
  onRefresh,
}: Props) {
  return (
    <section
      className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_35%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
            Admin / Analytics
          </div>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            Analytics Dashboard
          </h1>

          <p className="mt-2 max-w-[760px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            Track sales performance, customer behavior, product insights, and
            payment method usage with real-time store data.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onExportOpen}
            disabled={loading}
            className={secondaryBtnClass}
          >
            Export
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || loading}
            className={primaryBtnClass}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    </section>
  );
}