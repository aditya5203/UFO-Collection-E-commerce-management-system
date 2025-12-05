"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MainCategory = "Clothes" | "Shoes";

const MAIN_CATEGORIES: MainCategory[] = ["Clothes", "Shoes"];

const SUB_CATEGORIES: Record<MainCategory, string[]> = {
  Clothes: [
    "T-Shirt",
    "Shirt",
    "Jeans",
    "Hoodie",
    "Jacket",
    "Windcheater",
    "Combination Set",
    "Frock",
    "Formal Shirt",
    "Formal Pant",
    "Wide-Leg",
    "Long Coat",
    "Track",
  ],
  Shoes: [
    "Loafer",
    "Boot",
    "Sneaker",
    "Running Shoes",
    "Hiking & Trekking Shoes",
  ],
};

const CUSTOMER_OPTIONS = ["Men", "Women", "Boys", "Girls"] as const;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function AdminCategoryPage() {
  const router = useRouter();

  const [mainCategory, setMainCategory] = React.useState<MainCategory | "">("");
  const [subCategory, setSubCategory] = React.useState<string>("");
  const [customer, setCustomer] = React.useState<string>("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const availableSubCategories =
    mainCategory === "" ? [] : SUB_CATEGORIES[mainCategory];

  function handleMainCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as MainCategory | "";
    setMainCategory(value);
    setSubCategory("");
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!mainCategory || !subCategory || !customer) {
      setError("Please select main category, sub-category, and customer.");
      return;
    }

    try {
      setSubmitting(true);

      // 🔹 Build payload for backend
      const payload = {
        name: subCategory, // e.g. "Hoodie"
        mainCategory, // "Clothes" | "Shoes"
        customer, // "Men" | "Women" | "Boys" | "Girls"
        // slug optional → backend will generate if missing
        // description, imageUrl, parentId can be added later if needed
      };

      const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
        method: "POST",
        credentials: "include", // 🔐 send auth cookie
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.message || `Failed to create category (status ${res.status})`
        );
      }

      const json = await res.json();
      const created = json.data ?? json; // depending on controller response
      const categoryId = created._id || created.id;

      // 🔹 Build query params for redirect
      const params = new URLSearchParams({
        mainCategory,
        subCategory,
        customer,
      });

      if (categoryId) {
        params.set("categoryId", String(categoryId));
      }

      // 🔹 Redirect to Add Product page with context
      router.push(`/admin/products/newproduct?${params.toString()}`);
    } catch (err: any) {
      console.error("Create category error:", err);
      setError(err.message || "Something went wrong while creating category.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* GLOBAL CSS */}
      <style jsx global>{`
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
          gap: 8px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 400;
          color: #e5e7eb;
          text-decoration: none;
          cursor: pointer;
        }

        .nav-link:hover:not(.active) {
          background: #0b1220;
        }

        .nav-link.active {
          background: #1f2937;
        }

        .nav-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          object-fit: contain;
        }

        .sidebar-footer {
          margin-top: auto;
          font-size: 11px;
          color: #6b7280;
        }

        /* MAIN */
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

        /* CONTENT */
        .content {
          padding: 24px 28px 40px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .page-title {
          font-size: 22px;
          font-weight: 600;
        }

        .category-form-wrap {
          max-width: 720px;
          margin-top: 8px;
        }

        .field-group {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 13px;
          color: #e5e7eb;
        }

        .field-description {
          font-size: 11px;
          color: #9ca3af;
        }

        .select-input,
        .file-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #1f2937;
          background: #020617;
          color: #e5e7eb;
          font-size: 14px;
          outline: none;
        }

        .actions {
          margin-top: 28px;
          display: flex;
          justify-content: flex-end;
        }

        .save-btn {
          padding: 10px 22px;
          border-radius: 999px;
          border: none;
          background: #8b5cf6;
          color: #f9fafb;
          font-size: 14px;
          cursor: pointer;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-text {
          margin-bottom: 10px;
          font-size: 13px;
          color: #fca5a5;
        }

        .file-name {
          font-size: 12px;
          color: #9ca3af;
        }
      `}</style>

      <div className="admin-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">Store Admin</div>

          <ul className="nav-list">
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
                Dashboard
              </Link>
            </li>

            <li>
              <Link href="/admin/category" className="nav-link active">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/category.png"
                    alt="Category"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                Category
              </Link>
            </li>

            <li>
              <Link href="/admin/products" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/products.png"
                    alt="Products"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                Products
              </Link>
            </li>

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
                Orders
              </Link>
            </li>

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
                Customers
              </Link>
            </li>

            <li>
              <Link href="/admin/discounts" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/discount.png"
                    alt="Discounts"
                    width={18}
                    height={18}
                    className="nav-icon"
                  />
                </span>
                Discounts
              </Link>
            </li>

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
                Settings
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
                  alt="UFO Collection"
                  width={46}
                  height={46}
                />
              </div>
              <div className="brand-title">UFO Collection</div>
            </div>
            <div className="header-right"></div>
          </header>

          {/* CONTENT – CATEGORY FORM */}
          <main className="content">
            <h1 className="page-title">Category Management Form</h1>

            <div className="category-form-wrap">
              {error && <div className="error-text">{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* MAIN CATEGORY */}
                <div className="field-group">
                  <label className="field-label" htmlFor="mainCategory">
                    Main Category
                  </label>
                  <select
                    id="mainCategory"
                    className="select-input"
                    value={mainCategory}
                    onChange={handleMainCategoryChange}
                  >
                    <option value="">Select</option>
                    {MAIN_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUB CATEGORY */}
                <div className="field-group">
                  <label className="field-label" htmlFor="subCategory">
                    Sub-Category
                  </label>
                  <select
                    id="subCategory"
                    className="select-input"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    disabled={!mainCategory}
                  >
                    <option value="">
                      {mainCategory
                        ? "Select"
                        : "Select main category first"}
                    </option>
                    {availableSubCategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CUSTOMER */}
                <div className="field-group">
                  <label className="field-label" htmlFor="customer">
                    Customer Selection
                  </label>
                  <select
                    id="customer"
                    className="select-input"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                  >
                    <option value="">Select</option>
                    {CUSTOMER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OPTIONAL IMAGE (not sent yet, but UI kept) */}
                <div className="field-group">
                  <label className="field-label" htmlFor="categoryImage">
                    Category Image (Optional)
                  </label>
                  <input
                    id="categoryImage"
                    type="file"
                    accept="image/*"
                    className="file-input"
                    onChange={handleImageChange}
                  />
                  {imageFile && (
                    <p className="file-name">Selected: {imageFile.name}</p>
                  )}
                </div>

                <div className="actions">
                  <button className="save-btn" type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save & Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
