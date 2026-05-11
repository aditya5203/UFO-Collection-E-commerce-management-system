"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ToastState,
  panelClass,
  softPanelClass,
} from "./dashboardTypes";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className={`${panelClass} p-6`}>
        <div className="h-3 w-36 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-9 w-56 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-4 w-full max-w-[620px] animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${softPanelClass} p-5`}>
            <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-7 w-32 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-3 w-28 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
        <div className={`${panelClass} h-[360px] animate-pulse`} />
        <div className={`${panelClass} h-[360px] animate-pulse`} />
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  iconSrc,
}: {
  label: string;
  value: string;
  helper: string;
  iconSrc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`${softPanelClass} group p-5 transition duration-300 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>

          <div className="mt-2 text-[12px] text-[#7f879f]">{helper}</div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 transition group-hover:bg-white/10">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </motion.div>
  );
}

export function ChartBar({
  heightClass,
  label,
  value,
  muted,
}: {
  heightClass: string;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="group relative flex flex-1 flex-col items-center justify-end gap-2">
      <div
        title={value}
        className={[
          "w-full origin-bottom rounded-full bg-gradient-to-t from-[#7c3aed] via-[#8b5cf6] to-[#d6c7ff] shadow-[0_0_30px_rgba(139,92,246,0.25)] transition duration-300 group-hover:opacity-100",
          heightClass,
          muted ? "opacity-30 grayscale" : "opacity-80",
        ].join(" ")}
      />

      <div className="absolute bottom-0 translate-y-6 text-[11px] text-[#7f879f]">
        {label || "-"}
      </div>

      <div className="pointer-events-none absolute bottom-[74%] hidden rounded-full border border-white/10 bg-[#0d0f17] px-3 py-1 text-[11px] font-semibold text-white shadow-xl group-hover:block">
        {value}
      </div>
    </div>
  );
}

export function StatusBar({
  label,
  value,
  heightClass,
  tone,
  muted,
}: {
  label: string;
  value: number;
  heightClass: string;
  tone: string;
  muted?: boolean;
}) {
  const colors: Record<string, string> = {
    pending: "from-[#f59e0b] to-[#fde68a]",
    shipped: "from-[#2563eb] to-[#93c5fd]",
    delivered: "from-[#16a34a] to-[#86efac]",
    cancelled: "from-[#dc2626] to-[#fca5a5]",
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-2">
      <div className="text-[12px] font-semibold text-white">{value}</div>

      <div
        className={[
          "w-[72%] origin-bottom rounded-t-[14px] bg-gradient-to-t shadow-[0_0_26px_rgba(255,255,255,0.07)] transition duration-300",
          heightClass,
          colors[tone] || "from-[#374151] to-[#9ca3af]",
          muted ? "opacity-30 grayscale" : "opacity-85",
        ].join(" ")}
      />

      <div className="text-center text-[11px] text-[#a7aec4]">{label}</div>
    </div>
  );
}

export function Badge({
  variant,
  children,
}: {
  variant: "shipped" | "delivered" | "pending" | "cancelled";
  children: React.ReactNode;
}) {
  const styles: Record<
    "shipped" | "delivered" | "pending" | "cancelled",
    string
  > = {
    shipped: "border-blue-400/20 bg-blue-500/15 text-blue-300",
    delivered: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    pending: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    cancelled: "border-red-400/20 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function EmptyChartState({
  message,
  compact,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-4 z-10 flex items-center justify-center",
        compact ? "top-16" : "top-20",
      ].join(" ")}
    >
      <div className="rounded-full border border-white/10 bg-[#0d0f17]/80 px-4 py-2 text-center text-[12px] text-[#a7aec4] backdrop-blur">
        {message}
      </div>
    </div>
  );
}

export function Toast({ toast }: { toast: ToastState }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          className={[
            "fixed right-4 top-4 z-[80] max-w-[360px] rounded-[18px] border px-4 py-3 text-[13px] font-semibold shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur",
            toast.type === "success"
              ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
              : toast.type === "error"
                ? "border-red-400/20 bg-red-500/15 text-red-200"
                : "border-[#8b5cf6]/30 bg-[#8b5cf6]/15 text-[#e9ddff]",
          ].join(" ")}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}