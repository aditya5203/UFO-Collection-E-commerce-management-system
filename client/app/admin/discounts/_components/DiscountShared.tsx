"use client";

import React from "react";
import Image from "next/image";
import {
  CollectedRow,
  CouponRow,
  ToastState,
  getCouponDateStatus,
  panelClass,
} from "./discountTypes";

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
        "flex items-start justify-between gap-3 rounded-[20px] border px-5 py-4 text-[13px]",
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

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition",
        active
          ? "bg-white text-[#090a12]"
          : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ row }: { row: CouponRow }) {
  const status = getCouponDateStatus(row);

  const tone =
    status === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "UPCOMING"
        ? "border-sky-400/20 bg-sky-500/15 text-sky-300"
        : status === "EXPIRED"
          ? "border-red-400/20 bg-red-500/15 text-red-300"
          : "border-amber-400/20 bg-amber-500/15 text-amber-300";

  const label =
    status === "ACTIVE"
      ? "Active"
      : status === "UPCOMING"
        ? "Upcoming"
        : status === "EXPIRED"
          ? "Expired"
          : "Paused";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        tone,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function CollectedPill({ status }: { status: CollectedRow["status"] }) {
  const tone =
    status === "USED"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "EXPIRED"
        ? "border-red-400/20 bg-red-500/15 text-red-300"
        : "border-blue-400/20 bg-blue-500/15 text-blue-300";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        tone,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

export function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/coupon.png"
          alt="Discounts"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">Discounts</div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        {text}
      </p>
    </div>
  );
}

export function PanelShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          {eyebrow}
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">{title}</h2>
      </div>

      {children}
    </section>
  );
}