"use client";

import React from "react";
import Image from "next/image";
import {
  CouponRow,
  dangerBtnClass,
  secondaryBtnClass,
} from "./discountTypes";

type Props = {
  row: CouponRow;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteCouponModal({
  row,
  deleting,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div className="flex min-h-full items-center justify-center py-6">
        <div
          className="w-full max-w-[460px] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-coupon-title"
        >
          <div className="grid h-14 w-14 place-items-center rounded-full border border-red-400/20 bg-red-500/10">
            <Image
              src="/images/admin/coupon.png"
              alt="Delete coupon"
              width={26}
              height={26}
            />
          </div>

          <h3
            id="delete-coupon-title"
            className="mt-4 text-[22px] font-semibold text-white"
          >
            Delete coupon?
          </h3>

          <p className="mt-2 text-[13px] leading-7 text-[#a7aec4]">
            This will permanently delete coupon{" "}
            <span className="font-semibold text-white">{row.code}</span>. This
            action cannot be undone.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className={secondaryBtnClass}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className={dangerBtnClass}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}