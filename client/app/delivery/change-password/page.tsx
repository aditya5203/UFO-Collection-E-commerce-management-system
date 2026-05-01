"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DELIVERY_ENDPOINTS, safeJson } from "@/app/lib/delivery";

type FormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ToastType = "success" | "error" | "info";

type Toast = {
  type: ToastType;
  message: string;
};

const panelClass =
  "rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const inputBaseClass =
  "w-full rounded-[18px] border bg-[#0d0f17] px-4 py-3 text-sm text-white placeholder:text-[#7f879f] outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

const primaryBtnClass =
  "inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

function inputClassName(hasError = false) {
  return [
    inputBaseClass,
    hasError
      ? "border-red-400/50 focus:border-red-400 focus:ring-red-500/10"
      : "border-[#26293a] focus:border-[#8b5cf6] focus:ring-[#8b5cf6]/10",
  ].join(" ");
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
        <path d="M9.88 4.24A10.76 10.76 0 0112 4c7 0 10 8 10 8a18.5 18.5 0 01-2.66 4.15" />
        <path d="M6.61 6.61C3.86 8.46 2 12 2 12s3 8 10 8a10.85 10.85 0 005.39-1.39" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PasswordInput({
  id,
  label,
  value,
  placeholder,
  autoComplete,
  disabled,
  hasError,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  disabled: boolean;
  hasError?: boolean;
  onChange: (value: string) => void;
}) {
  const [show, setShow] = React.useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`${inputClassName(Boolean(hasError))} pr-14`}
        />

        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          disabled={disabled}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#d6c7ff] transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <EyeIcon hidden={show} />
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
  );
}

function getPasswordRules(password: string) {
  return [
    {
      label: "At least 6 characters",
      valid: password.trim().length >= 6,
    },
    {
      label: "Contains one uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "Contains one lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "Contains one number",
      valid: /\d/.test(password),
    },
    {
      label: "Contains one special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export default function DeliveryChangePasswordPage() {
  const router = useRouter();

  const [form, setForm] = React.useState<FormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);
  const [touched, setTouched] = React.useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  React.useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const passwordRules = React.useMemo(
    () => getPasswordRules(form.newPassword),
    [form.newPassword]
  );

  const currentPasswordError =
    touched.currentPassword && !form.currentPassword.trim()
      ? "Current password is required."
      : "";

  const newPasswordError =
    touched.newPassword && !form.newPassword.trim()
      ? "New password is required."
      : touched.newPassword && form.newPassword.trim().length < 6
      ? "New password must be at least 6 characters."
      : "";

  const confirmPasswordError =
    touched.confirmPassword && !form.confirmPassword.trim()
      ? "Please confirm the new password."
      : touched.confirmPassword && form.newPassword !== form.confirmPassword
      ? "New password and confirm password do not match."
      : "";

  const validate = () => {
    if (!form.currentPassword.trim()) return "Current password is required.";
    if (!form.newPassword.trim()) return "New password is required.";
    if (form.newPassword.trim().length < 6) {
      return "New password must be at least 6 characters.";
    }
    if (!form.confirmPassword.trim()) return "Please confirm the new password.";
    if (form.newPassword !== form.confirmPassword) {
      return "New password and confirm password do not match.";
    }
    if (form.currentPassword === form.newPassword) {
      return "New password must be different from current password.";
    }

    return "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    setToast(null);

    const validationMessage = validate();

    if (validationMessage) {
      setToast({
        type: "error",
        message: validationMessage,
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(DELIVERY_ENDPOINTS.changePassword, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword.trim(),
          newPassword: form.newPassword.trim(),
        }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setToast({
          type: "error",
          message: (json as any)?.message || "Failed to change password",
        });
        return;
      }

      setToast({
        type: "success",
        message: "Password changed successfully. Redirecting...",
      });

      window.setTimeout(() => {
        router.replace("/delivery/dashboard");
        router.refresh();
      }, 900);
    } catch {
      setToast({
        type: "error",
        message: "Failed to change password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.1),transparent_32%),linear-gradient(135deg,#07080d,#0a0a0f_55%,#0d0f17)]" />

      <ToastView toast={toast} />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl items-center">
        <motion.section
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${panelClass} relative w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_34%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-8`}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#8b5cf6]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Delivery Panel
                </div>

                <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] text-white sm:text-[38px]">
                  Change Password
                </h1>

                <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  For security, update your password before accessing the
                  delivery dashboard.
                </p>
              </div>

              <Link href="/delivery/login" className={secondaryBtnClass}>
                Back to Login
              </Link>
            </div>

            <div className="mt-6 rounded-[18px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[13px] leading-6 text-amber-100">
              Use a password that is different from your current password. A
              stronger password helps protect delivery account access.
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <PasswordInput
                  id="delivery-current-password"
                  label="Current Password"
                  value={form.currentPassword}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  disabled={loading}
                  hasError={Boolean(currentPasswordError)}
                  onChange={(value) => updateField("currentPassword", value)}
                />

                {currentPasswordError ? (
                  <p className="mt-2 text-xs font-medium text-red-300">
                    {currentPasswordError}
                  </p>
                ) : null}
              </div>

              <div>
                <PasswordInput
                  id="delivery-new-password"
                  label="New Password"
                  value={form.newPassword}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={loading}
                  hasError={Boolean(newPasswordError)}
                  onChange={(value) => updateField("newPassword", value)}
                />

                {newPasswordError ? (
                  <p className="mt-2 text-xs font-medium text-red-300">
                    {newPasswordError}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                  Password Strength Checklist
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-2 text-[12px] ${
                        rule.valid ? "text-emerald-300" : "text-[#8f98b3]"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${
                          rule.valid
                            ? "border-emerald-400/20 bg-emerald-500/15"
                            : "border-white/10 bg-white/[0.04]"
                        }`}
                      >
                        {rule.valid ? "✓" : "•"}
                      </span>
                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <PasswordInput
                  id="delivery-confirm-password"
                  label="Confirm New Password"
                  value={form.confirmPassword}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={loading}
                  hasError={Boolean(confirmPasswordError)}
                  onChange={(value) => updateField("confirmPassword", value)}
                />

                {confirmPasswordError ? (
                  <p className="mt-2 text-xs font-medium text-red-300">
                    {confirmPasswordError}
                  </p>
                ) : null}
              </div>

              <motion.button
                whileHover={!loading ? { y: -2 } : undefined}
                whileTap={!loading ? { scale: 0.98 } : undefined}
                type="submit"
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </motion.button>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-[#26293a] pt-5">
              <Link href="/delivery/dashboard" className={secondaryBtnClass}>
                Dashboard
              </Link>

              <Link href="/delivery/orders" className={secondaryBtnClass}>
                Orders
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function ToastView({ toast }: { toast: Toast | null }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          className={[
            "fixed right-4 top-4 z-50 max-w-[360px] rounded-[18px] border px-4 py-3 text-sm font-semibold shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl",
            toast.type === "success"
              ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-100"
              : toast.type === "info"
              ? "border-blue-400/25 bg-blue-500/15 text-blue-100"
              : "border-red-400/25 bg-red-500/15 text-red-100",
          ].join(" ")}
        >
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}