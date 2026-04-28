"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import CollectionHeader from "@/components/layout/InfoHeader";
import MainFooter from "@/components/layout/MainFooter";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const inputClass =
  "h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7c86b1] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString().trim() || "";
    const password = formData.get("password")?.toString() || "";

    if (!email || !password) {
      setError("Email and password are required.");
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

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data?.message || "Login failed.");
        return;
      }

      localStorage.removeItem("ufo_redirect_after_login");

      router.push("/collection");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = () => {
    localStorage.removeItem("ufo_redirect_after_login");
    window.location.href = `${API}/auth/google/oauth`;
  };

  return (
    <>
      <CollectionHeader />

      <main className={shellClass}>
        <section className={containerClass}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Welcome Back
              </h1>

              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#a7aec4]">
                Log in to track orders, manage your wishlist, use collected
                discounts, and continue shopping faster.
              </p>
            </div>

            <Link href="/signup" className={secondaryBtnClass}>
              Create Account
            </Link>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
              className={`${panelClass} overflow-hidden`}
            >
              <div className="relative min-h-[360px] bg-[#161824] sm:min-h-[520px]">
                <Image
                  src="/images/loginw.jpg"
                  alt="UFO Collection login"
                  fill
                  priority
                  className="object-cover opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/20 to-transparent" />

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
                  Login
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
                    aria-label="Email address"
                    className={inputClass}
                  />
                </div>

                <div>
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
                      aria-label="Password"
                      className={`${inputClass} pr-12`}
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
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

                <AnimatePresence mode="wait">
                  {error ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-[13px] leading-6 text-red-200"
                    >
                      {error}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${primaryBtnClass} mt-2 w-full`}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                  <div className="h-px flex-1 bg-[#26293a]" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-[#26293a]" />
                </div>

                <button
                  type="button"
                  disabled={loading}
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
                </button>
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

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["Track", "Orders"],
                  ["Save", "Wishlist"],
                  ["Use", "Coupons"],
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
            </motion.aside>
          </div>
        </section>
      </main>

      <MainFooter />
    </>
  );
}