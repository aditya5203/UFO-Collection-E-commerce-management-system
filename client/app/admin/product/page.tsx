"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  category: string;
  categoryLink: string;
  price: string;
  stock: number;
  status: "Active" | "Draft" | "Archived";
  image: string; // PNG path
};

const products: Product[] = [
  {
    id: 1,
    name: "Eco-Friendly Water Bottle",
    category: "Home & Kitchen",
    categoryLink: "#",
    price: "$15.99",
    stock: 150,
    status: "Active",
    image: "/images/products/water-bottle.png",
  },
  {
    id: 2,
    name: "Organic Cotton T-Shirt",
    category: "Apparel",
    categoryLink: "#",
    price: "$29.99",
    stock: 200,
    status: "Active",
    image: "/images/products/tshirt.png",
  },
  {
    id: 3,
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    categoryLink: "#",
    price: "$79.99",
    stock: 50,
    status: "Active",
    image: "/images/products/headphones.png",
  },
  {
    id: 4,
    name: "Leather Messenger Bag",
    category: "Accessories",
    categoryLink: "#",
    price: "$129.99",
    stock: 30,
    status: "Active",
    image: "/images/products/bag.png",
  },
  {
    id: 5,
    name: "Aromatherapy Diffuser",
    category: "Home & Kitchen",
    categoryLink: "#",
    price: "$39.99",
    stock: 100,
    status: "Active",
    image: "/images/products/diffuser.png",
  },
  {
    id: 6,
    name: "Running Shoes",
    category: "Apparel",
    categoryLink: "#",
    price: "$89.99",
    stock: 120,
    status: "Active",
    image: "/images/products/shoes.png",
  },
  {
    id: 7,
    name: "Smartwatch",
    category: "Electronics",
    categoryLink: "#",
    price: "$199.99",
    stock: 20,
    status: "Active",
    image: "/images/products/smartwatch.png",
  },
  {
    id: 8,
    name: "Travel Backpack",
    category: "Accessories",
    categoryLink: "#",
    price: "$79.99",
    stock: 80,
    status: "Active",
    image: "/images/products/backpack.png",
  },
  {
    id: 9,
    name: "Yoga Mat",
    category: "Sports & Outdoors",
    categoryLink: "#",
    price: "$24.99",
    stock: 150,
    status: "Active",
    image: "/images/products/yoga-mat.png",
  },
  {
    id: 10,
    name: "Desk Lamp",
    category: "Home & Kitchen",
    categoryLink: "#",
    price: "$49.99",
    stock: 70,
    status: "Active",
    image: "/images/products/desk-lamp.png",
  },
];

