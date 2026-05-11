"use client";

import * as React from "react";
import { secondaryBtnClass } from "./productTypes";

type Props = {
  confirmDeleteId: string | null;
  deletingId: string | null;
  onCancel: () => void;
  onConfirm: (id: string | null) => void;
};

export default function DeleteProductModal({
  confirmDeleteId,
  deletingId,
  onCancel,
  onConfirm,
}: Props) {
  if (!confirmDeleteId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="w-[min(440px,94vw)] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
        <div className="text-[11px] uppercase tracking-[0.22em] text-red-300">
          Delete Product
        </div>

        <div className="mt-2 text-[22px] font-semibold text-white">
          Are you sure?
        </div>

        <div className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
          This action cannot be undone. The selected product will be permanently
          removed from your database.
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={secondaryBtnClass}
            disabled={deletingId === confirmDeleteId}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deletingId === confirmDeleteId}
            onClick={() => onConfirm(confirmDeleteId)}
            className="rounded-full bg-red-500 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}