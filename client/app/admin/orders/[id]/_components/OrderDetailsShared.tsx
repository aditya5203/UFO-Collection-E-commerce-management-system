"use client";

import * as React from "react";
import Image from "next/image";
import {
  DeliveryAssignment,
  TimelineStep,
  ToastState,
  assignmentContact,
  assignmentName,
  assignmentStatus,
  formatDateTime,
  getStatusTone,
  panelClass,
  prettyStatus,
} from "./orderDetailsTypes";

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div
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
    </div>
  );
}

export function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getStatusTone(String(children));

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

export function TimelineDot({ status }: { status: TimelineStep["status"] }) {
  const base =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[13px] font-bold shadow-sm";

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
        className={`${base} border-[#d6c7ff]/30 bg-[#d6c7ff]/15 text-[#d6c7ff]`}
      >
        •
      </div>
    );
  }

  return (
    <div className={`${base} border-white/10 bg-white/5 text-[#7f879f]`}>
      •
    </div>
  );
}

export function SummaryCard({
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
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 line-clamp-1 text-[20px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>

          {hint ? (
            <div className="mt-2 line-clamp-1 text-[12px] text-[#7f879f]">
              {hint}
            </div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
      <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
        {eyebrow}
      </div>

      <h2 className="mt-1 text-[20px] font-semibold text-white">{title}</h2>

      {description ? (
        <p className="mt-1 text-[13px] text-[#a7aec4]">{description}</p>
      ) : null}
    </div>
  );
}

export function InfoPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          {eyebrow}
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">{title}</h2>
      </div>

      {children}
    </section>
  );
}

export function Field({
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
      <span className="text-[13px] text-[#a7aec4]">{label}</span>

      <span className={`text-right text-[13px] ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

export function AssignmentCard({
  title,
  assignment,
}: {
  title: string;
  assignment?: DeliveryAssignment | null;
}) {
  if (!assignment) return null;

  return (
    <div className="rounded-[20px] border border-purple-400/20 bg-purple-500/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-purple-100">{title}</div>
        <StatusPill>{assignmentStatus(assignment)}</StatusPill>
      </div>

      <div className="mt-4 space-y-2">
        <LineItem
          label="Rider"
          value={assignmentName(assignment)}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Contact"
          value={assignmentContact(assignment) || "-"}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Assigned At"
          value={formatDateTime(assignment.assignedAt)}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Picked Up At"
          value={formatDateTime(assignment.pickedUpAt)}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Returned To Store"
          value={formatDateTime(assignment.returnedToStoreAt)}
          valueClassName="text-purple-100"
        />
        <LineItem
          label="Delivered At"
          value={formatDateTime(assignment.deliveredAt)}
          valueClassName="text-purple-100"
        />

        {assignment.note ? (
          <LineItem
            label="Note"
            value={assignment.note}
            valueClassName="text-purple-100"
          />
        ) : null}
      </div>
    </div>
  );
}

export function RequestCard({
  title,
  status,
  reason,
  requestedAt,
  resolvedAt,
  adminNote,
  actions,
  extra,
  tone = "neutral",
}: {
  title: string;
  status: string;
  reason?: string;
  requestedAt?: string | null;
  resolvedAt?: string | null;
  adminNote?: string;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
  tone?: "neutral" | "amber" | "blue" | "green" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-400/20 bg-amber-500/10"
      : tone === "blue"
        ? "border-blue-400/20 bg-blue-500/10"
        : tone === "green"
          ? "border-emerald-400/20 bg-emerald-500/10"
          : tone === "red"
            ? "border-red-400/20 bg-red-500/10"
            : "border-[#26293a] bg-[#161824]";

  return (
    <div className={`rounded-[20px] border p-4 ${toneClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-white">{title}</div>

        <StatusPill>{prettyStatus(status)}</StatusPill>
      </div>

      <div className="mt-4 space-y-2 text-[13px] leading-6 text-[#a7aec4]">
        <LineItem label="Reason" value={reason || "—"} />
        <LineItem label="Requested At" value={formatDateTime(requestedAt)} />

        {resolvedAt ? (
          <LineItem label="Resolved At" value={formatDateTime(resolvedAt)} />
        ) : null}

        {adminNote ? <LineItem label="Admin Note" value={adminNote} /> : null}

        {extra}
      </div>

      {actions ? <div className="mt-4 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function ColorSwatch({ color }: { color: string }) {
  const ref = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.style.backgroundColor = color;
  }, [color]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="h-4 w-4 shrink-0 rounded-full border border-white/20"
    />
  );
}

export function LoadingSkeleton() {
  return (
    <div className={`${panelClass} p-6`}>
      <div className="h-3 w-36 animate-pulse rounded bg-white/5" />
      <div className="mt-4 h-9 w-64 animate-pulse rounded bg-white/5" />
      <div className="mt-4 h-4 w-full max-w-[680px] animate-pulse rounded bg-white/5" />
    </div>
  );
}