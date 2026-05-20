"use client";

import { API_BASE_URL as PUBLIC_API_BASE_URL } from "@/lib/api";

import * as React from "react";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
};

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
} | null;

type ApiCategory = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
};

type CategoryListResponse = {
  success?: boolean;
  message?: string;
  data?: ApiCategory[] | { categories?: ApiCategory[] };
  categories?: ApiCategory[];
};

type CategorySaveResponse = {
  success?: boolean;
  message?: string;
  data?: ApiCategory;
  category?: ApiCategory;
};

const API_BASE_URL = PUBLIC_API_BASE_URL;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";
const inputClass =
  "h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]";

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function mapCategory(c: ApiCategory): Category {
  return {
    id: String(c._id || c.id || ""),
    name: String(c.name || "Untitled Category"),
    slug: String(c.slug || "-"),
    description: c.description || "",
    isActive: Boolean(c.isActive),
    createdAt: c.createdAt,
  };
}

function getCategoryArray(body: CategoryListResponse): ApiCategory[] {
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.categories)) return body.categories;
  if (body.data && Array.isArray(body.data.categories)) {
    return body.data.categories;
  }

  return [];
}

function formatDate(date?: string) {
  if (!date) return "--";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "--";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminCategoryPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  );
  const [toast, setToast] = React.useState<ToastState>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all");

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  const canCreate = hasPermission(role, permissions, "categoryCreate");
  const canEdit = hasPermission(role, permissions, "categoryEdit");
  const canDelete = hasPermission(role, permissions, "categoryDelete");

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
    },
    []
  );

  const loadCategories = React.useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      try {
        if (mode === "initial") setLoadingList(true);
        if (mode === "refresh") setRefreshing(true);

        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          credentials: "include",
          cache: "no-store",
        });

        const body = (await safeJson(res)) as CategoryListResponse;

        if (!res.ok) {
          throw new Error(body?.message || "Failed to load categories");
        }

        const mapped = getCategoryArray(body)
          .map(mapCategory)
          .filter((c) => c.id);

        setCategories(mapped);

        if (mode === "refresh") {
          showToast("Categories refreshed successfully.", "success");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load categories";

        setError(message);

        if (mode === "refresh") {
          showToast(message, "error");
        }
      } finally {
        setLoadingList(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  React.useEffect(() => {
    if (!toast) return;

    const t = window.setTimeout(() => setToast(null), 3000);
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
        // AdminPageGuard already protects this page.
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    loadCategories("initial");
  }, [loadCategories]);

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

  const filteredCategories = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return categories.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        String(c.description || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = React.useMemo(
    () => categories.filter((c) => c.isActive).length,
    [categories]
  );

  const inactiveCount = categories.length - activeCount;

  function resetForm() {
    setName("");
    setDescription("");
    setIsActive(true);
    setEditingId(null);
    setError(null);
  }

  function openCreateModal() {
    if (!canCreate) {
      showToast("You do not have permission to create category.", "error");
      return;
    }

    resetForm();
    setShowModal(true);
  }

  function openEditModal(c: Category) {
    if (!canEdit) {
      showToast("You do not have permission to edit category.", "error");
      return;
    }

    setError(null);
    setEditingId(c.id);
    setName(c.name ?? "");
    setDescription(c.description ?? "");
    setIsActive(Boolean(c.isActive));
    setShowModal(true);
  }

  function requestDelete(id: string) {
    if (!canDelete) {
      showToast("You do not have permission to delete category.", "error");
      return;
    }

    setConfirmDeleteId(id);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanDesc = description.trim();
    const isEditing = Boolean(editingId);

    if (!cleanName) {
      setError("Please provide a category name.");
      return;
    }

    if (isEditing && !canEdit) {
      setError("You do not have permission to edit category.");
      return;
    }

    if (!isEditing && !canCreate) {
      setError("You do not have permission to create category.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: cleanName,
        description: cleanDesc || undefined,
        isActive,
      };

      const endpoint = isEditing
        ? `${API_BASE_URL}/api/admin/categories/${editingId}`
        : `${API_BASE_URL}/api/admin/categories`;

      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await safeJson(res)) as CategorySaveResponse;

      if (!res.ok) {
        throw new Error(body?.message || "Failed to save category");
      }

      const saved = body.data || body.category;

      if (!saved) {
        throw new Error("Category saved, but server returned invalid data.");
      }

      const mapped = mapCategory(saved);

      if (!mapped.id) {
        throw new Error("Category saved, but category id was missing.");
      }

      setCategories((prev) => {
        if (isEditing && editingId) {
          return prev.map((c) => (c.id === editingId ? mapped : c));
        }

        return [mapped, ...prev];
      });

      resetForm();
      setShowModal(false);

      showToast(
        isEditing ? "Category updated successfully." : "Category created.",
        "success"
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";

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
      showToast("You do not have permission to delete category.", "error");
      setConfirmDeleteId(null);
      return;
    }

    try {
      setDeleting(true);

      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const body = await safeJson(res);

      if (!res.ok) {
        throw new Error(body?.message || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("Category deleted successfully.", "success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete category";

      showToast(message, "error");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  }

  return (
    <AdminPageGuard permission="categoryView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin Catalog
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Categories
                </h1>

                <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Manage product categories, visibility status, slugs, and
                  catalog organization from one clean admin panel.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => loadCategories("refresh")}
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
                    Add Category
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MiniStat label="Total Categories" value={categories.length} />
            <MiniStat label="Active" value={activeCount} tone="success" />
            <MiniStat label="Inactive" value={inactiveCount} tone="danger" />
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-[#26293a] px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Category List
                </div>
                <div className="mt-1 text-[20px] font-semibold text-white">
                  All Categories
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(220px,320px)_160px_auto]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search category..."
                  className={inputClass}
                />

                <select
                 aria-label="Filter categories by status"
                title="Filter categories by status"
                value={statusFilter}
                onChange={(e) =>
                setStatusFilter(
                e.target.value as "all" | "active" | "inactive"
                 )
                }
                className={inputClass}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>

                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-[12px] font-semibold text-[#d6c7ff]">
                  {filteredCategories.length} shown
                </div>
              </div>
            </div>

            {loadingList ? (
              <CategorySkeleton />
            ) : categories.length === 0 ? (
              <EmptyState canCreate={canCreate} onCreate={openCreateModal} />
            ) : filteredCategories.length === 0 ? (
              <NoResults onClear={() => {
                setSearch("");
                setStatusFilter("all");
              }} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Name</th>
                      <th className="px-5 py-4 font-medium">Slug</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Created</th>
                      {canEdit || canDelete ? (
                        <th className="px-5 py-4 font-medium">Actions</th>
                      ) : null}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {c.name}
                          </div>

                          {c.description ? (
                            <div className="mt-1 line-clamp-1 max-w-[320px] text-[12px] text-[#7f879f]">
                              {c.description}
                            </div>
                          ) : (
                            <div className="mt-1 text-[12px] text-[#7f879f]">
                              No description
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-[#a7aec4]">
                            {c.slug}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge active={c.isActive} />
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {formatDate(c.createdAt)}
                        </td>

                        {canEdit || canDelete ? (
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {canEdit ? (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(c)}
                                  className={secondaryBtnClass}
                                >
                                  Edit
                                </button>
                              ) : null}

                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => requestDelete(c.id)}
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

        {showModal ? (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <div className="w-[min(720px,94vw)] overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
              <div className="flex items-start justify-between border-b border-[#26293a] px-5 py-5 sm:px-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    {editingId ? "Update" : "Create"}
                  </div>
                  <div className="mt-1 text-[22px] font-semibold text-white">
                    {editingId ? "Edit Category" : "Add Category"}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowModal(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px] text-[#a7aec4] transition hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                {error ? (
                  <div className="rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
                    {error}
                  </div>
                ) : null}

                <Field label="Category Name *">
                  <input
                    id="name"
                    name="name"
                    className={inputClass}
                    placeholder="e.g. Hoodie, Sneakers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    id="description"
                    name="description"
                    className="min-h-[110px] w-full resize-none rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-[13px] leading-6 text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                    placeholder="Optional short description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </Field>

                <div className="rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4">
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                      <div className="text-[13px] font-semibold text-white">
                        Active Category
                      </div>
                      <div className="mt-1 text-[12px] text-[#a7aec4]">
                        Keep enabled to show this category in public listings.
                      </div>
                    </div>

                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-5 w-5 accent-[#d6c7ff]"
                    />
                  </label>
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
                    {submitting ? "Saving..." : "Save Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {confirmDeleteId ? (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <div className="w-[min(440px,94vw)] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
              <div className="text-[11px] uppercase tracking-[0.22em] text-red-300">
                Delete Category
              </div>

              <div className="mt-2 text-[22px] font-semibold text-white">
                Are you sure?
              </div>

              <div className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                This action cannot be undone. The selected category will be
                permanently removed from your database.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className={secondaryBtnClass}
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDeleteConfirmed(confirmDeleteId)}
                  className="rounded-full bg-red-500 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <Toast toast={toast} /> : null}
      </div>
    </AdminPageGuard>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4]">
        {label}
      </div>
      {children}
    </label>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        active
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
          : "border-red-400/20 bg-red-500/15 text-red-300",
      ].join(" ")}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger";
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
        {label}
      </div>

      <div
        className={[
          "mt-3 text-[28px] font-semibold tracking-[-0.04em]",
          tone === "success"
            ? "text-emerald-300"
            : tone === "danger"
            ? "text-red-300"
            : "text-white",
        ].join(" ")}
      >
        {value.toLocaleString("en-US")}
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[64px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
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
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px]">
        🗂️
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No categories yet
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Start by creating your first product category for organizing items in
        the store catalog.
      </p>

      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className={`${primaryBtnClass} mt-5`}
        >
          Add Category
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
        No matching categories
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
