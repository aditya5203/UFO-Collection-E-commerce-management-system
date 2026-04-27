"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { DELIVERY_ENDPOINTS, safeJson } from "@/app/lib/delivery";

type FormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

function inputClassName() {
  return "w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white placeholder:text-[#7f879f] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10";
}

export default function DeliveryChangePasswordPage() {
  const router = useRouter();

  const [form, setForm] = React.useState<FormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
    setError("");
    setSuccess("");

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
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
        setError((json as any)?.message || "Failed to change password");
        return;
      }

      setSuccess("Password changed successfully.");

      setTimeout(() => {
        router.replace("/delivery/dashboard");
        router.refresh();
      }, 900);
    } catch {
      setError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl items-center">
        <section
          className={`${panelClass} w-full bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-8`}
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
              Delivery Panel
            </div>

            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
              Change Password
            </h1>

            <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
              For security, update your password before accessing the delivery
              dashboard.
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-[16px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 rounded-[16px] border border-emerald-400/20 bg-emerald-500/15 p-4 text-sm text-emerald-300">
              {success}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="delivery-current-password"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
              >
                Current Password
              </label>
              <input
                id="delivery-current-password"
                type="password"
                value={form.currentPassword}
                onChange={(e) => updateField("currentPassword", e.target.value)}
                placeholder="Enter current password"
                className={inputClassName()}
              />
            </div>

            <div>
              <label
                htmlFor="delivery-new-password"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
              >
                New Password
              </label>
              <input
                id="delivery-new-password"
                type="password"
                value={form.newPassword}
                onChange={(e) => updateField("newPassword", e.target.value)}
                placeholder="Enter new password"
                className={inputClassName()}
              />
            </div>

            <div>
              <label
                htmlFor="delivery-confirm-password"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
              >
                Confirm New Password
              </label>
              <input
                id="delivery-confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                placeholder="Confirm new password"
                className={inputClassName()}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}