// client/app/admin/discounts/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

type CouponType = "PERCENT" | "FLAT" | "FREESHIP";
type CouponScope = "ALL" | "CATEGORY" | "PRODUCT";
type CouponStatus = "ACTIVE" | "PAUSED";
type CouponDateStatus = "ACTIVE" | "UPCOMING" | "EXPIRED" | "PAUSED";

type CouponRow = {
  id: string;
  code: string;
  title: string;
  description?: string;
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
  eligibleCategoryIds?: string[];
  eligibleProductIds?: string[];
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

type FormState = {
  id?: string;
  code: string;
  title: string;
  description: string;
  type: CouponType;
  scope: CouponScope;
  value: number;
  maxDiscountCap: number | null;
  minOrder: number | null;
  startAt: string;
  endAt: string;
  globalUsageLimit: number | null;
  maxUsesPerUser: number | null;
  status: CouponStatus;
  eligibleCategoryIds: string;
  eligibleProductIds: string;
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");
const API_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const dangerBtnClass =
  "rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60";

const inputClass =
  "h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

const selectClass =
  "h-[48px] rounded-full border border-white/10 bg-[#141620] px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff]";

const actionBtnClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

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
  eligibleCategoryIds: "",
  eligibleProductIds: "",
};

function formatDate(d?: string | null) {
  if (!d) return "—";

  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  } catch {
    return "—";
  }
}

