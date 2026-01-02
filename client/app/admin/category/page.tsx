"use client";

import * as React from "react";

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
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingList(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          credentials: "include",
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Failed to load categories");
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanDesc = description.trim();

    if (!cleanName) {
      setError("Please provide a category name.");
      return;
    }

    try {
      setSubmitting(true);
      const isEditing = Boolean(editingId);

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

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to save category");
      }

      const json = await res.json();
      const created = json.data ?? json;
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
          },
          ...prev,
        ];
      });

      setName("");
      setDescription("");
      setIsActive(true);
      setEditingId(null);
      setShowModal(false);
      setToast({ type: "success", message: isEditing ? "Category updated" : "Category created" });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setToast({ type: "error", message: err.message || "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  function openCreateModal() {
    setError(null);
    setEditingId(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setShowModal(true);
  }

  function openEditModal(c: Category) {
    setError(null);
    setEditingId(c.id);
    setName(c.name ?? "");
    setDescription(c.description ?? "");
    setIsActive(Boolean(c.isActive));
    setShowModal(true);
  }

  function requestDelete(id: string) {
    setConfirmDeleteId(id);
  }

  async function handleDeleteConfirmed(id: string | null) {
    if (!id) {
      setConfirmDeleteId(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete category");
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setToast({ type: "success", message: "Category deleted" });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to delete category" });
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="relative">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="mb-0 text-[22px] font-semibold">Categories</h1>

        <button
          type="button"
          onClick={openCreateModal}
          className="cursor-pointer rounded-[10px] bg-[#22c55e] px-4 py-[10px] font-semibold text-[#0f172a]"
        >
          Add Category
        </button>
      </div>

      {/* ERROR */}
      {error && <div className="mb-3 text-[13px] text-[#fca5a5]">{error}</div>}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="w-[min(720px,90vw)] rounded-2xl border border-[#111827] bg-[#0b1220] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="mb-[14px] flex items-center justify-between">
              <div className="text-[18px] font-bold">
                {editingId ? "Edit Category" : "Add Category"}
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowModal(false)}
                className="cursor-pointer border-0 bg-transparent text-[22px] text-[#9ca3af]"
              >
                ×
              </button>
            </div>

            {/* form wrap (same look as before but border removed in modal) */}
            <div className="max-w-[720px] rounded-2xl bg-transparent p-0">
              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div className="mb-5 flex flex-col gap-[6px]">
                  <label htmlFor="name" className="text-[13px]">
                    Category Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                    placeholder="e.g. Hoodie, Sneakers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Desc */}
                <div className="mb-5 flex flex-col gap-[6px]">
                  <label htmlFor="description" className="text-[13px]">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-[10px] text-[#e5e7eb]"
                    placeholder="Optional short description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Active */}
                <div className="mb-5 flex flex-col gap-[6px]">
                  <label htmlFor="isActive" className="text-[13px]">
                    Active
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span className="text-[11px] text-[#9ca3af]">
                      Keep enabled to show in public listings.
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="mt-7 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="cursor-pointer rounded-full bg-[#8b5cf6] px-[22px] py-[10px] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : "Save Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="w-[min(420px,90vw)] rounded-[14px] border border-[#111827] bg-[#0b1220] p-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="mb-2 font-bold">Delete category?</div>
            <div className="mb-2 text-[11px] text-[#9ca3af]">This action cannot be undone.</div>

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
                onClick={() => handleDeleteConfirmed(confirmDeleteId)}
                className="cursor-pointer rounded-[10px] border border-[#b91c1c] bg-[#ef4444] px-[14px] py-2 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div>
        {loadingList ? (
          <p className="text-[11px] text-[#9ca3af]">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-[11px] text-[#9ca3af]">No categories yet.</p>
        ) : (
          <table className="mt-[10px] w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px] font-semibold">
                  Name
                </th>
                <th className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px] font-semibold">
                  Slug
                </th>
                <th className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px] font-semibold">
                  Status
                </th>
                <th className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px] font-semibold">
                  Created
                </th>
                <th className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px] font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px]">
                    {c.name}
                  </td>
                  <td className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px]">
                    {c.slug}
                  </td>
                  <td className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px]">
                    <span
                      className={[
                        "inline-flex items-center gap-[6px] rounded-full px-2 py-1 text-[12px] font-semibold",
                        c.isActive
                          ? "bg-[rgba(34,197,94,0.12)] text-[#4ade80]"
                          : "bg-[rgba(248,113,113,0.12)] text-[#fca5a5]",
                      ].join(" ")}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px]">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "--"}
                  </td>
                  <td className="border-b border-[#111827] px-2 py-[10px] text-left text-[13px]">
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="mr-2 cursor-pointer rounded-lg border border-[#1f2937] bg-[#0b1220] px-[10px] py-[6px] text-[12px] text-[#e5e7eb]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(c.id)}
                      className="cursor-pointer rounded-lg border border-[#7f1d1d] bg-[#0b1220] px-[10px] py-[6px] text-[12px] text-[#fca5a5]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div
          className={[
            "fixed bottom-5 right-5 z-[1200] rounded-xl px-[14px] py-3 text-[13px] font-semibold text-[#0f172a] shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
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
