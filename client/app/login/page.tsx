"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

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
        credentials: "include", // ✅ important for cookie auth
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data?.message || "Login failed");
        return;
      }

      // ✅ success
      router.push("/collection");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = () => {
    // ✅ backend route already includes /api in our API const
    window.location.href = `${API}/auth/google/oauth`;
  };

  return (
    <div className="min-h-screen bg-[#050611] text-[#f5f5f7]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 h-20 border-b border-[#191b2d] bg-[#050611]/95 backdrop-blur-[12px]">
        <div className="mx-auto flex h-full w-full max-w-[1160px] items-center justify-between px-4 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-2 max-[640px]:py-3">
          {/* LEFT – ROUND LOGO + TEXT */}
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
            <div className="text-[28px] font-bold uppercase tracking-[0.18em] text-white max-[640px]:text-[22px]">
              UFO Collection
            </div>
          </div>

          {/* CENTER – NAV LINKS */}
          <nav className="flex gap-[42px] max-[640px]:flex-wrap max-[640px]:gap-5">
            <Link
              href="/"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          {/* RIGHT – ICONS */}
          <div className="flex items-center gap-5 max-[640px]:mt-1">
            <Link href="/collection">
              <Image
                src="/images/search.png"
                width={26}
                height={26}
                alt="Search"
                className="opacity-100 brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>
            <Link href="/login">
              <Image
                src="/images/profile.png"
                width={26}
                height={26}
                alt="Profile"
                className="opacity-100 brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>
            <Link href="/wishlist">
              <Image
                src="/images/wishlist.png"
                width={26}
                height={26}
                alt="Wishlist"
                className="opacity-100 brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_left,rgba(102,76,255,0.14),transparent_55%)]">
        {/* HERO */}
        <section className="py-10 pb-[60px]">
          <div className="mx-auto grid w-full max-w-[1160px] grid-cols-2 items-center gap-12 px-4 max-[900px]:grid-cols-1">
            {/* LEFT IMAGE */}
            <div className="relative min-h-[420px] w-full overflow-hidden rounded-[18px] border border-[#20233a] bg-[#111324] max-[900px]:min-h-[320px]">
              <Image
                src="/images/loginw.jpg"
                alt="Model sitting on stool"
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* RIGHT CARD */}
            <div className="rounded-[18px] border border-[#22253a] bg-[#101223] px-10 py-10 pb-[34px] shadow-[0_18px_40px_rgba(0,0,0,0.65)] max-[900px]:px-[22px] max-[900px]:py-7">
              <h1 className="mb-1 text-[40px] font-semibold leading-[1.15] max-[900px]:text-[30px]">
                Welcome Back
              </h1>
              <p className="mb-[26px] max-w-[340px] text-[14px] text-[#8b90ad]">
                Log in to continue with your fashion journey. Track your orders,
                manage your wishlist and never miss a drop from UFO Collection.
              </p>

              <form className="grid gap-[14px]" onSubmit={onSubmit}>
                {/* EMAIL */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#daddff]">Email Address</span>
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-[11px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                  />
                </div>

                {/* PASSWORD */}
                <div className="mt-1.5">
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#daddff]">Password</span>
                    <Link
                      href="/forgot-password"
                      className="cursor-pointer text-[11px] text-[#c9b9ff] hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>

                  <div className="relative w-full">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 pr-[42px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 opacity-90 hover:opacity-100"
                    >
                      <Image
                        src="/images/view.png"
                        alt="Toggle password visibility"
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>
                </div>

                {/* ERROR */}
                {error ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                    {error}
                  </div>
                ) : null}

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#b49cff] px-4 py-3 text-[14px] font-medium text-[#070818] shadow-[0_10px_26px_rgba(116,92,255,0.5)] transition hover:brightness-[1.05] active:translate-y-[1px] active:shadow-[0_6px_18px_rgba(116,92,255,0.4)] disabled:opacity-60"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                {/* OR DIVIDER */}
                <div className="my-2 flex items-center gap-2.5 text-[11px] text-[#8b90ad]">
                  <div className="h-px flex-1 bg-[#292c45]" />
                  <span className="whitespace-nowrap">OR</span>
                  <div className="h-px flex-1 bg-[#292c45]" />
                </div>

                {/* GOOGLE LOGIN */}
                <button
                  type="button"
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-full border border-[#23253a] bg-transparent px-4 py-[10px] text-[13px] text-[#f5f5f7] transition hover:bg-[#15182a] hover:border-[#2b3050] disabled:opacity-60"
                  onClick={onGoogleLogin}
                >
                  <Image src="/images/google.png" width={18} height={18} alt="Google" />
                  <span>Log in with Google</span>
                </button>
              </form>

              <div className="mt-4 text-center text-[12px] text-[#8b90ad]">
                New here?{" "}
                <Link href="/signup" className="font-medium text-[#c9b9ff]">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIBE STRIP */}
        <section className="mt-10 border-y border-[#171a32] bg-[#0a1020] py-[46px] text-center max-[640px]:py-9">
          <div className="mx-auto w-full max-w-[1160px] px-4">
            <h3 className="mb-1.5 text-[20px] font-semibold">
              Subscribe now &amp; get 20% off
            </h3>
            <p className="mb-[18px] text-[13px] text-[#8b90ad]">
              Discover the latest trends in fashion with UFO Collection. Stylish,
              comfortable and made for everyone.
            </p>

            <form
              className="flex flex-wrap justify-center gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                const inp = e.currentTarget.querySelector("input") as HTMLInputElement;
                if (inp.value) alert(`Subscribed: ${inp.value}`);
                inp.value = "";
              }}
            >
              <input
                className="w-[420px] max-w-[80vw] min-w-[260px] rounded-full border border-[#23253a] bg-[#090c1a] px-[14px] py-[10px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99]"
                type="email"
                required
                placeholder="Enter your email id"
              />
              <button
                className="rounded-full bg-white px-5 py-[10px] text-[13px] font-medium text-[#050616]"
                type="submit"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#050611] pb-[18px] pt-10">
        <div className="mx-auto grid w-full max-w-[1160px] grid-cols-[1.4fr_0.8fr_0.8fr] gap-10 border-b border-[#191b2e] px-4 pb-6 max-[900px]:grid-cols-1">
          <div>
            <div className="text-[16px] font-semibold tracking-[0.11em]">UFO Collection</div>
            <p className="mt-2 max-w-[420px] text-[12px] leading-[1.9] text-[#8b90ad]">
              UFO Collection brings minimal, premium streetwear to your wardrobe.
              Discover curated looks, everyday essentials and pieces made to last.
            </p>
          </div>

          <div>
            <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              COMPANY
            </div>
            <ul className="grid gap-2 text-[12px] text-[#d4d6ea]">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About us</Link></li>
              <li><a href="#">Delivery</a></li>
              <li><a href="#">Privacy policy</a></li>
            </ul>
          </div>

          <div>
            <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              GET IN TOUCH
            </div>
            <ul className="grid gap-2 text-[12px] text-[#d4d6ea]">
              <li>+977 9804880758</li>
              <li>ufocollection@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="pt-3.5 text-center text-[11px] text-[#6d7192]">
          Copyright 2025 © UFO Collection — All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
