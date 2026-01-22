"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ✅ FIX: store the form element BEFORE any await
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

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data?.message || "Signup failed");
        return;
      }

      // ✅ Welcome email is sent by backend after registration
      setSuccess(
        "✅ Account created! Welcome to UFO Collection. Please check your email for a welcome message, then log in to continue."
      );

      // ✅ FIX: reset using stored form reference (safe after await)
      form.reset();

      // redirect after a short moment (no async background, just UX)
      setTimeout(() => {
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
    <div className="min-h-screen bg-[#050611] text-[#f5f5f7]">
      {/* HEADER – SAME DESIGN */}
      <header className="sticky top-0 z-40 h-20 border-b border-[#191b2d] bg-[#050611]/95 backdrop-blur-[12px]">
        <div className="mx-auto flex h-full w-full max-w-[1160px] items-center justify-between px-4 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-2 max-[640px]:py-3">
          {/* Brand */}
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

          {/* Nav */}
          <nav className="flex gap-[42px] max-[640px]:flex-wrap max-[640px]:gap-5">
            <Link
              href="/homepage"
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

          {/* Icons */}
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
            <Link href="/profile">
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
      <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_left,rgba(102,76,255,0.15),transparent_55%)]">
        {/* HERO */}
        <section className="py-10 pb-[60px]">
          <div className="mx-auto grid w-full max-w-[1160px] grid-cols-2 items-center gap-10 px-4 max-[900px]:grid-cols-1">
            {/* LEFT IMAGE */}
            <div className="relative h-[500px] w-full overflow-hidden rounded-[18px] border border-[#20233a] bg-[#111324] max-[900px]:min-h-[320px]">
              <Image
                src="/images/signup.jpg"
                alt="Model standing"
                fill
                priority
                className="object-cover object-center"
              />
            </div>

            {/* RIGHT CARD */}
            <div className="rounded-[18px] border border-[#22253a] bg-[#101223] px-8 py-8 pb-7 shadow-[0_18px_40px_rgba(0,0,0,0.65)] max-[640px]:px-[18px] max-[640px]:py-6">
              <h1 className="mb-2 text-[32px] font-semibold leading-[1.25] max-[640px]:text-[26px]">
                Join The Collection
              </h1>
              <p className="mb-6 max-w-[320px] text-[13px] text-[#8b90ad]">
                Create an account to manage your orders, save favorites, and get
                access to exclusive UFO Collection deals.
              </p>

              <form className="grid gap-3" onSubmit={onSubmit}>
                <input
                  name="name"
                  placeholder="Name"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-[11px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-[11px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-[11px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                />

                {/* Measurements */}
                <div className="mt-1">
                  <div className="mb-1.5 text-[13px] text-[#f5f5f7]">
                    Basic Measurements{" "}
                    <span className="ml-1 text-[12px] text-[#8b90ad]">
                      (Optional)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      name="height"
                      placeholder="Height (ft)"
                      disabled={loading}
                      className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-[11px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                    />
                    <input
                      name="weight"
                      placeholder="Weight (kg)"
                      disabled={loading}
                      className="w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-[11px] text-[13px] text-[#f5f5f7] outline-none placeholder:text-[#787e99] focus:border-[#c9b9ff] focus:shadow-[0_0_0_1px_rgba(180,156,255,0.4)] disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* SUCCESS / ERROR */}
                {success ? (
                  <div className="mt-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-[12px] text-green-200">
                    {success}
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                    {error}
                  </div>
                ) : null}

                {/* Buttons */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-full bg-[linear-gradient(90deg,#b49cff,#e2c4ff)] px-4 py-[11px] text-[13px] font-medium text-[#070818] shadow-[0_10px_26px_rgba(116,92,255,0.5)] transition active:translate-y-[1px] active:shadow-[0_6px_18px_rgba(116,92,255,0.4)] hover:brightness-[1.05] disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-full border border-[#23253a] bg-transparent px-4 py-[10px] text-[13px] text-[#f5f5f7] transition hover:bg-[#15182a] hover:border-[#2b3050] disabled:opacity-60"
                  onClick={onGoogleSignup}
                >
                  <Image
                    src="/images/google.png"
                    width={18}
                    height={18}
                    alt="Google"
                  />
                  <span>Continue with Google</span>
                </button>
              </form>

              <div className="mt-3.5 text-center text-[12px] text-[#8b90ad]">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[#c9b9ff]">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIBE STRIP */}
        <section className="mt-10 border-y border-[#171a32] bg-[#0a1020] py-[46px] text-center max-[640px]:py-9">
          <div className="mx-auto w-full max-w-[1160px] px-4">
            <h3 className="mb-1.5 text-[20px] font-semibold">
              Subscribe &amp; get 20% off
            </h3>
            <p className="mb-[18px] text-[13px] text-[#8b90ad]">
              Join our mailing list for the latest drops, new arrivals and
              exclusive offers delivered straight to your inbox.
            </p>

            <form
              className="flex flex-wrap justify-center gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                const inp = e.currentTarget.querySelector(
                  "input"
                ) as HTMLInputElement;
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
          {/* Left */}
          <div>
            <div className="flex items-center gap-1.5 text-[16px] font-semibold tracking-[0.11em]">
              UFO Collection
              <span className="inline-flex items-center justify-center">
                <Image src="/images/logo.png" width={10} height={10} alt="dot" />
              </span>
            </div>
            <p className="mt-2 max-w-[420px] text-[12px] leading-[1.9] text-[#8b90ad]">
              UFO Collection brings minimal, premium streetwear to your wardrobe.
              Discover curated looks, everyday essentials and pieces made to
              last.
            </p>
          </div>

          {/* Middle */}
          <div>
            <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              COMPANY
            </div>
            <ul className="grid gap-2 text-[12px] text-[#d4d6ea]">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/about">About us</Link>
              </li>
              <li>
                <a href="#">Delivery</a>
              </li>
              <li>
                <a href="#">Privacy policy</a>
              </li>
            </ul>
          </div>

          {/* Right */}
          <div>
            <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              GET IN TOUCH
            </div>
            <ul className="grid gap-2 text-[12px] text-[#d4d6ea]">
              <li>+977 9804880758</li>
              <li>ufocollection075@gmail.com</li>
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
