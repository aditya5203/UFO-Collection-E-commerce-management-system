"use client";

import React, { useState } from "react";
import Link from "next/link";

type CartItem = {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
};

const initialCart: CartItem[] = [
  {
    id: "1",
    name: "Women’s Black Jacket",
    size: "M",
    price: 120,
    quantity: 1,
    image: "/cart-jacket.png",
  },
  {
    id: "2",
    name: "Men’s Blue Jeans",
    size: "32",
    price: 160,
    quantity: 1,
    image: "/cart-jeans.png",
  },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);

  const handleIncrease = (id: string) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecrease = (id: string) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleRemove = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 10;
  const total = subtotal + shipping;

  return (
    <>
      {/* ===== GLOBAL STYLES FOR THIS PAGE ===== */}
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

        /* ---------- HEADER ---------- */
        .cart-header {
          background: #050816;
          border-bottom: 1px solid #111827;
          padding: 12px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cart-header-left {
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
          gap: 14px;
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

        .cart-header-right img {
          width: 22px;
          height: 22px;
        }

        /* ---------- MAIN LAYOUT ---------- */
        .cart-page {
          max-width: 1120px;
          margin: 0 auto;
          padding: 24px 32px 56px;
        }

        .cart-title {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .divider-line {
          height: 1px;
          background: #111827;
          margin-bottom: 28px;
        }

        .cart-layout {
          display: grid;
          grid-template-columns: minmax(0, 2.4fr) minmax(280px, 1.3fr);
          gap: 40px;
          align-items: flex-start;
        }

        @media (max-width: 960px) {
          .cart-layout {
            grid-template-columns: 1fr;
          }
        }

        /* ---------- CART TABLE CARD ---------- */
        .cart-table-card {
          background: #050816;
          border-radius: 10px;
          border: 1px solid #1f2937;
          overflow: hidden;
        }

        .cart-header-row,
        .cart-row {
          display: grid;
          grid-template-columns: 3.4fr 1.1fr 1.5fr 1.2fr 0.6fr;
          align-items: center;
          padding: 12px 18px;
        }

        .cart-header-row {
          background: #020617;
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
          border-bottom: 1px solid #1f2937;
        }

        .cart-row {
          background: #050816;
          border-top: 1px solid #1f2937;
          font-size: 14px;
        }

        /* Product cell */
        .product-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-thumb {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          object-fit: cover;
          background: #111827;
        }

        .product-name {
          font-size: 14px;
          color: #e5e7eb;
        }

        /* Size cell */
        .size-cell {
          font-size: 13px;
          color: #9ca3af;
        }

        /* Quantity cell – custom control */
        .qty-cell {
          display: flex;
          align-items: center;
        }

        .qty-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #d1d5db;
          padding: 6px 10px 6px 12px;
          border-radius: 3px;
          width: 150px;
          background: #050816;
        }

        .qty-label {
          font-size: 14px;
          color: #cbd5e1;
        }

        .qty-buttons {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-left: 8px;
        }

        .qty-btn {
          width: 16px;
          height: 10px;
          border: none;
          background: transparent;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .qty-btn img {
          width: 14px;
          height: 10px;
        }

        /* Price cell */
        .price-cell {
          text-align: left;
          font-size: 14px;
          color: #e5e7eb;
        }

        /* Delete icon cell */
        .delete-cell {
          display: flex;
          justify-content: center;
        }

        .delete-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
        }

        .delete-btn img {
          width: 20px;
          height: 20px;
        }

        /* ---------- ORDER SUMMARY CARD ---------- */
        .summary-card {
          background: #050816;
          border-radius: 10px;
          border: 1px solid #1f2937;
          padding: 22px 24px;
        }

        .summary-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #cbd5e1;
          margin: 6px 0;
        }

        .summary-row.total-row {
          margin-top: 10px;
          font-weight: 600;
        }

        .checkout-btn {
          margin-top: 18px;
          width: 100%;
          padding: 11px 0;
          border-radius: 6px;
          border: none;
          background: #1d9bf0;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .checkout-btn:hover {
          background: #1580c5;
        }

        /* ---------- FOOTER ---------- */
        .cart-footer {
          text-align: center;
          padding: 40px 0 26px;
          color: #9ca3af;
          font-size: 12px;
        }

        .footer-icons {
          margin-bottom: 10px;
          display: flex;
          justify-content: center;
          gap: 18px;
        }

        .footer-icons img {
          width: 18px;
          height: 18px;
        }
      `}</style>

      {/* ---------- HEADER ---------- */}
      <header className="cart-header">
        <div className="cart-header-left">
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

        <div className="cart-header-right">
          <img src="/images/wishlist.png" alt="Cart" />
        </div>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="cart-page">
        <h1 className="cart-title">Shopping Cart</h1>
        <div className="divider-line" />

        <div className="cart-layout">
          {/* LEFT: cart table */}
          <section className="cart-table-card">
            <div className="cart-header-row">
              <span>Product</span>
              <span>Size</span>
              <span>Quantity</span>
              <span>Price</span>
              <span></span>
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="cart-row">
                <div className="product-cell">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="product-thumb"
                  />
                  <span className="product-name">{item.name}</span>
                </div>

                <div className="size-cell">Size: {item.size}</div>

                <div className="qty-cell">
                  <div className="qty-box">
                    <span className="qty-label">Quantity: {item.quantity}</span>
                    <div className="qty-buttons">
                      <button
                        className="qty-btn"
                        type="button"
                        onClick={() => handleIncrease(item.id)}
                      >
                        <img src="/images/qtyup.png" alt="Increase quantity" />
                      </button>
                      <button
                        className="qty-btn"
                        type="button"
                        onClick={() => handleDecrease(item.id)}
                      >
                        <img src="/images/qtydown.png" alt="Decrease quantity" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="price-cell">${item.price * item.quantity}</div>

                <div className="delete-cell">
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() => handleRemove(item.id)}
                  >
                    <img src="/images/delete.png" alt="Remove item" />
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* RIGHT: order summary */}
          <aside className="summary-card">
            <div className="summary-title">Order Summary</div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div className="summary-row">
              <span>Estimated Shipping</span>
              <span>${shipping}</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>${total}</span>
            </div>

            <button className="checkout-btn" type="button">
              Proceed to Checkout
            </button>
          </aside>
        </div>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="cart-footer">
        <div className="footer-icons">
          <img src="/instagram.png" alt="Instagram" />
          <img src="/facebook.png" alt="Facebook" />
        </div>
        <p>© 2025 UFO Collection — All Rights Reserved</p>
      </footer>
    </>
  );
}