function moneyLabelRs(v?: number | null) {
  if (v == null) return "—";

  const n = Number(v);
  if (Number.isNaN(n)) return "—";

  return `Rs ${n.toLocaleString("en-IN")}`;
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

function idsToText(ids?: string[]) {
  if (!Array.isArray(ids)) return "";
  return ids.filter(Boolean).join(", ");
}

function textToIds(text: string) {
  return String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function optionClass() {
  return "bg-[#11121a] text-white";
}

function getCouponDateStatus(row: CouponRow): CouponDateStatus {
  if (row.status === "PAUSED") return "PAUSED";

  const now = new Date();
  const start = row.startAt ? new Date(row.startAt) : null;
  const end = row.endAt ? new Date(row.endAt) : null;

  if (start && !Number.isNaN(start.getTime()) && now < start) {
    return "UPCOMING";
  }

  if (end && !Number.isNaN(end.getTime()) && now > end) {
    return "EXPIRED";
  }

  return "ACTIVE";
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    cache: "no-store",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error((data as any)?.message || "Request failed");
  }

  return data;
}

export default function AdminDiscountsPage() {
  const [tab, setTab] = useState<"coupons" | "collected">("coupons");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [collected, setCollected] = useState<CollectedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | CouponDateStatus
  >("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CouponType>("ALL");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CouponRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);

  const canCreate = hasPermission(role, permissions, "discountCreate");
  const canEdit = hasPermission(role, permissions, "discountEdit");
  const canDelete = hasPermission(role, permissions, "discountDelete");

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    let mounted = true;

    const loadAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/settings`, {
          method: "GET",
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
        if (!mounted) return;
        setPermissions(null);
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = rows.filter(
      (r) => getCouponDateStatus(r) === "ACTIVE"
    ).length;

    const upcoming = rows.filter(
      (r) => getCouponDateStatus(r) === "UPCOMING"
    ).length;

    const expired = rows.filter(
      (r) => getCouponDateStatus(r) === "EXPIRED"
    ).length;

    const paused = rows.filter(
      (r) => getCouponDateStatus(r) === "PAUSED"
    ).length;

    const usedTotal = rows.reduce((acc, r) => acc + Number(r.usedCount || 0), 0);
    const total = rows.length;

    return { active, upcoming, expired, paused, usedTotal, total };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((r) => {
      const realStatus = getCouponDateStatus(r);

      if (statusFilter !== "ALL" && realStatus !== statusFilter) return false;
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (!needle) return true;

      return (
        r.code.toLowerCase().includes(needle) ||
        r.title.toLowerCase().includes(needle) ||
        String(r.description || "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, statusFilter, typeFilter]);

  async function loadCoupons() {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/admin/discounts");
      setRows(Array.isArray((res as any)?.data) ? (res as any).data : []);
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
      setCollected(Array.isArray((res as any)?.data) ? (res as any).data : []);
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

  useEffect(() => {
    if (!open && !deleteTarget) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving && !deleting) {
        setOpen(false);
        setDeleteTarget(null);
      }
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, deleteTarget, saving, deleting]);

  function openCreate() {
    if (!canCreate) {
      setError("You do not have permission to create coupons.");
      return;
    }

    setError(null);
    setModalError(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: CouponRow) {
    if (!canEdit) {
      setError("You do not have permission to edit coupons.");
      return;
    }

    setError(null);
    setModalError(null);

    setForm({
      id: row.id,
      code: row.code || "",
      title: row.title || "Discount",
      description: row.description || "",
      type: row.type,
      scope: row.scope,
      value: row.type === "FREESHIP" ? 0 : Number(row.value || 0),
      maxDiscountCap: row.maxDiscountCap ?? null,
      minOrder: row.minOrder ?? null,
      startAt: row.startAt ? String(row.startAt).slice(0, 10) : "",
      endAt: row.endAt ? String(row.endAt).slice(0, 10) : "",
      globalUsageLimit: row.globalUsageLimit ?? null,
      maxUsesPerUser: row.maxUsesPerUser ?? null,
      status: row.status,
      eligibleCategoryIds: idsToText(row.eligibleCategoryIds),
      eligibleProductIds: idsToText(row.eligibleProductIds),
    });

    setOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setOpen(false);
    setModalError(null);
  }

  function validateForm(f: FormState) {
    const code = String(f.code || "").trim().toUpperCase();
    const title = String(f.title || "").trim();

    if (!code) return "Coupon code is required.";

    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      return "Code must be 3–20 chars using A-Z, 0-9, _ or -.";
    }

    if (!title) return "Title is required.";

    if (f.type === "PERCENT" && (Number(f.value) < 1 || Number(f.value) > 100)) {
      return "Percent discount must be between 1 and 100.";
    }

    if (f.type === "FLAT" && Number(f.value) <= 0) {
      return "Flat discount must be greater than 0.";
    }

    if (f.minOrder != null && Number(f.minOrder) < 0) {
      return "Minimum order cannot be negative.";
    }

    if (f.maxDiscountCap != null && Number(f.maxDiscountCap) < 0) {
      return "Maximum discount cap cannot be negative.";
    }

    if (f.globalUsageLimit != null && Number(f.globalUsageLimit) < 1) {
      return "Global usage limit must be at least 1.";
    }

    if (f.maxUsesPerUser != null && Number(f.maxUsesPerUser) < 1) {
      return "Per user limit must be at least 1.";
    }

    if (f.startAt && f.endAt) {
      const start = new Date(f.startAt);
      const end = new Date(f.endAt);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return "Please enter a valid start and end date.";
      }

      if (end < start) {
        return "End date cannot be before start date.";
      }
    }

    const categoryIds = textToIds(f.eligibleCategoryIds);
    const productIds = textToIds(f.eligibleProductIds);

    if (f.scope === "CATEGORY" && categoryIds.length === 0) {
      return "Please enter at least one category ID for category coupon scope.";
    }

    if (f.scope === "PRODUCT" && productIds.length === 0) {
      return "Please enter at least one product ID for product coupon scope.";
    }

    return null;
  }

  function normalizePayload(f: FormState) {
    const eligibleCategoryIds =
      f.scope === "CATEGORY" ? textToIds(f.eligibleCategoryIds) : [];

    const eligibleProductIds =
      f.scope === "PRODUCT" ? textToIds(f.eligibleProductIds) : [];

    const payload: any = {
      code: String(f.code || "").trim().toUpperCase(),
      title: String(f.title || "").trim(),
      description: String(f.description || "").trim(),
      type: f.type,
      scope: f.scope,
      value: Number(f.value || 0),
      status: f.status,
      minOrder: f.minOrder == null ? null : Number(f.minOrder),
      maxDiscountCap:
        f.maxDiscountCap == null ? null : Number(f.maxDiscountCap),
      globalUsageLimit:
        f.globalUsageLimit == null ? null : Number(f.globalUsageLimit),
      maxUsesPerUser:
        f.maxUsesPerUser == null ? null : Number(f.maxUsesPerUser),
      startAt: f.startAt ? new Date(f.startAt).toISOString() : null,
      endAt: f.endAt ? new Date(f.endAt).toISOString() : null,
      eligibleCategoryIds,
      eligibleProductIds,
    };

    if (payload.type === "FREESHIP") {
      payload.value = 0;
      payload.maxDiscountCap = null;
    }

    if (payload.type !== "PERCENT") {
      payload.maxDiscountCap = null;
    }

    if (payload.scope === "ALL") {
      payload.eligibleCategoryIds = [];
      payload.eligibleProductIds = [];
    }

    return payload;
  }

  async function saveCoupon() {
    if (form.id && !canEdit) {
      setModalError("You do not have permission to edit coupons.");
      return;
    }

    if (!form.id && !canCreate) {
      setModalError("You do not have permission to create coupons.");
      return;
    }

    const validationError = validateForm(form);

    if (validationError) {
      setModalError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setModalError(null);

    try {
      const payload = normalizePayload(form);

      if (form.id) {
        await apiFetch(`/admin/discounts/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        showToast({
          type: "success",
          message: "Coupon updated successfully.",
        });
      } else {
        await apiFetch("/admin/discounts", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        showToast({
          type: "success",
          message: "Coupon created successfully.",
        });
      }

      setOpen(false);
      await loadCoupons();
    } catch (e: any) {
      setModalError(e?.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(row: CouponRow) {
    if (!canDelete) {
      setError("You do not have permission to delete coupons.");
      return;
    }

    setError(null);
    setDeleteTarget(row);
  }

  async function confirmDeleteCoupon() {
    if (!deleteTarget) return;

    if (!canDelete) {
      setError("You do not have permission to delete coupons.");
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await apiFetch(`/admin/discounts/${deleteTarget.id}`, {
        method: "DELETE",
      });

      showToast({
        type: "success",
        message: "Coupon deleted successfully.",
      });

      setDeleteTarget(null);
      await loadCoupons();
    } catch (e: any) {
      setError(e?.message || "Failed to delete coupon.");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(row: CouponRow) {
    if (!canEdit) {
      setError("You do not have permission to edit coupons.");
      return;
    }

    const next: CouponStatus = row.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

    setError(null);

    try {
      await apiFetch(`/admin/discounts/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });

      showToast({
        type: "success",
        message:
          next === "ACTIVE"
            ? "Coupon activated successfully."
            : "Coupon paused successfully.",
      });

      await loadCoupons();
    } catch (e: any) {
      setError(e?.message || "Failed to update status.");
    }
  }

  return (
    <AdminPageGuard permission="discountView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}

        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Admin / Discounts
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Discounts
                </h1>

                <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Create coupon codes, manage discount rules, pause campaigns,
                  check expiry dates, and track collected coupons used by
                  customers at checkout.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <TabButton
                  active={tab === "coupons"}
                  onClick={() => setTab("coupons")}
                >
                  Coupons
                </TabButton>

                <TabButton
                  active={tab === "collected"}
                  onClick={() => setTab("collected")}
                >
                  Collected
                </TabButton>

                {tab === "coupons" && canCreate ? (
                  <button
                    type="button"
                    onClick={openCreate}
                    className={primaryBtnClass}
                  >
                    Create Coupon
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {error ? (
            <AlertBox type="error" message={error} onClose={() => setError(null)} />
          ) : null}

          {tab === "coupons" ? (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                  label="Total Coupons"
                  value={String(stats.total)}
                  iconSrc="/images/admin/coupon.png"
                />

                <StatCard
                  label="Active"
                  value={String(stats.active)}
                  iconSrc="/images/admin/active.png"
                />

                <StatCard
                  label="Upcoming"
                  value={String(stats.upcoming)}
                  iconSrc="/images/admin/active.png"
                />

                <StatCard
                  label="Expired"
                  value={String(stats.expired)}
                  iconSrc="/images/admin/paused.png"
                />

                <StatCard
                  label="Paused"
                  value={String(stats.paused)}
                  iconSrc="/images/admin/paused.png"
                />
              </section>

              <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_180px_auto]">
                  <div className="flex h-[48px] items-center rounded-full border border-white/10 bg-white/5 px-4">
                    <label htmlFor="coupon-search" className="sr-only">
                      Search by code, title, or description
                    </label>

                    <input
                      id="coupon-search"
                      name="couponSearch"
                      title="Search by code, title, or description"
                      aria-label="Search by code, title, or description"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search by code, title, or description..."
                      className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
                    />
                  </div>

                  <select
                    id="coupon-status-filter"
                    name="couponStatusFilter"
                    title="Coupon status filter"
                    aria-label="Coupon status filter"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as "ALL" | CouponDateStatus)
                    }
                    className={selectClass}
                  >
                    <option className={optionClass()} value="ALL">
                      All status
                    </option>
                    <option className={optionClass()} value="ACTIVE">
                      Active
                    </option>
                    <option className={optionClass()} value="UPCOMING">
                      Upcoming
                    </option>
                    <option className={optionClass()} value="EXPIRED">
                      Expired
                    </option>
                    <option className={optionClass()} value="PAUSED">
                      Paused
                    </option>
                  </select>

                  <select
                    id="coupon-type-filter"
                    name="couponTypeFilter"
                    title="Coupon type filter"
                    aria-label="Coupon type filter"
                    value={typeFilter}
                    onChange={(e) =>
                      setTypeFilter(e.target.value as "ALL" | CouponType)
                    }
                    className={selectClass}
                  >
                    <option className={optionClass()} value="ALL">
                      All types
                    </option>
                    <option className={optionClass()} value="PERCENT">
                      Percent
                    </option>
                    <option className={optionClass()} value="FLAT">
                      Flat
                    </option>
                    <option className={optionClass()} value="FREESHIP">
                      Free Ship
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={loadCoupons}
                    className={secondaryBtnClass}
                  >
                    Refresh
                  </button>
                </div>
              </section>

              <CouponsTable
                loading={loading}
                rows={filteredRows}
                canEdit={canEdit}
                canDelete={canDelete}
                openEdit={openEdit}
                toggleStatus={toggleStatus}
                requestDelete={requestDelete}
              />
            </>
          ) : (
            <CollectedTable
              loading={loading}
              rows={collected}
              onRefresh={loadCollected}
            />
          )}

          {open ? (
            <CouponModal
              form={form}
              setForm={setForm}
              saving={saving}
              error={modalError}
              setError={setModalError}
              closeModal={closeModal}
              saveCoupon={saveCoupon}
            />
          ) : null}

          {deleteTarget ? (
            <DeleteConfirmModal
              row={deleteTarget}
              deleting={deleting}
              onCancel={() => {
                if (!deleting) setDeleteTarget(null);
              }}
              onConfirm={confirmDeleteCoupon}
            />
          ) : null}
        </div>
      </div>
    </AdminPageGuard>
  );
}

function Toast({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  const tone =
    toast.type === "success"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-100"
      : toast.type === "error"
      ? "border-red-400/20 bg-red-500/15 text-red-100"
      : "border-blue-400/20 bg-blue-500/15 text-blue-100";

  return (
    <div className="fixed right-4 top-4 z-[70] w-[calc(100vw-2rem)] max-w-[420px]">
      <div
        className={[
          "flex items-start justify-between gap-3 rounded-[20px] border px-4 py-3 shadow-2xl backdrop-blur",
          tone,
        ].join(" ")}
      >
        <p className="text-[13px] font-medium leading-6">{toast.message}</p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-bold text-white"
          aria-label="Close toast"
          title="Close toast"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function AlertBox({
  type,
  message,
  onClose,
}: {
  type: "error" | "info";
  message: string;
  onClose?: () => void;
}) {
  const tone =
    type === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : "border-blue-400/20 bg-blue-500/10 text-blue-200";

  return (
    <div
      className={[
        "flex items-start justify-between gap-3 rounded-[20px] border px-5 py-4 text-[13px]",
        tone,
      ].join(" ")}
    >
      <p className="leading-6">{message}</p>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition",
        active
          ? "bg-white text-[#090a12]"
          : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
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

function StatusPill({ row }: { row: CouponRow }) {
  const status = getCouponDateStatus(row);

  const tone =
    status === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "UPCOMING"
      ? "border-sky-400/20 bg-sky-500/15 text-sky-300"
      : status === "EXPIRED"
      ? "border-red-400/20 bg-red-500/15 text-red-300"
      : "border-amber-400/20 bg-amber-500/15 text-amber-300";

  const label =
    status === "ACTIVE"
      ? "Active"
      : status === "UPCOMING"
      ? "Upcoming"
      : status === "EXPIRED"
      ? "Expired"
      : "Paused";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        tone,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function CollectedPill({ status }: { status: CollectedRow["status"] }) {
  const tone =
    status === "USED"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "EXPIRED"
      ? "border-red-400/20 bg-red-500/15 text-red-300"
      : "border-blue-400/20 bg-blue-500/15 text-blue-300";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        tone,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function CouponsTable({
  loading,
  rows,
  canEdit,
  canDelete,
  openEdit,
  toggleStatus,
  requestDelete,
}: {
  loading: boolean;
  rows: CouponRow[];
  canEdit: boolean;
  canDelete: boolean;
  openEdit: (row: CouponRow) => void;
  toggleStatus: (row: CouponRow) => void;
  requestDelete: (row: CouponRow) => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          Coupon List
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">
          Discount Rules
        </h2>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState text="No coupons found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                <th className="px-5 py-4 font-medium">Code</th>
                <th className="px-5 py-4 font-medium">Title</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 font-medium">Scope</th>
                <th className="px-5 py-4 font-medium">Min Order</th>
                <th className="px-5 py-4 font-medium">Validity</th>
                <th className="px-5 py-4 font-medium">Used</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const realStatus = getCouponDateStatus(r);

                return (
                  <tr
                    key={r.id}
                    className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{r.code}</div>

                      <div className="mt-1 text-[12px] text-[#7f879f]">
                        {r.globalUsageLimit
                          ? `Limit ${r.usedCount}/${r.globalUsageLimit}`
                          : `Used ${r.usedCount}`}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{r.title}</div>

                      {r.description ? (
                        <div className="mt-1 max-w-[240px] truncate text-[12px] text-[#7f879f]">
                          {r.description}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-[#a7aec4]">
                      {typeLabel(r.type, r.value, r.maxDiscountCap)}
                    </td>

                    <td className="px-5 py-4 text-[#a7aec4]">
                      {scopeLabel(r.scope)}
                    </td>

                    <td className="px-5 py-4 text-[#a7aec4]">
                      {moneyLabelRs(r.minOrder)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-[#a7aec4]">
                        {formatDate(r.startAt)} – {formatDate(r.endAt)}
                      </div>

                      {realStatus === "EXPIRED" ? (
                        <div className="mt-1 text-[11px] text-red-300">
                          Date expired
                        </div>
                      ) : null}

                      {realStatus === "UPCOMING" ? (
                        <div className="mt-1 text-[11px] text-sky-300">
                          Starts later
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4">
                      <CountBadge>{r.usedCount ?? 0}</CountBadge>
                    </td>

                    <td className="px-5 py-4">
                      <StatusPill row={r} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className={actionBtnClass}
                          >
                            Edit
                          </button>
                        ) : null}

                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => toggleStatus(r)}
                            className={actionBtnClass}
                          >
                            {r.status === "ACTIVE" ? "Pause" : "Activate"}
                          </button>
                        ) : null}

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => requestDelete(r)}
                            className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CollectedTable({
  loading,
  rows,
  onRefresh,
}: {
  loading: boolean;
  rows: CollectedRow[];
  onRefresh: () => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Collected Coupons
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">
            Customer Coupon Activity
          </h2>

          <p className="mt-1 text-[13px] text-[#a7aec4]">
            Track which users collected and used coupons.
          </p>
        </div>

        <button type="button" onClick={onRefresh} className={secondaryBtnClass}>
          Refresh
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState text="No collected coupons yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                <th className="px-5 py-4 font-medium">User</th>
                <th className="px-5 py-4 font-medium">Coupon</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Collected</th>
                <th className="px-5 py-4 font-medium">Used</th>
                <th className="px-5 py-4 font-medium">Order</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">
                      {r.user?.name || "—"}
                    </div>

                    <div className="mt-1 text-[12px] text-[#7f879f]">
                      {r.user?.email || ""}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">
                      {r.coupon?.code || "—"}
                    </div>

                    <div className="mt-1 text-[12px] text-[#7f879f]">
                      {r.coupon?.title || ""}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <CollectedPill status={r.status} />
                  </td>

                  <td className="px-5 py-4 text-[#a7aec4]">
                    {formatDate(r.collectedAt)}
                  </td>

                  <td className="px-5 py-4 text-[#a7aec4]">
                    {formatDate(r.usedAt)}
                  </td>

                  <td className="px-5 py-4 text-[#a7aec4]">
                    {r.orderId ? <CountBadge>{r.orderId}</CountBadge> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CouponModal({
  form,
  setForm,
  saving,
  error,
  setError,
  closeModal,
  saveCoupon,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  saving: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  closeModal: () => void;
  saveCoupon: () => void;
}) {
  function updateType(nextType: CouponType) {
    setError(null);

    setForm((p) => ({
      ...p,
      type: nextType,
      value: nextType === "FREESHIP" ? 0 : p.value || 1,
      maxDiscountCap: nextType === "PERCENT" ? p.maxDiscountCap ?? 500 : null,
    }));
  }

  function updateScope(nextScope: CouponScope) {
    setError(null);

    setForm((p) => ({
      ...p,
      scope: nextScope,
      eligibleCategoryIds: nextScope === "CATEGORY" ? p.eligibleCategoryIds : "",
      eligibleProductIds: nextScope === "PRODUCT" ? p.eligibleProductIds : "",
    }));
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div className="flex min-h-full items-start justify-center py-6">
        <div
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
        >
          <div className="shrink-0 border-b border-[#26293a] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Coupon Setup
                </div>

                <h3
                  id="coupon-modal-title"
                  className="mt-1 text-[20px] font-semibold text-white"
                >
                  {form.id ? "Edit Coupon" : "Create Coupon"}
                </h3>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Configure discount rules, start date, and expiry date.
                </p>
              </div>

              <button type="button" onClick={closeModal} className={secondaryBtnClass}>
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {error ? (
                <div className="sm:col-span-2">
                  <AlertBox type="error" message={error} onClose={() => setError(null)} />
                </div>
              ) : null}

              <FormField label="Code" htmlFor="coupon-code">
                <input
                  id="coupon-code"
                  name="couponCode"
                  title="Coupon code"
                  aria-label="Coupon code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  disabled={!!form.id}
                  placeholder="NEWYEAR10"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Title" htmlFor="coupon-title">
                <input
                  id="coupon-title"
                  name="couponTitle"
                  title="Coupon title"
                  aria-label="Coupon title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="New Year Sale"
                  className={inputClass}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Description" htmlFor="coupon-description">
                  <input
                    id="coupon-description"
                    name="couponDescription"
                    title="Coupon description"
                    aria-label="Coupon description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Extra 10% off on all products"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Type" htmlFor="coupon-type">
                <select
                  id="coupon-type"
                  name="couponType"
                  title="Coupon type"
                  aria-label="Coupon type"
                  value={form.type}
                  onChange={(e) => updateType(e.target.value as CouponType)}
                  className={inputClass}
                >
                  <option className={optionClass()} value="PERCENT">
                    Percent
                  </option>
                  <option className={optionClass()} value="FLAT">
                    Flat (Rs)
                  </option>
                  <option className={optionClass()} value="FREESHIP">
                    Free Shipping
                  </option>
                </select>
              </FormField>

              <FormField label="Scope" htmlFor="coupon-scope">
                <select
                  id="coupon-scope"
                  name="couponScope"
                  title="Coupon scope"
                  aria-label="Coupon scope"
                  value={form.scope}
                  onChange={(e) => updateScope(e.target.value as CouponScope)}
                  className={inputClass}
                >
                  <option className={optionClass()} value="ALL">
                    All products
                  </option>
                  <option className={optionClass()} value="CATEGORY">
                    Specific category
                  </option>
                  <option className={optionClass()} value="PRODUCT">
                    Specific product
                  </option>
                </select>
              </FormField>

              <FormField
                label={form.type === "PERCENT" ? "Percent (%)" : "Value"}
                htmlFor="coupon-value"
              >
                <input
                  id="coupon-value"
                  name="couponValue"
                  title="Coupon value"
                  aria-label="Coupon value"
                  type="number"
                  min={form.type === "PERCENT" ? 1 : 0}
                  max={form.type === "PERCENT" ? 100 : undefined}
                  value={form.value}
                  disabled={form.type === "FREESHIP"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      value: e.target.value === "" ? 0 : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Max cap (Rs)" htmlFor="coupon-max-cap">
                <input
                  id="coupon-max-cap"
                  name="couponMaxCap"
                  title="Coupon max cap"
                  aria-label="Coupon max cap"
                  type="number"
                  min={0}
                  value={form.maxDiscountCap ?? ""}
                  disabled={form.type !== "PERCENT"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      maxDiscountCap:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Min order (Rs)" htmlFor="coupon-min-order">
                <input
                  id="coupon-min-order"
                  name="couponMinOrder"
                  title="Coupon minimum order"
                  aria-label="Coupon minimum order"
                  type="number"
                  min={0}
                  value={form.minOrder ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      minOrder: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Per user limit" htmlFor="coupon-per-user-limit">
                <input
                  id="coupon-per-user-limit"
                  name="couponPerUserLimit"
                  title="Coupon per user limit"
                  aria-label="Coupon per user limit"
                  type="number"
                  min={1}
                  value={form.maxUsesPerUser ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      maxUsesPerUser:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Global usage limit" htmlFor="coupon-global-limit">
                <input
                  id="coupon-global-limit"
                  name="couponGlobalLimit"
                  title="Coupon global usage limit"
                  aria-label="Coupon global usage limit"
                  type="number"
                  min={1}
                  value={form.globalUsageLimit ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      globalUsageLimit:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Start date" htmlFor="coupon-start-date">
                <input
                  id="coupon-start-date"
                  name="couponStartDate"
                  title="Coupon start date"
                  aria-label="Coupon start date"
                  type="date"
                  value={form.startAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startAt: e.target.value }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="End date" htmlFor="coupon-end-date">
                <input
                  id="coupon-end-date"
                  name="couponEndDate"
                  title="Coupon end date"
                  aria-label="Coupon end date"
                  type="date"
                  value={form.endAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endAt: e.target.value }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Status" htmlFor="coupon-status">
                <select
                  id="coupon-status"
                  name="couponStatus"
                  title="Coupon status"
                  aria-label="Coupon status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      status: e.target.value as CouponStatus,
                    }))
                  }
                  className={inputClass}
                >
                  <option className={optionClass()} value="ACTIVE">
                    Active
                  </option>
                  <option className={optionClass()} value="PAUSED">
                    Paused
                  </option>
                </select>
              </FormField>

              {form.scope === "CATEGORY" ? (
                <div className="sm:col-span-2">
                  <FormField
                    label="Eligible Category IDs"
                    htmlFor="coupon-category-ids"
                  >
                    <input
                      id="coupon-category-ids"
                      name="couponCategoryIds"
                      title="Eligible category IDs"
                      aria-label="Eligible category IDs"
                      value={form.eligibleCategoryIds}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          eligibleCategoryIds: e.target.value,
                        }))
                      }
                      placeholder="Example: 662f..., 663a..."
                      className={inputClass}
                    />
                  </FormField>

                  <p className="mt-2 text-[12px] leading-6 text-[#7f879f]">
                    Enter category IDs separated by commas. You can replace this
                    with a category picker later.
                  </p>
                </div>
              ) : null}

              {form.scope === "PRODUCT" ? (
                <div className="sm:col-span-2">
                  <FormField
                    label="Eligible Product IDs"
                    htmlFor="coupon-product-ids"
                  >
                    <input
                      id="coupon-product-ids"
                      name="couponProductIds"
                      title="Eligible product IDs"
                      aria-label="Eligible product IDs"
                      value={form.eligibleProductIds}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          eligibleProductIds: e.target.value,
                        }))
                      }
                      placeholder="Example: 662f..., 663a..."
                      className={inputClass}
                    />
                  </FormField>

                  <p className="mt-2 text-[12px] leading-6 text-[#7f879f]">
                    Enter product IDs separated by commas. You can replace this
                    with a product picker later.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-[#26293a] px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-[#7f879f]">
                Active, upcoming, expired, and paused status are calculated from
                status plus start/end date.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveCoupon}
                  disabled={saving}
                  className={primaryBtnClass}
                >
                  {saving ? "Saving..." : form.id ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  row,
  deleting,
  onCancel,
  onConfirm,
}: {
  row: CouponRow;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div className="flex min-h-full items-center justify-center py-6">
        <div
          className="w-full max-w-[460px] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-coupon-title"
        >
          <div className="grid h-14 w-14 place-items-center rounded-full border border-red-400/20 bg-red-500/10">
            <Image
              src="/images/admin/coupon.png"
              alt="Delete coupon"
              width={26}
              height={26}
            />
          </div>

          <h3
            id="delete-coupon-title"
            className="mt-4 text-[22px] font-semibold text-white"
          >
            Delete coupon?
          </h3>

          <p className="mt-2 text-[13px] leading-7 text-[#a7aec4]">
            This will permanently delete coupon{" "}
            <span className="font-semibold text-white">{row.code}</span>. This
            action cannot be undone.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className={secondaryBtnClass}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className={dangerBtnClass}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
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

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

function TableSkeleton() {
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/coupon.png"
          alt="Discounts"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">Discounts</div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        {text}
      </p>
    </div>
  );
}