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

type ApiProduct = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
  status?: string;
  image?: string;
  images?: string[];
  gender?: string;
  colors?: string[];
  sizes?: string[];
  categoryId?: string;
  category?: string | { _id?: string; id?: string };
};

type ApiCategory = {
  _id?: string;
  id?: string;
  name?: string;
  isActive?: boolean;
};

type ProductListResponse = {
  success?: boolean;
  message?: string;
  data?:
    | ApiProduct[]
    | {
        products?: ApiProduct[];
        items?: ApiProduct[];
        docs?: ApiProduct[];
        result?: ApiProduct[];
        data?: ApiProduct[];
      };
  products?: ApiProduct[];
  items?: ApiProduct[];
  docs?: ApiProduct[];
  result?: ApiProduct[];
};

type CategoryListResponse = {
  success?: boolean;
  message?: string;
  data?:
    | ApiCategory[]
    | {
        categories?: ApiCategory[];
        items?: ApiCategory[];
        docs?: ApiCategory[];
        result?: ApiCategory[];
        data?: ApiCategory[];
      };
  categories?: ApiCategory[];
  items?: ApiCategory[];
  docs?: ApiCategory[];
  result?: ApiCategory[];
};

type ProductSaveResponse = {
  success?: boolean;
  message?: string;
  data?: ApiProduct;
  product?: ApiProduct;
};

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
} | null;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const PLACEHOLDER = "/images/products/placeholder.png";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";
const inputClass =
  "h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]";

const getImageSrc = (image: string | undefined | null): string => {
  if (!image) return PLACEHOLDER;

  const src = image.trim();
  if (!src) return PLACEHOLDER;
  if (src.startsWith("/")) return src;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const u = new URL(src);

      const allowedHosts = new Set([
        "res.cloudinary.com",
        "localhost",
        "lh3.googleusercontent.com",
        "images.unsplash.com",
        "t3.ftcdn.net",
      ]);

      const isLocalUpload =
        u.hostname === "localhost" &&
        u.port === "8080" &&
        u.pathname.startsWith("/uploads/");

      if (!allowedHosts.has(u.hostname) && !isLocalUpload) {
        return PLACEHOLDER;
      }

      return src;
    } catch {
      return PLACEHOLDER;
    }
  }

  return PLACEHOLDER;
};

const formatPriceNPR = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function normalizeStatus(status?: string): ProductStatus {
  return String(status || "").toLowerCase() === "inactive"
    ? "Inactive"
    : "Active";
}

function normalizeGender(gender?: string): Gender {
  return String(gender || "").toLowerCase() === "female" ? "Female" : "Male";
}

function normalizeSizes(values?: string[]): Size[] {
  const allowed: Size[] = ["S", "M", "L", "XL", "XXL"];

  if (!Array.isArray(values)) return [];

  return values.filter((v): v is Size => allowed.includes(v as Size));
}

function getProductCategoryId(product: ApiProduct) {
  if (typeof product.categoryId === "string") return product.categoryId;
  if (typeof product.category === "string") return product.category;

  if (product.category && typeof product.category === "object") {
    return String(product.category._id || product.category.id || "");
  }

  return "";
}

function mapProduct(p: ApiProduct): Product {
  return {
    id: String(p._id || p.id || ""),
    name: String(p.name || "Untitled Product"),
    slug: String(p.slug || "-"),
    description: p.description || "",
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    status: normalizeStatus(p.status),
    image: String(p.image || ""),
    images: Array.isArray(p.images) ? p.images : [],
    gender: normalizeGender(p.gender),
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: normalizeSizes(p.sizes),
    categoryId: getProductCategoryId(p),
  };
}

