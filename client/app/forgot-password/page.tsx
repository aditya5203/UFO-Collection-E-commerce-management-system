"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import CollectionHeader from "@/components/layout/InfoHeader";
import MainFooter from "@/components/layout/MainFooter";

const API_BASE =
  API_BASE_URL;
const API = `${API_BASE}/api`;

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 pb-5 pt-2 sm:px-5 sm:pb-10 sm:pt-4 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const inputClass =
  "h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7c86b1] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString().trim() || "";

    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Something went wrong.");
        return;
      }

      setSuccess("Password reset link has been sent to your email.");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CollectionHeader />

      <main className={shellClass}>
        <section className={containerClass}>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Forgot Password
              </h1>

              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#a7aec4]">
                Enter your email address and we’ll send you a secure reset link
                to update your password.
              </p>
            </div>

            <Link href="/login" className={secondaryBtnClass}>
              Back to Login
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div className={`${panelClass} overflow-hidden`}>
              <div className="relative min-h-[420px] bg-[#161824] sm:min-h-[520px]">
                <Image
                  src="/images/loginw.jpg"
                  alt="Forgot password"
                  fill
                  priority
                  className="object-cover opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/25 to-transparent" />

                <div className="absolute bottom-6 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                    Secure Account Recovery
                  </div>

                  <h2 className="mt-4 max-w-[560px] text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[44px]">
                    Get back into your account quickly.
                  </h2>

                  <p className="mt-3 max-w-[520px] text-[14px] leading-7 text-[#d6dbeb]">
                    We’ll send a secure password reset link so you can continue
                    your UFO Collection shopping experience.
                  </p>
                </div>
              </div>
            </div>

            <aside className={`${panelClass} p-5 sm:p-6 lg:sticky lg:top-[104px]`}>
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Reset Password
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Reset your password
                </h2>

                <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                  Enter your registered email below.
                </p>
              </div>

              <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                {error ? (
                  <div className="rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-[13px] leading-6 text-red-200">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-[13px] leading-6 text-emerald-200">
                    {success}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className={`${primaryBtnClass} mt-2 w-full`}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-5 text-center text-[13px] text-[#a7aec4]">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#d6c7ff] transition hover:text-white"
                >
                  Login
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["Secure", "Reset"],
                  ["Email", "Link"],
                  ["Fast", "Access"],
                ].map(([a, b]) => (
                  <div
                    key={`${a}-${b}`}
                    className="rounded-[16px] border border-[#26293a] bg-[#161824] p-3 text-center"
                  >
                    <div className="text-[12px] font-semibold text-white">
                      {a}
                    </div>
                    <div className="text-[11px] text-[#a7aec4]">{b}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>

      <MainFooter />
    </>
  );
}