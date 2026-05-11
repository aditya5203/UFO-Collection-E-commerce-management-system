"use client";

import * as React from "react";
import {
  getRangeText,
  isPositiveChange,
  panelClass,
  RangeKey,
} from "./analyticsTypes";

export function AlertBox({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[20px] border border-red-400/20 bg-red-500/15 px-4 py-3 text-[13px] text-red-200">
      <p className="leading-6">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white"
        aria-label="Dismiss error"
        title="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[150px] animate-pulse rounded-[22px] border border-white/5 bg-white/[0.03]"
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-[380px] animate-pulse rounded-[24px] border border-white/5 bg-white/[0.03]"
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[130px] animate-pulse rounded-[22px] border border-white/5 bg-white/[0.03]"
          />
        ))}
      </section>
    </div>
  );
}

export function LabelRow({ labels }: { labels: string[] }) {
  return (
    <div className="mt-3 flex gap-2 text-[11px] text-[#7f879f]">
      {labels.map((label, index) => (
        <span
          key={`${label}-${index}`}
          className="min-w-0 flex-1 truncate text-center"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
        Analytics
      </div>

      <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>

      <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">{subtitle}</p>
    </div>
  );
}

export function ChartPanel({
  title,
  value,
  change,
  range,
  children,
}: {
  title: string;
  value: string;
  change: string;
  range: RangeKey;
  children: React.ReactNode;
}) {
  const positive = isPositiveChange(change);

  return (
    <div className={`${panelClass} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-semibold text-white">{title}</h3>

          <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-white">
            {value}
          </div>

          <div className="mt-1 text-[13px] text-[#a7aec4]">
            {getRangeText(range)}{" "}
            <span
              className={
                positive
                  ? "font-semibold text-emerald-300"
                  : "font-semibold text-orange-300"
              }
            >
              {change}
            </span>
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#cbd5e1]">
          {getRangeText(range)}
        </span>
      </div>

      {children}
    </div>
  );
}

export function EmptyMini({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-6 text-center text-[13px] text-[#a7aec4]">
      {text}
    </div>
  );
}