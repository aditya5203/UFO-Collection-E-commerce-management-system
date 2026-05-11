"use client";

import * as React from "react";
import Image from "next/image";
import {
  CustomerStatus,
  OrderStatus,
  PaymentStatus,
  TicketStatus,
  panelClass,
} from "./customerDetailsTypes";

export function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {text}
    </span>
  );
}

export function PaymentPill({
  status,
  children,
}: {
  status: PaymentStatus;
  children: React.ReactNode;
}) {
  const tone =
    status === "Paid"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "Failed"
        ? "border-red-400/20 bg-red-500/15 text-red-300"
        : "border-amber-400/20 bg-amber-500/15 text-amber-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

export function OrderStatusPill({
  status,
  children,
}: {
  status: OrderStatus;
  children: React.ReactNode;
}) {
  const tone =
    status === "Delivered"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "Transit"
        ? "border-violet-400/20 bg-violet-500/15 text-violet-300"
        : status === "Shipped"
          ? "border-blue-400/20 bg-blue-500/15 text-blue-300"
          : status === "Confirmed"
            ? "border-cyan-400/20 bg-cyan-500/15 text-cyan-300"
            : status === "Cancelled"
              ? "border-red-400/20 bg-red-500/15 text-red-300"
              : "border-amber-400/20 bg-amber-500/15 text-amber-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

export function TicketStatusPill({
  status,
  children,
}: {
  status: TicketStatus;
  children: React.ReactNode;
}) {
  const tone =
    status === "Resolved"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "Closed"
        ? "border-slate-400/20 bg-slate-500/15 text-slate-300"
        : status === "In Progress"
          ? "border-blue-400/20 bg-blue-500/15 text-blue-300"
          : status === "Pending"
            ? "border-amber-400/20 bg-amber-500/15 text-amber-300"
            : "border-sky-400/20 bg-sky-500/15 text-sky-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

export function CustomerStatusPill({ status }: { status: CustomerStatus }) {
  const styles =
    status === "blocked"
      ? "border-amber-400/20 bg-amber-500/15 text-amber-300"
      : status === "deleted"
        ? "border-red-400/20 bg-red-500/15 text-red-300"
        : "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles,
      ].join(" ")}
    >
      {status === "blocked"
        ? "Blocked"
        : status === "deleted"
          ? "Deleted"
          : "Active"}
    </span>
  );
}

export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition",
        active
          ? "bg-white text-[#090a12]"
          : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

export function TableShell({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Customer Data
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">{title}</h2>
        </div>

        {right ? <div>{right}</div> : null}
      </div>

      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[20px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>

          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

export function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
        {label}
      </div>

      <div className="mt-2 break-words text-[13px] font-medium text-white">
        {value || "-"}
      </div>
    </div>
  );
}

export function CustomerSkeleton() {
  return (
    <div className="space-y-5">
      <div className={`${panelClass} p-6`}>
        <div className="h-3 w-40 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-9 w-64 animate-pulse rounded bg-white/5" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[116px] animate-pulse rounded-[20px] border border-white/5 bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}