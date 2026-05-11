"use client";

import * as React from "react";
import Image from "next/image";
import {
  OrderStatus,
  PaymentStatus,
  panelClass,
} from "./orderTypes";

export function MetricCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-white">
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

export function MethodBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

export function PaymentBadge({
  status,
  children,
}: {
  status: PaymentStatus;
  children: React.ReactNode;
}) {
  const styles: Record<PaymentStatus, string> = {
    Paid: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    Pending: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    Failed: "border-red-400/20 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles[status] || styles.Pending,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function OrderBadge({
  status,
  children,
}: {
  status: OrderStatus;
  children: React.ReactNode;
}) {
  const styles: Record<OrderStatus, string> = {
    Delivered: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    Transit: "border-violet-400/20 bg-violet-500/15 text-violet-300",
    Shipped: "border-blue-400/20 bg-blue-500/15 text-blue-300",
    Processing: "border-purple-400/20 bg-purple-500/15 text-purple-300",
    Confirmed: "border-cyan-400/20 bg-cyan-500/15 text-cyan-300",
    Pending: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    Cancelled: "border-red-400/20 bg-red-500/15 text-red-300",
    Returned: "border-red-400/20 bg-red-500/15 text-red-300",
    Refunded: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles[status] || styles.Pending,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function TaskBadge({
  title,
  status,
  name,
  tone,
}: {
  title: string;
  status: string;
  name?: string;
  tone: "blue" | "orange" | "purple" | "green";
}) {
  const toneClass =
    tone === "orange"
      ? "border-orange-400/20 bg-orange-500/10 text-orange-200"
      : tone === "purple"
        ? "border-purple-400/20 bg-purple-500/10 text-purple-200"
        : tone === "green"
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
          : "border-blue-400/20 bg-blue-500/10 text-blue-200";

  return (
    <div className={`rounded-[14px] border px-3 py-2 text-[11px] ${toneClass}`}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 opacity-90">{status || "Assigned"}</div>

      {name ? (
        <div className="mt-1 max-w-[140px] truncate opacity-70">{name}</div>
      ) : null}
    </div>
  );
}

export function AfterSalesBadge({
  tone,
  children,
}: {
  tone: "amber" | "blue" | "green" | "red" | "purple";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
      : tone === "blue"
        ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
        : tone === "green"
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
          : tone === "purple"
            ? "border-purple-400/20 bg-purple-500/10 text-purple-200"
            : "border-red-400/20 bg-red-500/10 text-red-200";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        toneClass,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function OrderSkeleton() {
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

export function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/orders.png"
          alt="Orders"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No orders found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        New customer orders will appear here automatically.
      </p>
    </div>
  );
}

export function NoSearchResults() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px]">
        🔎
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No matching orders
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Try searching by order code, customer name, customer email, return,
        refund, exchange, or delivery status.
      </p>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
      {message}
    </div>
  );
}

export function TablePanel({ children }: { children: React.ReactNode }) {
  return <section className={`${panelClass} overflow-hidden`}>{children}</section>;
}