"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPermissions } from "../_components/adminPermissions";

const API_BASE =
  API_BASE_URL;

type AdminLoginResponse = {
  success?: boolean;
  message?: string;
  token?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: "admin" | "superadmin";
    status?: "active" | "inactive" | "invited";
    mustChangePassword?: boolean;
    permissions?: Partial<AdminPermissions>;
    avatar?: string;
  };
};

const inputClass =
  "h-12 w-full rounded-2xl border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] font-medium text-white outline-none transition placeholder:text-[#7f879f] focus:border-[#8b5cf6]/60 focus:ring-4 focus:ring-[#8b5cf6]/10";

export default function AdminLoginPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [savedEmail, setSavedEmail] = React.useState("");

  React.useEffect(() => {
    const email = window.localStorage.getItem("admin_remember_email");

    if (email) {
      setSavedEmail(email);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data: AdminLoginResponse = await res.json();

      if (!res.ok) {
        setError(data?.message || "Invalid admin credentials");
        return;
      }

      if (rememberMe) {
        window.localStorage.setItem("admin_remember_email", email);
      } else {
        window.localStorage.removeItem("admin_remember_email");
      }

      const user = data?.user;
      const role = String(user?.role || "").toLowerCase();
      const status = String(user?.status || "active").toLowerCase();
      const mustChangePassword = !!user?.mustChangePassword;

      if (role !== "admin" && role !== "superadmin") {
        setError("Access denied. Admin only.");
        return;
      }

      if (status === "inactive") {
        setError("This admin account is inactive.");
        return;
      }

      if (role === "admin" && mustChangePassword) {
        router.push("/admin/settings?forcePasswordChange=1");
        return;
      }

      router.push("/admin/dashboard");
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
                <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#8b5cf6]/20" />
                  <span className="absolute inset-2 animate-pulse rounded-full bg-[#60a5fa]/10 blur-xl" />

                  <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] shadow-[0_0_40px_rgba(139,92,246,0.35)]">
                    <img
                      src="/images/logo.png"
                      alt="UFO Collection"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a7aec4]">
                  UFO Collection
                </div>

                <h1 className="mt-4 max-w-[460px] text-[42px] font-semibold leading-tight tracking-[-0.05em] text-white">
                  Admin Control Panel
                </h1>

                <p className="mt-4 max-w-[460px] text-[14px] leading-7 text-[#a7aec4]">
                  Secure access for managing products, orders, delivery riders,
                  notifications, customers, and analytics.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[12px] font-semibold text-white">
                    Role-Based Access
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
                    Admin and superadmin permissions are checked after login.
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[12px] font-semibold text-white">
                    Secure Session
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
                    Login uses secure credentials with cookie-based access.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="p-5 sm:p-8 lg:p-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center lg:hidden">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#8b5cf6]/20" />
                  <span className="absolute inset-2 animate-pulse rounded-full bg-[#60a5fa]/10 blur-xl" />

                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] shadow-[0_0_40px_rgba(139,92,246,0.35)]">
                    <img
                      src="/images/logo.png"
                      alt="UFO Collection"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a7aec4]">
                Admin Panel
              </div>

              <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-white">
                Login
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
                >
                  Email Address
                </label>

                <input
                  id="admin-email"
                  className={inputClass}
                  type="email"
                  name="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  defaultValue={savedEmail}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="admin-password"
                    className={`${inputClass} pr-24`}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#d6c7ff] transition hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-3 text-[13px] font-medium text-[#a7aec4]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#26293a] accent-[#8b5cf6]"
                  />
                  Remember me
                </label>

                <Link
                  href="/admin/forgot-password"
                  className="text-[13px] font-semibold text-[#d6c7ff] transition hover:text-white"
                >
                  Forgot Password?
                </Link>
              </div>

              {error ? (
                <div className="rounded-[18px] border border-red-400/20 bg-red-500/15 px-4 py-3 text-center text-[13px] font-medium text-red-300">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-8 text-center text-[12px] leading-6 text-[#7f879f]">
              Only authorized admin and superadmin accounts can access this
              dashboard.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}