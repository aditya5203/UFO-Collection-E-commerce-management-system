"use client";

import * as React from "react";
import {
  AdRow,
  dangerBtnClass,
  secondaryBtnClass,
} from "./advertisementTypes";

type Props = {
  target: AdRow;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteAdvertisementModal({
  target,
  deleting,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[460px] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-ad-title"
      >
        <div id="delete-ad-title" className="text-[20px] font-semibold text-white">
          Delete advertisement?
        </div>

        <p className="mt-2 text-[13px] leading-7 text-[#a7aec4]">
          This will permanently delete{" "}
          <span className="font-semibold text-white">{target.title}</span>. This
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
  );
}