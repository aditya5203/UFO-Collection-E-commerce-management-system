"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type StatusValue = "active" | "draft" | "archived";

type FormState = {
  name: string;
  description: string;
  basePrice: string;
  discountPrice: string;
  productCode: string;
  stock: string;
  status: StatusValue | ""; // "active" | "draft" | "archived"
  category: string; // "tshirt" | "hoodie" | ...
  tags: string;
  colors: string;
  fitNote: string;
  image: string; // main image url/path (REAL URL, not blob)

  // Category context from Category page
  mainCategory: string; // Clothes / Shoes
  subCategory: string; // T-Shirt / Hoodie / ...
  customer: string; // Men / Women / Boys / Girls
};

// 🔹 Helper to upload image to backend and get real URL
const uploadImageToServer = async (file: File): Promise<string> => {
  const data = new FormData();
  data.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/admin/products/upload-image`, {
    method: "POST",
    credentials: "include",
    body: data,
  });

  if (!res.ok) {
    throw new Error(`Image upload failed (status ${res.status})`);
  }

  const json = await res.json();
  if (!json.imageUrl) {
    throw new Error("Image URL missing from server response");
  }

  return json.imageUrl as string; // e.g. http://localhost:8080/uploads/xyz.png
};

export default function NewProductPage() {
  const router = useRouter();
  const params = useSearchParams();

  const productId = params.get("id");
  const mode = params.get("mode"); // "edit" or null
  const isEdit = mode === "edit";

  // Values coming from Category page
  const mainCategoryParam = params.get("mainCategory") || "";
  const subCategoryParam = params.get("subCategory") || "";
  const customerParam = params.get("customer") || "";
  const categoryIdParam = params.get("categoryId") || "";

  // Map Category page sub-category label -> our internal select value
  const mapSubCategoryToFormCategory = (sub: string): string => {
    switch (sub) {
      case "T-Shirt":
        return "tshirt";
      case "Shirt":
        return "shirt";
      case "Jeans":
        return "jeans";
      case "Hoodie":
        return "hoodie";
      case "Jacket":
        return "jacket";
      case "Windcheater":
        return "windcheater";
      case "Combination Set":
        return "combination-set";
      case "Frock":
        return "frock";
      case "Formal Shirt":
        return "formal-shirt";
      case "Wide-Leg":
        return "wide-leg";
      case "Long Coat":
        return "long-coat";
      case "Track":
        return "track";
      case "Shoes":
        return "shoes";
      default:
        return sub.toLowerCase().replace(/\s+/g, "-");
    }
  };

  const [formData, setFormData] = React.useState<FormState>({
    name: "",
    description: "",
    basePrice: "",
    discountPrice: "",
    productCode: "",
    stock: "",
    status: "",
    category: mapSubCategoryToFormCategory(subCategoryParam),
    tags: "",
    colors: "",
    fitNote: "",
    image: "",

    // From Category page
    mainCategory: mainCategoryParam,
    subCategory: subCategoryParam,
    customer: customerParam,
  });

  const [loading, setLoading] = React.useState<boolean>(isEdit);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 🔹 Image upload preview state
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Map UI values -> backend enum values
  const mapStatusToBackend = (
    status: string
  ): "Active" | "Draft" | "Archived" => {
    switch (status) {
      case "active":
        return "Active";
      case "archived":
        return "Archived";
      case "draft":
      default:
        return "Draft";
    }
  };

  const mapCategoryToBackend = (category: string): string => {
    const map: Record<string, string> = {
      tshirt: "T-Shirt",
      shirt: "Shirt",
      jeans: "Jeans",
      hoodie: "Hoodie",
      jacket: "Jacket",
      windcheater: "Windcheater",
      shoes: "Shoes",
      "combination-set": "Combination Set",
      frock: "Frock",
      "formal-shirt": "Formal Shirt",
      "wide-leg": "Wide-Leg",
      "long-coat": "Long Coat",
      track: "Track",
    };

    return map[category] || category;
  };

  // 🔹 Load product data when editing
  React.useEffect(() => {
    if (!isEdit || !productId) return;

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
          throw new Error(`Failed to load product (status ${res.status})`);
        }

        const p: any = await res.json();

        setFormData({
          name: p.name ?? "",
          description: p.description ?? "",
          basePrice: p.price?.toString() ?? "",
          discountPrice: "",
          productCode: p.sku ?? "",
          stock: p.stock?.toString() ?? "",
          status: (p.status || "Draft").toString().toLowerCase() as StatusValue, // "Active" -> "active"
          category:
            (p.category || "").toLowerCase().replace(/\s+/g, "-"), // "T-Shirt" -> "t-shirt"
          tags: "",
          colors: "",
          fitNote: "",
          image: p.image ?? "",

          mainCategory: p.mainCategory ?? mainCategoryParam,
          subCategory: p.subCategory ?? subCategoryParam,
          customer: p.customer ?? customerParam,
        });

        if (p.image) {
          setPreviewImage(p.image); // backend URL for existing product
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, productId]);

  // 🔹 Image upload handlers
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview (blob) – use normal <img>, NOT Next Image
    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    try {
      // Upload to backend and get REAL URL
      const serverUrl = await uploadImageToServer(file);

      // Save REAL URL in form data (this goes to Mongo)
      setFormData((prev) => ({
        ...prev,
        image: serverUrl,
      }));
    } catch (err: any) {
      console.error("Image upload error:", err);
      setError(err.message || "Image upload failed. Please try again.");
    }
  };

  // 🔹 Submit handler – create or update product
  const saveProduct = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const priceNumber = parseFloat(
        formData.discountPrice || formData.basePrice || "0"
      );
      const stockNumber = parseInt(formData.stock || "0", 10);

      if (
        !formData.productCode ||
        !formData.name ||
        !formData.category ||
        !formData.image
      ) {
        setError("Name, product code, category and image are required.");
        setSubmitting(false);
        return;
      }

      if (Number.isNaN(priceNumber)) {
        setError("Price must be a valid number.");
        setSubmitting(false);
        return;
      }

      if (Number.isNaN(stockNumber)) {
        setError("Stock must be a valid number.");
        setSubmitting(false);
        return;
      }

      const payload: any = {
        sku: formData.productCode,
        name: formData.name,
        description: formData.description,
        category: mapCategoryToBackend(formData.category),
        price: priceNumber,
        stock: stockNumber,
        status: mapStatusToBackend(formData.status || "draft"),
        image: formData.image, // ✅ this is now a real http://... or /uploads/... URL

        // New category metadata fields
        mainCategory: formData.mainCategory,
        subCategory: formData.subCategory,
        customer: formData.customer,
      };

      // Optional strong link to Category collection
      if (categoryIdParam) {
        payload.categoryId = categoryIdParam;
      }

      const url = isEdit
        ? `${API_BASE_URL}/api/admin/products/${productId}`
        : `${API_BASE_URL}/api/admin/products`;

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.message || `Failed to save product (status ${res.status})`
        );
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Something went wrong while saving the product."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        body {
          background: #020817;
        }

        .admin-root {
          min-height: 100vh;
          display: flex;
          background: #020817;
          color: #e5e7eb;
          font-family: system-ui, sans-serif;
        }

        .sidebar {
          width: 260px;
          background: #020617;
          border-right: 1px solid #111827;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0;
          list-style: none;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px;
          border-radius: 12px;
          color: #e5e7eb;
          text-decoration: none;
        }

        .nav-link.active {
          background: #1f2937;
        }

        .nav-link:hover:not(.active) {
          background: #0b1220;
        }

        .nav-icon-wrapper img {
          width: 18px;
          height: 18px;
        }

        .sidebar-footer {
          margin-top: auto;
          font-size: 11px;
          color: #6b7280;
        }

        .header {
          height: 72px;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          padding: 0 28px;
          border-bottom: 1px solid #111827;
          background: #020617;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand h1 {
          font-size: 20px;
          font-weight: 600;
        }

        .content {
          padding: 40px;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 600;
        }

        .field-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 14px;
          font-weight: 500;
        }

        .field-input,
        .field-select,
        .field-textarea {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #1f2937;
          background: #0b1120;
          color: #e5e7eb;
        }

        .field-textarea {
          height: 140px;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .checkbox-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .upload-box {
          border: 1px dashed #1f2937;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          margin-top: 10px;
          cursor: pointer;
        }

        .save-btn {
          background: #2563eb;
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 15px;
          float: right;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-text {
          font-size: 13px;
          color: #fca5a5;
        }

        .main-area {
          flex: 1;
        }

        .upload-hint {
          font-size: 12px;
          color: #9ca3af;
        }

        .upload-btn {
          margin-top: 12px;
          background: #1f2937;
        }

        .preview-wrapper {
          margin-top: 16px;
        }

        .preview-image {
          border-radius: 12px;
          object-fit: cover;
        }

        .file-input-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #e5e7eb;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .back-button-icon {
          font-size: 18px;
          line-height: 1;
        }

        .breadcrumb {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 6px;
        }
      `}</style>

      <div className="admin-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <ul className="nav-list">
            <li>
              <Link href="/admin/dashboard" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/dashboard.png"
                    width={18}
                    height={18}
                    alt="Dashboard"
                  />
                </span>
                Dashboard
              </Link>
            </li>

            <li>
              <Link href="/admin/category" className="nav-link">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/category.png"
                    width={18}
                    height={18}
                    alt="Category"
                  />
                </span>
                Category
              </Link>
            </li>

            <li>
              <Link href="/admin/products" className="nav-link active">
                <span className="nav-icon-wrapper">
                  <Image
                    src="/images/admin/products.png"
                    width={18}
                    height={18}
                    alt="Products"
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
                    width={18}
                    height={18}
                    alt="Orders"
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
                    width={18}
                    height={18}
                    alt="Customers"
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
                    width={18}
                    height={18}
                    alt="Discounts"
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
                    width={18}
                    height={18}
                    alt="Settings"
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

        {/* MAIN AREA */}
        <div className="main-area">
          {/* HEADER */}
          <header className="header">
            <div className="brand">
              <Image
                src="/images/admin/logo.png"
                alt="UFO Collection"
                width={46}
                height={46}
              />
              <h1>UFO Collection</h1>
            </div>
          </header>

          {/* CONTENT */}
          <main className="content">
            <div
              className="back-button"
              onClick={() => router.push("/admin/products")}
            >
              <span className="back-button-icon">‹</span>
              <span>Back</span>
            </div>

            <div className="breadcrumb">
              Products / {isEdit ? "Edit Product" : "Add New Product"}
            </div>

            <h1 className="page-title">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h1>

            {loading ? (
              <div>Loading product…</div>
            ) : (
              <>
                {error && <p className="error-text">{error}</p>}

                {/* Context from Category Page */}
                <div className="two-col">
                  <div className="field-block">
                    <label className="field-label" htmlFor="mainCategory">
                      Main Category
                    </label>
                    <input
                      id="mainCategory"
                      name="mainCategory"
                      className="field-input"
                      value={formData.mainCategory}
                      readOnly
                    />
                  </div>

                  <div className="field-block">
                    <label className="field-label" htmlFor="subCategory">
                      Sub-Category
                    </label>
                    <input
                      id="subCategory"
                      name="subCategory"
                      className="field-input"
                      value={formData.subCategory}
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
                    name="customer"
                    className="field-input"
                    value={formData.customer}
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
                    name="name"
                    className="field-input"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Description */}
                <div className="field-block">
                  <label className="field-label" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="field-textarea"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Prices */}
                <div className="two-col">
                  <div className="field-block">
                    <label htmlFor="basePrice" className="field-label">
                      Base Price (Rs)
                    </label>
                    <input
                      id="basePrice"
                      name="basePrice"
                      className="field-input"
                      value={formData.basePrice}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field-block">
                    <label htmlFor="discountPrice" className="field-label">
                      Discount Price (Rs, optional)
                    </label>
                    <input
                      id="discountPrice"
                      name="discountPrice"
                      className="field-input"
                      value={formData.discountPrice}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Product Code + Stock */}
                <div className="two-col">
                  <div className="field-block">
                    <label htmlFor="productCode" className="field-label">
                      Product Code (SKU)
                    </label>
                    <input
                      id="productCode"
                      name="productCode"
                      className="field-input"
                      value={formData.productCode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field-block">
                    <label htmlFor="stock" className="field-label">
                      Stock Qty
                    </label>
                    <input
                      id="stock"
                      name="stock"
                      className="field-input"
                      value={formData.stock}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Status + Category */}
                <div className="two-col">
                  <div className="field-block">
                    <label htmlFor="status" className="field-label">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="field-select"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="field-block">
                    <label htmlFor="category" className="field-label">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      className="field-select"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="tshirt">T-Shirt</option>
                      <option value="shirt">Shirt</option>
                      <option value="jeans">Jeans</option>
                      <option value="hoodie">Hoodie</option>
                      <option value="jacket">Jacket</option>
                      <option value="windcheater">Windcheater</option>
                      <option value="shoes">Shoes</option>
                      <option value="combination-set">Combination set</option>
                      <option value="frock">Frock</option>
                      <option value="formal-shirt">Formal Shirt</option>
                      <option value="wide-leg">Wide-leg</option>
                      <option value="long-coat">Long coat</option>
                      <option value="track">Track</option>
                    </select>
                  </div>
                </div>

                {/* Main image path (manual override if needed) */}
                <div className="field-block">
                  <label htmlFor="image" className="field-label">
                    Main Image URL / Path
                  </label>
                  <input
                    id="image"
                    name="image"
                    className="field-input"
                    placeholder="/images/products/oversized-hoodie.png"
                    value={formData.image}
                    onChange={handleChange}
                  />
                </div>

                {/* Tags */}
                <div className="field-block">
                  <label htmlFor="tags" className="field-label">
                    Tags / Style Tags
                  </label>
                  <input
                    id="tags"
                    name="tags"
                    className="field-input"
                    placeholder="oversized, unisex, streetwear"
                    value={formData.tags}
                    onChange={handleChange}
                  />
                </div>

                {/* Variants */}
                <div className="field-block">
                  <label className="field-label">Variants</label>
                  <div className="checkbox-list">
                    {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                      <label key={size} className="checkbox-item">
                        <input type="checkbox" />
                        {size}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color Variants */}
                <div className="field-block">
                  <label htmlFor="colors" className="field-label">
                    Optional Color Variants
                  </label>
                  <input
                    id="colors"
                    name="colors"
                    className="field-input"
                    placeholder="Black, Grey, Navy"
                    value={formData.colors}
                    onChange={handleChange}
                  />
                </div>

                {/* Images upload */}
                <div className="field-block">
                  <label className="field-label" htmlFor="productImages">
                    Images
                  </label>

                  {/* hidden file input */}
                  <input
                    id="productImages"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="file-input-hidden"
                    onChange={handleImageFileChange}
                    aria-label="Upload product images"
                    title="Upload product images"
                  />

                  <div className="upload-box" onClick={handleImageButtonClick}>
                    <div>Upload Images</div>
                    <div className="upload-hint">
                      Drag and drop or click
                    </div>
                    <button
                      className="save-btn upload-btn"
                      type="button"
                      onClick={handleImageButtonClick}
                    >
                      Upload Images
                    </button>

                    {(previewImage || formData.image) && (
                      <div className="preview-wrapper">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Product image preview"
                            width={120}
                            height={120}
                            className="preview-image"
                          />
                        ) : (
                          <Image
                            src={formData.image}
                            alt="Product image preview"
                            width={120}
                            height={120}
                            className="preview-image"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fit Note */}
                <div className="field-block">
                  <label htmlFor="fitNote" className="field-label">
                    Fit Note
                  </label>
                  <textarea
                    id="fitNote"
                    name="fitNote"
                    className="field-textarea"
                    placeholder="Relaxed oversized fit. Recommend sizing down."
                    value={formData.fitNote}
                    onChange={handleChange}
                  />
                </div>

                {/* SAVE BUTTON */}
                <button
                  className="save-btn"
                  onClick={saveProduct}
                  disabled={submitting}
                  type="button"
                >
                  {submitting
                    ? isEdit
                      ? "Saving..."
                      : "Creating..."
                    : "Save Product"}
                </button>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
