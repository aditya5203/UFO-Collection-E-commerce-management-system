// app/admin/advertisement/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

type AdType = "Banner" | "Carousel" | "Pop-up" | "Video";
type AdStatus = "Active" | "Inactive" | "Scheduled" | "Expired";
type Audience = "All Customers" | "New Customers" | "Returning Customers";
type AdPosition = "Home Top" | "Home Mid" | "Home Bottom" | "Category Top" | "Product Page";

type AdRow = {
  id: string;
  title: string;
  type: AdType;
  status: AdStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  audience: Audience;
  mediaKind: "image" | "video";

  // ✅ Backward compatible single
  mediaUrl: string;

  // ✅ NEW: for Carousel images
  mediaUrls?: string[];

  clickUrl?: string;
  position?: AdPosition;
  priority?: number;
};

function statusPill(s: AdStatus) {
  if (s === "Active") return "bg-[#153225] text-[#b7f7d0] border-[#1f4b34]";
  if (s === "Inactive") return "bg-[#1d2a3b] text-[#cfe6ff] border-[#2b3a52]";
  if (s === "Scheduled") return "bg-[#2a2a1d] text-[#fff4c2] border-[#3a3a2b]";
  return "bg-[#2a2020] text-[#ffd1d1] border-[#3a2b2b]";
}

function fmtDate(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
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

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/+$/, "");

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/** Small helper for preview: get carousel first image */
function firstMedia(ad: AdRow) {
  const arr = Array.isArray(ad.mediaUrls) ? ad.mediaUrls.filter(Boolean) : [];
  if (arr.length) return arr[0];
  return ad.mediaUrl || "/images/placeholder.png";
}

