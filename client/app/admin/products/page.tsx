"use client";

import * as React from "react";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

import DeleteProductModal from "./_components/DeleteProductModal";
import ProductModal from "./_components/ProductModal";
import ProductsHeader from "./_components/ProductsHeader";
import ProductsStats from "./_components/ProductsStats";
import ProductsTable from "./_components/ProductsTable";
import { Toast } from "./_components/ProductShared";
import {
  API_BASE_URL,
  ApiCategory,
  ApiProduct,
  CategoryListResponse,
  Gender,
  Product,
  ProductListResponse,
  ProductSaveResponse,
  ProductStatus,
  ProductVariantForm,
  SIZE_OPTIONS,
  Size,
  ToastState,
  ToastType,
  buildSku,
  emptyForm,
  emptyVariant,
  getCategoryArray,
  getProductArray,
  getTotalVariantStock,
  mapProduct,
  safeJson,
  shellClass,
  productVariantsToForm,
} from "./_components/productTypes";

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
  const [compareAtPrice, setCompareAtPrice] = React.useState<number | "">("");
  const [status, setStatus] = React.useState<ProductStatus>("Active");
  const [gender, setGender] = React.useState<Gender>("Male");
  const [categoryId, setCategoryId] = React.useState("");
  const [image, setImage] = React.useState("");
  const [images, setImages] = React.useState("");
  const [variants, setVariants] = React.useState<ProductVariantForm[]>([
    emptyVariant(),
  ]);

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

  const totalVariantStock = React.useMemo(
    () => getTotalVariantStock(variants),
    [variants]
  );

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
    () =>
      products.filter((p) => {
        if (p.variants.length > 0) {
          return p.variants.some(
            (variant) =>
              variant.isActive && variant.stock > 0 && variant.stock <= 5
          );
        }

        return p.stock <= 5;
      }).length,
    [products]
  );

  const outOfStockCount = React.useMemo(
    () =>
      products.filter((p) => {
        if (p.variants.length > 0) {
          return p.variants.every(
            (variant) => !variant.isActive || variant.stock <= 0
          );
        }

        return p.stock <= 0;
      }).length,
    [products]
  );

  const resetForm = () => {
    const form = emptyForm();

    setName(form.name);
    setDescription(form.description);
    setPrice(form.price);
    setCompareAtPrice(form.compareAtPrice);
    setStatus(form.status);
    setGender(form.gender);
    setCategoryId(form.categoryId);
    setImage(form.image);
    setImages(form.images);
    setVariants(form.variants);
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
    setCompareAtPrice(product.compareAtPrice || "");
    setStatus(product.status);
    setGender(product.gender);
    setCategoryId(product.categoryId || "");
    setImage(product.image || "");
    setImages(product.images?.join(", ") || "");
    setVariants(productVariantsToForm(product));
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

  const addVariant = () => {
    setVariants((prev) => [...prev, emptyVariant()]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateVariant = (
    index: number,
    patch: Partial<ProductVariantForm>
  ) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, ...patch } : variant
      )
    );
  };

  const generateVariantSku = (index: number) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? {
              ...variant,
              sku: buildSku(name, variant.color, variant.size),
            }
          : variant
      )
    );
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
    const compareAtPriceNum =
      compareAtPrice === "" ? undefined : Number(compareAtPrice);

    if (
      !cleanName ||
      priceNum == null ||
      Number.isNaN(priceNum) ||
      priceNum < 0
    ) {
      showToast("Name and valid price are required.", "error");
      return;
    }

    if (
      compareAtPriceNum != null &&
      (Number.isNaN(compareAtPriceNum) || compareAtPriceNum < 0)
    ) {
      showToast("Actual price must be 0 or more.", "error");
      return;
    }

    if (compareAtPriceNum != null && compareAtPriceNum <= priceNum) {
      showToast("Actual price must be greater than selling price.", "error");
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

    if (!Array.isArray(variants) || variants.length === 0) {
      showToast("Add at least one product variant.", "error");
      return;
    }

    const cleanVariants = variants.map((variant) => ({
      id: variant.id,
      color: String(variant.color || "").trim().toLowerCase(),
      size: String(variant.size || "").trim().toUpperCase() as Size,
      stock: Number(variant.stock || 0),
      sku: String(variant.sku || "").trim().toUpperCase(),
      isActive: variant.isActive !== false,
    }));

    const invalidColor = cleanVariants.find(
      (variant) => !/^#([0-9a-f]{6})$/.test(variant.color)
    );

    if (invalidColor) {
      showToast("Each variant color must be a hex code like #000000.", "error");
      return;
    }

    const invalidSize = cleanVariants.find(
      (variant) => !SIZE_OPTIONS.includes(variant.size)
    );

    if (invalidSize) {
      showToast("Each variant must have a valid size.", "error");
      return;
    }

    const invalidStock = cleanVariants.find(
      (variant) => Number.isNaN(variant.stock) || variant.stock < 0
    );

    if (invalidStock) {
      showToast("Each variant stock must be 0 or more.", "error");
      return;
    }

    const duplicateCheck = new Set<string>();
    const duplicateVariant = cleanVariants.find((variant) => {
      const key = `${variant.color}-${variant.size}`;

      if (duplicateCheck.has(key)) return true;

      duplicateCheck.add(key);
      return false;
    });

    if (duplicateVariant) {
      showToast("Duplicate color and size variant is not allowed.", "error");
      return;
    }

    const imageUrls = images
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    const uniqueColors = Array.from(
      new Set(cleanVariants.map((variant) => variant.color))
    );

    const uniqueSizes = Array.from(
      new Set(cleanVariants.map((variant) => variant.size))
    );

    const totalStock = cleanVariants
      .filter((variant) => variant.isActive)
      .reduce((sum, variant) => sum + Number(variant.stock || 0), 0);

    try {
      setSubmitting(true);

      const payload = {
        name: cleanName,
        description: cleanDesc || undefined,
        price: priceNum,
        compareAtPrice: compareAtPriceNum,
        stock: totalStock,
        status,
        image: image.trim(),
        images: imageUrls.length ? imageUrls : undefined,
        gender,
        colors: uniqueColors,
        sizes: uniqueSizes,
        variants: cleanVariants.map((variant) => ({
          color: variant.color,
          size: variant.size,
          stock: variant.stock,
          sku: variant.sku || undefined,
          isActive: variant.isActive,
        })),
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
          <ProductsHeader
            refreshing={refreshing}
            canCreate={canCreate}
            onRefresh={() => fetchProducts("refresh")}
            onCreate={openCreateModal}
          />

          <ProductsStats
            total={products.length}
            activeCount={activeCount}
            lowStockCount={lowStockCount}
            outOfStockCount={outOfStockCount}
          />

          <ProductsTable
            products={products}
            filteredProducts={filteredProducts}
            loading={loading}
            error={error}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            inactiveCount={inactiveCount}
            statuses={statuses}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            openCreateModal={openCreateModal}
            openEditModal={openEditModal}
            requestDelete={requestDelete}
            clearFilters={clearFilters}
          />
        </div>

        <DeleteProductModal
          confirmDeleteId={confirmDeleteId}
          deletingId={deletingId}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleDeleteConfirmed}
        />

        <ProductModal
          showModal={showModal}
          editingId={editingId}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          price={price}
          setPrice={setPrice}
          compareAtPrice={compareAtPrice}
          setCompareAtPrice={setCompareAtPrice}
          status={status}
          setStatus={setStatus}
          gender={gender}
          setGender={setGender}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          categories={categories}
          variants={variants}
          submitting={submitting}
          mainFileRef={mainFileRef}
          galleryFileRef={galleryFileRef}
          mainPreview={mainPreview}
          galleryPreview={galleryPreview}
          totalVariantStock={totalVariantStock}
          handleSubmit={handleSubmit}
          handleMainFileChange={handleMainFileChange}
          handleGalleryFilesChange={handleGalleryFilesChange}
          addVariant={addVariant}
          removeVariant={removeVariant}
          updateVariant={updateVariant}
          generateVariantSku={generateVariantSku}
          onClose={() => setShowModal(false)}
        />

        {toast ? <Toast toast={toast} /> : null}
      </div>
    </AdminPageGuard>
  );
}