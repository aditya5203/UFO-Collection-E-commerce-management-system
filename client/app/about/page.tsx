"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
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

        /* HEADER – SAME AS OTHER PAGES */
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

        /* ABOUT HERO */
        .about-section {
          padding: 40px 0 40px;
        }

        .about-title-wrap {
          text-align: left;
          margin-bottom: 22px;
        }

        .about-title {
          font-size: 18px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .about-title span {
          font-weight: 700;
        }

        .about-divider {
          margin-top: 8px;
          width: 80px;
          height: 1px;
          background: #3c3f59;
        }

        .about-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 32px;
          align-items: stretch;
        }

        .about-image-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 75%;
          border-radius: 18px;
          overflow: hidden;
          background: #111324;
          border: 1px solid #20233a;
        }

        .about-image-wrap :global(img) {
          object-fit: cover;
        }

        .about-card {
          background: var(--bg-card);
          border-radius: 18px;
          padding: 26px 26px 24px;
          border: 1px solid #23253a;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.6);
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.8;
        }

        .about-card p {
          margin: 0 0 12px;
        }

        .about-card h3 {
          margin: 10px 0 8px;
          font-size: 14px;
          font-weight: 600;
          color: #f5f5ff;
        }

        /* WHY CHOOSE US */
        .why-section {
          padding: 18px 0 40px;
        }

        .why-header {
          margin-bottom: 22px;
        }

        .why-heading {
          font-size: 16px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .why-heading span {
          font-weight: 700;
        }

        .why-divider {
          margin-top: 6px;
          width: 80px;
          height: 1px;
          background: #3c3f59;
        }

        .why-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .why-card {
          background: var(--bg-subtle);
          border-radius: 14px;
          border: 1px solid #23253a;
          padding: 18px 18px 16px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .why-card-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 8px;
          color: #e4e5ff;
        }

        /* SUBSCRIBE SECTION */
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
          .about-grid {
            grid-template-columns: 1fr;
          }

          .why-grid {
            grid-template-columns: 1fr 1fr;
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

          .why-grid {
            grid-template-columns: 1fr;
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
        {/* ABOUT HERO */}
        <section className="about-section">
          <div className="container">
            <div className="about-title-wrap">
              <div className="about-title">
                ABOUT <span>US</span>
              </div>
              <div className="about-divider" />
            </div>

            <div className="about-grid">
              <div className="about-image-wrap">
                <Image
                  src="/images/about-flatlay.jpg" // change to your image
                  alt="Folded clothes, shoes and accessories"
                  fill
                />
              </div>

              <div className="about-card">
                <p>
                  UFO Collection was born from a passion for innovation and a
                  desire to reimagine the way people experience everyday style.
                  What started as a simple idea—to make curated, premium
                  streetwear accessible from the comfort of your home—has grown
                  into a brand focused on comfort, confidence and clean design.
                </p>
                <p>
                  Since our first drop, we&apos;ve worked to craft a diverse
                  selection of high–quality pieces that cater to every taste and
                  occasion. From laid–back basics to standout silhouettes, every
                  item is chosen with fabric, fit and longevity in mind.
                </p>

                <h3>Our Mission</h3>
                <p>
                  Our mission at UFO Collection is to empower customers with
                  choice, convenience and confidence. We&apos;re dedicated to
                  offering a seamless shopping journey—from discovery and
                  sizing, to checkout and delivery—so you can focus on wearing
                  what you love.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="why-section">
          <div className="container">
            <div className="why-header">
              <div className="why-heading">
                WHY <span>CHOOSE US</span>
              </div>
              <div className="why-divider" />
            </div>

            <div className="why-grid">
              <div className="why-card">
                <div className="why-card-title">QUALITY ASSURANCE</div>
                <p>
                  We carefully select and test every piece to ensure it meets
                  our standards for comfort, durability and finish.
                </p>
              </div>

                <div className="why-card">
                <div className="why-card-title">CONVENIENCE</div>
                <p>
                  Shop on your time with an easy–to–use interface, smart
                  filters, and size–friendly designs for everyday wear.
                </p>
              </div>

              <div className="why-card">
                <div className="why-card-title">
                  EXCEPTIONAL CUSTOMER SERVICE
                </div>
                <p>
                  Our support team is here to help with sizing, orders and
                  returns—so your experience stays smooth from cart to closet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIBE STRIP */}
        <section className="sub">
          <div className="container">
            <h3>Subscribe now &amp; get 20% off</h3>
            <p>
              Join the UFO list for exclusive drops, styling ideas and early
              access to limited collections.
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
