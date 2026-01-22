"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

export default function ForgotPasswordPage() {
  const router = useRouter();

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

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data?.message || "Something went wrong");
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
    <div className="min-h-screen bg-[#050611] text-[#f5f5f7]">
      {/* HEADER (same as login) */}
      <header className="sticky top-0 z-40 h-20 border-b border-[#191b2d] bg-[#050611]/95 backdrop-blur-[12px]">
  <div className="relative mx-auto flex h-full w-full max-w-[1160px] items-center px-4">
    
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
      <div className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
        UFO Collection
      </div>
    </div>

    {/* CENTER – NAV */}
    <nav className="flex items-center gap-[42px] pl-16">
  <Link href="/" className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
    HOME
  </Link>
  <Link href="/collection" className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
    COLLECTION
  </Link>
  <Link href="/about" className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
    ABOUT
  </Link>
  <Link href="/contact" className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
    CONTACT
  </Link>
</nav>


  </div>
</header>


      {/* PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_left,rgba(102,76,255,0.14),transparent_55%)]">
        <section className="py-12">
          <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-12 px-4 max-[900px]:grid-cols-1">
            {/* IMAGE */}
            <div className="relative min-h-[420px] overflow-hidden rounded-[18px] border border-[#20233a] bg-[#111324]">
              <Image
                src="/images/loginw.jpg"
                alt="Forgot password"
                fill
                className="object-cover"
              />
            </div>

            {/* CARD */}
            <div className="rounded-[18px] border border-[#22253a] bg-[#101223] px-10 py-10 shadow-[0_18px_40px_rgba(0,0,0,0.65)]">
              <h1 className="mb-2 text-[36px] font-semibold">
                Forgot Password
              </h1>
              <p className="mb-6 max-w-[360px] text-[14px] text-[#8b90ad]">
                Enter your email address and we’ll send you a link to reset your password.
              </p>

              <form onSubmit={onSubmit} className="grid gap-4">
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-[13px] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff]"
                />

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-[12px] text-green-200">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 rounded-full bg-[#b49cff] py-3 text-[14px] font-medium text-[#070818] shadow-[0_10px_26px_rgba(116,92,255,0.5)]"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-4 text-center text-[12px] text-[#8b90ad]">
                Remembered your password?{" "}
                <Link href="/login" className="font-medium text-[#c9b9ff]">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER (same as login) */}
      <footer className="bg-[#050611] py-6 text-center text-[11px] text-[#6d7192]">
        © 2025 UFO Collection — All Rights Reserved.
      </footer>
    </div>
  );
}
