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

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const password = formData.get("password")?.toString() || "";
    const height = formData.get("height")?.toString().trim() || "";
    const weight = formData.get("weight")?.toString().trim() || "";

    if (!name || !email || !password) {
      setError("Name, email and password are required.");
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
          password,
          height: height ? Number(height) : undefined,
          weight: weight ? Number(weight) : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Signup failed.");
        return;
      }

      setSuccess(
        "Account created successfully. Please check your email, then log in to continue."
      );

      form.reset();

      window.setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignup = () => {
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
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Create Account
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Join UFO Collection
              </h1>

              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[#a7aec4]">
                Sign up to save favorites, track orders, collect discounts, and
                enjoy a faster checkout experience.
              </p>
            </div>

            <Link href="/login" className={secondaryBtnClass}>
              Login
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
                  src="/images/signup.jpg"
                  alt="UFO Collection signup"
                  fill
                  priority
                  className="object-cover opacity-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/20 to-transparent" />

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
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    required
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

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

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create password"
                    required
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
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
                      placeholder="Height (ft)"
                      disabled={loading}
                      className={inputClass}
                    />

                    <input
                      name="weight"
                      placeholder="Weight (kg)"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-[13px] leading-6 text-emerald-200"
                    >
                      {success}
                    </motion.div>
                  ) : null}

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
                  {loading ? "Creating..." : "Create Account"}
                </button>

                <button
                  type="button"
                  disabled={loading}
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
                </button>
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

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["Secure", "Account"],
                  ["Fast", "Checkout"],
                  ["Member", "Offers"],
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