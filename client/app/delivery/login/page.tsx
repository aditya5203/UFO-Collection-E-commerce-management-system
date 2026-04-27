"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DELIVERY_ENDPOINTS, safeJson } from "@/app/lib/delivery";

type LoginForm = {
  emailOrPhone: string;
  password: string;
  rememberMe: boolean;
};

function inputClassName() {
  return "w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-5 py-4 text-sm font-medium text-white placeholder:text-[#7f879f] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10";
}

export default function DeliveryLoginPage() {
  const router = useRouter();

  const [form, setForm] = React.useState<LoginForm>({
    emailOrPhone: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const savedEmail = window.localStorage.getItem("delivery_remember_email");

    if (savedEmail) {
      setForm((prev) => ({
        ...prev,
        emailOrPhone: savedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  const updateField = <K extends keyof LoginForm>(
    key: K,
    value: LoginForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.emailOrPhone.trim()) return "Email or phone is required.";
    if (!form.password.trim()) return "Password is required.";
    return "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationMessage = validate();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(DELIVERY_ENDPOINTS.login, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: form.emailOrPhone.trim(),
          password: form.password.trim(),
        }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setError((json as any)?.message || "Login failed");
        return;
      }

      if (form.rememberMe) {
        window.localStorage.setItem(
          "delivery_remember_email",
          form.emailOrPhone.trim()
        );
      } else {
        window.localStorage.removeItem("delivery_remember_email");
      }

      const mustChangePassword =
        Boolean((json as any)?.mustChangePassword) ||
        Boolean((json as any)?.user?.mustChangePassword) ||
        Boolean((json as any)?.data?.mustChangePassword);

      if (mustChangePassword) {
        router.replace("/delivery/change-password");
        return;
      }

      router.replace("/delivery/dashboard");
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0a0a0f] px-4 py-10 text-[#f5f7fb]">
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#8b5cf6]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-[#60a5fa]/10 blur-3xl" />

      <section className="relative w-full max-w-[620px] overflow-hidden rounded-[30px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/5 bg-white/[0.02] px-5 py-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#a7aec4]">
            Delivery Access
          </p>
        </div>

        <div className="bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] px-5 py-10 sm:px-8 md:px-12">
          <div className="text-center">
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
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

            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.04em] text-white md:text-[42px]">
              Delivery Login
            </h1>

            <p className="mx-auto mt-3 max-w-[420px] text-[13px] leading-6 text-[#a7aec4]">
              Sign in to manage assigned deliveries, update order status, and
              complete OTP verification.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                Email or Phone
              </label>
              <input
                type="text"
                value={form.emailOrPhone}
                onChange={(e) => updateField("emailOrPhone", e.target.value)}
                placeholder="Email Address or Phone"
                className={inputClassName()}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Enter password"
                  className={`${inputClassName()} pr-24`}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-[0.12em] text-[#d6c7ff] transition hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#a7aec4]">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => updateField("rememberMe", e.target.checked)}
                  className="h-4 w-4 rounded border-[#26293a] accent-[#8b5cf6]"
                />
                Remember me
              </label>

              <Link
                href="/delivery/forgot-password"
                className="text-sm font-semibold text-[#d6c7ff] transition hover:text-white"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-8 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}