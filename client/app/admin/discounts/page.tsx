// client/app/admin/discounts/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type CouponType = "PERCENT" | "FLAT" | "FREESHIP";
type CouponScope = "ALL" | "CATEGORY" | "PRODUCT";
type CouponStatus = "ACTIVE" | "PAUSED";

type CouponRow = {
  id: string;
  code: string;
  title: string;
  type: CouponType;
  scope: CouponScope;
  value: number;
  minOrder: number | null;
  maxDiscountCap: number | null;
  status: CouponStatus;
  startAt: string | null;
  endAt: string | null;
  usedCount: number;
  globalUsageLimit: number | null;
  maxUsesPerUser: number | null;
  createdAt?: string;
};

type CollectedRow = {
  id: string;
  status: "COLLECTED" | "USED" | "EXPIRED";
  collectedAt: string;
  usedAt: string | null;
  orderId: string | null;
  user: { id: string; name: string; email: string };
  coupon: { id: string; code: string; title: string; type: CouponType };
};

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

function moneyLabelRs(v?: number | null) {
  if (v == null) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `Rs ${n}`;
}

function statusPill(status: CouponStatus) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1";
  if (status === "ACTIVE")
    return `${base} bg-emerald-500/10 text-emerald-300 ring-emerald-500/20`;
  return `${base} bg-amber-500/10 text-amber-300 ring-amber-500/20`;
}

function collectedPill(status: CollectedRow["status"]) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1";
  if (status === "USED")
    return `${base} bg-emerald-500/10 text-emerald-300 ring-emerald-500/20`;
  if (status === "EXPIRED")
    return `${base} bg-rose-500/10 text-rose-300 ring-rose-500/20`;
  return `${base} bg-sky-500/10 text-sky-300 ring-sky-500/20`;
}

function typeLabel(t: CouponType, value: number, cap?: number | null) {
  if (t === "PERCENT") return `${value}%${cap ? ` (cap Rs ${cap})` : ""}`;
  if (t === "FLAT") return `Rs ${value}`;
  return "Free Shipping";
}

