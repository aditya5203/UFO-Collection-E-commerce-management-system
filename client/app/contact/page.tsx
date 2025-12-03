"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export default function ContactPage() {
  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

        :root {
          --bg-main: #050611;
          --bg-card: #101223;
          --bg-subtle: #0b0d1a;
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

        /* HEADER – same as other pages */
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

        /* PAGE */
        .page {
          background: radial-gradient(
              circle at top left,
              rgba(102, 76, 255, 0.16),
              transparent 55%
            ),
            var(--bg-main);
        }

        /* CONTACT HERO */
        .contact-section {
          padding: 40px 0 40px;
        }

        .contact-title-wrap {
          margin-bottom: 22px;
        }

        .contact-title {
          font-size: 18px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .contact-title span {
          font-weight: 700;
        }

        .contact-divider {
          margin-top: 8px;
          width: 80px;
          height: 1px;
          background: #3c3f59;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 32px;
          align-items: stretch;
        }

        .contact-image-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 75%;
          border-radius: 18px;
          overflow: hidden;
          background: #111324;
          border: 1px solid #20233a;
        }

        .contact-image-wrap :global(img) {
          object-fit: cover;
        }

        .contact-card {
          background: var(--bg-card);
          border-radius: 18px;
          padding: 26px 26px 24px;
          border: 1px solid #23253a;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.6);
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.8;
        }

        .contact-card h3 {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 600;
          color: #f5f5ff;
        }

        .contact-block {
          margin-bottom: 14px;
        }

        .contact-block p {
          margin: 0;
        }

        .contact-muted {
          font-size: 12px;
          color: var(--text-muted);
        }

        .contact-cta-btn {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          border-radius: 999px;
          border: 1px solid var(--border-soft);
          background: transparent;
          color: var(--text-main);
          font-size: 12px;
          cursor: pointer;
          transition: background 0.14s ease, border-color 0.14s ease;
        }

        .contact-cta-btn:hover {
          background: #181a2c;
          border-color: #2f3250;
        }

        /* SUBSCRIBE */
        .sub {
          margin-top: 10px;
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
          max-width: var(--max);
          margin: 0 auto;
          padding: 0 16px 24px;
          display: grid;
          grid-template-columns: 1.4fr 0.8fr 0.8fr;
          gap: 40px;
          border-bottom: 1px solid #191b2e;
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
          .contact-grid {
            grid-template-columns: 1fr;
          }

          .footwrap {
            grid-template-columns: 1fr 1fr;
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

          .footwrap {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* HEADER */}
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
            <Image
              src="/images/profile.png"
              width={26}
              height={26}
              alt="Profile"
              className="nav-icon"
            />
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt="Wishlist"
              className="nav-icon"
            />
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main className="page">
        {/* CONTACT BLOCK */}
        <section className="contact-section">
          <div className="container">
            <div className="contact-title-wrap">
              <div className="contact-title">
                CONTACT <span>US</span>
              </div>
              <div className="contact-divider" />
            </div>

            <div className="contact-grid">
              {/* LEFT IMAGE */}
              <div className="contact-image-wrap">
                <Image
                  src="/images/contact-desk.jpg" // change to your image
                  alt="Laptop, phone and coffee on desk"
                  fill
                />
              </div>

              {/* RIGHT INFO CARD */}
              <div className="contact-card">
                <div className="contact-block">
                  <h3>Our Store</h3>
                  <p className="contact-muted">
                    Bhanu Chowk – 04, JanakpurDham,
                    <br />
                    Madhesh Pradesh, Dhanusha, Nepal
                  </p>
                  <p className="contact-muted" style={{ marginTop: "8px" }}>
                    Tel: +977 9804880758
                    <br />
                    Email: ufocollection@gmail.com
                  </p>
                </div>

                <div className="contact-block">
                  <h3>Careers at UFO</h3>
                  <p className="contact-muted">
                    Learn more about our teams, culture and current job
                    openings.
                  </p>
                  <button className="contact-cta-btn">Explore Jobs</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIBE STRIP */}
        <section className="sub">
          <div className="container">
            <h3>Subscribe now &amp; get 20% off</h3>
            <p>
              Be the first to hear about new drops, limited releases and special
              offers from UFO Collection.
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
        <div className="footwrap">
          {/* LEFT: UFO Collection */}
          <div>
            <div className="foot-logo">UFO Collection</div>
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
