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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/**
 * ✅ Safe image resolver for Next/Image
 * - Only allow your trusted hosts (Cloudinary + dev uploads + Google + ftcdn)
 * - Everything else -> placeholder (prevents Next.js runtime crash)
 */
const PLACEHOLDER = "/images/products/placeholder.png";

const getImageSrc = (image: string | undefined | null): string => {
  if (!image) return PLACEHOLDER;

  const src = image.trim();
  if (!src) return PLACEHOLDER;

  // allow local public assets
  if (src.startsWith("/")) return src;

  // allow only trusted remote urls
  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const u = new URL(src);

      // ✅ only these hosts are allowed in UI
      const allowed = new Set([
        "res.cloudinary.com", // cloudinary
        "localhost", // dev uploads (http://localhost:8080/uploads/..)
        "lh3.googleusercontent.com", // google avatars
        "t3.ftcdn.net", // stock images if you use them
      ]);

      if (!allowed.has(u.hostname)) return PLACEHOLDER;
      return src;
    } catch {
      return PLACEHOLDER;
    }
  }

  return PLACEHOLDER;
};

const formatPriceNPR = (value: number) => `Rs. ${value.toFixed(2)}`;

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    ProductStatus | "All"
  >("All");

  const [categories, setCategories] = React.useState<
    { id: string; name: string }[]
  >([]);

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
  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const mainFileRef = React.useRef<HTMLInputElement | null>(null);
  const galleryFileRef = React.useRef<HTMLInputElement | null>(null);
  const [mainPreview, setMainPreview] = React.useState<string | null>(null);
  const [galleryPreview, setGalleryPreview] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // -----------------------------
  // LOAD PRODUCTS
  // -----------------------------
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

        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }

        if (!res.ok) throw new Error(`Failed to load products (status ${res.status})`);

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
  }, [router]);

  // -----------------------------
  // LOAD CATEGORIES
  // -----------------------------
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }

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
  }, [router]);

  const statuses: (ProductStatus | "All")[] = ["All", "Active", "Inactive"];

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSize = (value: Size) => {
    setSizes((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  // -----------------------------
  // IMAGE UPLOAD HELPERS
  // -----------------------------
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

    if (!Array.isArray(urls) || urls.length === 0)
      throw new Error("Upload response missing URLs");

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

  // -----------------------------
  // CREATE PRODUCT
  // -----------------------------
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
      setToast({ type: "error", message: "Main image is required" });
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

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          const body = JSON.parse(text);
          message = body.message || JSON.stringify(body);
        } catch {}
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
          price: Number(created.price) || 0,
          stock: Number(created.stock) || 0,
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
      setError(err.message || "Failed to create product");
      setToast({ type: "error", message: err.message || "Failed to create product" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-[22px] font-semibold">Products</h1>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="cursor-pointer rounded-lg bg-[#2563eb] px-[14px] py-2 text-[13px] text-[#f9fafb] hover:bg-[#1d4ed8]"
        >
          + Add Product
        </button>
      </div>

      {/* Search + Filter */}
      <div className="mb-[10px] flex items-center gap-[10px]">
        <div className="flex flex-1 items-center rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-2">
          <input
            className="flex-1 border-none bg-transparent text-[13px] text-[#e5e7eb] outline-none placeholder:text-[#6b7280]"
            type="text"
            placeholder="Search by name or slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-[6px] whitespace-nowrap rounded-lg border border-[#1f2937] bg-[#020617] px-3 py-2 text-[13px] text-[#e5e7eb]"
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

      {/* Table wrapper */}
      <div className="overflow-hidden rounded-[14px] border border-[#111827] bg-[#020617]">
        {error && <div className="px-4 py-[10px] text-[13px] text-[#fca5a5]">{error}</div>}

        {loading ? (
          <div className="p-[18px] text-[13px] text-[#9ca3af]">Loading products…</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-[18px] text-[13px] text-[#9ca3af]">No products found.</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Name
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Gender
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Sizes
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Colors
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Price (Rs)
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Stock
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-[#111827] hover:bg-[#02081b]">
                  <td className="px-4 py-[10px]">
                    <div className="flex items-center gap-[10px]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0f172a]">
                        <Image
                          src={getImageSrc(product.image)}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                        />
                      </div>
                      <span className="text-[13px] text-[#e5e7eb]">{product.name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-[10px] text-[#cbd5e1]">{product.gender}</td>
                  <td className="px-4 py-[10px] text-[#cbd5e1]">{product.sizes?.join(", ") || "-"}</td>
                  <td className="px-4 py-[10px] text-[#cbd5e1]">{product.colors?.join(", ") || "-"}</td>
                  <td className="px-4 py-[10px] text-[#cbd5e1]">{formatPriceNPR(product.price)}</td>
                  <td className="px-4 py-[10px] text-[#cbd5e1]">{product.stock}</td>

                  <td className="px-4 py-[10px]">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-[11px] font-semibold",
                        product.status === "Active"
                          ? "bg-[rgba(34,197,94,0.12)] text-[#4ade80]"
                          : "bg-[rgba(148,163,184,0.12)] text-[#cbd5e1]",
                      ].join(" ")}
                    >
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="flex max-h-[90vh] w-[min(760px,92vw)] flex-col rounded-2xl border border-[#111827] bg-[#0b1220] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="mb-[14px] flex items-center justify-between">
              <div className="text-[18px] font-bold">Add Product</div>
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent text-[22px] text-[#9ca3af]"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-[6px]">
              <form onSubmit={handleCreate}>
                {/* Name */}
                <div className="mb-[14px] flex flex-col gap-[6px]">
                  <label className="text-[13px]" htmlFor="pname">
                    Name *
                  </label>
                  <input
                    id="pname"
                    className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Desc */}
                <div className="mb-[14px] flex flex-col gap-[6px]">
                  <label className="text-[13px]" htmlFor="pdesc">
                    Description
                  </label>
                  <textarea
                    id="pdesc"
                    className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Price + Stock */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                  <div className="mb-[14px] flex flex-col gap-[6px]">
                    <label className="text-[13px]" htmlFor="price">
                      Price (Rs) *
                    </label>
                    <input
                      id="price"
                      type="number"
                      min={0}
                      className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="mb-[14px] flex flex-col gap-[6px]">
                    <label className="text-[13px]" htmlFor="stock">
                      Stock *
                    </label>
                    <input
                      id="stock"
                      type="number"
                      min={0}
                      className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                      value={stock}
                      onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Status + Gender */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                  <div className="mb-[14px] flex flex-col gap-[6px]">
                    <label className="text-[13px]" htmlFor="status">
                      Status
                    </label>
                    <select
                      id="status"
                      className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="mb-[14px] flex flex-col gap-[6px]">
                    <label className="text-[13px]" htmlFor="gender">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Colors */}
                <div className="mb-[14px] flex flex-col gap-[6px]">
                  <label className="text-[13px]" htmlFor="colors">
                    Colors (hex, comma separated) *
                  </label>
                  <input
                    id="colors"
                    className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                    placeholder="#000000, #ffffff"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                  />
                </div>

                {/* Sizes */}
                <div className="mb-[14px] flex flex-col gap-[6px]">
                  <label className="text-[13px]">Sizes *</label>
                  <div className="flex flex-wrap gap-2">
                    {["S", "M", "L", "XL", "XXL"].map((s) => (
                      <label
                        key={s}
                        className="inline-flex items-center gap-[6px] rounded-[10px] border border-[#1f2937] bg-[#0b1220] px-[10px] py-[6px] text-[12px]"
                      >
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

                {/* Category */}
                <div className="mb-[14px] flex flex-col gap-[6px]">
                  <label className="text-[13px]" htmlFor="category">
                    Category *
                  </label>
                  <select
                    id="category"
                    className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
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

                {/* Main Image */}
                <div className="mb-[14px] flex flex-col gap-[6px]">
                  <label className="text-[13px]">Main Image *</label>

                  <input
                    ref={mainFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMainFileChange}
                  />

                  <div
                    className="cursor-pointer rounded-[10px] border border-dashed border-[#1f2937] bg-[#0b1220] p-[14px]"
                    onClick={() => mainFileRef.current?.click()}
                    role="button"
                  >
                    <div className="text-[12px] text-[#9ca3af]">
                      Click to upload a local image. (Required)
                    </div>

                    {mainPreview && (
                      <div className="mt-2 h-[72px] w-[72px] overflow-hidden rounded-[10px] border border-[#1f2937] bg-[#020617]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mainPreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery */}
                <div className="mb-[14px] flex flex-col gap-[6px]">
                  <label className="text-[13px]">Gallery Images</label>

                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryFilesChange}
                  />

                  <div
                    className="cursor-pointer rounded-[10px] border border-dashed border-[#1f2937] bg-[#0b1220] p-[14px]"
                    onClick={() => galleryFileRef.current?.click()}
                    role="button"
                  >
                    <div className="text-[12px] text-[#9ca3af]">
                      Upload one or more images (optional).
                    </div>

                    {galleryPreview.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {galleryPreview.map((src, idx) => (
                          <div
                            key={idx}
                            className="h-[72px] w-[72px] overflow-hidden rounded-[10px] border border-[#1f2937] bg-[#020617]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="cursor-pointer rounded-full bg-[#8b5cf6] px-[22px] py-[10px] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={[
            "fixed bottom-5 right-5 z-[1200] rounded-xl px-[14px] py-3 text-[13px] font-semibold text-[#0f172a]",
            "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
            toast.type === "success"
              ? "border border-[#22c55e] bg-[#bbf7d0]"
              : "border border-[#f43f5e] bg-[#fecdd3]",
          ].join(" ")}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
