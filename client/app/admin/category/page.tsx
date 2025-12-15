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
    <>
      <style jsx global>{`
        .page-title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .add-btn {
          padding: 10px 16px;
          border-radius: 10px;
          background: #22c55e;
          border: none;
          color: #0f172a;
          font-weight: 600;
          cursor: pointer;
        }

        .add-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .category-form-wrap {
          max-width: 720px;
          margin-bottom: 28px;
          border: 1px solid #111827;
          border-radius: 16px;
          padding: 18px 18px 10px;
          background: #0b1220;
        }

        .field-group {
          margin-bottom: 20px;
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

        .text-input {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #1f2937;
          background: #020617;
          color: #e5e7eb;
        }

        .actions {
          margin-top: 28px;
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

        .error-text {
          margin-bottom: 12px;
          font-size: 13px;
          color: #fca5a5;
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
          width: min(720px, 90vw);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
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

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .table th,
        .table td {
          border-bottom: 1px solid #111827;
          padding: 10px 8px;
          text-align: left;
          font-size: 13px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge.active {
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
        }

        .badge.inactive {
          background: rgba(248, 113, 113, 0.12);
          color: #fca5a5;
        }

        .action-btn {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #1f2937;
          background: #0b1220;
          color: #e5e7eb;
          cursor: pointer;
          font-size: 12px;
          margin-right: 8px;
        }

        .action-btn.delete {
          border-color: #7f1d1d;
          color: #fca5a5;
        }

        .confirm-card {
          background: #0b1220;
          border: 1px solid #111827;
          border-radius: 14px;
          padding: 18px;
          width: min(420px, 90vw);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }

        .btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #1f2937;
          background: #0b1220;
          color: #e5e7eb;
          cursor: pointer;
        }

        .btn.primary {
          background: #ef4444;
          border-color: #b91c1c;
          color: #fff;
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
        <div className="page-header">
          <h1 className="page-title">Categories</h1>
          <button type="button" className="add-btn" onClick={openCreateModal}>
            Add Category
          </button>
        </div>

        {error && <div className="error-text">{error}</div>}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <div className="modal-title">{editingId ? "Edit Category" : "Add Category"}</div>
                <button
                  type="button"
                  className="close-btn"
                  aria-label="Close"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="category-form-wrap" style={{ marginBottom: 0, border: "none", padding: 0 }}>
                <form onSubmit={handleSubmit}>
                  <div className="field-group">
                    <label htmlFor="name" className="field-label">
                      Category Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      className="text-input"
                      placeholder="e.g. Hoodie, Sneakers"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="description" className="field-label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className="text-input"
                      placeholder="Optional short description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="isActive" className="field-label">
                      Active
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <span className="field-description">Keep enabled to show in public listings.</span>
                    </label>
                  </div>

                  <div className="actions">
                    <button type="submit" className="save-btn" disabled={submitting}>
                      {submitting ? "Saving..." : "Save Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteId && (
          <div className="modal-overlay">
            <div className="confirm-card">
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Delete category?</div>
              <div className="field-description" style={{ marginBottom: 8 }}>
                This action cannot be undone.
              </div>
              <div className="confirm-actions">
                <button type="button" className="btn" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </button>
                <button type="button" className="btn primary" onClick={() => handleDeleteConfirmed(confirmDeleteId)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          {loadingList ? (
            <p className="field-description">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="field-description">No categories yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.slug}</td>
                    <td>
                      <span className={`badge ${c.isActive ? "active" : "inactive"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "--"}</td>
                    <td>
                      <button type="button" className="action-btn" onClick={() => openEditModal(c)}>
                        Edit
                      </button>
                      <button type="button" className="action-btn delete" onClick={() => requestDelete(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
