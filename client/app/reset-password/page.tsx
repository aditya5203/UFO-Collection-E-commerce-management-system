"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token") || "";

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (!token) setError("Reset token is missing. Please request a new reset link.");
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

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data?.message || "Reset failed. Please request a new link.");
        return;
      }

      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 900);
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050611] text-[#f5f5f7]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 h-20 border-b border-[#191b2d] bg-[#050611]/95 backdrop-blur-[12px]">
        <div className="mx-auto flex h-full w-full max-w-[1160px] items-center justify-between px-4">
          {/* LEFT – LOGO */}
          <div className="flex items-center gap-[10px]">
            <div className="h-[44px] w-[44px] overflow-hidden rounded-full border-2 border-white">
              <Image
                src="/images/logo.png"
                alt="UFO Collection logo"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-[28px] font-bold uppercase tracking-[0.18em] text-white">
              UFO Collection
            </div>
          </div>

          {/* CENTER – NAV */}
          <nav className="flex gap-[42px]">
            <Link href="/" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              HOME
            </Link>
            <Link href="/collection" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              COLLECTION
            </Link>
            <Link href="/about" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              ABOUT
            </Link>
            <Link href="/contact" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              CONTACT
            </Link>
          </nav>

          {/* RIGHT – ICONS */}
          <div className="flex items-center gap-5">
            <Link href="/collection">
              <Image src="/images/search.png" width={26} height={26} alt="Search" className="brightness-0 invert contrast-[2.8] saturate-[2.6]" />
            </Link>
            <Link href="/login">
              <Image src="/images/profile.png" width={26} height={26} alt="Profile" className="brightness-0 invert contrast-[2.8] saturate-[2.6]" />
            </Link>
            <Link href="/wishlist">
              <Image src="/images/wishlist.png" width={26} height={26} alt="Wishlist" className="brightness-0 invert contrast-[2.8] saturate-[2.6]" />
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_left,rgba(102,76,255,0.14),transparent_55%)]">
        <section className="py-10 pb-[60px]">
          <div className="mx-auto grid w-full max-w-[1160px] grid-cols-2 items-center gap-12 px-4 max-[900px]:grid-cols-1">
            {/* LEFT IMAGE */}
            <div className="relative min-h-[420px] w-full overflow-hidden rounded-[18px] border border-[#20233a] bg-[#111324] max-[900px]:min-h-[320px]">
              <Image src="/images/loginw.jpg" alt="Reset password visual" fill priority className="object-cover" />
            </div>

            {/* RIGHT CARD */}
            <div className="rounded-[18px] border border-[#22253a] bg-[#101223] px-10 py-10 pb-[34px] shadow-[0_18px_40px_rgba(0,0,0,0.65)] max-[900px]:px-[22px] max-[900px]:py-7">
              <h1 className="mb-1 text-[40px] font-semibold leading-[1.15] max-[900px]:text-[30px]">
                Reset Password
              </h1>
              <p className="mb-[26px] max-w-[420px] text-[14px] text-[#8b90ad]">
                Create a new password for your account. This reset link expires quickly for your security.
              </p>

              <form className="grid gap-[14px]" onSubmit={onSubmit}>
                {/* NEW PASSWORD */}
                <div>
                  <div className="mb-1.5 text-[12px] font-medium text-[#daddff]">New Password</div>
                  <div className="relative w-full">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      disabled={loading}
                      className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 pr-[42px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 opacity-90 hover:opacity-100"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Image src="/images/view.png" alt="Toggle password visibility" width={20} height={20} />
                    </button>
                  </div>
                </div>

                {/* CONFIRM */}
                <div>
                  <div className="mb-1.5 text-[12px] font-medium text-[#daddff]">Confirm Password</div>
                  <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    disabled={loading}
                    className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                    required
                  />
                </div>

                {/* ERROR/SUCCESS */}
                {error ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
                    {success}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#b49cff] px-4 py-3 text-[14px] font-medium text-[#070818] shadow-[0_10px_26px_rgba(116,92,255,0.5)] transition hover:brightness-[1.05] active:translate-y-[1px] active:shadow-[0_6px_18px_rgba(116,92,255,0.4)] disabled:opacity-60"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <div className="mt-2 text-center text-[12px] text-[#8b90ad]">
                  Back to{" "}
                  <Link href="/login" className="font-medium text-[#c9b9ff]">
                    Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
