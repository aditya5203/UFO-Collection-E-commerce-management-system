"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { DELIVERY_ENDPOINTS, safeJson } from "@/app/lib/delivery";

type FormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function inputClassName() {
  return "w-full rounded-[14px] border border-[#111827] bg-[#020617] px-4 py-3 text-sm text-white placeholder:text-[#6b7280] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
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
        headers: {
          "Content-Type": "application/json",
        },
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
    <div className="min-h-screen bg-[#03101f] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 md:px-6">
        <section className="w-full rounded-[20px] border border-[#111827] bg-[#020617] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-8">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7280]">
              Delivery Panel
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Change Password
            </h1>

            <p className="text-sm text-[#9ca3af]">
              For security, update your password before accessing the delivery
              dashboard.
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-[14px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 rounded-[14px] border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="delivery-current-password"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]"
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
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]"
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
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9ca3af]"
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
              className="w-full rounded-[14px] bg-[#2563eb] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}