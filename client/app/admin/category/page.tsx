// client/app/admin/category/page.tsx
"use client";

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function AdminCategoryPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  );
  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  const canCreate = hasPermission(role, permissions, "categoryCreate");
  const canEdit = hasPermission(role, permissions, "categoryEdit");
  const canDelete = hasPermission(role, permissions, "categoryDelete");

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
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
      } catch {}
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingList(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          credentials: "include",
          cache: "no-store",
        });

        const body = await safeJson(res);

        if (!res.ok) {
          throw new Error(body?.message || "Failed to load categories");
        }

        const data = (body.data ?? body) as any[];
        const mapped: Category[] = data.map((c: any) => ({
          id: c._id || c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          isActive: c.isActive,
          createdAt: c.createdAt,
        }));

        if (mounted) setCategories(mapped);
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load categories");
      } finally {
        if (mounted) setLoadingList(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setIsActive(true);
    setEditingId(null);
    setError(null);
  }

  function openCreateModal() {
    if (!canCreate) {
      setToast({
        type: "error",
        message: "You do not have permission to create category",
      });
      return;
    }

    resetForm();
    setShowModal(true);
  }

  function openEditModal(c: Category) {
    if (!canEdit) {
      setToast({
        type: "error",
        message: "You do not have permission to edit category",
      });
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
      setToast({
        type: "error",
        message: "You do not have permission to delete category",
      });
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

      const body = await safeJson(res);

      if (!res.ok) {
        throw new Error(body?.message || "Failed to save category");
      }

      const created = body.data ?? body;
      const categoryId = created._id || created.id;

      setCategories((prev) => {
        if (isEditing && editingId) {
          return prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  name: created.name,
                  slug: created.slug,
                  description: created.description,
                  isActive: created.isActive,
                }
              : c
          );
        }

        return [
          {
            id: categoryId,
            name: created.name,
            slug: created.slug,
            description: created.description,
            isActive: created.isActive,
            createdAt: created.createdAt,
          },
          ...prev,
        ];
      });

      resetForm();
      setShowModal(false);
      setToast({
        type: "success",
        message: isEditing ? "Category updated" : "Category created",
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setToast({
        type: "error",
        message: err.message || "Something went wrong",
      });
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
      setToast({
        type: "error",
        message: "You do not have permission to delete category",
      });
      setConfirmDeleteId(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error(body?.message || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setToast({ type: "success", message: "Category deleted" });
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.message || "Failed to delete category",
      });
    } finally {
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
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Category List
                </div>
                <div className="mt-1 text-[20px] font-semibold text-white">
                  All Categories
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
                {categories.length} total
              </div>
            </div>

            {loadingList ? (
              <CategorySkeleton />
            ) : categories.length === 0 ? (
              <EmptyState canCreate={canCreate} onCreate={openCreateModal} />
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
                    {categories.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{c.name}</div>
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
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString()
                            : "--"}
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

        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
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
                <Field label="Category Name *">
                  <input
                    id="name"
                    name="name"
                    className="h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
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
        )}

        {confirmDeleteId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
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
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteConfirmed(confirmDeleteId)}
                  className="rounded-full bg-red-500 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            className={[
              "fixed bottom-5 right-5 z-[1200] rounded-[18px] border px-5 py-4 text-[13px] font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)]",
              toast.type === "success"
                ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                : "border-red-400/20 bg-red-500/15 text-red-200",
            ].join(" ")}
          >
            {toast.message}
          </div>
        )}
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
        <button type="button" onClick={onCreate} className={`${primaryBtnClass} mt-5`}>
          Add Category
        </button>
      ) : null}
    </div>
  );
}