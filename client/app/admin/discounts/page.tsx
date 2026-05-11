"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

import CollectedCouponsTable from "./_components/CollectedCouponsTable";
import CouponModal from "./_components/CouponModal";
import CouponsTable from "./_components/CouponsTable";
import DeleteCouponModal from "./_components/DeleteCouponModal";
import DiscountHeader from "./_components/DiscountHeader";
import { AlertBox, StatCard, Toast } from "./_components/DiscountShared";

import {
  apiFetch,
  API_BASE,
  CollectedRow,
  CouponDateStatus,
  CouponRow,
  CouponStatus,
  CouponType,
  DiscountStats,
  emptyForm,
  FormState,
  getCouponDateStatus,
  idsToText,
  optionClass,
  panelClass,
  safeJson,
  secondaryBtnClass,
  selectClass,
  shellClass,
  textToIds,
  ToastState,
} from "./_components/discountTypes";

export default function AdminDiscountsPage() {
  const [tab, setTab] = useState<"coupons" | "collected">("coupons");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [collected, setCollected] = useState<CollectedRow[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CouponDateStatus>(
    "ALL"
  );
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

  const stats: DiscountStats = useMemo(() => {
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

    return {
      active,
      upcoming,
      expired,
      paused,
      usedTotal,
      total,
    };
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
    if (tab === "collected") {
      loadCollected();
    }
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
          <DiscountHeader
            tab={tab}
            setTab={setTab}
            canCreate={canCreate}
            openCreate={openCreate}
          />

          {error ? (
            <AlertBox
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
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
            <CollectedCouponsTable
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
            <DeleteCouponModal
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