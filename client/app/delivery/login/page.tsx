"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DELIVERY_ENDPOINTS, safeJson } from "@/app/lib/delivery";

type LoginForm = {
  emailOrPhone: string;
  password: string;
  rememberMe: boolean;
};

type ToastType = "error" | "success" | "info";

type Toast = {
  type: ToastType;
  message: string;
};

function inputClassName(hasError = false) {
  return [
    "w-full rounded-[18px] border px-5 py-4 text-sm font-medium text-white",
    "bg-[#0b0d14]/90 placeholder:text-[#7f879f] outline-none transition-all duration-300",
    "focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
    hasError
      ? "border-red-400/50 focus:border-red-400 focus:ring-red-500/10"
      : "border-[#26293a] focus:border-[#8b5cf6] focus:ring-[#8b5cf6]/10",
  ].join(" ");
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <Image
      src={hidden ? "/images/delivery/eye-off.png" : "/images/delivery/eye.png"}
      alt={hidden ? "Hide password" : "Show password"}
      width={18}
      height={18}
      className="h-[18px] w-[18px] object-contain opacity-90"
    />
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
  );
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
  const [toast, setToast] = React.useState<Toast | null>(null);
  const [touched, setTouched] = React.useState({
    emailOrPhone: false,
    password: false,
  });

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

  React.useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateField = <K extends keyof LoginForm>(
    key: K,
    value: LoginForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const emailError =
    touched.emailOrPhone && !form.emailOrPhone.trim()
      ? "Email or phone is required."
      : "";

  const passwordError =
    touched.password && !form.password.trim() ? "Password is required." : "";

  const validate = () => {
    if (!form.emailOrPhone.trim()) return "Email or phone is required.";
    if (!form.password.trim()) return "Password is required.";
    return "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      emailOrPhone: true,
      password: true,
    });

    const validationMessage = validate();

    if (validationMessage) {
      setToast({
        type: "error",
        message: validationMessage,
      });
      return;
    }

    try {
      setLoading(true);
      setToast(null);

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
        setToast({
          type: "error",
          message: (json as any)?.message || "Login failed. Please try again.",
        });
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

      setToast({
        type: "success",
        message: "Login successful. Redirecting...",
      });

      if (mustChangePassword) {
        router.replace("/delivery/change-password");
        return;
      }

      router.replace("/delivery/dashboard");
      router.refresh();
    } catch {
      setToast({
        type: "error",
        message: "Login failed. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07080d] px-4 py-8 text-[#f5f7fb] sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.14),transparent_32%),linear-gradient(135deg,#07080d,#0a0a0f_50%,#0d0f17)]" />

      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            className={[
              "fixed right-4 top-4 z-50 max-w-[360px] rounded-[18px] border px-4 py-3 text-sm font-semibold shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl",
              toast.type === "success"
                ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-100"
                : toast.type === "info"
                ? "border-blue-400/25 bg-blue-500/15 text-blue-100"
                : "border-red-400/25 bg-red-500/15 text-red-100",
            ].join(" ")}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative w-full max-w-[650px] overflow-hidden rounded-[34px] border border-white/10 bg-[#11121a]/95 shadow-[0_28px_100px_rgba(0,0,0,0.62)] backdrop-blur-xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8b5cf6]/80 to-transparent" />

        <div className="border-b border-white/5 bg-white/[0.025] px-5 py-4 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#a7aec4]">
            Delivery Access
          </p>
        </div>

        <div className="relative bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_34%),linear-gradient(135deg,#12131d,#0c0e15)] px-5 py-9 sm:px-8 sm:py-10 md:px-12">
          <div className="pointer-events-none absolute -right-20 top-20 h-44 w-44 rounded-full bg-[#8b5cf6]/10 blur-3xl" />

          <div className="relative text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.45, ease: "easeOut" }}
              className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-[#8b5cf6]/20" />
              <span className="absolute inset-2 animate-pulse rounded-full bg-[#60a5fa]/10 blur-xl" />

              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] shadow-[0_0_44px_rgba(139,92,246,0.38)]">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection"
                  width={80}
                  height={80}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>

            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a7aec4]">
              UFO Collection
            </div>

            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.045em] text-white sm:text-[38px] md:text-[44px]">
              Delivery Login
            </h1>

            <p className="mx-auto mt-3 max-w-[430px] text-[13px] leading-6 text-[#a7aec4]">
              Sign in to manage assigned deliveries, update order status, and
              complete secure OTP verification.
            </p>
          </div>

          <form onSubmit={onSubmit} className="relative mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                Email or Phone
              </label>

              <input
                type="text"
                value={form.emailOrPhone}
                onChange={(e) => updateField("emailOrPhone", e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, emailOrPhone: true }))
                }
                placeholder="Email address or phone"
                className={inputClassName(Boolean(emailError))}
                autoComplete="username"
                disabled={loading}
              />

              {emailError ? (
                <p className="mt-2 text-xs font-medium text-red-300">
                  {emailError}
                </p>
              ) : null}
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
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
                  placeholder="Enter password"
                  className={`${inputClassName(Boolean(passwordError))} pr-14`}
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>

              {passwordError ? (
                <p className="mt-2 text-xs font-medium text-red-300">
                  {passwordError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-[#a7aec4]">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => updateField("rememberMe", e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-[#26293a] accent-[#8b5cf6] disabled:cursor-not-allowed"
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

            <motion.button
              whileHover={!loading ? { y: -2 } : undefined}
              whileTap={!loading ? { scale: 0.98 } : undefined}
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-8 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] shadow-[0_18px_45px_rgba(255,255,255,0.12)] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </motion.button>
          </form>

          <div className="relative mt-7 rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-3 text-center text-xs leading-5 text-[#8f98b3]">
            Secure delivery portal for assigned UFO Collection staff only.
          </div>
        </div>
      </motion.section>
    </main>
  );
}