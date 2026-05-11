"use client";

import * as React from "react";
import { secondaryBtnClass } from "./profileTypes";

type Props = {
  open: boolean;
  deleting: boolean;
  deleteText: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  labels: {
    title: string;
    hint: string;
    close: string;
    typeDelete: string;
    cancel: string;
    confirmDelete: string;
  };
  onTextChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteAccountModal({
  open,
  deleting,
  deleteText,
  inputRef,
  labels,
  onTextChange,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !deleting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-[520px] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.75)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-red-200">
              Confirm Action
            </div>

            <h3
              id="delete-account-title"
              className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white"
            >
              {labels.title}
            </h3>

            <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
              {labels.hint}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {labels.close}
          </button>
        </div>

        <input
          ref={inputRef}
          value={deleteText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={labels.typeDelete}
          aria-label="Type DELETE to confirm account deletion"
          disabled={deleting}
          className="mt-5 h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className={secondaryBtnClass}
          >
            {labels.cancel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-full bg-red-500 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {deleting ? "Deleting..." : labels.confirmDelete}
          </button>
        </div>
      </div>
    </div>
  );
}