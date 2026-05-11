"use client";

import * as React from "react";
import {
  AdStatus,
  statusTone,
  ToastState,
} from "./advertisementTypes";

export function Toast({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  const tone =
    toast.type === "success"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-100"
      : toast.type === "error"
        ? "border-red-400/20 bg-red-500/15 text-red-100"
        : "border-blue-400/20 bg-blue-500/15 text-blue-100";

  return (
    <div className="fixed right-4 top-4 z-[70] w-[calc(100vw-2rem)] max-w-[420px]">
      <div
        className={[
          "flex items-start justify-between gap-3 rounded-[20px] border px-4 py-3 shadow-2xl backdrop-blur",
          tone,
        ].join(" ")}
      >
        <p className="text-[13px] font-medium leading-6">{toast.message}</p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-bold text-white"
          aria-label="Close toast"
          title="Close toast"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function AlertBox({
  type,
  message,
  onClose,
}: {
  type: "error" | "info";
  message: string;
  onClose?: () => void;
}) {
  const tone =
    type === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : "border-blue-400/20 bg-blue-500/10 text-blue-200";

  return (
    <div
      className={[
        "mb-4 flex items-start justify-between gap-3 rounded-[20px] border px-5 py-4 text-[13px]",
        tone,
      ].join(" ")}
    >
      <p className="leading-6">{message}</p>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function Select({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  const id = React.useId();

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <select
        id={id}
        name={id}
        title={label}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[48px] rounded-full border border-white/10 bg-white/5 px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff]"
      >
        {children}
      </select>
    </div>
  );
}

export function StatusPill({ status }: { status: AdStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        statusTone(status),
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export function MiniChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}