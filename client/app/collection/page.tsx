"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

type CustomerType = "Men" | "Women" | "Boys" | "Girls";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  customer?: CustomerType;
  subCategory?: string; // e.g. "T-Shirt", "Jean", "Jacket"
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function CollectionPage() {
  const [sortValue, setSortValue] = React.useState("low-high");

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [selectedCustomers, setSelectedCustomers] = React.useState<
    CustomerType[]
  >([]);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);

  // ---------- Fetch products from backend ----------
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/products`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load products (status ${res.status})`);
        }

        const raw = await res.json();

        // Map API response → Product type
        const mapped: Product[] = (raw || []).map((p: any) => ({
          id: String(p.id || p._id),
          name: p.name,
          price:
            typeof p.price === "string" ? Number(p.price) || 0 : p.price ?? 0,
          image: p.image || "/images/collection/1.jpg",
          customer: p.customer as CustomerType | undefined,
          subCategory: p.subCategory || p.category, // fallback
        }));

        setProducts(mapped);
      } catch (err: any) {
        console.error("Error fetching collection products:", err);
        setError(err.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ---------- Filter helpers ----------
  const toggleCustomer = (value: CustomerType) => {
    setSelectedCustomers((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  // ---------- Apply filters + sort ----------
  const filteredAndSortedProducts = React.useMemo(() => {
    let list = [...products];

    // Filter by customer
    if (selectedCustomers.length > 0) {
      list = list.filter((p) =>
        p.customer ? selectedCustomers.includes(p.customer) : true
      );
    }

    // Filter by type / subCategory
    if (selectedTypes.length > 0) {
      const lowerTypes = selectedTypes.map((t) => t.toLowerCase());
      list = list.filter((p) => {
        const typeSource =
          (p.subCategory || "").toLowerCase() || (p.name || "").toLowerCase();
        return lowerTypes.some((t) => typeSource.includes(t));
      });
    }

    // Sort by price (or extend for newest using createdAt)
    list.sort((a, b) => {
      if (sortValue === "low-high") return a.price - b.price;
      if (sortValue === "high-low") return b.price - a.price;
      // "newest" – you can change to use createdAt when available
      return 0;
    });

    return list;
  }, [products, selectedCustomers, selectedTypes, sortValue]);

  return (
    <>
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

        /* PAGE LAYOUT */
        .page {
          min-height: calc(100vh - 80px);
          background: var(--bg-main);
          padding-bottom: 60px;
        }

        .collections-wrap {
          padding: 32px 0 40px;
        }

        .collections-header-line {
          border-bottom: 1px solid #2a2c3f;
          margin-top: 10px;
        }

        .collections-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .collections-title {
          font-size: 22px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .sort-select-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sort-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .sort-select {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid var(--border-soft);
          background: #090b18;
          color: var(--text-main);
          font-size: 12px;
          min-width: 180px;
        }

        /* MAIN GRID WITH FILTERS */
        .collections-grid-layout {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 32px;
          margin-top: 18px;
        }

        /* FILTER SIDEBAR */
        .filters-card {
          border-radius: 10px;
          border: 1px solid var(--border-soft);
          padding: 16px 16px 18px;
          background: #0d0f1e;
        }

        .filters-title {
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .filters-group {
          margin-bottom: 18px;
        }

        .filters-group-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 10px;
          color: var(--text-muted);
        }

        .checkbox-list {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: #d4d7f3;
        }

        .checkbox-item {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .checkbox-item input {
          accent-color: #ffffff;
        }

        /* PRODUCTS GRID */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
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
          border-radius: 8px;
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
          .collections-grid-layout {
            grid-template-columns: 1fr;
          }

          .filters-card {
            order: -1;
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

          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
            {/* Search -> collection */}
            <Link href="/collection">
              <Image
                src="/images/search.png"
                width={26}
                height={26}
                alt="Search"
                className="nav-icon"
              />
            </Link>

            {/* Profile -> profile page */}
            <Link href="/profile">
              <Image
                src="/images/profile.png"
                width={26}
                height={26}
                alt="Profile"
                className="nav-icon"
              />
            </Link>

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
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="page">
        <section className="collections-wrap">
          <div className="container">
            {/* TOP TITLE + SORT */}
            <div className="collections-top">
              <div className="collections-title">ALL COLLECTIONS</div>

              <div className="sort-select-wrap">
                <span className="sort-label">Sort by</span>
                <select
                  className="sort-select"
                  value={sortValue}
                  onChange={(e) => setSortValue(e.target.value)}
                  aria-label="Sort collections"
                >
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            <div className="collections-header-line" />

            {/* GRID LAYOUT: FILTERS + PRODUCTS */}
            <div className="collections-grid-layout">
              {/* FILTERS */}
              <aside className="filters-card">
                <div className="filters-title">FILTERS</div>

                <div className="filters-group">
                  <div className="filters-group-title">CATEGORIES</div>
                  <div className="checkbox-list">
                    {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map(
                      (c) => (
                        <label className="checkbox-item" key={c}>
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(c)}
                            onChange={() => toggleCustomer(c)}
                          />{" "}
                          <span>{c}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div className="filters-group">
                  <div className="filters-group-title">TYPES</div>
                  <div className="checkbox-list">
                    {[
                      "T-Shirt",
                      "Jean",
                      "Jacket",
                      "Formal Shirt",
                      "Frock",
                      "Wide-leg",
                      "Shorts",
                    ].map((t) => (
                      <label className="checkbox-item" key={t}>
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(t)}
                          onChange={() => toggleType(t)}
                        />{" "}
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </aside>

              {/* PRODUCTS GRID */}
              <div className="products-grid">
                {loading ? (
                  <div style={{ gridColumn: "1 / -1" }}>Loading products…</div>
                ) : error ? (
                  <div
                    style={{ gridColumn: "1 / -1", color: "#fca5a5" }}
                  >{`Error: ${error}`}</div>
                ) : filteredAndSortedProducts.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1" }}>
                    No products match your filters.
                  </div>
                ) : (
                  filteredAndSortedProducts.map((product) => (
                    <div key={product.id} className="product-card">
                      <div className="product-image-wrap">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                        />
                      </div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-price">
                        Rs. {product.price.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
