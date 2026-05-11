"use client";

import React from "react";
import {
  CollectedRow,
  formatDate,
  panelClass,
  secondaryBtnClass,
} from "./discountTypes";
import {
  CollectedPill,
  CountBadge,
  EmptyState,
  TableSkeleton,
} from "./DiscountShared";

type Props = {
  loading: boolean;
  rows: CollectedRow[];
  onRefresh: () => void;
};

export default function CollectedCouponsTable({
  loading,
  rows,
  onRefresh,
}: Props) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Collected Coupons
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">
            Customer Coupon Activity
          </h2>

          <p className="mt-1 text-[13px] text-[#a7aec4]">
            Track which users collected and used coupons.
          </p>
        </div>

        <button type="button" onClick={onRefresh} className={secondaryBtnClass}>
          Refresh
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState text="No collected coupons yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                <th className="px-5 py-4 font-medium">User</th>
                <th className="px-5 py-4 font-medium">Coupon</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Collected</th>
                <th className="px-5 py-4 font-medium">Used</th>
                <th className="px-5 py-4 font-medium">Order</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">
                      {r.user?.name || "—"}
                    </div>

                    <div className="mt-1 text-[12px] text-[#7f879f]">
                      {r.user?.email || ""}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">
                      {r.coupon?.code || "—"}
                    </div>

                    <div className="mt-1 text-[12px] text-[#7f879f]">
                      {r.coupon?.title || ""}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <CollectedPill status={r.status} />
                  </td>

                  <td className="px-5 py-4 text-[#a7aec4]">
                    {formatDate(r.collectedAt)}
                  </td>

                  <td className="px-5 py-4 text-[#a7aec4]">
                    {formatDate(r.usedAt)}
                  </td>

                  <td className="px-5 py-4 text-[#a7aec4]">
                    {r.orderId ? <CountBadge>{r.orderId}</CountBadge> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}