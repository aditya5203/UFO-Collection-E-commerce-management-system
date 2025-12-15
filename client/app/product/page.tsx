"use client";

import React, { useState } from "react";
import Link from "next/link";

type Size = "S" | "M" | "L" | "XL" | "XXL";

type Product = {
  name: string;
  price: number;
  rating: number;
  reviews: number;
  shortDesc: string;
  longDesc: string;
  sizes: Size[];
  image: string;
};

type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const product: Product = {
  name: "Boy Round Neck Pure Cotton T-shirt",
  price: 60,
  rating: 4.8,
  reviews: 122,
  shortDesc:
    "This classic round neck t-shirt for boys is made from 100% pure cotton, ensuring comfort and breathability. Available in a range of sizes, it’s perfect for everyday wear.",
  longDesc:
    "This boy’s round neck t-shirt is crafted from high-quality, pure cotton, offering superior comfort and durability. Its classic design makes it a versatile addition to any young boy’s wardrobe, suitable for school, play, or casual outings. The breathable fabric ensures all-day comfort, while the durable construction withstands frequent washing and wear. Available in a variety of sizes to ensure a perfect fit.",
  sizes: ["S", "M", "L", "XL", "XXL"],
  image: "/product-boy-main.png",
};

const relatedProducts: RelatedProduct[] = [
  {
    id: "maroon-1",
    name: "Boy Maroon T-shirt",
    price: 55,
    image: "/related-maroon-1.png",
  },
  {
    id: "maroon-2",
    name: "Boy Maroon T-shirt",
    price: 55,
    image: "/related-maroon-2.png",
  },
  {
    id: "green",
    name: "Boy Green T-shirt",
    price: 55,
    image: "/related-boy-green.png",
  },
  {
    id: "yellow",
    name: "Boy Yellow T-shirt",
    price: 55,
    image: "/related-boy-yellow.png",
  },
  {
    id: "black",
    name: "Boy Black T-shirt",
    price: 55,
    image: "/related-boy-black.png",
  },
];

