"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ProductStatus = "Active" | "Inactive";
type Gender = "Male" | "Female";
type Size = "S" | "M" | "L" | "XL" | "XXL";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  images?: string[];
  gender: Gender;
  colors: string[];
  sizes: Size[];
  categoryId: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const getImageSrc = (image: string | undefined | null): string => {
  if (!image) return "/images/products/placeholder.png";
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image;
  }
  return "/images/products/placeholder.png";
};

const formatPriceNPR = (value: number) => `Rs. ${value.toFixed(2)}`;

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ProductStatus | "All">("All");

  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);

  // modal state
  const [showModal, setShowModal] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState<number | "">("");
  const [stock, setStock] = React.useState<number | "">("");
  const [status, setStatus] = React.useState<ProductStatus>("Active");
  const [gender, setGender] = React.useState<Gender>("Male");
  const [colors, setColors] = React.useState("");
  const [sizes, setSizes] = React.useState<Size[]>([]);
  const [categoryId, setCategoryId] = React.useState("");
  const [image, setImage] = React.useState("");
  const [images, setImages] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const mainFileRef = React.useRef<HTMLInputElement | null>(null);
  const galleryFileRef = React.useRef<HTMLInputElement | null>(null);
  const [mainPreview, setMainPreview] = React.useState<string | null>(null);
  const [galleryPreview, setGalleryPreview] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to load products (status ${res.status})`);
        }

        const body = await res.json();
        const data: any[] = body.data ?? body;

        const normalized: Product[] = data.map((p) => ({
          id: p._id || p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          status: (p.status as ProductStatus) ?? "Active",
          image: p.image,
          images: p.images ?? [],
          gender: p.gender,
          colors: p.colors ?? [],
          sizes: p.sizes ?? [],
          categoryId: p.categoryId,
        }));

        setProducts(normalized);
      } catch (err: any) {
        setError(err.message || "Something went wrong while loading products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories`, { credentials: "include" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Failed to load categories");
        const data: any[] = body.data ?? body;
        setCategories(
          data.map((c) => ({
            id: c._id || c.id,
            name: c.name,
          }))
        );
      } catch (err: any) {
        setToast({ type: "error", message: err.message || "Failed to load categories" });
      }
    };
    fetchCategories();
  }, []);

  const statuses: (ProductStatus | "All")[] = ["All", "Active", "Inactive"];

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSize = (value: Size) => {
    setSizes((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
  };

  const uploadSingleToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE_URL}/api/admin/products/upload-image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to upload image");
    }
    const body = await res.json();
    const candidate =
      (typeof body === "string" && body) ||
      body.imageUrl ||
      body.data?.imageUrl ||
      body.data?.url ||
      body.data?.secure_url ||
      body.data?.location ||
      (typeof body.data === "string" ? body.data : undefined) ||
      body.url ||
      body.secure_url ||
      (Array.isArray(body.urls) ? body.urls[0] : undefined) ||
      (Array.isArray(body.data?.urls) ? body.data.urls[0] : undefined);
    if (!candidate) throw new Error("Upload response missing URL");
    return candidate as string;
  };

  const uploadMultipleToCloudinary = async (files: FileList): Promise<string[]> => {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    const res = await fetch(`${API_BASE_URL}/api/admin/products/upload-images`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to upload gallery images");
    }
    const body = await res.json();
    const urls: string[] =
      (Array.isArray(body?.imageUrls) && body.imageUrls) ||
      (Array.isArray(body?.data?.imageUrls) && body.data.imageUrls) ||
      (Array.isArray(body?.data?.urls) && body.data.urls) ||
      (Array.isArray(body?.urls) && body.urls) ||
      (Array.isArray(body?.data) && body.data) ||
      [];
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("Upload response missing URLs");
    }
    return urls;
  };

  const handleMainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSubmitting(true);
      const url = await uploadSingleToCloudinary(file);
      setImage(url);
      setMainPreview(url);
      setToast({ type: "success", message: "Main image uploaded" });
    } catch (err: any) {
      console.error("Main image upload failed", err);
      setToast({ type: "error", message: err.message || "Failed to upload image" });
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  };

  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setSubmitting(true);
      const urls = await uploadMultipleToCloudinary(files);
      setGalleryPreview(urls);
      setImages((prev) => {
        const prevList = prev
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean);
        const merged = [...prevList, ...urls];
        return merged.join(", ");
      });
      setToast({ type: "success", message: "Gallery images uploaded" });
    } catch (err: any) {
      console.error("Gallery upload failed", err);
      setToast({ type: "error", message: err.message || "Failed to upload gallery" });
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  };

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setToast(null);

    const cleanName = name.trim();
    const cleanDesc = description.trim();
    const priceNum = typeof price === "string" ? Number(price) : price;
    const stockNum = typeof stock === "string" ? Number(stock) : stock;
    const colorArr = colors
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    const imageUrls = images
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    if (!cleanName || priceNum == null || priceNum < 0 || stockNum == null || stockNum < 0) {
      setToast({ type: "error", message: "Name, price, and stock are required" });
      return;
    }
    if (!categoryId) {
      setToast({ type: "error", message: "Select a category" });
      return;
    }
    if (!image.trim()) {
      setToast({ type: "error", message: "Main image URL is required" });
      return;
    }
    if (colorArr.length === 0) {
      setToast({ type: "error", message: "Add at least one color (hex, e.g. #000000)" });
      return;
    }
    const invalidColors = colorArr.filter((c) => !/^#([0-9a-f]{6})$/.test(c));
    if (invalidColors.length) {
      setToast({
        type: "error",
        message: `Invalid color(s): ${invalidColors.join(", ")}. Use hex like #000000`,
      });
      return;
    }
    if (sizes.length === 0) {
      setToast({ type: "error", message: "Select at least one size" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: cleanName,
        description: cleanDesc || undefined,
        price: priceNum,
        stock: stockNum,
        status,
        image: image.trim(),
        images: imageUrls.length ? imageUrls : undefined,
        gender,
        colors: colorArr,
        sizes,
        categoryId,
      };

      const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          const body = JSON.parse(text);
          message = body.message || JSON.stringify(body);
        } catch (_) {
          /* ignore parse error */
        }
        console.error("Create product failed", res.status, message);
        throw new Error(message || `Failed to create product (status ${res.status})`);
      }

      const body = await res.json();
      const created = body.data ?? body;
      setProducts((prev) => [
        {
          id: created._id || created.id,
          name: created.name,
          slug: created.slug,
          description: created.description,
          price: created.price,
          stock: created.stock,
          status: created.status,
          image: created.image,
          images: created.images ?? [],
          gender: created.gender,
          colors: created.colors ?? [],
          sizes: created.sizes ?? [],
          categoryId: created.categoryId,
        },
        ...prev,
      ]);
      setToast({ type: "success", message: "Product created" });
      setShowModal(false);
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setStatus("Active");
      setGender("Male");
      setColors("");
      setSizes([]);
      setCategoryId("");
      setImage("");
      setImages("");
      setMainPreview(null);
      setGalleryPreview([]);
    } catch (err: any) {
      console.error("Create product error", err);
      setError(err.message || "Failed to create product");
      setToast({ type: "error", message: err.message || "Failed to create product" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
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
          margin-bottom: 10px;
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
          white-space: nowrap;
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

        .badge-status {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
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

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: #0b1220;
          border: 1px solid #111827;
          border-radius: 16px;
          padding: 20px;
          width: min(760px, 92vw);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
        }

        .close-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 22px;
          cursor: pointer;
        }

        .modal-body {
          overflow-y: auto;
          padding-right: 6px;
          flex: 1;
        }

        .upload-box {
          border: 1px dashed #1f2937;
          border-radius: 10px;
          padding: 14px;
          background: #0b1220;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .upload-hint {
          font-size: 12px;
          color: #9ca3af;
        }

        .file-input-hidden {
          display: none;
        }

        .preview-row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .thumb {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #1f2937;
          background: #020617;
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .field-group {
          margin-bottom: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 13px;
        }

        .field-description {
          font-size: 11px;
          color: #9ca3af;
        }

        .text-input,
        textarea,
        select {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #1f2937;
          background: #020617;
          color: #e5e7eb;
        }

        .field-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .size-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .size-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid #1f2937;
          background: #0b1220;
          font-size: 12px;
        }

        .actions {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }

        .save-btn {
          padding: 10px 22px;
          border-radius: 999px;
          background: #8b5cf6;
          border: none;
          color: #fff;
          cursor: pointer;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toast {
          position: fixed;
          right: 20px;
          bottom: 20px;
          padding: 12px 14px;
          border-radius: 12px;
          color: #0f172a;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          z-index: 1200;
        }

        .toast.success {
          background: #bbf7d0;
          border: 1px solid #22c55e;
        }

        .toast.error {
          background: #fecdd3;
          border: 1px solid #f43f5e;
        }
      `}</style>

      <div>
        <div className="content-header">
          <h1 className="page-title">Products</h1>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add Product
          </button>
        </div>

        <div className="search-row">
          <div className="search-wrap">
            <input
              className="search-input"
              type="text"
              placeholder="Search by name or slug"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="filter-btn"
            onClick={() =>
              setStatusFilter((prev) => {
                const idx = statuses.indexOf(prev);
                return statuses[(idx + 1) % statuses.length];
              })
            }
          >
            {statusFilter === "All" ? "Status: All" : `Status: ${statusFilter}`}
          </button>
        </div>

        <div className="table-wrap">
          {error && <div className="error-text">{error}</div>}

          {loading ? (
            <div className="empty-state">Loading products…</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">No products found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Sizes</th>
                  <th>Colors</th>
                  <th>Price (Rs)</th>
                  <th>Stock</th>
                  <th>Status</th>
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
                        <span className="product-name">{product.name}</span>
                      </div>
                    </td>
                    <td>{product.gender}</td>
                    <td>{product.sizes?.join(", ") || "-"}</td>
                    <td>{product.colors?.join(", ") || "-"}</td>
                    <td>{formatPriceNPR(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className="badge-status">{product.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add Product</div>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
            <form onSubmit={handleCreate}>
              <div className="field-group">
                <label className="field-label" htmlFor="pname">
                  Name *
                </label>
                <input
                  id="pname"
                  className="text-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="pdesc">
                  Description
                </label>
                <textarea
                  id="pdesc"
                  className="text-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label" htmlFor="price">
                    Price (Rs) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    className="text-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="stock">
                    Stock *
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min={0}
                    className="text-input"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    className="text-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="gender">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    className="text-input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="colors">
                  Colors (hex, comma separated) *
                </label>
                <input
                  id="colors"
                  className="text-input"
                  placeholder="#000000, #ffffff"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Sizes *</label>
                <div className="size-row">
                  {["S", "M", "L", "XL", "XXL"].map((s) => (
                    <label key={s} className="size-pill">
                      <input
                        type="checkbox"
                        checked={sizes.includes(s as Size)}
                        onChange={() => toggleSize(s as Size)}
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="category">
                  Category *
                </label>
                <select
                  id="category"
                  className="text-input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="image">
                  Main Image *
                </label>
                <input
                  ref={mainFileRef}
                  type="file"
                  accept="image/*"
                  className="file-input-hidden"
                  onChange={handleMainFileChange}
                />
                <div
                  className="upload-box"
                  onClick={() => mainFileRef.current?.click()}
                  role="button"
                >
                  <div className="upload-hint">
                    Click to upload a local image. (Required)
                  </div>
                  {mainPreview && (
                    <div className="thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainPreview} alt="Preview" />
                    </div>
                  )}
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="images">
                  Gallery Images
                </label>
                <input
                  ref={galleryFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="file-input-hidden"
                  onChange={handleGalleryFilesChange}
                />
                <div
                  className="upload-box"
                  onClick={() => galleryFileRef.current?.click()}
                  role="button"
                >
                  <div className="upload-hint">Upload one or more images (optional).</div>
                  {galleryPreview.length > 0 && (
                    <div className="preview-row">
                      {galleryPreview.map((src, idx) => (
                        <div key={idx} className="thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Gallery ${idx + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="actions">
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
