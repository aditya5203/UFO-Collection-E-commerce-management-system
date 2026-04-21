"use client";

import Link from "next/link";
import * as React from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type ForgotPasswordResponse = {
  success?: boolean;
  message?: string;
};

function inputClassName() {
  return "w-full rounded-[14px] border border-[#111827] bg-[#020617] px-5 py-4 text-sm text-white placeholder:text-[#6b7280] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
}

export default function DeliveryForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

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

      const data: ForgotPasswordResponse = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to send reset link.");
        return;
      }

      setSuccess(
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
    <div className="min-h-screen bg-[#03101f] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px] gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-[290px] shrink-0 rounded-[20px] border border-[#111827] bg-[#020617] p-6 lg:flex lg:flex-col">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6b7280]">
            UFO Collection
          </div>
          <h2 className="mt-4 text-[20px] font-extrabold text-white">
            Delivery Panel
          </h2>

          <div className="mt-10 space-y-4 text-[#d1d5db]">
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] px-4 py-4">
              Dashboard
            </div>
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] px-4 py-4">
              My Orders
            </div>
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] px-4 py-4">
              Profile
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden rounded-[20px] border border-[#111827] bg-[#020617] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="border-b border-[#111827] px-4 py-4 md:px-6 lg:px-8">
            <h1 className="text-[18px] font-bold text-white md:text-[20px]">
              Delivery Panel
            </h1>
          </div>

          <div className="grid min-h-[calc(100vh-110px)] place-items-center px-4 py-10 md:px-6">
            <section className="w-full max-w-[560px]">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Forgot Password
                </h2>
                <p className="mt-3 text-sm text-[#94a3b8]">
                  Enter your delivery account email and we’ll send you a reset
                  link.
                </p>
              </div>

              {error ? (
                <div className="mt-6 rounded-[14px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mt-6 rounded-[14px] border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  {success}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className={inputClassName()}
                  required
                />

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-w-[170px] rounded-[14px] bg-[#2563eb] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/delivery/login"
                  className="text-sm font-semibold text-[#60a5fa] transition hover:text-[#93c5fd]"
                >
                  Back to Delivery Login
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}