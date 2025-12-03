"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();

  return (
    <>
      {/* GLOBAL STYLES – DARK THEME LIKE LOGIN PAGE */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

        :root {
          --bg-main: #050611;
          --bg-card: #101223;
          --bg-subscribe: #0a1020;
          --bg-input: #181a2c;
          --border-soft: #23253a;
          --text-main: #f5f5f7;
          --text-muted: #8b90ad;
          --brand: #b49cff;
          --brand-soft: #c9b9ff;
          --max: 1160px;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          font-family: Poppins, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          background: var(--bg-main);
          color: var(--text-main);
        }

        a {
          text-decoration: none;
          color: inherit;
        }

        .container {
          max-width: var(--max);
          margin: 0 auto;
          padding: 0 16px;
        }

        /* HEADER (NAVBAR) – SAME AS LOGIN */
        .topbar {
          height: 80px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #191b2d;
          background: rgba(5, 6, 17, 0.96);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .brand-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo {
          border-radius: 999px;
          overflow: hidden;
          border: 2px solid #ffffff;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
        }

        .brand-logo :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .logo-text {
          font-weight: 700;
          letter-spacing: 0.18em;
          font-size: 28px;
          text-transform: uppercase;
          color: #ffffff;
        }

        .nav {
          display: flex;
          gap: 42px;
        }

        .nav a {
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .nav a:hover {
          color: var(--brand-soft);
        }

        .icons {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .nav-icon {
          filter: brightness(0) invert(1) contrast(280%) saturate(260%);
          opacity: 1;
        }

        /* PAGE LAYOUT */
        .page {
          background: radial-gradient(
              circle at top left,
              rgba(102, 76, 255, 0.15),
              transparent 55%
            ),
            var(--bg-main);
          min-height: calc(100vh - 80px);
        }

        .hero {
          padding: 40px 0 60px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 40px;
          align-items: center;
        }

        .hero-image {
          position: relative;
          width: 100%;
          height: 500px;
          border-radius: 18px;
          overflow: hidden;
          background: #111324;
          border: 1px solid #20233a;
        }

        .hero-image :global(img) {
          object-fit: cover !important;
          object-position: center !important;
        }

        /* RIGHT FORM CARD (SIGNUP) */
        .hero-card {
          background: var(--bg-card);
          border-radius: 18px;
          padding: 32px 32px 28px;
          border: 1px solid #22253a;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
        }

        .hero-title {
          font-size: 32px;
          line-height: 1.25;
          margin: 0 0 8px;
          font-weight: 600;
        }

        .hero-sub {
          margin: 0 0 24px;
          font-size: 13px;
          color: var(--text-muted);
          max-width: 320px;
        }

        form.signup {
          display: grid;
          gap: 12px;
        }

        .signup input {
          width: 100%;
          padding: 11px 12px;
          font-size: 13px;
          border-radius: 8px;
          border: 1px solid var(--border-soft);
          background: var(--bg-input);
          color: var(--text-main);
          outline: none;
        }

        .signup input::placeholder {
          color: #787e99;
        }

        .signup input:focus {
          border-color: var(--brand-soft);
          box-shadow: 0 0 0 1px rgba(180, 156, 255, 0.4);
        }

        .measure-block {
          margin-top: 6px;
        }

        .measure-title {
          font-size: 13px;
          margin-bottom: 6px;
          color: var(--text-main);
        }

        .measure-title span {
          font-size: 12px;
          color: var(--text-muted);
          margin-left: 4px;
        }

        .measure-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .primary-btn {
          margin-top: 10px;
          width: 100%;
          border: none;
          border-radius: 999px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 500;
          background: linear-gradient(90deg, #b49cff, #e2c4ff);
          color: #070818;
          cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.08s ease,
            filter 0.08s ease;
          box-shadow: 0 10px 26px rgba(116, 92, 255, 0.5);
        }

        .primary-btn:hover {
          filter: brightness(1.05);
        }

        .primary-btn:active {
          transform: translateY(1px);
          box-shadow: 0 6px 18px rgba(116, 92, 255, 0.4);
        }

        .google-btn {
          margin-top: 10px;
          width: 100%;
          border-radius: 999px;
          border: 1px solid var(--border-soft);
          background: transparent;
          padding: 10px 16px;
          font-size: 13px;
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease;
        }

        .google-btn:hover {
          background: #15182a;
          border-color: #2b3050;
        }

        .login-text {
          margin-top: 14px;
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
        }

        .login-text a {
          color: var(--brand-soft);
          font-weight: 500;
        }

        /* SUBSCRIBE STRIP */
        .sub {
          margin-top: 40px;
          padding: 46px 0;
          background: var(--bg-subscribe);
          border-top: 1px solid #171a32;
          border-bottom: 1px solid #171a32;
          text-align: center;
        }

        .sub h3 {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 600;
        }

        .sub p {
          margin: 0 0 18px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .subform {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sub-input {
          min-width: 260px;
          width: 420px;
          max-width: 80vw;
          border-radius: 999px;
          border: 1px solid var(--border-soft);
          padding: 10px 14px;
          font-size: 13px;
          background: #090c1a;
          color: var(--text-main);
        }

        .sub-input::placeholder {
          color: #787e99;
        }

        .subbtn {
          border-radius: 999px;
          border: none;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          background: #ffffff;
          color: #050616;
        }

        /* FOOTER (same as before) */
        .footer {
          padding: 40px 0 18px;
          background: #050611;
        }

        .footwrap {
          display: grid;
          grid-template-columns: 1.4fr 0.8fr 0.8fr;
          gap: 40px;
          border-bottom: 1px solid #191b2e;
          padding-bottom: 24px;
        }

        .foot-logo {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.11em;
        }

        .logo-dot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .foothead {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text-muted);
        }

        .footp {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.9;
          max-width: 420px;
        }

        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 8px;
          font-size: 12px;
          color: #d4d6ea;
        }

        .copy {
          font-size: 11px;
          color: #6d7192;
          text-align: center;
          padding-top: 14px;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr;
          }

          .hero-image {
            min-height: 320px;
          }

          .footwrap {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .nav {
            gap: 20px;
            flex-wrap: wrap;
          }

          .icons {
            margin-top: 4px;
          }

          .hero-card {
            padding: 24px 18px 20px;
          }

          .hero-title {
            font-size: 26px;
          }

          .sub {
            padding: 36px 0;
          }
        }
      `}</style>

      {/* HEADER – SAME AS LOGIN */}
      <header className="topbar">
        <div className="container row">
          <div className="brand-wrap">
            <div className="brand-logo">
              <Image
                src="/images/logo.png"
                alt="UFO Collection logo"
                width={44}
                height={44}
              />
            </div>
            <div className="logo-text">UFO Collection</div>
          </div>

          <nav className="nav">
            <Link href="/homepage">HOME</Link>
            <Link href="/collection">COLLECTION</Link>
            <Link href="/about">ABOUT</Link>
            <Link href="/contact">CONTACT</Link>
          </nav>

          <div className="icons">
            <Link href="/collection">
              <Image
                src="/images/search.png"
                width={26}
                height={26}
                alt="Search"
                className="nav-icon"
              />
            </Link>
            <Link href="/profile">
              <Image
                src="/images/profile.png"
                width={26}
                height={26}
                alt="Profile"
                className="nav-icon"
              />
            </Link>
            <Link href="/wishlist">
              <Image
                src="/images/wishlist.png"
                width={26}
                height={26}
                alt="Wishlist"
                className="nav-icon"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main className="page">
        {/* HERO SECTION (IMAGE + FORM) */}
        <section className="hero">
          <div className="container hero-grid">
            {/* LEFT IMAGE */}
            <div className="hero-image">
              <Image
                src="/images/signup.jpg"
                alt="Model standing"
                fill
                priority
              />
            </div>

            {/* RIGHT FORM CARD */}
            <div className="hero-card">
              <h1 className="hero-title">Join The Collection</h1>
              <p className="hero-sub">
                Create an account to manage your orders, save favorites, and get
                access to exclusive UFO Collection deals.
              </p>

              <form
                className="signup"
                onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                  e.preventDefault();

                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name")?.toString() || "";
                  const email = formData.get("email")?.toString() || "";
                  const password = formData.get("password")?.toString() || "";
                  const height = formData.get("height")?.toString() || "";
                  const weight = formData.get("weight")?.toString() || "";

                  try {
                    const apiBase =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const res = await fetch(`${apiBase}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",  // 🔴 ADD THIS
  body: JSON.stringify({
    name,
    email,
    password,
    height: Number(height),
    weight: Number(weight),
  }),
});

                    const data = await res.json().catch(() => ({} as any));

                    if (!res.ok) {
                      alert((data && data.message) || "Signup failed");
                      return;
                    }

                    alert("Account created! Please log in to continue ✉️");
                    router.push("/login");
                  } catch (err) {
                    console.error(err);
                    alert("Something went wrong. Please try again.");
                  }
                }}
              >
                <input name="name" placeholder="Name" required />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                />

                <div className="measure-block">
                  <div className="measure-title">
                    Basic Measurements <span>(Optional)</span>
                  </div>

                  <div className="measure-row">
                    <input name="height" placeholder="Height (ft)" />
                    <input name="weight" placeholder="Weight (kg)" />
                  </div>
                </div>

                <button type="submit" className="primary-btn">
                  Create Account
                </button>

                <button
  type="button"
  className="google-btn"
  onClick={() => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    window.location.href = `${apiBase}/auth/google/oauth`;
  }}
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

              <div className="login-text">
                Already have an account? <Link href="/login">Log in</Link>
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIBE STRIP */}
        <section className="sub">
          <div className="container">
            <h3>Subscribe &amp; get 20% off</h3>
            <p>
              Join our mailing list for the latest drops, new arrivals and
              exclusive offers delivered straight to your inbox.
            </p>

            <form
              className="subform"
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
                className="sub-input"
                type="email"
                required
                placeholder="Enter your email id"
              />
              <button className="subbtn" type="submit">
                SUBSCRIBE
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footwrap">
          {/* LEFT: UFO Collection */}
          <div>
            <div className="foot-logo">
              UFO Collection
              <span className="logo-dot">
                <Image
                  src="/images/logo.png"
                  width={10}
                  height={10}
                  alt="dot"
                />
              </span>
            </div>
            <p className="footp">
              UFO Collection brings minimal, premium streetwear to your
              wardrobe. Discover curated looks, everyday essentials and pieces
              made to last.
            </p>
          </div>

          {/* MIDDLE: COMPANY */}
          <div>
            <div className="foothead">COMPANY</div>
            <ul className="list">
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

          {/* RIGHT: GET IN TOUCH */}
          <div>
            <div className="foothead">GET IN TOUCH</div>
            <ul className="list">
              <li>+977 9804880758</li>
              <li>ufocollection@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="copy">
          Copyright 2025 © UFO Collection — All Rights Reserved.
        </div>
      </footer>
    </>
  );
}