const ProductPage: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description",
  );

  return (
    <>
      {/* ============ GLOBAL STYLES ============ */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #050816;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          color: #e5e7eb;
        }

        a {
          text-decoration: none;
          color: inherit;
        }

        /* -------- HEADER (same as cart) -------- */
        .header {
          background: #050816;
          border-bottom: 1px solid #111827;
          padding: 12px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #f9fafb;
        }

        .back-link img {
          width: 18px;
          height: 18px;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-group img {
          width: 72px;
          height: 72px;
          object-fit: cover;
        }

        .logo-text {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 0.18em;
        }

        .nav-links {
          display: flex;
          gap: 32px;
          font-size: 14px;
        }

        .nav-links a {
          color: #9ca3af;
        }

        .nav-links a:hover {
          color: #ffffff;
        }

        .nav-links .active-link {
          color: #ffffff;
          border-bottom: 2px solid #ffffff;
          padding-bottom: 6px;
        }

        .header-right img {
          width: 22px;
          height: 22px;
        }

        /* -------- MAIN WRAPPER -------- */
        .page {
          max-width: 1120px;
          margin: 0 auto;
          padding: 22px 32px 60px;
        }

        .breadcrumb {
          font-size: 13px;
          color: #9ca3af;
          margin-bottom: 20px;
        }

        .breadcrumb span.current {
          color: #e5e7eb;
        }

        /* -------- TOP GRID: image + info -------- */
        .top-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.4fr);
          gap: 32px;
        }

        @media (max-width: 960px) {
          .top-grid {
            grid-template-columns: 1fr;
          }
        }

        .product-image-card {
          background: #050816;
          border-radius: 14px;
          padding: 18px;
          border: 1px solid #111827;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
        }

        .product-main-img {
          width: 100%;
          max-width: 360px;
          height: auto;
          object-fit: contain;
        }

        .product-title {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .rating-score {
          font-size: 22px;
          font-weight: 600;
        }

        .star-group {
          display: flex;
          gap: 2px;
        }

        .star-group img {
          width: 16px;
          height: 16px;
        }

        .review-count {
          font-size: 13px;
          color: #9ca3af;
        }

        .price {
          margin-top: 8px;
          font-size: 22px;
          font-weight: 600;
          color: #7dd3fc;
        }

        .short-desc {
          margin-top: 10px;
          font-size: 14px;
          color: #d1d5db;
          max-width: 460px;
          line-height: 1.7;
        }

        /* -------- SIZES -------- */
        .size-label {
          margin-top: 20px;
          margin-bottom: 8px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #cbd5f5;
        }

        .size-row {
          display: flex;
          gap: 8px;
        }

        .size-btn {
          min-width: 40px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #4b5563;
          background: #050816;
          color: #e5e7eb;
          font-size: 13px;
          cursor: pointer;
        }

        .size-btn.active {
          background: #1d9bf0;
          border-color: #1d9bf0;
          color: #ffffff;
        }

        /* -------- ADD TO CART + bullets -------- */
        .primary-btn {
          margin-top: 18px;
          padding: 9px 22px;
          border-radius: 4px;
          border: none;
          background: #1d9bf0;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .primary-btn:hover {
          background: #1580c5;
        }

        .bullet-list {
          margin-top: 10px;
          list-style: none;
          padding-left: 0;
          font-size: 13px;
          color: #cbd5e1;
        }

        .bullet-list li + li {
          margin-top: 4px;
        }

        /* -------- TABS -------- */
        .tabs {
          margin-top: 34px;
          border-bottom: 1px solid #111827;
          display: flex;
          gap: 28px;
          font-size: 14px;
        }

        .tab-btn {
          padding-bottom: 10px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
        }

        .tab-btn.active {
          color: #ffffff;
          border-bottom: 2px solid #ffffff;
        }

        .tab-btn span.count {
          font-size: 13px;
        }

        .tab-content {
          margin-top: 14px;
          font-size: 14px;
          color: #d1d5db;
          line-height: 1.7;
          max-width: 100%;
        }

        /* -------- RELATED PRODUCTS -------- */
        .related-section {
          margin-top: 46px;
        }

        .related-title {
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.18em;
          margin-bottom: 18px;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 1024px) {
          .related-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .related-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .related-card {
          background: #050816;
          border-radius: 10px;
          padding: 10px;
          border: 1px solid #111827;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.7);
          cursor: pointer;
        }

        .related-img-wrap {
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .related-img {
          width: 100%;
          height: 140px;
          object-fit: cover;
        }

        .related-name {
          font-size: 13px;
          color: #e5e7eb;
        }

        .related-price {
          font-size: 13px;
          color: #cbd5f5;
          margin-top: 2px;
        }

        /* -------- FOOTER -------- */
        .footer {
          text-align: center;
          padding: 38px 0 24px;
          color: #9ca3af;
          font-size: 12px;
        }

        .footer-icons {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin-bottom: 8px;
        }

        .footer-icons img {
          width: 18px;
          height: 18px;
        }
      `}</style>

      {/* ============ HEADER ============ */}
      <header className="header">
        <div className="header-left">
          <Link href="/collection" className="back-link">
            <img src="/images/backarrow.png" alt="Back" />
            <span>Back</span>
          </Link>

          <div className="logo-group">
            <Link href="/">
              <img src="/images/logo.png" alt="UFO Collection logo" />
            </Link>
            <span className="logo-text">UFO Collection</span>
          </div>
        </div>

        <nav className="nav-links">
          <Link href="/">HOME</Link>
          <Link href="/collection" className="active-link">
            COLLECTION
          </Link>
          <Link href="/about">ABOUT</Link>
          <Link href="/contact">CONTACT</Link>
        </nav>

        <div className="header-right">
          <img src="/images/wishlist.png" alt="Cart" />
        </div>
      </header>

      {/* ============ MAIN PAGE ============ */}
      <main className="page">
        {/* breadcrumb */}
        <div className="breadcrumb">
          Home /{" "}
          <span className="current">
            Boy Round Neck Pure Cotton T-shirt
          </span>
        </div>

        {/* top grid */}
        <section className="top-grid">
          {/* LEFT IMAGE */}
          <div className="product-image-card">
            <img
              src={product.image}
              alt={product.name}
              className="product-main-img"
            />
          </div>

          {/* RIGHT INFO */}
          <div>
            <h1 className="product-title">{product.name}</h1>

            <div className="rating-row">
              <span className="rating-score">{product.rating}</span>
              <div className="star-group">
                <img src="/star-full.png" alt="star" />
                <img src="/star-full.png" alt="star" />
                <img src="/star-full.png" alt="star" />
                <img src="/star-full.png" alt="star" />
                <img src="/star-empty.png" alt="star" />
              </div>
            </div>

            <div className="review-count">
              {product.reviews} reviews
            </div>

            <div className="price">${product.price}</div>

            <p className="short-desc">{product.shortDesc}</p>

            {/* sizes */}
            <div className="size-label">Size</div>
            <div className="size-row">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={
                    "size-btn " +
                    (selectedSize === size ? "active" : "")
                  }
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* add to cart + bullets */}
            <button type="button" className="primary-btn">
              ADD TO CART
            </button>

            <ul className="bullet-list">
              <li>100% Original Products</li>
              <li>Cash on delivery Available</li>
              <li>Easy 7 days return available</li>
            </ul>
          </div>
        </section>

        {/* tabs */}
        <section style={{ marginTop: "36px" }}>
          <div className="tabs">
            <button
              type="button"
              className={
                "tab-btn " +
                (activeTab === "description" ? "active" : "")
              }
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              type="button"
              className={
                "tab-btn " +
                (activeTab === "reviews" ? "active" : "")
              }
              onClick={() => setActiveTab("reviews")}
            >
              Reviews{" "}
              <span className="count">({product.reviews})</span>
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "description" ? (
              <p>{product.longDesc}</p>
            ) : (
              <p>
                Customer reviews section coming soon. Integrate your
                reviews data or API here.
              </p>
            )}
          </div>
        </section>

        {/* related products */}
        <section className="related-section">
          <div className="related-title">RELATED PRODUCTS</div>
          <div className="related-grid">
            {relatedProducts.map((rp) => (
              <div key={rp.id} className="related-card">
                <div className="related-img-wrap">
                  <img
                    src={rp.image}
                    alt={rp.name}
                    className="related-img"
                  />
                </div>
                <div className="related-name">{rp.name}</div>
                <div className="related-price">${rp.price}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="footer-icons">
          <img src="/instagram.png" alt="Instagram" />
          <img src="/facebook.png" alt="Facebook" />
        </div>
        <p>© 2025 UFOCollection — All Rights Reserved</p>
      </footer>
    </>
  );
};

export default ProductPage;
