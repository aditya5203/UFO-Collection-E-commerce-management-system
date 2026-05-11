"use client";

import * as React from "react";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

import AdvertisementFormModal from "./_components/AdvertisementFormModal";
import AdvertisementHeader from "./_components/AdvertisementHeader";
import AdvertisementList from "./_components/AdvertisementList";
import AdvertisementPreview from "./_components/AdvertisementPreview";
import AdvertisementStats from "./_components/AdvertisementStats";
import DeleteAdvertisementModal from "./_components/DeleteAdvertisementModal";
import { AlertBox, Toast } from "./_components/AdvertisementShared";

import {
  AdPosition,
  AdRow,
  AdStatus,
  AdType,
  Audience,
  isImageFile,
  isValidClickUrl,
  isVideoFile,
  safeJson,
  shellClass,
  ToastState,
  toISODateInput,
} from "./_components/advertisementTypes";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080/api";

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

function AdvertisementInner() {
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [type, setType] = React.useState<AdType | "All">("All");
  const [status, setStatus] = React.useState<AdStatus | "All">("All");
  const [audience, setAudience] = React.useState<Audience | "All">("All");

  const [ads, setAds] = React.useState<AdRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<AdRow | null>(null);

  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState<ToastState | null>(null);

  const [openForm, setOpenForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const [deleteTarget, setDeleteTarget] = React.useState<AdRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [canCreate, setCanCreate] = React.useState(false);
  const [canEdit, setCanEdit] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);

  const [formId, setFormId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [adType, setAdType] = React.useState<AdType>("Banner");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [formAudience, setFormAudience] =
    React.useState<Audience>("All Customers");
  const [position, setPosition] = React.useState<AdPosition>("Home Top");
  const [priority, setPriority] = React.useState<number>(1);
  const [clickUrl, setClickUrl] = React.useState("");
  const [mediaKind, setMediaKind] = React.useState<"image" | "video">("image");

  const [file, setFile] = React.useState<File | null>(null);
  const [files, setFiles] = React.useState<File[]>([]);

  const isCarouselImages = adType === "Carousel" && mediaKind === "image";
  const isEdit = Boolean(formId);

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  }

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(q.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [q]);

  React.useEffect(() => {
    let mounted = true;

    const loadPermissions = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (mounted) {
            setCanCreate(false);
            setCanEdit(false);
            setCanDelete(false);
          }

          return;
        }

        const json = (await safeJson(res)) as AdminSettingsResponse;
        const role = String(json?.profile?.role || "admin");
        const permissions = normalizeAdminPermissions(
          role,
          json?.profile?.permissions
        );

        if (!mounted) return;

        setCanCreate(hasPermission(role, permissions, "advertisementCreate"));
        setCanEdit(hasPermission(role, permissions, "advertisementEdit"));
        setCanDelete(hasPermission(role, permissions, "advertisementDelete"));
      } catch {
        if (!mounted) return;

        setCanCreate(false);
        setCanEdit(false);
        setCanDelete(false);
      }
    };

    loadPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!openForm && !deleteTarget) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!saving && openForm) setOpenForm(false);
        if (!deleting && deleteTarget) setDeleteTarget(null);
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [openForm, deleteTarget, saving, deleting]);

  const resetForm = React.useCallback(() => {
    setFormId(null);
    setTitle("");
    setAdType("Banner");
    setStartDate("");
    setEndDate("");
    setFormAudience("All Customers");
    setPosition("Home Top");
    setPriority(1);
    setClickUrl("");
    setMediaKind("image");
    setFile(null);
    setFiles([]);
    setFormError("");
  }, []);

  const openCreate = React.useCallback(() => {
    if (!canCreate) {
      setError("You do not have permission to create advertisements.");
      return;
    }

    resetForm();
    setOpenForm(true);
  }, [resetForm, canCreate]);

  const openEdit = React.useCallback(
    (a: AdRow) => {
      if (!canEdit) {
        setError("You do not have permission to edit advertisements.");
        return;
      }

      setFormId(a.id);
      setTitle(a.title || "");
      setAdType(a.type);
      setStartDate(toISODateInput(a.startDate));
      setEndDate(toISODateInput(a.endDate));
      setFormAudience(a.audience);
      setPosition((a.position || "Home Top") as AdPosition);
      setPriority(Number(a.priority ?? 1));
      setClickUrl(a.clickUrl || "");
      setMediaKind(a.mediaKind);
      setFile(null);
      setFiles([]);
      setFormError("");
      setOpenForm(true);
    },
    [canEdit]
  );

  const fetchAds = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (debouncedQ) params.set("q", debouncedQ);
      if (type !== "All") params.set("type", type);
      if (status !== "All") params.set("status", status);
      if (audience !== "All") params.set("audience", audience);

      const query = params.toString();
      const url = query
        ? `${API_BASE}/admin/ads?${query}`
        : `${API_BASE}/admin/ads`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error((json as any)?.message || "Failed to load ads");
      }

      const rawItems = Array.isArray((json as any)?.items)
        ? (json as any).items
        : Array.isArray((json as any)?.data)
          ? (json as any).data
          : Array.isArray((json as any)?.ads)
            ? (json as any).ads
            : [];

      const items: AdRow[] = rawItems
        .map((a: any) => ({
          id: String(a?.id || a?._id || ""),
          title: String(a?.title || ""),
          type: (a?.type || "Banner") as AdType,
          status: (a?.status || "Inactive") as AdStatus,
          startDate: String(a?.startDate || a?.startAt || ""),
          endDate: String(a?.endDate || a?.endAt || ""),
          audience: (a?.audience || "All Customers") as Audience,
          mediaKind: (a?.mediaKind || "image") as "image" | "video",
          mediaUrl: String(a?.mediaUrl || ""),
          mediaUrls: Array.isArray(a?.mediaUrls) ? a.mediaUrls : [],
          clickUrl: a?.clickUrl || "",
          position: a?.position || "Home Top",
          priority: Number(a?.priority ?? 1),
        }))
        .filter((a: AdRow) => Boolean(a.id));

      setAds(items);

      const first = items[0] || null;

      setSelected((prev) => {
        if (!prev) return first;

        const still = items.find((x) => x.id === prev.id);

        return still || first;
      });
    } catch (e: any) {
      console.error(e);
      setAds([]);
      setSelected(null);
      setError(e?.message || "Failed to load advertisements.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, type, status, audience]);

  React.useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const activeCount = React.useMemo(
    () => ads.filter((x) => x.status === "Active").length,
    [ads]
  );

  const scheduledCount = React.useMemo(
    () => ads.filter((x) => x.status === "Scheduled").length,
    [ads]
  );

  const expiredCount = React.useMemo(
    () => ads.filter((x) => x.status === "Expired").length,
    [ads]
  );

  function validateForm() {
    const trimmedTitle = title.trim();
    const trimmedClickUrl = clickUrl.trim();

    if (!trimmedTitle) return "Title is required.";
    if (!startDate) return "Start date is required.";
    if (!endDate) return "End date is required.";

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Invalid start or end date.";
    }

    if (end < start) {
      return "End date cannot be before start date.";
    }

    if (!Number.isFinite(Number(priority)) || Number(priority) < 1) {
      return "Priority must be at least 1.";
    }

    if (!isValidClickUrl(trimmedClickUrl)) {
      return "Click URL must be a relative path like /collection or a valid http/https URL.";
    }

    if (!isEdit) {
      if (isCarouselImages) {
        const selectedFiles = files.length ? files : file ? [file] : [];

        if (!selectedFiles.length) {
          return "Please select at least one image for carousel advertisement.";
        }

        if (!selectedFiles.every(isImageFile)) {
          return "Carousel media must contain image files only.";
        }
      } else {
        if (!file) return "Please select a media file.";

        if (mediaKind === "image" && !isImageFile(file)) {
          return "Please select an image file.";
        }

        if (mediaKind === "video" && !isVideoFile(file)) {
          return "Please select a video file.";
        }
      }
    }

    if (isEdit) {
      if (isCarouselImages && files.length && !files.every(isImageFile)) {
        return "Carousel media must contain image files only.";
      }

      if (!isCarouselImages && file) {
        if (mediaKind === "image" && !isImageFile(file)) {
          return "Please select an image file.";
        }

        if (mediaKind === "video" && !isVideoFile(file)) {
          return "Please select a video file.";
        }
      }
    }

    return "";
  }

  async function onSave() {
    if (!(formId ? canEdit : canCreate)) {
      setFormError("You do not have permission to save advertisements.");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("type", adType);
      fd.append("startDate", startDate);
      fd.append("endDate", endDate);
      fd.append("audience", formAudience);
      fd.append("position", position);
      fd.append("priority", String(Number(priority) || 1));
      fd.append("clickUrl", clickUrl.trim());
      fd.append("mediaKind", mediaKind);

      if (isCarouselImages) {
        const list = files.length ? files : file ? [file] : [];

        for (const f of list) {
          fd.append("files", f);
        }
      } else if (file) {
        fd.append("file", file);
      }

      const url = isEdit
        ? `${API_BASE}/admin/ads/${formId}`
        : `${API_BASE}/admin/ads`;

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
        credentials: "include",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error((json as any)?.message || "Save failed");
      }

      setOpenForm(false);
      resetForm();
      await fetchAds();

      showToast({
        type: "success",
        message: isEdit
          ? "Advertisement updated successfully."
          : "Advertisement created successfully.",
      });
    } catch (e: any) {
      console.error(e);
      setFormError(e?.message || "Failed to save advertisement.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(ad: AdRow) {
    if (!canEdit) {
      setError("You do not have permission to update advertisements.");
      return;
    }

    try {
      const makeActive = ad.status !== "Active";

      const res = await fetch(`${API_BASE}/admin/ads/${ad.id}/toggle`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: makeActive }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error((json as any)?.message || "Toggle failed");
      }

      await fetchAds();

      showToast({
        type: "success",
        message: makeActive
          ? "Advertisement activated successfully."
          : "Advertisement deactivated successfully.",
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Toggle failed.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    if (!canDelete) {
      setError("You do not have permission to delete advertisements.");
      return;
    }

    try {
      setDeleting(true);

      const res = await fetch(`${API_BASE}/admin/ads/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error((json as any)?.message || "Delete failed");
      }

      setDeleteTarget(null);
      await fetchAds();

      showToast({
        type: "success",
        message: "Advertisement deleted successfully.",
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}

      <div className="space-y-6">
        <AdvertisementHeader
          q={q}
          setQ={setQ}
          type={type}
          setType={setType}
          status={status}
          setStatus={setStatus}
          audience={audience}
          setAudience={setAudience}
          canCreate={canCreate}
          openCreate={openCreate}
        />

        {error ? (
          <AlertBox type="error" message={error} onClose={() => setError("")} />
        ) : null}

        <AdvertisementStats
          totalCount={ads.length}
          activeCount={activeCount}
          scheduledCount={scheduledCount}
          expiredCount={expiredCount}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
          <AdvertisementList
            ads={ads}
            loading={loading}
            selected={selected}
            canEdit={canEdit}
            canDelete={canDelete}
            onSelect={setSelected}
            onEdit={openEdit}
            onToggle={onToggle}
            onDelete={setDeleteTarget}
          />

          <AdvertisementPreview
            selected={selected}
            canEdit={canEdit}
            onEdit={openEdit}
          />
        </div>

        {openForm ? (
          <AdvertisementFormModal
            isEdit={isEdit}
            saving={saving}
            formError={formError}
            setFormError={setFormError}
            onClose={() => {
              if (!saving) setOpenForm(false);
            }}
            onSave={onSave}
            title={title}
            setTitle={setTitle}
            adType={adType}
            setAdType={setAdType}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            formAudience={formAudience}
            setFormAudience={setFormAudience}
            position={position}
            setPosition={setPosition}
            priority={priority}
            setPriority={setPriority}
            clickUrl={clickUrl}
            setClickUrl={setClickUrl}
            mediaKind={mediaKind}
            setMediaKind={setMediaKind}
            file={file}
            setFile={setFile}
            files={files}
            setFiles={setFiles}
            isCarouselImages={isCarouselImages}
          />
        ) : null}

        {deleteTarget ? (
          <DeleteAdvertisementModal
            target={deleteTarget}
            deleting={deleting}
            onCancel={() => {
              if (!deleting) setDeleteTarget(null);
            }}
            onConfirm={confirmDelete}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function AdminAdvertisementPage() {
  return (
    <AdminPageGuard permission="advertisementView">
      <AdvertisementInner />
    </AdminPageGuard>
  );
}