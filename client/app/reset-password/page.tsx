"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CollectionHeader from "@/components/layout/InfoHeader";
import MainFooter from "@/components/layout/MainFooter";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 pb-8 pt-4 sm:px-5 sm:pb-10 sm:pt-6 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const inputClass =
  "h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7c86b1] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

function getRedirectPath(role: string) {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "admin" || normalizedRole === "superadmin") {
    return "/admin/adminlogin";
  }

  if (normalizedRole === "delivery") {
    return "/delivery/login";
  }

  return "/login";
}

function getBackLoginPath(role: string) {
  return getRedirectPath(role);
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token") || "";
  const role = sp.get("role") || "";

  const redirectPath = getRedirectPath(role);
  const backLoginPath = getBackLoginPath(role);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
    }
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Reset failed. Please request a new link.");
        return;
      }

      setSuccess("Password reset successful. Redirecting to login...");

      window.setTimeout(() => {
        router.push(redirectPath);
      }, 900);
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
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Account Security
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Reset Password
              </h1>

              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#a7aec4]">
                Create a new secure password for your account. This reset link
                expires quickly for your security.
              </p>
            </div>

            <Link href={backLoginPath} className={secondaryBtnClass}>
              Back to Login
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div className={`${panelClass} overflow-hidden`}>
              <div className="relative min-h-[420px] bg-[#161824] sm:min-h-[520px]">
                <Image
                  src="/images/loginw.jpg"
                  alt="Reset password visual"
                  fill
                  priority
                  className="object-cover opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/25 to-transparent" />

                <div className="absolute bottom-6 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                    Secure Password Update
                  </div>

                  <h2 className="mt-4 max-w-[560px] text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[44px]">
                    Set a strong new password.
                  </h2>

                  <p className="mt-3 max-w-[520px] text-[14px] leading-7 text-[#d6dbeb]">
                    Use a password that is easy for you to remember but hard for
                    others to guess.
                  </p>
                </div>
              </div>
            </div>

            <aside
              className={`${panelClass} p-5 sm:p-6 lg:sticky lg:top-[104px]`}
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  New Password
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Create new password
                </h2>

                <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                  Enter and confirm your new password below.
                </p>
              </div>

              <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      disabled={loading}
                      className={`${inputClass} pr-12`}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <Image
                        src="/images/view.png"
                        alt="Toggle password visibility"
                        width={18}
                        height={18}
                        className="brightness-0 invert"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    disabled={loading}
                    className={inputClass}
                    required
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
                  disabled={loading || !token}
                  className={`${primaryBtnClass} mt-2 w-full`}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <div className="mt-1 text-center text-[13px] text-[#a7aec4]">
                  Back to{" "}
                  <Link
                    href={backLoginPath}
                    className="font-semibold text-[#d6c7ff] transition hover:text-white"
                  >
                    Login
                  </Link>
                </div>
              </form>

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["Secure", "Update"],
                  ["Strong", "Password"],
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