function getProductArray(body: ProductListResponse | ApiProduct[]): ApiProduct[] {
  if (Array.isArray(body)) return body;

  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.products)) return body.products;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.docs)) return body.docs;
  if (Array.isArray(body.result)) return body.result;

  if (body.data && Array.isArray(body.data.products)) return body.data.products;
  if (body.data && Array.isArray(body.data.items)) return body.data.items;
  if (body.data && Array.isArray(body.data.docs)) return body.data.docs;
  if (body.data && Array.isArray(body.data.result)) return body.data.result;
  if (body.data && Array.isArray(body.data.data)) return body.data.data;

  return [];
}

function getCategoryArray(
  body: CategoryListResponse | ApiCategory[]
): ApiCategory[] {
  if (Array.isArray(body)) return body;

  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.categories)) return body.categories;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.docs)) return body.docs;
  if (Array.isArray(body.result)) return body.result;

  if (body.data && Array.isArray(body.data.categories)) {
    return body.data.categories;
  }

  if (body.data && Array.isArray(body.data.items)) return body.data.items;
  if (body.data && Array.isArray(body.data.docs)) return body.data.docs;
  if (body.data && Array.isArray(body.data.result)) return body.data.result;
  if (body.data && Array.isArray(body.data.data)) return body.data.data;

  return [];
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
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<ProductStatus | "All">("All");

  const [categories, setCategories] = React.useState<
    { id: string; name: string }[]
  >([]);

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
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  );

  const [toast, setToast] = React.useState<ToastState>(null);

  const mainFileRef = React.useRef<HTMLInputElement | null>(null);
  const galleryFileRef = React.useRef<HTMLInputElement | null>(null);

  const [mainPreview, setMainPreview] = React.useState<string | null>(null);
  const [galleryPreview, setGalleryPreview] = React.useState<string[]>([]);

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  const canCreate = hasPermission(role, permissions, "productCreate");
  const canEdit = hasPermission(role, permissions, "productEdit");
  const canDelete = hasPermission(role, permissions, "productDelete");

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
    },
    []
  );

  React.useEffect(() => {
    if (!toast) return;

    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
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
        const nextRole = (body?.profile?.role || "admin") as
          | "admin"
          | "superadmin";

        const nextPermissions = normalizeAdminPermissions(
          nextRole,
          body?.profile?.permissions
        );

        if (!mounted) return;

        setRole(nextRole);
        setPermissions(nextPermissions);
      } catch {
        // AdminPageGuard handles access.
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchProducts = React.useCallback(
    async (mode: "initial" | "refresh" | "silent" = "initial") => {
      try {
        if (mode === "initial") setLoading(true);
        if (mode === "refresh") setRefreshing(true);

        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
        });

        const body = (await safeJson(res)) as ProductListResponse | ApiProduct[];

        if (!res.ok) {
          const message = Array.isArray(body)
            ? `Failed to load products (status ${res.status})`
            : body?.message || `Failed to load products (status ${res.status})`;

          throw new Error(message);
        }

        const normalized = getProductArray(body)
          .map(mapProduct)
          .filter((p) => p.id);

        setProducts(normalized);

        if (mode === "refresh") {
          showToast("Products refreshed successfully.", "success");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong while loading products.";

        setError(message);

        if (mode === "refresh") showToast(message, "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  React.useEffect(() => {
    fetchProducts("initial");

    const interval = window.setInterval(() => {
      if (!showModal && !confirmDeleteId) {
        fetchProducts("silent");
      }
    }, 15000);

    const onFocus = () => {
      if (!showModal && !confirmDeleteId) {
        fetchProducts("silent");
      }
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchProducts, showModal, confirmDeleteId]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          credentials: "include",
          cache: "no-store",
        });

        const body = (await safeJson(res)) as
          | CategoryListResponse
          | ApiCategory[];

        if (!res.ok) {
          const message = Array.isArray(body)
            ? "Failed to load categories"
            : body?.message || "Failed to load categories";

          throw new Error(message);
        }

        const mapped = getCategoryArray(body)
          .map((c) => ({
            id: String(c._id || c.id || ""),
            name: String(c.name || "Unnamed Category"),
          }))
          .filter((c) => c.id);

        setCategories(mapped);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load categories";

        showToast(message, "error");
      }
    };

    fetchCategories();
  }, [showToast]);

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setConfirmDeleteId(null);
      }
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const statuses: (ProductStatus | "All")[] = ["All", "Active", "Inactive"];

  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const activeCount = React.useMemo(
    () => products.filter((p) => p.status === "Active").length,
    [products]
  );

  const inactiveCount = React.useMemo(
    () => products.filter((p) => p.status === "Inactive").length,
    [products]
  );

  const lowStockCount = React.useMemo(
    () => products.filter((p) => p.stock <= 5).length,
    [products]
  );

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
      showToast("You do not have permission to create product.", "error");
      return;
    }

    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    if (!canEdit) {
      showToast("You do not have permission to edit product.", "error");
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
      showToast("You do not have permission to delete product.", "error");
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

    const body = await safeJson(res);

    if (!res.ok) {
      throw new Error(body?.message || "Failed to upload image");
    }

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

    return String(candidate);
  };

  const uploadMultipleToCloudinary = async (
    files: FileList
  ): Promise<string[]> => {
    const formData = new FormData();

    Array.from(files).forEach((f) => formData.append("files", f));

    const res = await fetch(`${API_BASE_URL}/api/admin/products/upload-images`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const body = await safeJson(res);

    if (!res.ok) {
      throw new Error(body?.message || "Failed to upload gallery images");
    }

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

    return urls.map(String);
  };

  const handleMainFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSubmitting(true);

      const url = await uploadSingleToCloudinary(file);

      setImage(url);
      setMainPreview(url);
      showToast("Main image uploaded.", "success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to upload image";

      showToast(message, "error");
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  };

  const handleGalleryFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

      showToast("Gallery images uploaded.", "success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to upload gallery";

      showToast(message, "error");
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
      showToast("You do not have permission to edit product.", "error");
      return;
    }

    if (!isEditing && !canCreate) {
      showToast("You do not have permission to create product.", "error");
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

    if (
      !cleanName ||
      priceNum == null ||
      Number.isNaN(priceNum) ||
      priceNum < 0 ||
      stockNum == null ||
      Number.isNaN(stockNum) ||
      stockNum < 0
    ) {
      showToast("Name, valid price, and valid stock are required.", "error");
      return;
    }

    if (!categoryId) {
      showToast("Select a category.", "error");
      return;
    }

    if (!image.trim()) {
      showToast("Main image is required.", "error");
      return;
    }

    if (colorArr.length === 0) {
      showToast("Add at least one color. Example: #000000", "error");
      return;
    }

    const invalidColors = colorArr.filter((c) => !/^#([0-9a-f]{6})$/.test(c));

    if (invalidColors.length) {
      showToast(
        `Invalid color(s): ${invalidColors.join(", ")}. Use hex like #000000`,
        "error"
      );
      return;
    }

    if (sizes.length === 0) {
      showToast("Select at least one size.", "error");
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

      const body = (await safeJson(res)) as ProductSaveResponse | ApiProduct;

      if (!res.ok) {
        const message =
          "message" in body && body.message
            ? body.message
            : `Failed to save product (status ${res.status})`;

        throw new Error(message);
      }

      const saved =
        "data" in body && body.data
          ? body.data
          : "product" in body && body.product
          ? body.product
          : (body as ApiProduct);

      if (!saved) {
        throw new Error("Product saved, but server returned invalid data.");
      }

      const normalizedProduct = mapProduct(saved);

      if (!normalizedProduct.id) {
        throw new Error("Product saved, but product id was missing.");
      }

      if (isEditing && editingId) {
        setProducts((prev) =>
          prev.map((item) => (item.id === editingId ? normalizedProduct : item))
        );
      } else {
        setProducts((prev) => [normalizedProduct, ...prev]);
      }

      showToast(
        isEditing ? "Product updated successfully." : "Product created.",
        "success"
      );

      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save product";

      setError(message);
      showToast(message, "error");
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
      showToast("You do not have permission to delete product.", "error");
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
      showToast("Product deleted successfully.", "success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete product";

      showToast(message, "error");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
  }

  return (
    <AdminPageGuard permission="productView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin Catalog
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Products
                </h1>

                <p className="mt-2 max-w-[660px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Manage products, stock, pricing, images, categories, colors,
                  sizes, and visibility from one premium catalog dashboard.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => fetchProducts("refresh")}
                  disabled={refreshing}
                  className={secondaryBtnClass}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                {canCreate ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className={primaryBtnClass}
                  >
                    Add Product
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Products"
              value={String(products.length)}
              iconSrc="/images/admin/product.png"
            />

            <MetricCard
              label="Active"
              value={String(activeCount)}
              iconSrc="/images/admin/active.png"
            />

            <MetricCard
              label="Inactive"
              value={String(inactiveCount)}
              iconSrc="/images/admin/inactive.png"
            />

            <MetricCard
              label="Low Stock"
              value={String(lowStockCount)}
              iconSrc="/images/admin/stock.png"
            />
          </section>

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-[#26293a] px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Product List
                </div>

                <div className="mt-1 text-[20px] font-semibold text-white">
                  All Products
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-[46px] min-w-[260px] items-center rounded-full border border-white/10 bg-white/5 px-4">
                  <input
                    id="product-search"
                    name="product-search"
                    title="Search products"
                    aria-label="Search products"
                    className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
                    type="text"
                    placeholder="Search by name or slug"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className={secondaryBtnClass}
                  onClick={() =>
                    setStatusFilter((prev) => {
                      const idx = statuses.indexOf(prev);
                      return statuses[(idx + 1) % statuses.length];
                    })
                  }
                >
                  {statusFilter === "All"
                    ? "Status: All"
                    : `Status: ${statusFilter}`}
                </button>

                {(search || statusFilter !== "All") && (
                  <button
                    type="button"
                    className={secondaryBtnClass}
                    onClick={clearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {error ? (
              <div className="border-b border-[#26293a] px-5 py-4 text-[13px] text-red-300">
                {error}
              </div>
            ) : null}

            {loading ? (
              <ProductSkeleton />
            ) : products.length === 0 ? (
              <EmptyState canCreate={canCreate} onCreate={openCreateModal} />
            ) : filteredProducts.length === 0 ? (
              <NoResults onClear={clearFilters} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Product</th>
                      <th className="px-5 py-4 font-medium">Gender</th>
                      <th className="px-5 py-4 font-medium">Sizes</th>
                      <th className="px-5 py-4 font-medium">Colors</th>
                      <th className="px-5 py-4 font-medium">Price</th>
                      <th className="px-5 py-4 font-medium">Stock</th>
                      <th className="px-5 py-4 font-medium">Status</th>

                      {canEdit || canDelete ? (
                        <th className="px-5 py-4 font-medium">Actions</th>
                      ) : null}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-[#0d0f17]">
                              <Image
                                src={getImageSrc(product.image)}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="line-clamp-1 font-semibold text-white">
                                {product.name}
                              </div>

                              <div className="mt-1 line-clamp-1 text-[12px] text-[#7f879f]">
                                {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {product.gender}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex max-w-[190px] flex-wrap gap-1.5">
                            {product.sizes?.length ? (
                              product.sizes.map((s) => (
                                <span
                                  key={`${product.id}-${s}`}
                                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#7f879f]">-</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex max-w-[220px] flex-wrap gap-1.5">
                            {product.colors?.length ? (
                              product.colors.map((c, idx) => (
                                <span
                                  key={`${product.id}-${c}-${idx}`}
                                  title={c}
                                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]"
                                >
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#7f879f]">-</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 font-semibold text-[#d6c7ff]">
                          {formatPriceNPR(product.price)}
                        </td>

                        <td className="px-5 py-4">
                          <StockBadge stock={product.stock} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={product.status} />
                        </td>

                        {canEdit || canDelete ? (
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {canEdit ? (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(product)}
                                  className={secondaryBtnClass}
                                >
                                  Edit
                                </button>
                              ) : null}

                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => requestDelete(product.id)}
                                  className="rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15"
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {confirmDeleteId ? (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <div className="w-[min(440px,94vw)] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
              <div className="text-[11px] uppercase tracking-[0.22em] text-red-300">
                Delete Product
              </div>

              <div className="mt-2 text-[22px] font-semibold text-white">
                Are you sure?
              </div>

              <div className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                This action cannot be undone. The selected product will be
                permanently removed from your database.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className={secondaryBtnClass}
                  disabled={deletingId === confirmDeleteId}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deletingId === confirmDeleteId}
                  onClick={() => handleDeleteConfirmed(confirmDeleteId)}
                  className="rounded-full bg-red-500 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showModal ? (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <div className="flex max-h-[92vh] w-[min(860px,94vw)] flex-col overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
              <div className="flex items-start justify-between border-b border-[#26293a] px-5 py-5 sm:px-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    {editingId ? "Update" : "Create"}
                  </div>

                  <div className="mt-1 text-[22px] font-semibold text-white">
                    {editingId ? "Edit Product" : "Add Product"}
                  </div>
                </div>

                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px] text-[#a7aec4] transition hover:bg-white/10 hover:text-white"
                  onClick={() => setShowModal(false)}
                  aria-label="Close product modal"
                  title="Close product modal"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Field label="Name *" htmlFor="product-name">
                    <input
                      id="product-name"
                      name="productName"
                      title="Product name"
                      aria-label="Product name"
                      className={inputClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Field>

                  <Field label="Description" htmlFor="product-description">
                    <textarea
                      id="product-description"
                      name="productDescription"
                      title="Product description"
                      aria-label="Product description"
                      className="min-h-[110px] w-full resize-none rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-[13px] leading-6 text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Price (Rs) *" htmlFor="product-price">
                      <input
                        id="product-price"
                        name="productPrice"
                        title="Product price"
                        aria-label="Product price"
                        type="number"
                        min={0}
                        className={inputClass}
                        value={price}
                        onChange={(e) =>
                          setPrice(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        required
                      />
                    </Field>

                    <Field label="Stock *" htmlFor="product-stock">
                      <input
                        id="product-stock"
                        name="productStock"
                        title="Product stock"
                        aria-label="Product stock"
                        type="number"
                        min={0}
                        className={inputClass}
                        value={stock}
                        onChange={(e) =>
                          setStock(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        required
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Status" htmlFor="product-status">
                      <select
                        id="product-status"
                        name="productStatus"
                        title="Product status"
                        aria-label="Product status"
                        className={inputClass}
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as ProductStatus)
                        }
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </Field>

                    <Field label="Gender *" htmlFor="product-gender">
                      <select
                        id="product-gender"
                        name="productGender"
                        title="Product gender"
                        aria-label="Product gender"
                        className={inputClass}
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </Field>
                  </div>

                  <Field
                    label="Colors (hex, comma separated) *"
                    htmlFor="product-colors"
                  >
                    <input
                      id="product-colors"
                      name="productColors"
                      title="Product colors"
                      aria-label="Product colors"
                      className={inputClass}
                      placeholder="#000000, #ffffff"
                      value={colors}
                      onChange={(e) => setColors(e.target.value)}
                    />
                  </Field>

                  <Field label="Sizes *" htmlFor="product-sizes">
                    <div
                      id="product-sizes"
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label="Product sizes"
                    >
                      {(["S", "M", "L", "XL", "XXL"] as Size[]).map((s) => {
                        const checked = sizes.includes(s);

                        return (
                          <label
                            key={s}
                            className={[
                              "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-semibold transition",
                              checked
                                ? "border-[#d6c7ff]/40 bg-[#d6c7ff]/15 text-[#d6c7ff]"
                                : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                            ].join(" ")}
                          >
                            <input
                              name="productSizes"
                              title={`Size ${s}`}
                              aria-label={`Size ${s}`}
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSize(s)}
                              className="sr-only"
                            />

                            <span>{s}</span>
                          </label>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Category *" htmlFor="product-category">
                    <select
                      id="product-category"
                      name="productCategory"
                      title="Product category"
                      aria-label="Product category"
                      className={inputClass}
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Select category</option>

                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <UploadBox
                      title="Main Image *"
                      description="Click to upload a local image."
                      onClick={() => mainFileRef.current?.click()}
                    >
                      <input
                        ref={mainFileRef}
                        id="main-product-image"
                        name="mainProductImage"
                        title="Main product image"
                        aria-label="Main product image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleMainFileChange}
                      />

                      {mainPreview ? (
                        <div className="relative mt-4 h-[96px] w-[96px] overflow-hidden rounded-[18px] border border-white/10 bg-[#0d0f17]">
                          <Image
                            src={getImageSrc(mainPreview)}
                            alt="Main product preview"
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                    </UploadBox>

                    <UploadBox
                      title="Gallery Images"
                      description="Upload one or more optional images."
                      onClick={() => galleryFileRef.current?.click()}
                    >
                      <input
                        ref={galleryFileRef}
                        id="gallery-product-images"
                        name="galleryProductImages"
                        title="Gallery product images"
                        aria-label="Gallery product images"
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleGalleryFilesChange}
                      />

                      {galleryPreview.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {galleryPreview.map((src, idx) => (
                            <div
                              key={`${src}-${idx}`}
                              className="relative h-[72px] w-[72px] overflow-hidden rounded-[14px] border border-white/10 bg-[#0d0f17]"
                            >
                              <Image
                                src={getImageSrc(src)}
                                alt={`Gallery preview ${idx + 1}`}
                                fill
                                sizes="72px"
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </UploadBox>
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className={secondaryBtnClass}
                      disabled={submitting}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={primaryBtnClass}
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
        ) : null}

        {toast ? <Toast toast={toast} /> : null}
      </div>
    </AdminPageGuard>
  );
}

function MetricCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function UploadBox({
  title,
  description,
  onClick,
  children,
}: {
  title: string;
  description: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="cursor-pointer rounded-[20px] border border-dashed border-[#3a3f58] bg-[#0d0f17] p-5 transition hover:border-[#d6c7ff]/50 hover:bg-white/[0.03]"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={title}
      title={title}
    >
      <div className="text-[13px] font-semibold text-white">{title}</div>

      <div className="mt-1 text-[12px] leading-6 text-[#a7aec4]">
        {description}
      </div>

      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        status === "Active"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
          : "border-slate-400/20 bg-slate-500/15 text-slate-300",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const low = stock <= 5;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        low
          ? "border-amber-400/20 bg-amber-500/15 text-amber-300"
          : "border-white/10 bg-white/5 text-[#a7aec4]",
      ].join(" ")}
    >
      {stock} left
    </span>
  );
}

function ProductSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function EmptyState({
  canCreate,
  onCreate,
}: {
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/product.png"
          alt="Products"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No products found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Add your first product or adjust your search and status filters.
      </p>

      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className={`${primaryBtnClass} mt-5`}
        >
          Add Product
        </button>
      ) : null}
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px]">
        🔎
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No matching products
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Try changing the search keyword or status filter.
      </p>

      <button
        type="button"
        onClick={onClear}
        className={`${secondaryBtnClass} mt-5`}
      >
        Clear Filter
      </button>
    </div>
  );
}

function Toast({ toast }: { toast: Exclude<ToastState, null> }) {
  return (
    <div
      className={[
        "fixed bottom-5 right-5 z-[1200] max-w-[360px] rounded-[18px] border px-5 py-4 text-[13px] font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur",
        toast.type === "success"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
          : toast.type === "error"
          ? "border-red-400/20 bg-red-500/15 text-red-200"
          : "border-[#8b5cf6]/30 bg-[#8b5cf6]/15 text-[#e9ddff]",
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}