"use client";

import Link from "next/link";
import * as React from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type ForgotPasswordResponse = {
  success?: boolean;
  message?: string;
};

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
    <div
      className="min-h-screen text-white"
      style={{
        background: "#070514",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header className="flex h-16 items-center border-b border-[#2a223b] bg-[#0b061b] px-[40px]">
        <div className="text-[18px] font-semibold">Admin Panel</div>
      </header>

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-[40px]">
        <div className="w-full max-w-[460px] rounded-[16px]">
          <h1 className="mb-3 text-center text-[26px] font-semibold">
            Forgot Password
          </h1>

          <p className="mb-8 text-center text-[14px] text-[#b8aed6]">
            Enter your admin email and we’ll send you a password reset link.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
            <div className="flex flex-col">
              <input
                className="w-full rounded-[10px] border border-[#3a2b58] bg-[#160d28] px-[16px] py-[14px] text-[14px] text-[#f5f3ff] outline-none placeholder:text-[#7f6caa] focus:border-[#a95cff] focus:shadow-[0_0_0_1px_rgba(169,92,255,0.4)]"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
              />
            </div>

            {error ? (
              <div className="rounded-[10px] border border-[#6b1f37] bg-[#2a1020] px-4 py-3 text-[13px] text-[#ff9ab0]">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-[10px] border border-[#245537] bg-[#102218] px-4 py-3 text-[13px] text-[#b8f5cc]">
                {success}
              </div>
            ) : null}

            <div className="mt-[6px] flex justify-center">
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="cursor-pointer rounded-full border-none px-[40px] py-[12px] text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(176,33,255,0.4)] transition-[transform,box-shadow,opacity] duration-[120ms] ease-in hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(176,33,255,0.55)] active:translate-y-0 active:shadow-[0_6px_18px_rgba(176,33,255,0.35)] disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #b021ff, #5b1dff)",
                  opacity: loading || !email.trim() ? 0.7 : 1,
                }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/admin/adminlogin"
              className="text-[13px] font-medium text-[#c9b3ff] transition hover:text-white"
            >
              Back to Admin Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}