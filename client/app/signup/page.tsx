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

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_90px_rgba(0,0,0,0.45)]";
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

type Toast = {
  type: "success" | "error";
  message: string;
};

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (!password) return { label: "Not started", score: 0 };
  if (score <= 2) return { label: "Weak", score };
  if (score <= 4) return { label: "Good", score };
  return { label: "Strong", score };
}

function getStrengthWidthClass(score: number) {
  if (score <= 0) return "w-0";
  if (score === 1) return "w-1/5";
  if (score === 2) return "w-2/5";
  if (score === 3) return "w-3/5";
  if (score === 4) return "w-4/5";
  return "w-full";
}

function LoadingSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<Toast | null>(null);
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  const passwordStrength = getPasswordStrength(password);

  const showToast = React.useCallback((type: Toast["type"], message: string) => {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setToast(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const mobile = formData.get("mobile")?.toString().trim() || "";
    const passwordValue = formData.get("password")?.toString() || "";
    const confirmPassword =
      formData.get("confirmPassword")?.toString() || "";
    const height = formData.get("height")?.toString().trim() || "";
    const weight = formData.get("weight")?.toString().trim() || "";

    if (!name || !email || !mobile || !passwordValue || !confirmPassword) {
      showToast("error", "Name, email, mobile number and password are required.");
      return;
    }

    if (name.length < 2) {
      showToast("error", "Full name must be at least 2 characters.");
      return;
    }

    if (!/^(97|98)\d{8}$/.test(mobile)) {
      showToast("error", "Please enter a valid Nepali mobile number.");
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(passwordValue)) {
      showToast(
        "error",
        "Password must include uppercase, lowercase, number, and symbol."
      );
      return;
    }

    if (passwordValue !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }

    if (height && (Number(height) <= 0 || Number(height) > 8)) {
      showToast("error", "Please enter a valid height in feet.");
      return;
    }

    if (weight && (Number(weight) <= 0 || Number(weight) > 250)) {
      showToast("error", "Please enter a valid weight in kg.");
      return;
    }

    if (!acceptedTerms) {
      showToast("error", "Please accept the terms and privacy policy.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          phone: mobile,
          password: passwordValue,
          height: height ? Number(height) : undefined,
          weight: weight ? Number(weight) : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", data?.message || "Signup failed. Please try again.");
        return;
      }

      showToast("success", "Account created successfully. Redirecting to login...");
      form.reset();
      setPassword("");
      setAcceptedTerms(false);

      window.setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignup = () => {
    if (loading) return;
    window.location.href = `${API}/auth/google/oauth`;
  };

  return (
    <>
      <CollectionHeader />

      <AnimatePresence>
        {toast ? (
          <motion.div
            key="signup-toast"
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
            className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Create Account
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Join UFO Collection
              </h1>

              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#a7aec4]">
                Create your profile, save favorites, track orders, collect
                offers, and enjoy faster checkout.
              </p>
            </div>

            <Link href="/login" className={secondaryBtnClass}>
              Login
            </Link>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
              className={`${panelClass} overflow-hidden`}
            >
              <div className="relative min-h-[380px] bg-[#161824] sm:min-h-[620px]">
                <Image
                  src="/images/signups.jpg"
                  alt="UFO Collection signup"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/25 to-transparent" />

                <div className="absolute left-5 right-5 top-5 flex flex-wrap gap-2 sm:left-8 sm:right-8 sm:top-8">
                  {["Secure Account", "Fast Checkout", "Member Offers"].map(
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
                    Premium streetwear & essentials
                  </div>

                  <h2 className="mt-4 max-w-[560px] text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[44px]">
                    Build your style profile with UFO Collection.
                  </h2>

                  <p className="mt-3 max-w-[520px] text-[14px] leading-7 text-[#d6dbeb]">
                    Get personalized shopping, order updates, exclusive offers,
                    and member-only drops.
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
                  Signup
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Create your account
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
                className="mt-6 grid gap-3"
                onSubmit={onSubmit}
              >
                <motion.div whileHover={{ y: -1 }}>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                    autoComplete="name"
                    className={inputClass}
                  />
                </motion.div>

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
                    className={inputClass}
                  />
                </motion.div>

                <motion.div whileHover={{ y: -1 }}>
                  <label
                    htmlFor="mobile"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Mobile Number
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    inputMode="numeric"
                    placeholder="98XXXXXXXX"
                    required
                    maxLength={10}
                    disabled={loading}
                    autoComplete="tel"
                    className={inputClass}
                  />
                </motion.div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-20`}
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d6c7ff] transition hover:text-white disabled:opacity-60"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full bg-white transition-all ${getStrengthWidthClass(
                          passwordStrength.score
                        )}`}
                      />
                    </div>

                    <div className="mt-1 text-[11px] text-[#a7aec4]">
                      Password strength:{" "}
                      <span className="font-semibold text-white">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                      className={`${inputClass} pr-20`}
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d6c7ff] transition hover:text-white disabled:opacity-60"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4"
                >
                  <div className="mb-3">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white">
                      Basic Measurements
                    </div>
                    <div className="mt-1 text-[12px] text-[#a7aec4]">
                      Optional — helps with size recommendations.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="height"
                      type="number"
                      step="0.1"
                      min="1"
                      max="8"
                      placeholder="Height (ft)"
                      disabled={loading}
                      className={inputClass}
                    />

                    <input
                      name="weight"
                      type="number"
                      step="0.1"
                      min="1"
                      max="250"
                      placeholder="Weight (kg)"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </motion.div>

                <label className="flex cursor-pointer items-start gap-3 rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4 text-[12px] leading-5 text-[#a7aec4]">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    disabled={loading}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-white"
                  />
                  <span>
                    I agree to UFO Collection&apos;s{" "}
                    <Link
                      href="/terms"
                      className="font-semibold text-[#d6c7ff] hover:text-white"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-semibold text-[#d6c7ff] hover:text-white"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className={`${primaryBtnClass} mt-2 flex w-full items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  onClick={onGoogleSignup}
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
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#d6c7ff] transition hover:text-white"
                >
                  Log in
                </Link>
              </div>
            </motion.aside>
          </div>
        </section>
      </main>

      <MainFooter />
    </>
  );
}