function SmartMedia({ ad }: { ad: AdRow }) {
  const src = firstMedia(ad);

  if (ad.mediaKind === "video") {
    return <video className="h-full w-full object-cover" src={src} controls />;
  }

  if (isRemote(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={ad.title} className="h-full w-full object-cover" />;
  }

  return <Image src={src} alt={ad.title} fill className="object-cover" />;
}

export default function AdminAdvertisementPage() {
  // filters
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<AdType | "All">("All");
  const [status, setStatus] = React.useState<AdStatus | "All">("All");
  const [audience, setAudience] = React.useState<Audience | "All">("All");

  // data
  const [ads, setAds] = React.useState<AdRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<AdRow | null>(null);

  // modal + form
  const [openForm, setOpenForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // form state
  const [formId, setFormId] = React.useState<string | null>(null); // null => create, string => edit
  const [title, setTitle] = React.useState("");
  const [adType, setAdType] = React.useState<AdType>("Banner");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [formAudience, setFormAudience] = React.useState<Audience>("All Customers");
  const [position, setPosition] = React.useState<AdPosition>("Home Top");
  const [priority, setPriority] = React.useState<number>(1);
  const [clickUrl, setClickUrl] = React.useState("");
  const [mediaKind, setMediaKind] = React.useState<"image" | "video">("image");

  // ✅ single file (banner / video etc.)
  const [file, setFile] = React.useState<File | null>(null);

  // ✅ multi files (carousel images)
  const [files, setFiles] = React.useState<File[]>([]);

  const isCarouselImages = adType === "Carousel" && mediaKind === "image";

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
  }, []);

  const openCreate = React.useCallback(() => {
    resetForm();
    setOpenForm(true);
  }, [resetForm]);

  const openEdit = React.useCallback((a: AdRow) => {
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

    // ✅ on edit: do not auto-load files; user can optionally upload to replace
    setFile(null);
    setFiles([]);
    setOpenForm(true);
  }, []);

  async function fetchAds() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (type !== "All") params.set("type", type);
      if (status !== "All") params.set("status", status);
      if (audience !== "All") params.set("audience", audience);

      const res = await fetch(`${API_BASE}/admin/ads?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || "Failed to load ads");

      const items: AdRow[] = json?.items || [];
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
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, status, audience]);

  const activeCount = React.useMemo(() => ads.filter((x) => x.status === "Active").length, [ads]);
  const scheduledCount = React.useMemo(() => ads.filter((x) => x.status === "Scheduled").length, [ads]);

  async function onSave() {
    try {
      setSaving(true);

      if (!title.trim()) return alert("Title is required");
      if (!startDate) return alert("Start date is required");
      if (!endDate) return alert("End date is required");

      // ✅ create requires media
      if (!formId) {
        if (isCarouselImages) {
          if (!files.length && !file) return alert("Please select 1+ images for Carousel");
        } else {
          if (!file) return alert("Please select image/video file");
        }
      }

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("type", adType);
      fd.append("startDate", startDate);
      fd.append("endDate", endDate);
      fd.append("audience", formAudience);
      fd.append("position", position);
      fd.append("priority", String(priority || 999));
      fd.append("clickUrl", clickUrl || "");
      fd.append("mediaKind", mediaKind);

      // ✅ if Carousel images -> send multiple via "files"
      if (isCarouselImages) {
        // allow either multiple or single fallback
        const list = files.length ? files : file ? [file] : [];
        for (const f of list) fd.append("files", f);
      } else {
        // single media
        if (file) fd.append("file", file);
      }

      const isEdit = Boolean(formId);
      const url = isEdit ? `${API_BASE}/admin/ads/${formId}` : `${API_BASE}/admin/ads`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
        credentials: "include",
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || "Save failed");

      setOpenForm(false);
      resetForm();
      await fetchAds();
      alert(isEdit ? "Advertisement updated ✅" : "Advertisement created ✅");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(ad: AdRow) {
    try {
      const makeActive = ad.status !== "Active";

      const res = await fetch(`${API_BASE}/admin/ads/${ad.id}/toggle`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: makeActive }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || "Toggle failed");

      await fetchAds();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Toggle failed");
    }
  }

  async function onDelete(ad: AdRow) {
    if (!confirm(`Delete "${ad.title}" ?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/ads/${ad.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      await fetchAds();
      alert("Deleted ✅");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Delete failed");
    }
  }

  const filtered = ads;

  return (
    <div className="min-h-screen bg-[#0e1620] text-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Advertisement</h1>
            <p className="mt-1 text-sm text-white/60">Connected to API + Cloudinary upload.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={openCreate}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0e1620] shadow-sm hover:bg-white/90"
            >
              + Create Advertisement
            </button>

            <Link
              href="/admin/advertisement/history"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              View History
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Active Ads</div>
            <div className="mt-2 text-2xl font-semibold">{activeCount}</div>
            <div className="mt-1 text-xs text-white/50">Currently visible to customers</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Scheduled</div>
            <div className="mt-2 text-2xl font-semibold">{scheduledCount}</div>
            <div className="mt-1 text-xs text-white/50">Will go live on start date</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Quick Tips</div>
            <div className="mt-2 text-sm text-white/70">
              Use <span className="text-white">priority</span> to decide which banner appears first.
              Add a <span className="text-white">click URL</span> to send users to collection pages.
              For <span className="text-white">Carousel</span>, upload 2–6 images.
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-[#111c28] px-3 py-2">
              <span className="text-white/50">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by ad name"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[560px]">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#111c28] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="All">All Types</option>
                <option value="Banner">Banner</option>
                <option value="Carousel">Carousel</option>
                <option value="Pop-up">Pop-up</option>
                <option value="Video">Video</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#111c28] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Expired">Expired</option>
              </select>

              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#111c28] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="All">All Audience</option>
                <option value="All Customers">All Customers</option>
                <option value="New Customers">New Customers</option>
                <option value="Returning Customers">Returning Customers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Table */}
          <div className="rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Advertisements</div>
                <div className="text-xs text-white/50">Click any row to preview & manage.</div>
              </div>
              <div className="text-xs text-white/50">
                Showing <span className="text-white">{filtered.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="text-xs text-white/60">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3">Ad Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Audience</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-white/80">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-white/60">
                        Loading…
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => {
                      const isSel = selected?.id === a.id;
                      return (
                        <tr
                          key={a.id}
                          onClick={() => setSelected(a)}
                          className={`cursor-pointer border-b border-white/10 transition ${
                            isSel ? "bg-white/10" : "hover:bg-white/5"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-white">{a.title}</td>
                          <td className="px-4 py-3 text-white/70">{a.type}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${statusPill(
                                a.status
                              )}`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/70">{fmtDate(a.startDate)}</td>
                          <td className="px-4 py-3 text-white/70">{fmtDate(a.endDate)}</td>
                          <td className="px-4 py-3 text-white/70">{a.audience}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(a);
                                }}
                                className="text-xs font-semibold text-white hover:underline"
                              >
                                Edit
                              </button>
                              <span className="text-white/30">|</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggle(a);
                                }}
                                className="text-xs font-semibold text-white/70 hover:text-white hover:underline"
                              >
                                {a.status === "Active" ? "Deactivate" : "Activate"}
                              </button>
                              <span className="text-white/30">|</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(a);
                                }}
                                className="text-xs font-semibold text-red-200 hover:text-red-100 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td className="px-4 py-10 text-center text-white/60" colSpan={7}>
                        No advertisements found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="text-sm font-semibold">Preview</div>
              <div className="text-xs text-white/50">See how it will look on the site.</div>
            </div>

            <div className="p-4">
              {!selected ? (
                <div className="rounded-xl border border-white/10 bg-[#111c28] p-6 text-center text-sm text-white/60">
                  Select an advertisement to preview.
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{selected.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                          {selected.type}
                        </span>
                        <span
                          className={`rounded-lg border px-2 py-1 font-semibold ${statusPill(
                            selected.status
                          )}`}
                        >
                          {selected.status}
                        </span>
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                          {selected.audience}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openEdit(selected)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-[#111c28] p-3">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      <SmartMedia ad={selected} />
                    </div>

                    {/* ✅ show carousel count */}
                    {selected.type === "Carousel" && selected.mediaKind === "image" ? (
                      <div className="mt-2 text-xs text-white/60">
                        Slides:{" "}
                        <span className="text-white">
                          {Array.isArray(selected.mediaUrls) && selected.mediaUrls.length
                            ? selected.mediaUrls.length
                            : selected.mediaUrl
                            ? 1
                            : 0}
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/70">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-white/50">Start → End</div>
                        <div className="mt-1 text-white">
                          {fmtDate(selected.startDate)} → {fmtDate(selected.endDate)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-white/50">Placement</div>
                        <div className="mt-1 text-white">{selected.position ?? "-"}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-white/50">Priority</div>
                        <div className="mt-1 text-white">{selected.priority ?? "-"}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-white/50">Click URL</div>
                        <div className="mt-1 truncate text-white">{selected.clickUrl ?? "-"}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {openForm && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={() => setOpenForm(false)}
          >
            <div
              className="w-full max-w-[720px] rounded-2xl border border-white/10 bg-[#0e1620] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">
                    {formId ? "Edit Advertisement" : "Create Advertisement"}
                  </div>
                  <div className="text-xs text-white/50">Connected to API + Cloudinary upload.</div>
                </div>
                <button
                  onClick={() => setOpenForm(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">Ad Title</div>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Dashain Offer"
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#111c28] px-3 py-2 text-sm outline-none placeholder:text-white/30"
                    />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">Type</div>
                    <select
                      value={adType}
                      onChange={(e) => setAdType(e.target.value as any)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#111c28] px-3 py-2 text-sm outline-none"
                    >
                      <option>Banner</option>
                      <option>Carousel</option>
                      <option>Pop-up</option>
                      <option>Video</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">Start Date</div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#111c28] px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">End Date</div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#111c28] px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">Audience</div>
                    <select
                      value={formAudience}
                      onChange={(e) => setFormAudience(e.target.value as any)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#111c28] px-3 py-2 text-sm outline-none"
                    >
                      <option>All Customers</option>
                      <option>New Customers</option>
                      <option>Returning Customers</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">Placement</div>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value as any)}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#111c28] px-3 py-2 text-sm outline-none"
                    >
                      <option>Home Top</option>
                      <option>Home Mid</option>
                      <option>Home Bottom</option>
                      <option>Category Top</option>
                      <option>Product Page</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">Priority</div>
                    <input
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      min={1}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#111c28] px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">Click URL</div>
                    <input
                      value={clickUrl}
                      onChange={(e) => setClickUrl(e.target.value)}
                      placeholder="/collection or https://..."
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#111c28] px-3 py-2 text-sm outline-none placeholder:text-white/30"
                    />
                  </div>

                  <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">Upload Media (Image/Video)</div>

                    <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-[#111c28] p-3">
                        <div className="text-xs text-white/50">Media Kind</div>
                        <select
                          value={mediaKind}
                          onChange={(e) => setMediaKind(e.target.value as any)}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-[#0e1620] px-3 py-2 text-sm outline-none"
                        >
                          <option value="image">image</option>
                          <option value="video">video</option>
                        </select>
                        <div className="mt-2 text-xs text-white/40">
                          If you choose video, upload mp4 (recommended).
                        </div>
                        {adType === "Carousel" && mediaKind === "video" ? (
                          <div className="mt-2 text-xs text-yellow-200/80">
                            Carousel + video is not recommended. Use Type=Video for video ads.
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-lg border border-white/10 bg-[#111c28] p-3">
                        <div className="text-xs text-white/50">
                          {isCarouselImages ? "Choose Images (Multiple)" : "Choose File"}
                        </div>

                        <input
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
                          className="mt-2 block w-full text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0e1620] hover:file:bg-white/90"
                        />

                        <div className="mt-2 text-xs text-white/40">
                          {formId
                            ? "Optional: upload new file(s) to replace existing media."
                            : isCarouselImages
                            ? "Required: upload 2–6 images for Carousel."
                            : "Required: upload image/video before saving."}
                        </div>

                        {isCarouselImages && files.length ? (
                          <div className="mt-2 text-xs text-white/70">
                            Selected: <span className="text-white">{files.length}</span> images
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    onClick={() => setOpenForm(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0e1620] hover:bg-white/90 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Advertisement"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-white/40">
          © {new Date().getFullYear()} UFO Collection • Admin
        </div>
      </div>
    </div>
  );
}
