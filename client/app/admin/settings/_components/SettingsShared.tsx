"use client";

import * as React from "react";
import type { AdminPermissionKey } from "../../_components/adminPermissions";
import {
  buttonBase,
  inputClass,
  softCard,
} from "./settingsTypes";

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
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;

  return <input {...rest} className={`${inputClass} ${className}`} />;
}

export function Button({
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "danger" | "success";
}) {
  const styles = {
    solid: "bg-white text-[#090a12] hover:-translate-y-0.5 hover:bg-white/90",
    success:
      "bg-emerald-400 text-[#07110d] hover:-translate-y-0.5 hover:bg-emerald-300",
    ghost:
      "border border-white/15 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/10",
    danger:
      "border border-red-400/25 bg-red-500/15 text-red-300 hover:-translate-y-0.5 hover:bg-red-500/20",
  };

  return (
    <button
      {...props}
      className={`${buttonBase} ${styles[variant]} ${className}`}
    />
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "red" | "blue" | "amber";
}) {
  const styles = {
    neutral: "border-white/10 bg-white/5 text-[#a7aec4]",
    green: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    red: "border-red-400/20 bg-red-500/15 text-red-300",
    blue: "border-blue-400/20 bg-blue-500/15 text-blue-300",
    amber: "border-amber-400/20 bg-amber-500/15 text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className="flex max-h-[92vh] w-full max-w-[980px] flex-col overflow-hidden rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#26293a] px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>

              {subtitle ? (
                <p className="mt-1 text-[13px] text-[#a7aec4]">{subtitle}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrBox({ text }: { text: string }) {
  return (
    <div className="rounded-[18px] border border-red-400/20 bg-red-500/15 px-4 py-3 text-[13px] font-medium text-red-300">
      {text}
    </div>
  );
}

export function PermissionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border border-[#26293a] bg-white/[0.03] px-4 py-3 text-[13px] text-white transition hover:border-[#8b5cf6]/45 hover:bg-white/[0.05]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[#8b5cf6]"
      />

      <span className="leading-5">{label}</span>
    </label>
  );
}

export function StatBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className={`${softCard} p-5`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
        {label}
      </div>

      <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
        {value}
      </div>

      {hint ? (
        <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
      ) : null}
    </div>
  );
}

export function PermissionGroups({
  permissions,
  onToggle,
  groups,
}: {
  permissions: Record<string, boolean>;
  onToggle: (key: AdminPermissionKey) => void;
  groups: Array<{
    title: string;
    items: Array<{ key: AdminPermissionKey; label: string }>;
  }>;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div
          key={group.title}
          className="rounded-[24px] border border-[#26293a] bg-white/[0.03] p-5"
        >
          <h3 className="text-[15px] font-semibold text-white">
            {group.title}
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <PermissionCheckbox
                key={item.key}
                label={item.label}
                checked={Boolean(permissions[item.key])}
                onChange={() => onToggle(item.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}