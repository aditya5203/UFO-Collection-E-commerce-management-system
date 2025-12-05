"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = React.useState<User | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  // 🔹 homepage products (from backend)
  const [latestProducts, setLatestProducts] = React.useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = React.useState<Product[]>(
    []
  );
  const [loadingProducts, setLoadingProducts] = React.useState(true);

  // ---------- Fetch /auth/me ----------
  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const res = await fetch(`${apiBase}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        const me = data.user || data.data?.user || null;
        setUser(me);
      } catch (err) {
        console.error("Failed to fetch /auth/me", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, []);

  // ---------- Fetch products for homepage ----------
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const res = await fetch(`${apiBase}/products`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load products");
        }

        const all: Product[] = await res.json();

        // 🟣 HomePage requirement:
        //   - total 50 products
        //   - first 25 → Latest
        //   - next 25 → Best Seller
        const limited = all.slice(0, 50);
        setLatestProducts(limited.slice(0, 25));
        setBestSellerProducts(limited.slice(25, 50));
      } catch (err) {
        console.error("Error loading homepage products:", err);
        setLatestProducts([]);
        setBestSellerProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

        :root {
          --bg-main: #050611;
          --bg-card: #101223;
          --bg-hero: #0b0d1a;
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

        /* HEADER – SAME AS LOGIN/SIGNUP */
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

        .admin-btn {
          border-radius: 999px;
          border: 1px solid #ffffff;
          padding: 6px 18px;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          background: transparent;
          color: #ffffff;
          cursor: pointer;
        }

        .admin-btn:hover {
          background: #ffffff;
          color: #050611;
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

        /* HERO – DARK VERSION OF YOUR WHITE HERO */
        .hero-section {
          padding: 32px 0 40px;
        }

        .hero-card {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 0;
          border-radius: 18px;
          overflow: hidden;
          background: var(--bg-hero);
          border: 1px solid #1f2136;
          min-height: 320px;
        }

        .hero-left {
          padding: 38px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
        }

        .hero-tag {
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .hero-title {
          font-size: 38px;
          font-weight: 600;
        }

        .hero-sub {
          font-size: 13px;
          color: var(--text-muted);
          max-width: 320px;
        }

        .hero-cta {
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #050611;
          background: #ffffff;
          border-radius: 999px;
          padding: 10px 20px;
          cursor: pointer;
          border: none;
        }

        .hero-right {
          position: relative;
          background: #0f1120;
        }

        .hero-right :global(img) {
          object-fit: cover;
        }

        /* SECTION HEADINGS */
        .section {
          padding: 24px 0 32px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 22px;
        }

        .section-title {
          font-size: 18px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .section-divider {
          margin: 8px auto 0;
          width: 80px;
          height: 1px;
          background: #3c3f59;
        }

        .section-sub {
          margin-top: 10px;
          font-size: 13px;
          color: var(--text-muted);
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
        }

        /* PRODUCT GRIDS */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .product-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
        }

        .product-image-wrap {
          position: relative;
          width: 100%;
          padding-bottom: 130%;
          border-radius: 10px;
          overflow: hidden;
          background: #151726;
          border: 1px solid #252842;
        }

        .product-image-wrap :global(img) {
          object-fit: cover;
        }

        .product-name {
          margin-top: 4px;
          color: #f1f2ff;
        }

        .product-price {
          color: var(--text-muted);
        }

        /* POLICIES ROW */
        .policies-section {
          padding: 12px 0 40px;
        }

        .policies-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 32px;
          text-align: center;
        }

        .policy-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .policy-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid #3a3d5a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .policy-title {
          font-size: 13px;
          font-weight: 600;
        }

        .policy-text {
          font-size: 12px;
          color: var(--text-muted);
          max-width: 220px;
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
        @media (max-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .hero-card {
            grid-template-columns: 1fr;
          }

          .hero-right {
            min-height: 260px;
          }

          .products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .policies-row {
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

          .hero-left {
            padding: 28px 20px;
          }

          .hero-title {
            font-size: 30px;
          }

          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .policies-row {
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
            {/* Search */}
            <Link href="/collection">
              <Image
                src="/images/search.png"
                width={26}
                height={26}
                alt="Search"
                className="nav-icon"
              />
            </Link>

            {/* Profile (with Google avatar if logged in) */}
            {user ? (
              <button
                type="button"
                aria-label="Open user profile"
                title="Profile"
                onClick={() => router.push("/profile")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <Image
                  src={user.avatarUrl || "/images/profile.png"}
                  width={32}
                  height={32}
                  alt={user.name || "Profile picture"}
                  className="nav-icon"
                  style={{ borderRadius: "999px" }}
                />
              </button>
            ) : (
              <Link href="/signup">
                <Image
                  src="/images/profile.png"
                  width={26}
                  height={26}
                  alt="Profile"
                  className="nav-icon"
                />
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/wishlist">
              <Image
                src="/images/wishlist.png"
                width={26}
                height={26}
                alt="Wishlist"
                className="nav-icon"
              />
            </Link>

            {/* Admin Button */}
            <button
              type="button"
              className="admin-btn"
              onClick={() => router.push("/admin/adminlogin")}
            >
              ADMIN
            </button>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main className="page">
        {/* HERO */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-card">
              <div className="hero-left">
                <div className="hero-tag">OUR BESTSELLERS</div>
                <h1 className="hero-title">Latest Arrivals</h1>
                <p className="hero-sub">
                  Discover new-season pieces designed for everyday comfort and
                  statement looks. Curated drops from UFO Collection, just
                  landed.
                </p>
                <button
                  className="hero-cta"
                  onClick={() => router.push("/collection")}
                >
                  SHOP NOW
                </button>
              </div>

              <div className="hero-right">
                <Image
                  src="/images/home/hero-banner.jpg"
                  alt="Jeans and t-shirt flatlay"
                  fill
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* LATEST COLLECTIONS */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div className="section-title">LATEST COLLECTIONS</div>
              <div className="section-divider" />
              <p className="section-sub">
                Handpicked styles fresh from our latest drops. Explore minimalist
                silhouettes, soft fabrics and everyday essentials for every
                wardrobe.
              </p>
            </div>

            {loadingProducts ? (
              <div>Loading products…</div>
            ) : latestProducts.length === 0 ? (
              <div>No products available.</div>
            ) : (
              <div className="products-grid">
                {latestProducts.map((p) => (
                  <div key={p.id} className="product-card">
                    <div className="product-image-wrap">
                      <Image src={p.image} alt={p.name} fill />
                    </div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-price">
                      Rs. {p.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* BEST SELLER */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div className="section-title">
                BEST <span style={{ fontWeight: 400 }}>SELLER</span>
              </div>
              <div className="section-divider" />
              <p className="section-sub">
                Customer favorites you can&apos;t go wrong with. These pieces
                are tried, tested and loved by the UFO community.
              </p>
            </div>

            {loadingProducts ? (
              <div>Loading products…</div>
            ) : bestSellerProducts.length === 0 ? (
              <div>No products available.</div>
            ) : (
              <div className="products-grid">
                {bestSellerProducts.map((p) => (
                  <div key={p.id} className="product-card">
                    <div className="product-image-wrap">
                      <Image src={p.image} alt={p.name} fill />
                    </div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-price">
                      Rs. {p.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* POLICIES */}
        <section className="policies-section">
          <div className="container">
            <div className="policies-row">
              <div className="policy-card">
                <div className="policy-icon">🔁</div>
                <div className="policy-title">Easy Exchange Policy</div>
                <div className="policy-text">
                  Hassle-free exchanges on eligible items for a smooth
                  experience.
                </div>
              </div>

              <div className="policy-card">
                <div className="policy-icon">📅</div>
                <div className="policy-title">7 Days Return Policy</div>
                <div className="policy-text">
                  Not the right fit? Enjoy a simple 7-day return window.
                </div>
              </div>

              <div className="policy-card">
                <div className="policy-icon">🎧</div>
                <div className="policy-title">Best Customer Support</div>
                <div className="policy-text">
                  Our team is here to help you with sizing, orders and more.
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
              Join our mailing list for early access to drops, exclusive deals,
              and styling tips curated by UFO Collection.
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
          <div>
            <div className="foot-logo">UFO Collection</div>
            <p className="footp">
              UFO Collection brings minimal, premium streetwear to your
              wardrobe. Discover curated looks, everyday essentials and pieces
              made to last.
            </p>
          </div>

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
