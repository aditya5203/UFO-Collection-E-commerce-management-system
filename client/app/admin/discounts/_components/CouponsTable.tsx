"use client";

import React from "react";
import {
  CouponRow,
  actionBtnClass,
  formatDate,
  getCouponDateStatus,
  moneyLabelRs,
  panelClass,
  scopeLabel,
  typeLabel,
} from "./discountTypes";
import {
  CountBadge,
  EmptyState,
  StatusPill,
  TableSkeleton,
} from "./DiscountShared";

type Props = {
  loading: boolean;
  rows: CouponRow[];
  canEdit: boolean;
  canDelete: boolean;
  openEdit: (row: CouponRow) => void;
  toggleStatus: (row: CouponRow) => void;
  requestDelete: (row: CouponRow) => void;
};

export default function CouponsTable({
  loading,
  rows,
  canEdit,
  canDelete,
  openEdit,
  toggleStatus,
  requestDelete,
}: Props) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          Coupon List
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">
          Discount Rules
        </h2>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState text="No coupons found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                <th className="px-5 py-4 font-medium">Code</th>
                <th className="px-5 py-4 font-medium">Title</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 font-medium">Scope</th>
                <th className="px-5 py-4 font-medium">Min Order</th>
                <th className="px-5 py-4 font-medium">Validity</th>
                <th className="px-5 py-4 font-medium">Used</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const realStatus = getCouponDateStatus(r);

                return (
                  <tr
                    key={r.id}
                    className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{r.code}</div>

                      <div className="mt-1 text-[12px] text-[#7f879f]">
                        {r.globalUsageLimit
                          ? `Limit ${r.usedCount}/${r.globalUsageLimit}`
                          : `Used ${r.usedCount}`}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{r.title}</div>

                      {r.description ? (
                        <div className="mt-1 max-w-[240px] truncate text-[12px] text-[#7f879f]">
                          {r.description}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-[#a7aec4]">
                      {typeLabel(r.type, r.value, r.maxDiscountCap)}
                    </td>

                    <td className="px-5 py-4 text-[#a7aec4]">
                      {scopeLabel(r.scope)}
                    </td>

                    <td className="px-5 py-4 text-[#a7aec4]">
                      {moneyLabelRs(r.minOrder)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-[#a7aec4]">
                        {formatDate(r.startAt)} – {formatDate(r.endAt)}
                      </div>

                      {realStatus === "EXPIRED" ? (
                        <div className="mt-1 text-[11px] text-red-300">
                          Date expired
                        </div>
                      ) : null}

                      {realStatus === "UPCOMING" ? (
                        <div className="mt-1 text-[11px] text-sky-300">
                          Starts later
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4">
                      <CountBadge>{r.usedCount ?? 0}</CountBadge>
                    </td>

                    <td className="px-5 py-4">
                      <StatusPill row={r} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className={actionBtnClass}
                          >
                            Edit
                          </button>
                        ) : null}

                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => toggleStatus(r)}
                            className={actionBtnClass}
                          >
                            {r.status === "ACTIVE" ? "Pause" : "Activate"}
                          </button>
                        ) : null}

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => requestDelete(r)}
                            className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}