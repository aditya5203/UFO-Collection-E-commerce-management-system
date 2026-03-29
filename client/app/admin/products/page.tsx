// client/app/admin/products/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

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

const PLACEHOLDER = "/images/products/placeholder.png";

const getImageSrc = (image: string | undefined | null): string => {
  if (!image) return PLACEHOLDER;

  const src = image.trim();
  if (!src) return PLACEHOLDER;

  if (src.startsWith("/")) return src;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const u = new URL(src);

      const allowed = new Set([
        "res.cloudinary.com",
        "localhost",
        "lh3.googleusercontent.com",
        "t3.ftcdn.net",
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

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function emptyForm() {
  return {
    name: "",
    description: "",
    price: "" as number | "",
    stock: "" as number | "",
    status: "Active" as ProductStatus,
    gender: "Male" as Gender,
    colors: "",
    sizes: [] as Size[],
    categoryId: "",
    image: "",
    images: "",
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ProductStatus | "All">("All");

  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);

  const [showModal, setShowModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

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
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const mainFileRef = React.useRef<HTMLInputElement | null>(null);
  const galleryFileRef = React.useRef<HTMLInputElement | null>(null);
  const [mainPreview, setMainPreview] = React.useState<string | null>(null);
  const [galleryPreview, setGalleryPreview] = React.useState<string[]>([]);

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] = React.useState<AdminPermissions | null>(null);

  const canCreate = hasPermission(role, permissions, "productCreate");
  const canEdit = hasPermission(role, permissions, "productEdit");
  const canDelete = hasPermission(role, permissions, "productDelete");

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    let mounted = true;

    const loadAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const body = (await safeJson(res)) as AdminSettingsResponse;
        const nextRole = (body?.profile?.role || "admin") as "admin" | "superadmin";
        const nextPermissions = normalizeAdminPermissions(
          nextRole,
          body?.profile?.permissions
        );

        if (!mounted) return;
        setRole(nextRole);
        setPermissions(nextPermissions);
      } catch {
        // ignore
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
      });

      const body = await safeJson(res);

      if (!res.ok) {
        throw new Error(body?.message || `Failed to load products (status ${res.status})`);
      }

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
  }, []);

  React.useEffect(() => {
    fetchProducts();

    const interval = setInterval(() => {
      fetchProducts();
    }, 10000);

    const onFocus = () => fetchProducts();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchProducts]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          credentials: "include",
          cache: "no-store",
        });

        const body = await safeJson(res);

        if (!res.ok) throw new Error(body?.message || "Failed to load categories");

        const data: any[] = body.data ?? body;
        setCategories(
          data.map((c) => ({
            id: c._id || c.id,
            name: c.name,
          }))
        );
      } catch (err: any) {
        setToast({
          type: "error",
          message: err.message || "Failed to load categories",
        });
      }
    };

    fetchCategories();
  }, []);

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

  const resetForm = () => {
    const form = emptyForm();
    setName(form.name);
    setDescription(form.description);
    setPrice(form.price);
    setStock(form.stock);
    setStatus(form.status);
    setGender(form.gender);
    setColors(form.colors);
    setSizes(form.sizes);
    setCategoryId(form.categoryId);
    setImage(form.image);
    setImages(form.images);
    setEditingId(null);
    setMainPreview(null);
    setGalleryPreview([]);
    setError(null);
  };

  const openCreateModal = () => {
    if (!canCreate) {
      setToast({ type: "error", message: "You do not have permission to create product" });
      return;
    }

    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    if (!canEdit) {
      setToast({ type: "error", message: "You do not have permission to edit product" });
      return;
    }

    setEditingId(product.id);
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(product.price);
    setStock(product.stock);
    setStatus(product.status);
    setGender(product.gender);
    setColors(product.colors?.join(", ") || "");
    setSizes(product.sizes || []);
    setCategoryId(product.categoryId || "");
    setImage(product.image || "");
    setImages(product.images?.join(", ") || "");
    setMainPreview(product.image || null);
    setGalleryPreview(product.images || []);
    setError(null);
    setShowModal(true);
  };

  const requestDelete = (id: string) => {
    if (!canDelete) {
      setToast({ type: "error", message: "You do not have permission to delete product" });
      return;
    }

    setConfirmDeleteId(id);
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
      const body = await safeJson(res);
      throw new Error(body?.message || "Failed to upload image");
    }

    const body = await safeJson(res);

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
      const body = await safeJson(res);
      throw new Error(body?.message || "Failed to upload gallery images");
    }

    const body = await safeJson(res);

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
      setGalleryPreview((prev) => [...prev, ...urls]);

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
      setToast({ type: "error", message: err.message || "Failed to upload gallery" });
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setToast(null);

    const isEditing = Boolean(editingId);

    if (isEditing && !canEdit) {
      setToast({ type: "error", message: "You do not have permission to edit product" });
      return;
    }

    if (!isEditing && !canCreate) {
      setToast({ type: "error", message: "You do not have permission to create product" });
      return;
    }

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

      const endpoint = isEditing
        ? `${API_BASE_URL}/api/admin/products/${editingId}`
        : `${API_BASE_URL}/api/admin/products`;

      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const body = await safeJson(res);

      if (!res.ok) {
        throw new Error(body?.message || `Failed to save product (status ${res.status})`);
      }

      const created = body.data ?? body;

      if (isEditing && editingId) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
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
                }
              : item
          )
        );
      } else {
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
      }

      setToast({
        type: "success",
        message: isEditing ? "Product updated" : "Product created",
      });

      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
      setToast({ type: "error", message: err.message || "Failed to save product" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirmed(id: string | null) {
    if (!id) {
      setConfirmDeleteId(null);
      return;
    }

    if (!canDelete) {
      setToast({ type: "error", message: "You do not have permission to delete product" });
      setConfirmDeleteId(null);
      return;
    }

    try {
      setDeletingId(id);

      const res = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const body = await safeJson(res);

      if (!res.ok) {
        throw new Error(body?.message || "Failed to delete product");
      }

      setProducts((prev) => prev.filter((item) => item.id !== id));
      setToast({ type: "success", message: "Product deleted" });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to delete product" });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <AdminPageGuard permission="productView">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-[22px] font-semibold">Products</h1>

          {canCreate ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="cursor-pointer rounded-lg bg-[#2563eb] px-[14px] py-2 text-[13px] text-[#f9fafb] hover:bg-[#1d4ed8]"
            >
              + Add Product
            </button>
          ) : null}
        </div>

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
                  {(canEdit || canDelete) ? (
                    <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                      Actions
                    </th>
                  ) : null}
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
                    <td className="px-4 py-[10px] text-[#cbd5e1]">
                      {product.sizes?.join(", ") || "-"}
                    </td>
                    <td className="px-4 py-[10px] text-[#cbd5e1]">
                      {product.colors?.join(", ") || "-"}
                    </td>
                    <td className="px-4 py-[10px] text-[#cbd5e1]">
                      {formatPriceNPR(product.price)}
                    </td>
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

                    {(canEdit || canDelete) ? (
                      <td className="px-4 py-[10px]">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="mr-2 cursor-pointer rounded-lg border border-[#1f2937] bg-[#0b1220] px-[10px] py-[6px] text-[12px] text-[#e5e7eb]"
                          >
                            Edit
                          </button>
                        ) : null}

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => requestDelete(product.id)}
                            className="cursor-pointer rounded-lg border border-[#7f1d1d] bg-[#0b1220] px-[10px] py-[6px] text-[12px] text-[#fca5a5]"
                          >
                            Delete
                          </button>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {confirmDeleteId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
            <div className="w-[min(420px,90vw)] rounded-[14px] border border-[#111827] bg-[#0b1220] p-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <div className="mb-2 font-bold">Delete product?</div>
              <div className="mb-2 text-[11px] text-[#9ca3af]">
                This action cannot be undone.
              </div>

              <div className="mt-4 flex justify-end gap-[10px]">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="cursor-pointer rounded-[10px] border border-[#1f2937] bg-[#0b1220] px-[14px] py-2 text-[#e5e7eb]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deletingId === confirmDeleteId}
                  onClick={() => handleDeleteConfirmed(confirmDeleteId)}
                  className="cursor-pointer rounded-[10px] border border-[#b91c1c] bg-[#ef4444] px-[14px] py-2 text-white disabled:opacity-60"
                >
                  {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
            <div className="flex max-h-[90vh] w-[min(760px,92vw)] flex-col rounded-2xl border border-[#111827] bg-[#0b1220] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <div className="mb-[14px] flex items-center justify-between">
                <div className="text-[18px] font-bold">
                  {editingId ? "Edit Product" : "Add Product"}
                </div>
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent text-[22px] text-[#9ca3af]"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-[6px]">
                <form onSubmit={handleSubmit}>
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
                        onChange={(e) =>
                          setPrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
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
                        onChange={(e) =>
                          setStock(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                      />
                    </div>
                  </div>

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
                        Click to upload a local image.
                      </div>

                      {mainPreview && (
                        <div className="mt-2 h-[72px] w-[72px] overflow-hidden rounded-[10px] border border-[#1f2937] bg-[#020617]">
                          <img
                            src={mainPreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

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
                              key={`${src}-${idx}`}
                              className="h-[72px] w-[72px] overflow-hidden rounded-[10px] border border-[#1f2937] bg-[#020617]"
                            >
                              <img
                                src={src}
                                alt={`Gallery ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="cursor-pointer rounded-full bg-[#8b5cf6] px-[22px] py-[10px] text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting
                        ? "Saving..."
                        : editingId
                        ? "Update Product"
                        : "Save Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
    </AdminPageGuard>
  );
}