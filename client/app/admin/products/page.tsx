"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProductStatus = "Active" | "Draft" | "Archived";

type Product = {
  id: string | number;
  sku: string;
  name: string;
  category: string;        // e.g. "Hoodie"
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  categoryLink?: string;

  // 🔹 New fields coming from backend
  mainCategory?: string;   // "Clothes" | "Shoes"
  subCategory?: string;    // "Hoodie", "T-Shirt", etc.
  customer?: string;       // "Men" | "Women" | "Boys" | "Girls"
  colors?: string;         // optional if you later store color string
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/**
 * Convert Windows filesystem path (C:\ufo-collection\client\public\images\...)
 * into a web-safe path for Next <Image>, e.g. /images/...
 */
const getImageSrc = (image: string | undefined | null): string => {
  if (!image) return "/images/products/placeholder.png";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }

  const lower = image.toLowerCase();
  const publicIndex = lower.indexOf("\\public\\");

  if (publicIndex !== -1) {
    const rel = image
      .slice(publicIndex + "\\public".length)
      .replace(/\\/g, "/");
    return rel.startsWith("/") ? rel : `/${rel}`;
  }

  return "/images/products/placeholder.png";
};

// Optional helper: format price as Rs
const formatPriceNPR = (value: number) => `Rs. ${value.toFixed(2)}`;

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("All");
  const [statusFilter, setStatusFilter] = React.useState<ProductStatus | "All">(
    "All"
  );
  const [showCategoryMenu, setShowCategoryMenu] = React.useState(false);
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to load products (status ${res.status})`);
        }

        const data: Product[] = await res.json();

        const normalized = data.map((p) => ({
          ...p,
          price:
            typeof (p as any).price === "string"
              ? Number((p as any).price) || 0
              : p.price ?? 0,
        }));

        setProducts(normalized);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError(
          err.message || "Something went wrong while loading products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = React.useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const statuses: (ProductStatus | "All")[] = [
    "All",
    "Active",
    "Draft",
    "Archived",
  ];

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();

    const matchesSearch =
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);

    const matchesCategory =
      categoryFilter === "All" || p.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All" || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <>
      <style jsx global>{`
        .admin-root {
          min-height: 100vh;
          display: flex;
          background: #020817;
          color: #e5e7eb;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

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
          gap: 10px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 14px;
          color: #e5e7eb;
          text-decoration: none;
          cursor: pointer;
        }

        .nav-link:not(.active):hover {
          background: #0b1220;
        }

        .nav-link.active {
          background: #1f2937;
        }

        .nav-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          object-fit: contain;
        }

        .nav-label {
          white-space: nowrap;
        }

        .sidebar-footer {
          margin-top: auto;
          font-size: 11px;
          color: #6b7280;
        }

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
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 6px;
        }

        .search-icon-header img {
          width: 14px;
          height: 14px;
        }

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
          align-items: center;
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
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
        }

        .search-icon img {
          width: 14px;
          height: 14px;
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

        .filter-group {
          position: relative;
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
          white-space: nowrap;
        }

        .filter-chevron {
          font-size: 10px;
        }

        .filter-menu {
          position: absolute;
          top: 110%;
          left: 0;
          min-width: 140px;
          background: #020617;
          border-radius: 8px;
          border: 1px solid #111827;
          padding: 4px 0;
          z-index: 20;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.8);
        }

        .filter-menu-item {
          padding: 6px 10px;
          font-size: 13px;
          color: #e5e7eb;
          cursor: pointer;
        }

        .filter-menu-item:hover {
          background: #0b1220;
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

        .empty-state {
          padding: 18px;
          font-size: 13px;
          color: #9ca3af;
        }

        .error-text {
          padding: 10px 16px;
          color: #fca5a5;
          font-size: 13px;
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
        {/* SIDEBAR – reordered */}
        <aside className="sidebar">
          <div className="sidebar-header">Store Admin</div>

          <ul className="nav-list">
            {/* Dashboard */}
            <li>
              <Link href="/admin/dashboard" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/dashboard.png"
                    alt="Dashboard"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                <span className="nav-label">Dashboard</span>
              </Link>
            </li>

            {/* Category (used before adding product) */}
            <li>
              <Link href="/admin/category" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/category.png"
                    alt="Category"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                <span className="nav-label">Category</span>
              </Link>
            </li>

            {/* Products – ACTIVE */}
            <li>
              <Link href="/admin/products" className="nav-link active">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/products.png"
                    alt="Products"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                <span className="nav-label">Products</span>
              </Link>
            </li>

            {/* Orders */}
            <li>
              <Link href="/admin/orders" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/order.png"
                    alt="Orders"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                <span className="nav-label">Orders</span>
              </Link>
            </li>

            {/* Customers */}
            <li>
              <Link href="/admin/customers" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/customers.png"
                    alt="Customers"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                <span className="nav-label">Customers</span>
              </Link>
            </li>

            {/* Discounts */}
            <li>
              <Link href="/admin/discounts" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/discount.png"
                    alt="Discounts"
                    width={16}
                    height={16}
                    className="nav-icon"
                  />
                </span>
                <span className="nav-label">Discounts</span>
              </Link>
            </li>

            {/* Settings */}
            <li>
              <Link href="/admin/settings" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/setting.png"
                    alt="Settings"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                <span className="nav-label">Settings</span>
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
                <span className="search-icon-header">
                  <Image
                    src="/images/admin/search.png"
                    alt="Search"
                    width={14}
                    height={14}
                  />
                </span>
                <input
                  className="search-input-header"
                  type="text"
                  placeholder="Search"
                />
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="content">
            <div className="content-header">
              <h1 className="page-title">Products</h1>
              <button
                className="add-btn"
                // 🔹 Start from Category Page → then redirect to New Product
                onClick={() => router.push("/admin/category")}
              >
                + Add Product
              </button>
            </div>

            <div className="search-row">
              <div className="search-wrap">
                <span className="search-icon">
                  <Image
                    src="/images/admin/search.png"
                    alt="Search"
                    width={14}
                    height={14}
                  />
                </span>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search by name or SKU"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Category filter */}
              <div className="filter-group">
                <button
                  type="button"
                  className="filter-btn"
                  onClick={() => setShowCategoryMenu((v) => !v)}
                >
                  {categoryFilter === "All" ? "Category" : categoryFilter}
                  <span className="filter-chevron">▾</span>
                </button>
                {showCategoryMenu && (
                  <div className="filter-menu">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        className="filter-menu-item"
                        onClick={() => {
                          setCategoryFilter(cat);
                          setShowCategoryMenu(false);
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status filter */}
              <div className="filter-group">
                <button
                  type="button"
                  className="filter-btn"
                  onClick={() => setShowStatusMenu((v) => !v)}
                >
                  {statusFilter === "All" ? "Status" : statusFilter}
                  <span className="filter-chevron">▾</span>
                </button>
                {showStatusMenu && (
                  <div className="filter-menu">
                    {statuses.map((st) => (
                      <div
                        key={st}
                        className="filter-menu-item"
                        onClick={() => {
                          setStatusFilter(st);
                          setShowStatusMenu(false);
                        }}
                      >
                        {st}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="table-wrap">
              {error && <div className="error-text">{error}</div>}

              {loading ? (
                <div className="empty-state">Loading products…</div>
              ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                  No products found. Try adjusting filters or add a new product.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Main Category</th>
                      <th>Sub-Category</th>
                      <th>Customer</th>
                      <th>Category</th>
                      <th>Price (Rs)</th>
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
                                src={getImageSrc(product.image)}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="product-thumb"
                              />
                            </div>
                            <span className="product-name">
                              {product.name}
                            </span>
                          </div>
                        </td>

                        <td>{product.mainCategory ?? "-"}</td>
                        <td>{product.subCategory ?? "-"}</td>
                        <td>{product.customer ?? "-"}</td>

                        <td>
                          <Link
                            href={
                              product.categoryLink ??
                              `/collection?category=${encodeURIComponent(
                                product.category
                              )}`
                            }
                            className="category-link"
                          >
                            {product.category}
                          </Link>
                        </td>

                        <td>{formatPriceNPR(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span className="badge-status">
                            {product.status}
                          </span>
                        </td>
                        <td>
                          <span
                            className="view-link"
                            onClick={() =>
                              router.push(
                                `/admin/products/productdetails?id=${product.id}`
                              )
                            }
                          >
                            View
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
