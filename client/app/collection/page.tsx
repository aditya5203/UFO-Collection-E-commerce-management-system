"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  price: string;
  image: string;
};

const products: Product[] = [
  // ROW 1
  {
    id: 1,
    name: "Women's Round Neck Green Top",
    price: "$149",
    image: "/images/collection/1.jpg",
  },
  {
    id: 2,
    name: "Men's Slim Fit Denim Jeans",
    price: "$199",
    image: "/images/collection/2.jpg",
  },
  {
    id: 3,
    name: "Women's Round Neck Cotton Top",
    price: "$149",
    image: "/images/collection/3.jpg",
  },
  {
    id: 4,
    name: "Men's Round Neck Pure Cotton T-Shirt",
    price: "$149",
    image: "/images/collection/4.jpg",
  },

  // ROW 2
  {
    id: 5,
    name: "Men's Printed Check Cotton Shirt",
    price: "$149",
    image: "/images/collection/5.jpg",
  },
  {
    id: 6,
    name: "Boys Casual Check Shirt & Short Set",
    price: "$149",
    image: "/images/collection/6.jpg",
  },
  {
    id: 7,
    name: "Boys Navy Half-Sleeve Cotton Shirt",
    price: "$149",
    image: "/images/collection/7.jpg",
  },
  {
    id: 8,
    name: "Girls Denim Jacket With Printed Dress",
    price: "$149",
    image: "/images/collection/8.jpg",
  },

  // ROW 3
  {
    id: 9,
    name: "Men's Denim Jacket & Black Jeans",
    price: "$199",
    image: "/images/collection/9.jpg",
  },
  {
    id: 10,
    name: "Men's Solid Casual Sweatshirt",
    price: "$179",
    image: "/images/collection/10.jpg",
  },
  {
    id: 11,
    name: "Men's Co-ord Set: Sweatshirt & Joggers",
    price: "$199",
    image: "/images/collection/11.jpg",
  },
  {
    id: 12,
    name: "Women's Mixed Bottom Wear Pack (4 Pcs)",
    price: "$249",
    image: "/images/collection/12.jpg",
  },

  // ROW 4
  {
    id: 13,
    name: "Girls Pink Printed Anarkali Dress",
    price: "$189",
    image: "/images/collection/13.jpg",
  },
  {
    id: 14,
    name: "Men's Casual Green Shirt & White Sneaker Set",
    price: "$229",
    image: "/images/collection/14.jpg",
  },
  {
    id: 15,
    name: "Men's Multi-Pack Casual Trousers",
    price: "$219",
    image: "/images/collection/15.jpg",
  },
  {
    id: 16,
    name: "Women's Solid Long Sleeve Sweatshirt",
    price: "$159",
    image: "/images/collection/16.jpg",
  },

  // ROW 5
  {
    id: 17,
    name: "Men's Winter Layered Outfit Set",
    price: "$249",
    image: "/images/collection/17.jpg",
  },
  {
    id: 18,
    name: "Men's Sky Blue Casual Shirt",
    price: "$179",
    image: "/images/collection/18.jpg",
  },
  {
    id: 19,
    name: "Men's Sleeveless Puffer Jacket & Shirt",
    price: "$199",
    image: "/images/collection/19.jpg",
  },
  {
    id: 20,
    name: "Men's Classic Crew Neck Sweatshirt",
    price: "$169",
    image: "/images/collection/20.jpg",
  },

  // ROW 6
  {
    id: 21,
    name: "Women's Oversized Pink Sweatshirt",
    price: "$159",
    image: "/images/collection/21.jpg",
  },
  {
    id: 22,
    name: "Women's Straight Fit Light Blue Jeans",
    price: "$199",
    image: "/images/collection/22.jpg",
  },
  {
    id: 23,
    name: "Women's Co-ord Set: Crop Top & Pants",
    price: "$219",
    image: "/images/collection/23.jpg",
  },
  {
    id: 24,
    name: "Girls Floral Printed Casual Frock",
    price: "$149",
    image: "/images/collection/24.jpg",
  },

  // ROW 7
  {
    id: 25,
    name: "Women's Graphic Black T-Shirt",
    price: "$129",
    image: "/images/collection/25.jpg",
  },
  {
    id: 26,
    name: "Women's Multi-Pack Solid Tops (5 Pcs)",
    price: "$259",
    image: "/images/collection/26.jpg",
  },
  {
    id: 27,
    name: "Men's Slim Fit Dark Wash Jeans",
    price: "$199",
    image: "/images/collection/27.jpg",
  },
  {
    id: 28,
    name: "Women's Relaxed Fit Mint T-Shirt",
    price: "$139",
    image: "/images/collection/28.jpg",
  },

  // ROW 8
  {
    id: 29,
    name: "Girls Golden Floral Frock",
    price: "$149",
    image: "/images/collection/29.jpg",
  },
  {
    id: 30,
    name: "Boys Casual Polo T-Shirt",
    price: "$129",
    image: "/images/collection/30.jpg",
  },
  {
    id: 31,
    name: "Girls Black Front-Printed Dress",
    price: "$149",
    image: "/images/collection/31.jpg",
  },
  {
    id: 32,
    name: "Men's Sky Blue Formal Shirt",
    price: "$179",
    image: "/images/collection/32.jpg",
  },

  // ROW 9
  {
    id: 33,
    name: "Men's Multi-Pack Round Neck T-Shirts",
    price: "$189",
    image: "/images/collection/33.jpg",
  },
  {
    id: 34,
    name: "Men's Ripped Slim Fit Jeans",
    price: "$219",
    image: "/images/collection/34.jpg",
  },
  {
    id: 35,
    name: "Women's Solid Sky Blue Top",
    price: "$149",
    image: "/images/collection/35.jpg",
  },
  {
    id: 36,
    name: "Girls Beige Crop Top & Skirt Set",
    price: "$179",
    image: "/images/collection/36.jpg",
  },

  // ROW 10
  {
    id: 37,
    name: "Women's Casual Navy Crop Top",
    price: "$149",
    image: "/images/collection/37.jpg",
  },
  {
    id: 38,
    name: "Men's Full Sleeve Indigo Shirt",
    price: "$189",
    image: "/images/collection/38.jpg",
  },
  {
    id: 39,
    name: "Men's Maroon Regular Fit T-Shirt",
    price: "$129",
    image: "/images/collection/39.jpg",
  },
  {
    id: 40,
    name: "Men's Black Straight Fit Jeans",
    price: "$199",
    image: "/images/collection/40.jpg",
  },

  // LAST ROW
  {
    id: 41,
    name: "Women's Powder Blue Overshirt",
    price: "$169",
    image: "/images/collection/41.jpg",
  },
  {
    id: 42,
    name: "Women's White Tie-Front Shirt",
    price: "$169",
    image: "/images/collection/42.jpg",
  },
  {
    id: 43,
    name: "Women's Solid White Casual Shirt",
    price: "$169",
    image: "/images/collection/43.jpg",
  },
  {
    id: 44,
    name: "Girls Sky Blue School Dress",
    price: "$139",
    image: "/images/collection/44.jpg",
  },
];

export default function CollectionPage() {
  const [sortValue, setSortValue] = React.useState("low-high");

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

  {/* Wishlist (optional route) */}
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
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Men</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Women</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Boys</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Girls</span>
                    </label>
                  </div>
                </div>

                <div className="filters-group">
                  <div className="filters-group-title">TYPES</div>
                  <div className="checkbox-list">
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>T-Shirt</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Jean</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Jacket</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Formal Shirt</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Frock</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Wide-leg</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" /> <span>Shorts</span>
                    </label>
                  </div>
                </div>
              </aside>

              {/* PRODUCTS GRID */}
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image-wrap">
                      <Image src={product.image} alt={product.name} fill />
                    </div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">{product.price}</div>
                  </div>
                ))}
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
