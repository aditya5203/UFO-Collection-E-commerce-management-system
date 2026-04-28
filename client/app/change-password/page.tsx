"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type ToastType = "success" | "error" | "info";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[760px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />

        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  name,
  value,
  show,
  placeholder,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  show: boolean;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
      >
        {label}
      </label>

      <div className="flex h-[52px] items-center rounded-full border border-[#26293a] bg-[#0d0f17] transition focus-within:border-[#d6c7ff]">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={label}
          className="h-full min-w-0 flex-1 bg-transparent px-5 text-[13px] text-white outline-none placeholder:text-[#7f879f]"
        />

        <button
          type="button"
          onClick={onToggle}
          className="mr-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a7aec4] transition hover:bg-white/10 hover:text-white"
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const API =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api";

  const [form, setForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2600);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.currentPassword.trim()) {
      showToast("Current password is required.", "error");
      return;
    }

    if (!form.newPassword.trim()) {
      showToast("New password is required.", "error");
      return;
    }

    if (form.newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      showToast("New password and confirm password do not match.", "error");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API}/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        showToast(data?.message || "Failed to change password.", "error");
        return;
      }

      showToast("Password changed successfully.", "success");

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      window.setTimeout(() => {
        router.push("/profile");
      }, 700);
    } catch (error) {
      console.error(error);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CartHeader />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Account Security
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Change Password
              </h1>

              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#a7aec4]">
                Update your account password securely. Use a strong password
                with at least 6 characters.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              className={secondaryBtnClass}
            >
              Back
            </button>
          </div>

          <div className={`${panelClass} overflow-hidden`}>
            <div className="border-b border-[#26293a] bg-[radial-gradient(circle_at_top,#30214f,transparent_55%),linear-gradient(135deg,#161824,#0d0f17)] p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <span className="text-[28px]">🔐</span>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#d6c7ff]">
                    Password Protection
                  </div>

                  <div className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-white">
                    Keep your UFO Collection account safe
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 p-5 sm:p-6">
              <PasswordField
                id="currentPassword"
                label="Current Password"
                name="currentPassword"
                value={form.currentPassword}
                show={showCurrent}
                placeholder="Enter current password"
                onChange={handleChange}
                onToggle={() => setShowCurrent((prev) => !prev)}
              />

              <PasswordField
                id="newPassword"
                label="New Password"
                name="newPassword"
                value={form.newPassword}
                show={showNew}
                placeholder="Enter new password"
                onChange={handleChange}
                onToggle={() => setShowNew((prev) => !prev)}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                name="confirmPassword"
                value={form.confirmPassword}
                show={showConfirm}
                placeholder="Confirm new password"
                onChange={handleChange}
                onToggle={() => setShowConfirm((prev) => !prev)}
              />

              <div className="mt-2 rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3 text-[12px] leading-6 text-[#a7aec4]">
                Tip: Avoid using your name, phone number, or simple passwords
                like <span className="text-white">123456</span>.
              </div>

              <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  disabled={saving}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={primaryBtnClass}
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <MainFooter />
    </>
  );
}