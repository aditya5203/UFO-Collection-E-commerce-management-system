"use client";

import Link from "next/link";
import * as React from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type ForgotPasswordResponse = {
  success?: boolean;
  message?: string;
};

const inputClass =
  "h-12 w-full rounded-2xl border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] font-medium text-white outline-none transition placeholder:text-[#7f879f] focus:border-[#8b5cf6]/60 focus:ring-4 focus:ring-[#8b5cf6]/10";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data: ForgotPasswordResponse = await res
        .json()
        .catch(() => ({} as ForgotPasswordResponse));

      if (!res.ok) {
        setError(data?.message || "Failed to send reset link.");
        return;
      }

      setSuccess(
        data?.message ||
          "If your email exists, we sent a password reset link to your inbox."
      );
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 py-6 text-[#f5f7fb] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_90px_rgba(0,0,0,0.55)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.34),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-10 lg:block">
            <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[#8b5cf6]/20 blur-3xl" />
            <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#d6c7ff]/10 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a7aec4]">
                  UFO Collection
                </div>

                <h1 className="mt-4 max-w-[460px] text-[42px] font-semibold leading-tight tracking-[-0.05em] text-white">
                  Recover Admin Access Securely
                </h1>

                <p className="mt-4 max-w-[460px] text-[14px] leading-7 text-[#a7aec4]">
                  Enter the registered admin email address and receive a secure
                  password reset link in your inbox.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[12px] font-semibold text-white">
                    Secure Reset Flow
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
                    Reset links are sent only to registered admin emails.
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[12px] font-semibold text-white">
                    Admin Protection
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
                    Unauthorized users cannot access the protected dashboard.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="p-5 sm:p-8 lg:p-10">
            <div className="mb-8">
  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a7aec4]">
    Admin Panel
  </div>

  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-white">
    Forgot Password
  </h2>

  <p className="mt-2 max-w-[420px] text-[13px] leading-6 text-[#a7aec4]">
    Enter your admin email and we’ll send you a password reset link.
  </p>
</div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-reset-email"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
                >
                  Email Address
                </label>

                <input
                  id="admin-reset-email"
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-[18px] border border-red-400/20 bg-red-500/15 px-4 py-3 text-[13px] font-medium text-red-300">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-[13px] font-medium text-emerald-300">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="h-12 w-full rounded-full bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/admin/adminlogin"
                className="text-[13px] font-semibold text-[#d6c7ff] transition hover:text-white"
              >
                Back to Admin Login
              </Link>
            </div>

            <p className="mt-8 text-center text-[12px] leading-6 text-[#7f879f]">
              Use only the email address registered for your admin account.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}