// client/app/admin/advertisement/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

type AdType = "Banner" | "Carousel" | "Pop-up" | "Video";
type AdStatus = "Active" | "Inactive" | "Scheduled" | "Expired";
type Audience = "All Customers" | "New Customers" | "Returning Customers";
type AdPosition =
  | "Home Top"
  | "Home Mid"
  | "Home Bottom"
  | "Category Top"
  | "Product Page";

type AdRow = {
  id: string;
  title: string;
  type: AdType;
  status: AdStatus;
  startDate: string;
  endDate: string;
  audience: Audience;
  mediaKind: "image" | "video";
  mediaUrl: string;
  mediaUrls?: string[];
  clickUrl?: string;
  position?: AdPosition;
  priority?: number;
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080/api";

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

const totalIcon = "/images/admin/advertisement.png";
const activeIcon = "/images/admin/active.png";
const scheduledIcon = "/images/admin/clock.png";
const expiredIcon = "/images/admin/pending.png";

function statusTone(s: AdStatus) {
  if (s === "Active") {
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  }

  if (s === "Inactive") {
    return "border-slate-400/20 bg-white/5 text-slate-300";
  }

  if (s === "Scheduled") {
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  }

  return "border-red-400/20 bg-red-500/15 text-red-300";
}

function optionClass() {
  return "bg-[#11121a] text-white";
}

function fmtDate(s?: string | null) {
  if (!s) return "-";

  const d = new Date(s);

  if (Number.isNaN(d.getTime())) return String(s || "-");

  return d.toISOString().slice(0, 10);
}

function isRemote(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function toISODateInput(v: any) {
  const d = new Date(v);

  if (Number.isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
}

function firstMedia(ad: AdRow) {
  const arr = Array.isArray(ad.mediaUrls) ? ad.mediaUrls.filter(Boolean) : [];

  if (arr.length) return arr[0];

  return ad.mediaUrl || "/images/products/placeholder.png";
}

function isValidClickUrl(value: string) {
  const v = value.trim();

  if (!v) return true;

  if (v.startsWith("/")) return true;

  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function SmartMedia({ ad }: { ad: AdRow }) {
  const src = firstMedia(ad);

  if (ad.mediaKind === "video") {
    return (
      <video
        className="h-full w-full object-cover"
        src={src}
        controls
        preload="metadata"
      />
    );
  }

  if (isRemote(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={ad.title} className="h-full w-full object-cover" />;
  }

  return (
    <Image
      src={src}
      alt={ad.title}
      fill
      sizes="480px"
      className="object-cover"
    />
  );
}

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

  const filtered = ads;

  return (
    <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}

      <div className="space-y-6">
        <section
          className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Admin / Advertisement
              </div>

              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                Advertisement
              </h1>

              <p className="mt-2 max-w-[760px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                Manage homepage banners, carousel ads, pop-ups, videos,
                placement priority, audience targeting, and Cloudinary media
                uploads.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {canCreate ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className={primaryBtnClass}
                >
                  Create Ad
                </button>
              ) : null}

              <Link
                href="/admin/advertisement/history"
                className={secondaryBtnClass}
              >
                View History
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(3,180px)]">
            <div className="flex h-[48px] items-center rounded-full border border-white/10 bg-white/5 px-4">
              <label htmlFor="ad-search" className="sr-only">
                Search advertisements
              </label>

              <input
                id="ad-search"
                name="adSearch"
                title="Search advertisements"
                aria-label="Search advertisements"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by ad name..."
                className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
              />

              {q ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="ml-2 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-[12px] font-bold text-white transition hover:bg-white/10"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <Select
              label="Filter by advertisement type"
              value={type}
              onChange={(v) => setType(v as AdType | "All")}
            >
              <option value="All" className={optionClass()}>
                All Types
              </option>
              <option value="Banner" className={optionClass()}>
                Banner
              </option>
              <option value="Carousel" className={optionClass()}>
                Carousel
              </option>
              <option value="Pop-up" className={optionClass()}>
                Pop-up
              </option>
              <option value="Video" className={optionClass()}>
                Video
              </option>
            </Select>

            <Select
              label="Filter by advertisement status"
              value={status}
              onChange={(v) => setStatus(v as AdStatus | "All")}
            >
              <option value="All" className={optionClass()}>
                All Status
              </option>
              <option value="Active" className={optionClass()}>
                Active
              </option>
              <option value="Inactive" className={optionClass()}>
                Inactive
              </option>
              <option value="Scheduled" className={optionClass()}>
                Scheduled
              </option>
              <option value="Expired" className={optionClass()}>
                Expired
              </option>
            </Select>

            <Select
              label="Filter by advertisement audience"
              value={audience}
              onChange={(v) => setAudience(v as Audience | "All")}
            >
              <option value="All" className={optionClass()}>
                All Audience
              </option>
              <option value="All Customers" className={optionClass()}>
                All Customers
              </option>
              <option value="New Customers" className={optionClass()}>
                New Customers
              </option>
              <option value="Returning Customers" className={optionClass()}>
                Returning Customers
              </option>
            </Select>
          </div>
        </section>

        {error ? (
          <AlertBox type="error" message={error} onClose={() => setError("")} />
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Ads"
            value={String(ads.length)}
            hint="Current result count"
            iconSrc={totalIcon}
          />

          <StatCard
            label="Active Ads"
            value={String(activeCount)}
            hint="Visible to customers"
            iconSrc={activeIcon}
          />

          <StatCard
            label="Scheduled"
            value={String(scheduledCount)}
            hint="Upcoming campaigns"
            iconSrc={scheduledIcon}
          />

          <StatCard
            label="Expired"
            value={String(expiredCount)}
            hint="Ended campaigns"
            iconSrc={expiredIcon}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Campaign List
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Advertisements
                </h2>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Click any row to preview and manage the campaign.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
                {loading ? "Loading..." : `${filtered.length} showing`}
              </div>
            </div>

            {loading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full min-w-[980px] border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                        <th className="px-5 py-4 font-medium">Ad Title</th>
                        <th className="px-5 py-4 font-medium">Type</th>
                        <th className="px-5 py-4 font-medium">Status</th>
                        <th className="px-5 py-4 font-medium">Start</th>
                        <th className="px-5 py-4 font-medium">End</th>
                        <th className="px-5 py-4 font-medium">Audience</th>
                        <th className="px-5 py-4 text-right font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((a) => {
                        const isSel = selected?.id === a.id;

                        return (
                          <tr
                            key={a.id}
                            onClick={() => setSelected(a)}
                            className={[
                              "cursor-pointer border-t border-[#26293a] transition",
                              isSel
                                ? "bg-white/[0.06]"
                                : "hover:bg-white/[0.03]",
                            ].join(" ")}
                          >
                            <td className="px-5 py-4">
                              <div className="font-semibold text-white">
                                {a.title}
                              </div>

                              <div className="mt-1 text-[12px] text-[#7f879f]">
                                {a.position || "No placement"} • Priority{" "}
                                {a.priority ?? "-"}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-[#a7aec4]">
                              {a.type}
                            </td>

                            <td className="px-5 py-4">
                              <StatusPill status={a.status} />
                            </td>

                            <td className="px-5 py-4 text-[#a7aec4]">
                              {fmtDate(a.startDate)}
                            </td>

                            <td className="px-5 py-4 text-[#a7aec4]">
                              {fmtDate(a.endDate)}
                            </td>

                            <td className="px-5 py-4 text-[#a7aec4]">
                              {a.audience}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                {canEdit ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEdit(a);
                                      }}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggle(a);
                                      }}
                                      className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold text-blue-200 transition hover:bg-blue-500/15"
                                    >
                                      {a.status === "Active"
                                        ? "Deactivate"
                                        : "Activate"}
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[12px] text-[#7f879f]">
                                    View only
                                  </span>
                                )}

                                {canDelete ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget(a);
                                    }}
                                    className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/15"
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

                <div className="grid gap-4 p-5 xl:hidden">
                  {filtered.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className={[
                        "rounded-[22px] border bg-[#161824] p-5 transition",
                        selected?.id === a.id
                          ? "border-[#d6c7ff]/35"
                          : "border-[#26293a]",
                      ].join(" ")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[18px] font-semibold text-white">
                            {a.title}
                          </h3>

                          <p className="mt-1 text-[12px] text-[#7f879f]">
                            {a.position || "No placement"} • Priority{" "}
                            {a.priority ?? "-"}
                          </p>
                        </div>

                        <StatusPill status={a.status} />
                      </div>

                      <div className="mt-4 grid gap-2 text-[13px] text-[#a7aec4]">
                        <div>
                          Type: <span className="text-[#d6dbeb]">{a.type}</span>
                        </div>

                        <div>
                          Audience:{" "}
                          <span className="text-[#d6dbeb]">{a.audience}</span>
                        </div>

                        <div>
                          Dates:{" "}
                          <span className="text-[#d6dbeb]">
                            {fmtDate(a.startDate)} → {fmtDate(a.endDate)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {canEdit ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(a);
                              }}
                              className={secondaryBtnClass}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggle(a);
                              }}
                              className={secondaryBtnClass}
                            >
                              {a.status === "Active" ? "Deactivate" : "Activate"}
                            </button>
                          </>
                        ) : null}

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(a);
                            }}
                            className={dangerBtnClass}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className={`${panelClass} overflow-hidden`}>
            <div className="border-b border-[#26293a] px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                Preview
              </div>

              <h2 className="mt-1 text-[20px] font-semibold text-white">
                Campaign Preview
              </h2>

              <p className="mt-1 text-[13px] text-[#a7aec4]">
                See the selected advertisement media and details.
              </p>
            </div>

            <div className="p-5">
              {!selected ? (
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-8 text-center text-[13px] text-[#a7aec4]">
                  Select an advertisement to preview.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[18px] font-semibold text-white">
                        {selected.title}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <MiniChip>{selected.type}</MiniChip>
                        <StatusPill status={selected.status} />
                        <MiniChip>{selected.audience}</MiniChip>
                      </div>
                    </div>

                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => openEdit(selected)}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-[#0d0f17] p-3">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] border border-white/10 bg-black/30">
                      <SmartMedia ad={selected} />
                    </div>

                    {selected.type === "Carousel" &&
                    selected.mediaKind === "image" ? (
                      <div className="mt-3 text-[12px] text-[#a7aec4]">
                        Slides:{" "}
                        <span className="font-semibold text-white">
                          {Array.isArray(selected.mediaUrls) &&
                          selected.mediaUrls.length
                            ? selected.mediaUrls.length
                            : selected.mediaUrl
                            ? 1
                            : 0}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoCard
                      label="Start → End"
                      value={`${fmtDate(selected.startDate)} → ${fmtDate(
                        selected.endDate
                      )}`}
                    />

                    <InfoCard
                      label="Placement"
                      value={selected.position ?? "-"}
                    />

                    <InfoCard
                      label="Priority"
                      value={selected.priority ?? "-"}
                    />

                    <InfoCard
                      label="Click URL"
                      value={selected.clickUrl ?? "-"}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {openForm ? (
          <AdFormModal
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
          <DeleteConfirmModal
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

function AdFormModal({
  isEdit,
  saving,
  formError,
  setFormError,
  onClose,
  onSave,
  title,
  setTitle,
  adType,
  setAdType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  formAudience,
  setFormAudience,
  position,
  setPosition,
  priority,
  setPriority,
  clickUrl,
  setClickUrl,
  mediaKind,
  setMediaKind,
  file,
  setFile,
  files,
  setFiles,
  isCarouselImages,
}: {
  isEdit: boolean;
  saving: boolean;
  formError: string;
  setFormError: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  title: string;
  setTitle: (value: string) => void;
  adType: AdType;
  setAdType: (value: AdType) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  formAudience: Audience;
  setFormAudience: (value: Audience) => void;
  position: AdPosition;
  setPosition: (value: AdPosition) => void;
  priority: number;
  setPriority: (value: number) => void;
  clickUrl: string;
  setClickUrl: (value: string) => void;
  mediaKind: "image" | "video";
  setMediaKind: (value: "image" | "video") => void;
  file: File | null;
  setFile: (value: File | null) => void;
  files: File[];
  setFiles: (value: File[]) => void;
  isCarouselImages: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#26293a] px-5 py-4">
          <div>
            <div id="ad-modal-title" className="text-[18px] font-semibold text-white">
              {isEdit ? "Edit Advertisement" : "Create Advertisement"}
            </div>

            <div className="mt-1 text-[13px] text-[#a7aec4]">
              Connected to API + Cloudinary upload.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {formError ? (
            <AlertBox
              type="error"
              message={formError}
              onClose={() => setFormError("")}
            />
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Ad Title" htmlFor="ad-title">
              <input
                id="ad-title"
                name="adTitle"
                title="Ad Title"
                aria-label="Ad Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dashain Offer"
                className={inputClassName()}
              />
            </Field>

            <Field label="Type" htmlFor="ad-type">
              <select
                id="ad-type"
                name="adType"
                title="Advertisement type"
                aria-label="Advertisement type"
                value={adType}
                onChange={(e) => setAdType(e.target.value as AdType)}
                className={inputClassName()}
              >
                <option className={optionClass()}>Banner</option>
                <option className={optionClass()}>Carousel</option>
                <option className={optionClass()}>Pop-up</option>
                <option className={optionClass()}>Video</option>
              </select>
            </Field>

            <Field label="Start Date" htmlFor="ad-start-date">
              <input
                id="ad-start-date"
                name="adStartDate"
                title="Advertisement start date"
                aria-label="Advertisement start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClassName()}
              />
            </Field>

            <Field label="End Date" htmlFor="ad-end-date">
              <input
                id="ad-end-date"
                name="adEndDate"
                title="Advertisement end date"
                aria-label="Advertisement end date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClassName()}
              />
            </Field>

            <Field label="Audience" htmlFor="ad-audience">
              <select
                id="ad-audience"
                name="adAudience"
                title="Advertisement audience"
                aria-label="Advertisement audience"
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value as Audience)}
                className={inputClassName()}
              >
                <option className={optionClass()}>All Customers</option>
                <option className={optionClass()}>New Customers</option>
                <option className={optionClass()}>Returning Customers</option>
              </select>
            </Field>

            <Field label="Placement" htmlFor="ad-placement">
              <select
                id="ad-placement"
                name="adPlacement"
                title="Advertisement placement"
                aria-label="Advertisement placement"
                value={position}
                onChange={(e) => setPosition(e.target.value as AdPosition)}
                className={inputClassName()}
              >
                <option className={optionClass()}>Home Top</option>
                <option className={optionClass()}>Home Mid</option>
                <option className={optionClass()}>Home Bottom</option>
                <option className={optionClass()}>Category Top</option>
                <option className={optionClass()}>Product Page</option>
              </select>
            </Field>

            <Field label="Priority" htmlFor="ad-priority">
              <input
                id="ad-priority"
                name="adPriority"
                title="Advertisement priority"
                aria-label="Advertisement priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                min={1}
                className={inputClassName()}
              />
            </Field>

            <Field label="Click URL" htmlFor="ad-click-url">
              <input
                id="ad-click-url"
                name="adClickUrl"
                title="Advertisement click URL"
                aria-label="Advertisement click URL"
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                placeholder="/collection or https://..."
                className={inputClassName()}
              />
            </Field>

            <div className="md:col-span-2">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                  Upload Media
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Media Kind" htmlFor="ad-media-kind">
                    <select
                      id="ad-media-kind"
                      name="adMediaKind"
                      title="Advertisement media kind"
                      aria-label="Advertisement media kind"
                      value={mediaKind}
                      onChange={(e) =>
                        setMediaKind(e.target.value as "image" | "video")
                      }
                      className={inputClassName()}
                    >
                      <option value="image" className={optionClass()}>
                        image
                      </option>
                      <option value="video" className={optionClass()}>
                        video
                      </option>
                    </select>

                    {adType === "Carousel" && mediaKind === "video" ? (
                      <div className="mt-2 text-[12px] text-amber-300">
                        Carousel + video is not recommended. Use Type=Video for
                        video ads.
                      </div>
                    ) : null}
                  </Field>

                  <Field
                    label={
                      isCarouselImages
                        ? "Choose Images (Multiple)"
                        : "Choose File"
                    }
                    htmlFor="ad-media-upload"
                  >
                    <input
                      id="ad-media-upload"
                      name="adMediaUpload"
                      title="Upload advertisement media"
                      aria-label="Upload advertisement media"
                      type="file"
                      accept={isCarouselImages ? "image/*" : "image/*,video/*"}
                      multiple={isCarouselImages}
                      onChange={(e) => {
                        const list = Array.from(e.target.files || []);

                        if (isCarouselImages) {
                          setFiles(list);
                          setFile(null);
                        } else {
                          setFile(list[0] ?? null);
                          setFiles([]);
                        }
                      }}
                      className="block w-full text-[12px] text-[#a7aec4] file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-[12px] file:font-semibold file:text-[#090a12] hover:file:bg-white/90"
                    />

                    <div className="mt-2 text-[12px] text-[#7f879f]">
                      {isEdit
                        ? "Optional: upload new file(s) to replace existing media."
                        : isCarouselImages
                        ? "Required: upload 1+ images for Carousel."
                        : "Required: upload image/video before saving."}
                    </div>

                    {isCarouselImages && files.length ? (
                      <div className="mt-2 text-[12px] text-[#a7aec4]">
                        Selected:{" "}
                        <span className="font-semibold text-white">
                          {files.length}
                        </span>{" "}
                        images
                      </div>
                    ) : null}

                    {!isCarouselImages && file ? (
                      <div className="mt-2 text-[12px] text-[#a7aec4]">
                        Selected:{" "}
                        <span className="font-semibold text-white">
                          {file.name}
                        </span>
                      </div>
                    ) : null}
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className={secondaryBtnClass}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={primaryBtnClass}
          >
            {saving ? "Saving..." : "Save Advertisement"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  target,
  deleting,
  onCancel,
  onConfirm,
}: {
  target: AdRow;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[460px] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-ad-title"
      >
        <div id="delete-ad-title" className="text-[20px] font-semibold text-white">
          Delete advertisement?
        </div>

        <p className="mt-2 text-[13px] leading-7 text-[#a7aec4]">
          This will permanently delete{" "}
          <span className="font-semibold text-white">{target.title}</span>. This
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
  );
}

function Select({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  const id = React.useId();

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <select
        id={id}
        name={id}
        title={label}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[48px] rounded-full border border-white/10 bg-white/5 px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff]"
      >
        {children}
      </select>
    </div>
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
        "mb-4 flex items-start justify-between gap-3 rounded-[20px] border px-5 py-4 text-[13px]",
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

function StatusPill({ status }: { status: AdStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        statusTone(status),
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function MiniChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
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

          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={24} height={24} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
        {label}
      </div>

      <div className="mt-2 truncate text-[13px] font-medium text-white">
        {value}
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
    <div className="block rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function inputClassName() {
  return "h-[44px] w-full rounded-full border border-white/10 bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]";
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

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image src={totalIcon} alt="Advertisements" width={28} height={28} />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No advertisements found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Advertisements will appear here when you create campaigns or when your
        filters match existing ads.
      </p>
    </div>
  );
}