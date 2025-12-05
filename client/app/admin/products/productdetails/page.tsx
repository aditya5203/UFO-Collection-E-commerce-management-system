"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type ProductStatus = "Active" | "Draft" | "Archived";

type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;        // "Hoodie", "T-Shirt", ...
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  images?: string[];

  // Category meta from backend
  mainCategory?: string;   // "Clothes" | "Shoes"
  subCategory?: string;    // "Hoodie", "Sneaker", ...
  customer?: string;       // "Men" | "Women" | "Boys" | "Girls"
};

// Simple helper (you can reuse your getImageSrc if you want)
const getImageSrc = (image?: string | null) => {
  if (!image) return "/images/products/placeholder.png";
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }
  return "/images/products/placeholder.png";
};

export default function AdminProductDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // 🔹 LOAD PRODUCT FROM BACKEND
  React.useEffect(() => {
    if (!productId) {
      setError("Product ID is missing in URL.");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/admin/products/${productId}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Failed to load product (status ${res.status})`);
        }

        const p = await res.json();

        const normalized: Product = {
          id: p.id || p._id,
          sku: p.sku,
          name: p.name,
          description: p.description,
          category: p.category,
          price: typeof p.price === "string" ? Number(p.price) || 0 : p.price ?? 0,
          stock: p.stock ?? 0,
          status: p.status as ProductStatus,
          image: p.image,
          images: p.images || [],

          mainCategory: p.mainCategory,
          subCategory: p.subCategory,
          customer: p.customer,
        };

        setProduct(normalized);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // 🔹 DELETE HANDLER
  const handleDelete = async () => {
    if (!productId) return;
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      setDeleting(true);
      const res = await fetch(
        `${API_BASE_URL}/api/admin/products/${productId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        alert(data?.message || "Failed to delete product");
        return;
      }

      alert("Product deleted successfully");
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting.");
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 EDIT HANDLER → go to New Product page in edit mode
  const handleEdit = () => {
    if (!productId) return;
    router.push(`/admin/products/newproduct?id=${productId}&mode=edit`);
  };

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
          color: #e5e7eb;
          text-decoration: none;
        }

        /* ✅ fixed: removed extra ) */
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
        }

        .sidebar-footer {
          margin-top: auto;
          font-size: 11px;
          color: #6b7280;
        }

        /* MAIN HEADER */
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
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .icon-button {
          border: none;
          background: transparent;
          padding: 6px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .icon-button:hover {
          background: #020617;
        }

        .icon-image {
          width: 22px;
          height: 22px;
        }

        /* CONTENT */
        .content {
          padding: 24px 28px 40px;
          max-width: 980px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .breadcrumb {
          font-size: 13px;
          color: #9ca3af;
          display: flex;
          gap: 6px;
        }

        .breadcrumb a {
          color: #9ca3af;
          text-decoration: none;
        }

        .content-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }

        .page-title {
          font-size: 22px;
          font-weight: 600;
        }

        .summary-card {
          display: flex;
          gap: 20px;
          padding: 18px;
          border-radius: 16px;
          border: 1px solid #111827;
          background: #020617;
        }

        .summary-image-wrap {
          width: 120px;
          height: 120px;
          border-radius: 16px;
          overflow: hidden;
          background: #02081b;
          flex-shrink: 0;
        }

        .summary-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
        }

        .summary-name {
          font-size: 18px;
          font-weight: 600;
        }

        .badge-status {
          display: inline-flex;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
        }

        .meta-line {
          color: #9ca3af;
        }

        .meta-label {
          color: #6b7280;
        }

        .btn-outline {
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          border: 1px solid #374151;
          background: #020617;
          color: #e5e7eb;
          cursor: pointer;
        }

        .btn-outline:hover {
          background: #111827;
        }

        .btn-primary {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          border: none;
          background: #2563eb;
          color: #f9fafb;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-danger {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          border: 1px solid #b91c1c;
          background: #111827;
          color: #fecaca;
          cursor: pointer;
        }

        .btn-danger:hover {
          background: #7f1d1d;
          border-color: #fca5a5;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .field-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 500;
        }

        .field-input,
        .field-select,
        .field-textarea {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #1f2937;
          background: #020617;
          color: #e5e7eb;
          font-size: 13px;
        }

        .field-textarea {
          min-height: 120px;
        }

        .field-input[readonly],
        .field-textarea[readonly],
        .field-select:disabled {
          opacity: 0.9;
          cursor: default;
        }

        .two-col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .checkbox-item {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .upload-box {
          border: 1px dashed #1f2937;
          padding: 32px 16px;
          border-radius: 16px;
          text-align: center;
          margin-top: 8px;
        }

        .actions-row {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }

        .error-text {
          font-size: 13px;
          color: #fca5a5;
        }

        .muted {
          font-size: 13px;
          color: #9ca3af;
        }

        @media (max-width: 1024px) {
          .two-col {
            grid-template-columns: 1fr;
          }

          .summary-card {
            flex-direction: column;
          }
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
                <span>Dashboard</span>
              </Link>
            </li>

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
                <span>Category</span>
              </Link>
            </li>

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
                <span>Products</span>
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
                <span>Orders</span>
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
                <span>Customers</span>
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
                <span>Discounts</span>
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
                  alt="UFO Collection"
                  width={46}
                  height={46}
                />
              </div>
              <div className="brand-title">UFO Collection</div>
            </div>

            <div className="header-right">
  <button
    className="icon-button"
    type="button"
    aria-label="Search products"
    title="Search products"
  >
    <Image
      src="/images/admin/search.png"
      alt="Search"
      width={22}
      height={22}
      className="icon-image"
    />
  </button>

</div>

          </header>

          {/* CONTENT */}
          <main className="content">
            {/* Breadcrumb */}
            <div className="breadcrumb">
              <Link href="/admin/products">Products</Link>
              <span>/</span>
              <span>Product Details</span>
            </div>

            {loading ? (
              <p className="muted">Loading product details…</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : !product ? (
              <p className="muted">Product not found.</p>
            ) : (
              <>
                {/* SUMMARY CARD */}
                <section className="summary-card">
                  <div className="summary-image-wrap">
                    <Image
                      src={getImageSrc(product.image)}
                      alt={product.name}
                      width={120}
                      height={120}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="summary-meta">
                    <div className="summary-name">{product.name}</div>
                    <div className="meta-line">
                      <span className="meta-label">SKU: </span>
                      {product.sku}
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">Main Category: </span>
                      {product.mainCategory ?? "-"}
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">Sub-Category: </span>
                      {product.subCategory ?? "-"}
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">Customer: </span>
                      {product.customer ?? "-"}
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">Price: </span>
                      Rs. {product.price.toFixed(2)}
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">Stock: </span>
                      {product.stock}
                    </div>
                    <div>
                      <span className="badge-status">{product.status}</span>
                    </div>
                  </div>
                </section>

                {/* DETAILS FORM (read-only view) */}
                <section className="form-section">
                  <h2 className="section-title">Product Information</h2>

                  {/* Main / Sub / Customer */}
                  <div className="two-col">
                    <div className="field-block">
                      <label className="field-label" htmlFor="mainCategory">
                        Main Category
                      </label>
                      <input
                        id="mainCategory"
                        className="field-input"
                        value={product.mainCategory ?? ""}
                        readOnly
                      />
                    </div>
                    <div className="field-block">
                      <label className="field-label" htmlFor="subCategory">
                        Sub-Category
                      </label>
                      <input
                        id="subCategory"
                        className="field-input"
                        value={product.subCategory ?? ""}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="field-block">
                    <label className="field-label" htmlFor="customer">
                      Customer
                    </label>
                    <input
                      id="customer"
                      className="field-input"
                      value={product.customer ?? ""}
                      readOnly
                    />
                  </div>

                  {/* Name */}
                  <div className="field-block">
                    <label className="field-label" htmlFor="name">
                      Name
                    </label>
                    <input
                      id="name"
                      className="field-input"
                      value={product.name}
                      readOnly
                    />
                  </div>

                  {/* Description */}
                  <div className="field-block">
                    <label className="field-label" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      className="field-textarea"
                      value={product.description ?? ""}
                      readOnly
                    />
                  </div>

                  {/* Price / Discount placeholder / SKU / Stock */}
                  <div className="two-col">
                    <div className="field-block">
                      <label className="field-label" htmlFor="basePrice">
                        Base Price (Rs)
                      </label>
                      <input
                        id="basePrice"
                        className="field-input"
                        value={product.price.toFixed(2)}
                        readOnly
                      />
                    </div>

                    <div className="field-block">
                      <label className="field-label" htmlFor="discountPrice">
                        Discount Price (Rs, optional)
                      </label>
                      <input
                        id="discountPrice"
                        className="field-input"
                        placeholder="Not stored yet"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="two-col">
                    <div className="field-block">
                      <label className="field-label" htmlFor="productCode">
                        Product Code (SKU)
                      </label>
                      <input
                        id="productCode"
                        className="field-input"
                        value={product.sku}
                        readOnly
                      />
                    </div>
                    <div className="field-block">
                      <label className="field-label" htmlFor="stock">
                        Stock Qty
                      </label>
                      <input
                        id="stock"
                        className="field-input"
                        value={product.stock}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Status & Category */}
                  <div className="two-col">
                    <div className="field-block">
                      <label className="field-label" htmlFor="status">
                        Status
                      </label>
                      <select
                        id="status"
                        className="field-select"
                        value={product.status}
                        disabled
                      >
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>

                    <div className="field-block">
                      <label className="field-label" htmlFor="category">
                        Category Label
                      </label>
                      <input
                        id="category"
                        className="field-input"
                        value={product.category}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Tags / Variants / Colors / Fit Note are still front-end only for now */}
                  <div className="field-block">
                    <label className="field-label" htmlFor="tags">
                      Tags / Style Tags
                    </label>
                    <input
                      id="tags"
                      className="field-input"
                      placeholder="Not stored in backend (UI only)"
                      readOnly
                    />
                  </div>

                  <div className="field-block">
                    <label className="field-label">Variants (Sizes)</label>
                    <p className="muted">
                      Size variants are not yet connected to backend.
                    </p>
                    <div>
                      {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                        <label key={size} className="checkbox-item">
                          <input type="checkbox" disabled />
                          <span>{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="field-block">
                    <label className="field-label" htmlFor="colors">
                      Optional Color Variants
                    </label>
                    <input
                      id="colors"
                      className="field-input"
                      placeholder="Not stored yet"
                      readOnly
                    />
                  </div>

                  <div className="field-block">
                    <label className="field-label">Images</label>
                    <div className="upload-box">
                      <div>Gallery Images (from backend)</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                        Currently showing main image above. You can connect
                        multiple images later.
                      </div>
                    </div>
                  </div>

                  <div className="field-block">
                    <label className="field-label" htmlFor="fitnote">
                      Fit Note
                    </label>
                    <textarea
                      id="fitnote"
                      className="field-textarea"
                      placeholder="Not stored yet – only UI placeholder."
                      readOnly
                    />
                  </div>

                  {/* BOTTOM ACTIONS */}
                  <div className="actions-row">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => router.push("/admin/products")}
                    >
                      Back to Products
                    </button>

                    <button
                      type="button"
                      className="btn-danger"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleEdit}
                    >
                      Edit Product
                    </button>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
