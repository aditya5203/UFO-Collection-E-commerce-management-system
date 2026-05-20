"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import CollectionHeader from "@/components/layout/InfoHeader";
import MainFooter from "@/components/layout/MainFooter";

const API_BASE = (
  API_BASE_URL
).replace(/\/+$/, "");

const API = `${API_BASE}/api`;

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_90px_rgba(0,0,0,0.45)]";
const inputClass =
  "h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7c86b1] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

type Toast = {
  type: "success" | "error";
  message: string;
};

function LoadingSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = React.useCallback((type: Toast["type"], message: string) => {
    setToast({ type, message });

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setToast(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const password = formData.get("password")?.toString() || "";

    if (!email || !password) {
      showToast("error", "Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", data?.message || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      showToast("success", "Login successful. Redirecting...");

      const storedRedirect =
        typeof window !== "undefined"
          ? localStorage.getItem("ufo_redirect_after_login")
          : null;

      const redirectPath =
        storedRedirect && storedRedirect.startsWith("/")
          ? storedRedirect
          : "/collection";

      localStorage.removeItem("ufo_redirect_after_login");

      window.setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
      showToast(
        "error",
        "Network error. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  const onGoogleLogin = () => {
    if (loading) return;
    window.location.href = `${API}/auth/google/oauth`;
  };

  return (
    <>
      <CollectionHeader />

      <AnimatePresence>
        {toast ? (
          <motion.div
            key="login-toast"
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`fixed right-4 top-5 z-[9999] max-w-[360px] rounded-[18px] border px-4 py-3 text-[13px] leading-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur ${
              toast.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                : "border-red-400/30 bg-red-500/15 text-red-100"
            }`}
          >
            <div className="font-semibold">
              {toast.type === "success" ? "Success" : "Action needed"}
            </div>
            <div className="text-white/80">{toast.message}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className={shellClass}>
        <section className={containerClass}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Login
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Welcome Back
              </h1>

              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#a7aec4]">
                Log in to track orders, manage your wishlist, use collected
                discounts, and continue shopping faster.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={secondaryBtnClass}>
                Create Account
              </Link>

              <Link href="/admin/adminlogin" className={secondaryBtnClass}>
                Admin Panel
              </Link>

              <Link href="/delivery/login" className={secondaryBtnClass}>
                Delivery Panel
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
              className={`${panelClass} overflow-hidden`}
            >
              <div className="relative min-h-[360px] bg-[#161824] sm:min-h-[560px]">
                <Image
                  src="/images/loginphoto.jpg"
                  alt="UFO Collection login"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/25 to-transparent" />

                <div className="absolute left-5 right-5 top-5 flex flex-wrap gap-2 sm:left-8 sm:right-8 sm:top-8">
                  {["Secure Login", "Order Tracking", "Saved Profile"].map(
                    (item) => (
                      <motion.span
                        key={item}
                        whileHover={{ y: -2, scale: 1.03 }}
                        className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur"
                      >
                        {item}
                      </motion.span>
                    )
                  )}
                </div>

                <div className="absolute bottom-6 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                    Member shopping experience
                  </div>

                  <h2 className="mt-4 max-w-[560px] text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[44px]">
                    Continue your UFO Collection journey.
                  </h2>

                  <p className="mt-3 max-w-[520px] text-[14px] leading-7 text-[#d6dbeb]">
                    Access saved items, order history, exclusive discounts, and
                    checkout with your saved profile.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.aside
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.16 }}
              className={`${panelClass} p-5 sm:p-6 lg:sticky lg:top-[104px]`}
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Account Access
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Sign in to your account
                </h2>

                <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                  Use your email or continue with Google.
                </p>
              </div>

              <motion.form
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.22 }}
                className="mt-6 grid gap-4"
                onSubmit={onSubmit}
              >
                <motion.div whileHover={{ y: -1 }}>
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
                    autoComplete="email"
                    aria-label="Email address"
                    className={inputClass}
                  />
                </motion.div>

                <motion.div whileHover={{ y: -1 }}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-[12px] font-medium text-[#d6c7ff] transition hover:text-white hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                      aria-label="Password"
                      className={`${inputClass} pr-20`}
                    />

                    <button
                      type="button"
                      disabled={loading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d6c7ff] transition hover:text-white disabled:opacity-60"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className={`${primaryBtnClass} mt-2 flex w-full items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </motion.button>

                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                  <div className="h-px flex-1 bg-[#26293a]" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-[#26293a]" />
                </div>

                <motion.button
                  type="button"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  onClick={onGoogleLogin}
                  className={`${secondaryBtnClass} flex w-full items-center justify-center gap-2`}
                >
                  <Image
                    src="/images/google.png"
                    width={18}
                    height={18}
                    alt="Google"
                  />
                  Continue with Google
                </motion.button>
              </motion.form>

              <div className="mt-5 text-center text-[13px] text-[#a7aec4]">
                New to UFO Collection?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-[#d6c7ff] transition hover:text-white"
                >
                  Create an account
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/admin/adminlogin"
                  className="rounded-[18px] border border-[#d6c7ff]/25 bg-[#d6c7ff]/10 p-4 transition hover:-translate-y-0.5 hover:border-[#d6c7ff]/45 hover:bg-[#d6c7ff]/15"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d6c7ff]">
                    Admin
                  </div>

                  <div className="mt-1 text-[15px] font-semibold text-white">
                    Admin Panel
                  </div>

                  <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
                    Manage products, orders, users, ads and analytics.
                  </div>
                </Link>

                <Link
                  href="/delivery/login"
                  className="rounded-[18px] border border-emerald-300/20 bg-emerald-400/10 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-emerald-400/15"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    Delivery
                  </div>

                  <div className="mt-1 text-[15px] font-semibold text-white">
                    Delivery Panel
                  </div>

                  <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
                    View assigned orders, OTP delivery and status updates.
                  </div>
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["Track", "Orders"],
                  ["Save", "Wishlist"],
                  ["Use", "Coupons"],
                ].map(([a, b]) => (
                  <motion.div
                    key={`${a}-${b}`}
                    whileHover={{ y: -2 }}
                    className="rounded-[16px] border border-[#26293a] bg-[#161824] p-3 text-center"
                  >
                    <div className="text-[12px] font-semibold text-white">
                      {a}
                    </div>

                    <div className="text-[11px] text-[#a7aec4]">{b}</div>
                  </motion.div>
                ))}
              </div>
            </motion.aside>
          </div>
        </section>
      </main>

      <MainFooter />
    </>
  );
}