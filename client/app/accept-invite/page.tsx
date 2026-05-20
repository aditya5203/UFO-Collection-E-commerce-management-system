"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE =
  API_BASE_URL;

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function AcceptInvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invitation token is missing.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/auth/accept-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setError((json as any)?.message || "Failed to accept invitation");
        return;
      }

      const role = String((json as any)?.user?.role || "").toLowerCase();

      setSuccess("Account activated successfully. Redirecting to login...");

      setTimeout(() => {
        if (role === "delivery") {
          router.push("/delivery/login");
          return;
        }

        if (role === "admin" || role === "superadmin") {
          router.push("/admin/adminlogin");
          return;
        }

        router.push("/login");
      }, 1200);
    } catch {
      setError("Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-10 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl">
        <h1 className="text-2xl font-bold">Accept Invitation</h1>
        <p className="mt-2 text-sm text-slate-400">
          Set your password to activate your account.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            {loading ? "Activating..." : "Activate Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <React.Suspense fallback={null}>
      <AcceptInvitePageContent />
    </React.Suspense>
  );
}
