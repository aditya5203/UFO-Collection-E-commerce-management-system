"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDeliveryStatusTone } from "@/app/lib/delivery";
import {
  DeliveryTaskType,
  TimelineStep,
  Toast,
  getTaskLabel,
  getTaskTone,
  panelClass,
  softPanelClass,
} from "./deliveryOrderTypes";

export function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getDeliveryStatusTone(String(children));

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function TaskPill({ taskType }: { taskType: DeliveryTaskType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getTaskTone(
        taskType
      )}`}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {getTaskLabel(taskType)}
    </span>
  );
}

export function Dot({ status }: { status: TimelineStep["status"] }) {
  const base =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-bold";

  if (status === "done") {
    return (
      <div
        className={`${base} border-emerald-400/20 bg-emerald-500/15 text-emerald-300`}
      >
        ✓
      </div>
    );
  }

  if (status === "current") {
    return (
      <div
        className={`${base} border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#d6c7ff]`}
      >
        •
      </div>
    );
  }

  return (
    <div className={`${base} border-white/10 bg-white/[0.03] text-[#7f879f]`}>
      •
    </div>
  );
}

export function SummaryCard({
  label,
  value,
  hint,
  index,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={`${softPanelClass} relative min-w-0 overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#8b5cf6]/10 blur-2xl" />

      <div className="relative min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
          {label}
        </div>

        <div className="mt-3 break-words text-[20px] font-semibold tracking-[-0.03em] text-white">
          {value}
        </div>

        {hint ? (
          <div className="mt-2 break-words text-[12px] text-[#7f879f]">
            {hint}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export function LineItem({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[#a7aec4]">{label}</span>

      <span className={`break-words text-right text-sm ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
        {label}
      </label>

      {children}
    </div>
  );
}

export function SidePanel({ children }: { children: React.ReactNode }) {
  return (
    <section className={`${panelClass} min-w-0 max-w-full p-5 sm:p-6`}>
      {children}
    </section>
  );
}

export function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-[#0d0f17]/70 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f879f]">
        {label}
      </div>

      <div className="mt-1 break-words font-semibold text-white">{value}</div>
    </div>
  );
}

export function ToastView({ toast }: { toast: Toast | null }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          className={[
            "fixed right-5 top-5 z-[1200] max-w-[380px] rounded-[18px] border px-5 py-4 text-[13px] font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur",
            toast.type === "success"
              ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
              : toast.type === "info"
                ? "border-blue-400/20 bg-blue-500/15 text-blue-200"
                : "border-red-400/20 bg-red-500/15 text-red-200",
          ].join(" ")}
        >
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}