function scopeLabel(s: CouponScope) {
  if (s === "ALL") return "All Products";
  if (s === "CATEGORY") return "Category";
  return "Product";
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

type FormState = {
  id?: string; // for edit
  code: string;
  title: string;
  description: string;
  type: CouponType;
  scope: CouponScope;
  value: number;
  maxDiscountCap: number | null;
  minOrder: number | null;
  startAt: string; // yyyy-mm-dd
  endAt: string; // yyyy-mm-dd
  globalUsageLimit: number | null;
  maxUsesPerUser: number | null;
  status: CouponStatus;
};

const emptyForm: FormState = {
  code: "",
  title: "Discount",
  description: "",
  type: "PERCENT",
  scope: "ALL",
  value: 10,
  maxDiscountCap: 500,
  minOrder: 1000,
  startAt: "",
  endAt: "",
  globalUsageLimit: null,
  maxUsesPerUser: 1,
  status: "ACTIVE",
};

export default function AdminDiscountsPage() {
  const [tab, setTab] = useState<"coupons" | "collected">("coupons");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [collected, setCollected] = useState<CollectedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CouponStatus>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CouponType>("ALL");

  // modal
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "ACTIVE").length;
    const paused = rows.filter((r) => r.status === "PAUSED").length;
    const usedTotal = rows.reduce((acc, r) => acc + Number(r.usedCount || 0), 0);
    const total = rows.length;
    return { active, paused, usedTotal, total };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (!needle) return true;
      return (
        r.code.toLowerCase().includes(needle) ||
        r.title.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, statusFilter, typeFilter]);

  async function loadCoupons() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/discounts");
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }

  async function loadCollected() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/discounts/collected/list");
      setCollected(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load collected list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    if (tab === "collected") loadCollected();
  }, [tab]);

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: CouponRow) {
    setForm({
      id: row.id,
      code: row.code || "",
      title: row.title || "Discount",
      description: "",
      type: row.type,
      scope: row.scope,
      value: Number(row.value || 0),
      maxDiscountCap: row.maxDiscountCap ?? null,
      minOrder: row.minOrder ?? null,
      startAt: row.startAt ? String(row.startAt).slice(0, 10) : "",
      endAt: row.endAt ? String(row.endAt).slice(0, 10) : "",
      globalUsageLimit: row.globalUsageLimit ?? null,
      maxUsesPerUser: row.maxUsesPerUser ?? null,
      status: row.status,
    });
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function normalizePayload(f: FormState) {
    const payload: any = {
      code: String(f.code || "").trim().toUpperCase(),
      title: String(f.title || "").trim(),
      description: String(f.description || "").trim(),
      type: f.type,
      scope: f.scope,
      value: Number(f.value || 0),
      status: f.status,
      minOrder: f.minOrder == null ? null : Number(f.minOrder),
      maxDiscountCap: f.maxDiscountCap == null ? null : Number(f.maxDiscountCap),
      globalUsageLimit:
        f.globalUsageLimit == null ? null : Number(f.globalUsageLimit),
      maxUsesPerUser:
        f.maxUsesPerUser == null ? null : Number(f.maxUsesPerUser),
      startAt: f.startAt ? new Date(f.startAt).toISOString() : null,
      endAt: f.endAt ? new Date(f.endAt).toISOString() : null,
      eligibleCategoryIds: [],
      eligibleProductIds: [],
    };

    // FREESHIP: value not necessary
    if (payload.type === "FREESHIP") payload.value = 0;

    // FLAT: cap doesn't matter
    if (payload.type !== "PERCENT") payload.maxDiscountCap = null;

    return payload;
  }

  async function saveCoupon() {
    const code = String(form.code || "").trim().toUpperCase();
    if (!code) return setError("Coupon code is required");
    if (!/^[A-Z0-9_-]{3,20}$/.test(code))
      return setError("Code must be 3–20 chars (A-Z, 0-9, _ or -)");

    if (!String(form.title || "").trim()) return setError("Title is required");

    if (form.type === "PERCENT") {
      if (form.value < 1 || form.value > 100)
        return setError("Percent must be between 1 and 100");
    }
    if (form.type === "FLAT") {
      if (form.value <= 0) return setError("Flat discount must be > 0");
    }

    setSaving(true);
    setError(null);
    try {
      const payload = normalizePayload(form);

      if (form.id) {
        await apiFetch(`/admin/discounts/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/admin/discounts`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setOpen(false);
      await loadCoupons();
    } catch (e: any) {
      setError(e?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;
    setError(null);
    try {
      await apiFetch(`/admin/discounts/${id}`, { method: "DELETE" });
      await loadCoupons();
    } catch (e: any) {
      setError(e?.message || "Failed to delete coupon");
    }
  }

  async function toggleStatus(row: CouponRow) {
    const next: CouponStatus = row.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setError(null);
    try {
      await apiFetch(`/admin/discounts/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await loadCoupons();
    } catch (e: any) {
      setError(e?.message || "Failed to update status");
    }
  }

  return (
    <div className="min-h-[calc(100vh-40px)] text-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discounts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and manage coupon codes. Customers can collect and use them at checkout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("coupons")}
            className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
              tab === "coupons"
                ? "bg-slate-800 ring-slate-700"
                : "bg-transparent text-slate-300 ring-slate-800 hover:bg-slate-900"
            }`}
          >
            Coupons
          </button>
          <button
            onClick={() => setTab("collected")}
            className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
              tab === "collected"
                ? "bg-slate-800 ring-slate-700"
                : "bg-transparent text-slate-300 ring-slate-800 hover:bg-slate-900"
            }`}
          >
            Collected
          </button>

          {tab === "coupons" && (
            <button
              onClick={openCreate}
              className="ml-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20"
            >
              + Create Coupon
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Stats */}
      {tab === "coupons" && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs text-slate-400">Total Coupons</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs text-slate-400">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">
              {stats.active}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs text-slate-400">Paused</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">
              {stats.paused}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs text-slate-400">Used Count (Total)</p>
            <p className="mt-2 text-2xl font-semibold">{stats.usedTotal}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {tab === "coupons" ? (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-sm">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by code or title..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-slate-700"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as any)
                    }
                    className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-700"
                  >
                    <option value="ALL">All status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-700"
                  >
                    <option value="ALL">All types</option>
                    <option value="PERCENT">Percent</option>
                    <option value="FLAT">Flat</option>
                    <option value="FREESHIP">Free Ship</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={loadCoupons}
                  className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/50"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead className="bg-slate-900/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Scope</th>
                      <th className="px-4 py-3">Min Order</th>
                      <th className="px-4 py-3">Validity</th>
                      <th className="px-4 py-3">Used</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-8 text-sm text-slate-400" colSpan={9}>
                          Loading...
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-sm text-slate-400" colSpan={9}>
                          No coupons found.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr key={r.id} className="text-sm text-slate-200">
                          <td className="px-4 py-3">
                            <div className="font-semibold">{r.code}</div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {r.globalUsageLimit
                                ? `Limit ${r.usedCount}/${r.globalUsageLimit}`
                                : `Used ${r.usedCount}`}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{r.title}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {typeLabel(r.type, r.value, r.maxDiscountCap)}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {scopeLabel(r.scope)}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {moneyLabelRs(r.minOrder)}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <div className="text-xs">
                              {formatDate(r.startAt)} – {formatDate(r.endAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {r.usedCount ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <span className={statusPill(r.status)}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEdit(r)}
                                className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900/50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => toggleStatus(r)}
                                className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900/50"
                              >
                                {r.status === "ACTIVE" ? "Pause" : "Activate"}
                              </button>
                              <button
                                onClick={() => deleteCoupon(r.id)}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/15"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          // Collected tab
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Collected Coupons</h2>
                <p className="text-xs text-slate-400">
                  Track which users collected and used coupons.
                </p>
              </div>
              <button
                onClick={loadCollected}
                className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/50"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="bg-slate-900/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Coupon</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Collected</th>
                    <th className="px-4 py-3">Used</th>
                    <th className="px-4 py-3">Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-sm text-slate-400" colSpan={6}>
                        Loading...
                      </td>
                    </tr>
                  ) : collected.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-sm text-slate-400" colSpan={6}>
                        No collected coupons yet.
                      </td>
                    </tr>
                  ) : (
                    collected.map((r) => (
                      <tr key={r.id} className="text-sm text-slate-200">
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.user?.name || "—"}</div>
                          <div className="text-xs text-slate-500">{r.user?.email || ""}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{r.coupon?.code || "—"}</div>
                          <div className="text-xs text-slate-500">{r.coupon?.title || ""}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={collectedPill(r.status)}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{formatDate(r.collectedAt)}</td>
                        <td className="px-4 py-3 text-slate-300">{formatDate(r.usedAt)}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {r.orderId ? (
                            <span className="rounded-md border border-slate-800 bg-slate-900/30 px-2 py-1 text-xs">
                              {r.orderId}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold">
                  {form.id ? "Edit Coupon" : "Create Coupon"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Configure discount rules for customers.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/50"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-400">Code</label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                  }
                  disabled={!!form.id} // code shouldn't change after create
                  placeholder="NEWYEAR10"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700 disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Use A–Z, 0–9, _ or - (3–20 chars)
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-400">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="New Year Sale"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400">Description (optional)</label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Extra 10% off on all products"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Type</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, type: e.target.value as CouponType }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                >
                  <option value="PERCENT">Percent</option>
                  <option value="FLAT">Flat (Rs)</option>
                  <option value="FREESHIP">Free Shipping</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Scope</label>
                <select
                  value={form.scope}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, scope: e.target.value as CouponScope }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                >
                  <option value="ALL">All products</option>
                  <option value="CATEGORY">Specific category</option>
                  <option value="PRODUCT">Specific product</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">
                  {form.type === "PERCENT"
                    ? "Percent (%)"
                    : form.type === "FLAT"
                    ? "Flat value (Rs)"
                    : "Value"}
                </label>
                <input
                  type="number"
                  value={form.value}
                  disabled={form.type === "FREESHIP"}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, value: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Max cap (Rs) (percent only)</label>
                <input
                  type="number"
                  value={form.maxDiscountCap ?? ""}
                  disabled={form.type !== "PERCENT"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      maxDiscountCap:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Min order (Rs)</label>
                <input
                  type="number"
                  value={form.minOrder ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      minOrder: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Per user limit</label>
                <input
                  type="number"
                  value={form.maxUsesPerUser ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      maxUsesPerUser:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Global usage limit</label>
                <input
                  type="number"
                  value={form.globalUsageLimit ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      globalUsageLimit:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Start date</label>
                <input
                  type="date"
                  value={form.startAt}
                  onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">End date</label>
                <input
                  type="date"
                  value={form.endAt}
                  onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value as CouponStatus }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-700"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

              {/* Scope helpers (UI only for now) */}
              {form.scope !== "ALL" && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4 sm:col-span-2">
                  <p className="text-sm font-semibold">
                    Scope selection (next step)
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    You selected <span className="font-medium">{form.scope}</span>.  
                    In the next step we will connect category/product pickers from backend.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-800/70 px-5 py-4">
              <p className="text-xs text-slate-500">
                Totals are calculated server-side at checkout for safety.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCoupon}
                  disabled={saving}
                  className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20 disabled:opacity-60"
                >
                  {saving ? "Saving..." : form.id ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
