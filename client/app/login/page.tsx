"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <>
      {/* GLOBAL STYLES – DARK THEME + LOGIN LAYOUT */}
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

        /* HEADER (NAVBAR) */
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
              rgba(102, 76, 255, 0.14),
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
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 48px;
          align-items: center;
        }

        /* LEFT IMAGE BLOCK */
        .hero-image {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          background: #111324;
          border: 1px solid #20233a;
          min-height: 420px;
        }

        .hero-image :global(img) {
          object-fit: cover;
        }

        /* RIGHT FORM CARD */
        .hero-card {
          background: var(--bg-card);
          border-radius: 18px;
          padding: 40px 40px 34px;
          border: 1px solid #22253a;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
        }

        .hero-title {
          font-size: 40px;
          line-height: 1.15;
          margin: 0 0 4px;
          font-weight: 600;
        }

        .hero-sub {
          margin: 0 0 26px;
          font-size: 14px;
          color: var(--text-muted);
          max-width: 340px;
        }

        form.login-form {
          display: grid;
          gap: 14px;
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 12px;
        }

        .form-label {
          color: #daddff;
          font-weight: 500;
        }

        .forgot-link {
          color: var(--brand-soft);
          font-size: 11px;
          cursor: pointer;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .login-form input {
          width: 100%;
          padding: 11px 12px;
          font-size: 13px;
          border-radius: 8px;
          border: 1px solid var(--border-soft);
          background: var(--bg-input);
          color: var(--text-main);
          outline: none;
        }

        .login-form input::placeholder {
          color: #787e99;
        }

        .login-form input:focus {
          border-color: var(--brand-soft);
          box-shadow: 0 0 0 1px rgba(180, 156, 255, 0.4);
        }

        /* PASSWORD SPECIAL STYLES */
        .password-wrapper {
          margin-top: 6px;
        }

        .password-input-box {
          position: relative;
          width: 100%;
        }

        .password-input-box input {
          width: 100%;
          padding: 12px 42px 12px 12px;
          font-size: 13px;
          border-radius: 8px;
          border: 1px solid var(--border-soft);
          background: var(--bg-input);
          color: var(--text-main);
          outline: none;
        }

        .password-input-box input::placeholder {
          color: #787e99;
        }

        .password-input-box input:focus {
          border-color: var(--brand-soft);
          box-shadow: 0 0 0 1px rgba(180, 156, 255, 0.4);
        }

        .eye-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          opacity: 0.9;
          border: none;
          background: transparent;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .eye-toggle:hover {
          opacity: 1;
        }

        .primary-btn {
          margin-top: 10px;
          width: 100%;
          border: none;
          border-radius: 999px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 500;
          background: #b49cff;
          color: #070818;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
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
          margin-top: 12px;
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

        .or-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          margin-bottom: 4px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .or-row span {
          white-space: nowrap;
        }

        .or-line {
          flex: 1;
          height: 1px;
          background: #292c45;
        }

        .signup-text {
          margin-top: 16px;
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
        }

        .signup-text a {
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

        /* FOOTER */
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
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.11em;
          margin-bottom: 8px;
        }

        .footp {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.9;
          max-width: 420px;
        }

        .foothead {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text-muted);
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

          .hero-card {
            padding: 28px 22px 24px;
          }

          .hero-title {
            font-size: 30px;
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

          .logo-text {
            font-size: 22px;
          }

          .sub {
            padding: 36px 0;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="topbar">
        <div className="container row">
          {/* LEFT – ROUND LOGO + TEXT */}
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

          {/* CENTER – NAV LINKS */}
          <nav className="nav">
            <Link href="/">HOME</Link>
            <Link href="/collection">COLLECTION</Link>
            <Link href="/about">ABOUT</Link>
            <Link href="/contact">CONTACT</Link>
          </nav>

          {/* RIGHT – ICONS */}
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
            <Link href="/login">
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
                src="/images/loginw.jpg"
                alt="Model sitting on stool"
                fill
                priority
              />
            </div>

            {/* RIGHT FORM CARD */}
            <div className="hero-card">
              <h1 className="hero-title">Welcome Back</h1>
              <p className="hero-sub">
                Log in to continue with your fashion journey. Track your orders,
                manage your wishlist and never miss a drop from UFO Collection.
              </p>

              <form
                className="login-form"
                onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get("email")?.toString() || "";
                  const password = formData.get("password")?.toString() || "";

                  try {
                    const apiBase =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const res = await fetch(`${apiBase}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",   // 🔴 ADD THIS
  body: JSON.stringify({
    email,
    password,
  }),
});


                    console.log("Login status:", res.status);

                    let data: any = {};
                    try {
                      data = await res.json();
                    } catch {
                      console.log("Login response not JSON");
                    }

                    console.log("Login response body:", data);

                    if (!res.ok) {
                      alert(data.message || "Login failed");
                      return;
                    }

                    alert("Logged in successfully ✨");
                    router.push("/collection");
                  } catch (err) {
                    console.error("Login error:", err);
                    alert("Something went wrong. Please try again.");
                  }
                }}
              >
                {/* EMAIL */}
                <div>
                  <div className="form-label-row">
                    <span className="form-label">Email Address</span>
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* PASSWORD WITH EYE + FORGOT */}
                <div className="password-wrapper">
                  <div className="form-label-row">
                    <span className="form-label">Password</span>
                    <Link href="/forgot-password" className="forgot-link">
                      Forgot your password?
                    </Link>
                  </div>

                  <div className="password-input-box">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
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

                {/* LOGIN BUTTON */}
                <button type="submit" className="primary-btn">
                  Login
                </button>

                {/* OR DIVIDER */}
                <div className="or-row">
                  <div className="or-line" />
                  <span>OR</span>
                  <div className="or-line" />
                </div>

                {/* GOOGLE LOGIN */}
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
                  <span>Log in with Google</span>
                </button>
              </form>

              <div className="signup-text">
                New here? <Link href="/signup">Create an account</Link>
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIBE STRIP */}
        <section className="sub">
          <div className="container">
            <h3>Subscribe now &amp; get 20% off</h3>
            <p>
              Discover the latest trends in fashion with UFO Collection.
              Stylish, comfortable and made for everyone.
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
            <div className="foot-logo">UFO Collection</div>
            <p className="footp">
              UFO Collection brings minimal, premium streetwear to your wardrobe.
              Discover curated looks, everyday essentials and pieces made to last.
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