export default function AdminProductsPage() {
  const [search, setSearch] = React.useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style jsx>{`
        .admin-root {
          min-height: 100vh;
          display: flex;
          background: #020817;
          color: #e5e7eb;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        /* SIDEBAR */
        .sidebar {
          width: 260px;
          background: #020617;
          border-right: 1px solid #111827;
          padding: 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .sidebar-header {
          font-size: 14px;
          font-weight: 600;
          color: #f9fafb;
        }

        .nav-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 10px;
          font-size: 14px;
          color: #d1d5db;
        }

        .nav-item:hover {
          background: #0b1220;
        }

        .nav-item.active {
          background: #111827;
          color: #f9fafb;
        }

        .nav-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-icon img {
          width: 16px;
          height: 16px;
          object-fit: contain;
        }

        .sidebar-footer {
          margin-top: auto;
          font-size: 11px;
          color: #6b7280;
        }

        /* MAIN AREA */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .header {
          height: 72px;
          border-bottom: 1px solid #111827;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          background: #020617;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-logo-wrap {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid #374151;
        }

        .brand-title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #f9fafb;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-wrap-header {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: #020617;
          border-radius: 999px;
          border: 1px solid #1f2937;
          min-width: 240px;
        }

        .search-input-header {
          border: none;
          background: transparent;
          outline: none;
          color: #e5e7eb;
          font-size: 13px;
          flex: 1;
        }

        .search-input-header::placeholder {
          color: #6b7280;
        }

        .search-icon-header {
          margin-right: 6px;
          font-size: 14px;
          color: #6b7280;
        }

        .bell {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid #1f2937;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        /* CONTENT */
        .content {
          padding: 24px 28px 40px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-title {
          font-size: 22px;
          font-weight: 600;
        }

        .add-btn {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          border: none;
          background: #2563eb;
          color: #f9fafb;
          cursor: pointer;
        }

        .add-btn:hover {
          background: #1d4ed8;
        }

        .search-row {
          display: flex;
          gap: 10px;
        }

        .search-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #1f2937;
          background: #020617;
        }

        .search-icon {
          font-size: 14px;
          margin-right: 8px;
          color: #6b7280;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          color: #e5e7eb;
          font-size: 13px;
          flex: 1;
        }

        .search-input::placeholder {
          color: #6b7280;
        }

        .filter-btn {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #1f2937;
          background: #020617;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #e5e7eb;
          cursor: pointer;
        }

        .filter-chevron {
          font-size: 10px;
        }

        .table-wrap {
          border-radius: 14px;
          border: 1px solid #111827;
          background: #020617;
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        thead {
          background: #020617;
        }

        th,
        td {
          padding: 10px 16px;
          text-align: left;
        }

        th {
          font-size: 12px;
          color: #9ca3af;
          border-bottom: 1px solid #111827;
        }

        tbody tr {
          border-top: 1px solid #111827;
        }

        tbody tr:hover {
          background: #02081b;
        }

        .product-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .product-thumb-wrap {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          overflow: hidden;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .product-thumb {
          width: 40px;
          height: 40px;
          object-fit: cover;
        }

        .product-name {
          font-size: 13px;
          color: #e5e7eb;
        }

        .category-link {
          color: #60a5fa;
          font-size: 13px;
        }

        .badge-status {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
        }

        .view-link {
          font-size: 13px;
          color: #60a5fa;
          cursor: pointer;
        }

        .sidebar a {
          text-decoration: none;
        }

        @media (max-width: 1024px) {
          .admin-root {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            flex-direction: row;
            align-items: center;
            overflow-x: auto;
          }

          .sidebar-footer {
            display: none;
          }

          .content {
            padding: 20px;
          }
        }
      `}</style>

      <div className="admin-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">Acme Co</div>

          <ul className="nav-list">
            <li>
              <Link href="/admin/dashboard" className="nav-item">
                <div className="nav-icon">
                  <Image
                    src="/images/admin/dashboard.png"
                    alt="Dashboard"
                    width={16}
                    height={16}
                  />
                </div>
                <span>Dashboard</span>
              </Link>
            </li>

            <li>
              <Link href="/admin/products" className="nav-item active">
                <div className="nav-icon">
                  <Image
                    src="/images/admin/products.png"
                    alt="Products"
                    width={16}
                    height={16}
                  />
                </div>
                <span>Products</span>
              </Link>
            </li>

            <li>
              <Link href="/admin/orders" className="nav-item">
                <div className="nav-icon">
                  <Image
                    src="/images/admin/orders.png"
                    alt="Orders"
                    width={16}
                    height={16}
                  />
                </div>
                <span>Orders</span>
              </Link>
            </li>

            <li>
              <Link href="/admin/customers" className="nav-item">
                <div className="nav-icon">
                  <Image
                    src="/images/admin/customers.png"
                    alt="Customers"
                    width={16}
                    height={16}
                  />
                </div>
                <span>Customers</span>
              </Link>
            </li>

            <li>
              <Link href="/admin/discounts" className="nav-item">
                <div className="nav-icon">
                  <Image
                    src="/images/admin/discounts.png"
                    alt="Discounts"
                    width={16}
                    height={16}
                  />
                </div>
                <span>Discounts</span>
              </Link>
            </li>

            <li>
              <Link href="/admin/settings" className="nav-item">
                <div className="nav-icon">
                  <Image
                    src="/images/admin/settings.png"
                    alt="Settings"
                    width={16}
                    height={16}
                  />
                </div>
                <span>Settings</span>
              </Link>
            </li>
          </ul>

          <div className="sidebar-footer">
            © {new Date().getFullYear()} UFO Collection
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          {/* HEADER */}
          <header className="header">
            <div className="brand">
              <div className="brand-logo-wrap">
                <Image
                  src="/images/admin/logo.png"
                  alt="UFO Collection logo"
                  width={46}
                  height={46}
                />
              </div>
              <div className="brand-title">UFO Collection</div>
            </div>

            <div className="header-right">
              <div className="search-wrap-header">
                <span className="search-icon-header">🔍</span>
                <input
                  className="search-input-header"
                  type="text"
                  placeholder="Search"
                />
              </div>
              <div className="bell">🔔</div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="content">
            <div className="content-header">
              <h1 className="page-title">Products</h1>
              <button className="add-btn">+ Add Product</button>
            </div>

            <div className="search-row">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search by name or SKU"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="filter-btn">
                Category <span className="filter-chevron">▾</span>
              </button>
              <button className="filter-btn">
                Status <span className="filter-chevron">▾</span>
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-thumb-wrap">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="product-thumb"
                            />
                          </div>
                          <span className="product-name">{product.name}</span>
                        </div>
                      </td>
                      <td>
                        <Link href={product.categoryLink} className="category-link">
                          {product.category}
                        </Link>
                      </td>
                      <td>{product.price}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span className="badge-status">{product.status}</span>
                      </td>
                      <td>
                        <span className="view-link">View</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
