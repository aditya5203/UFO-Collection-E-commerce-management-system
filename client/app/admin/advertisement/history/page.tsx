// client/app/admin/advertisement/history/page.tsx
"use client";

import { API_URL } from "@/lib/api";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import AdminPageGuard from "../../_components/AdminPageGuard";

type AdType = "Banner" | "Carousel" | "Pop-up" | "Video";

type HistoryAction =
  | "Created"
  | "Updated"
  | "Activated"
  | "Deactivated"
  | "Scheduled"
  | "Expired"
  | "Deleted";

type HistoryRow = {
  id: string;
  title: string;
  type: AdType;
  action: HistoryAction;
  changedBy: string;
  changedAt: string;
  note?: string;
};

const RAW_API_BASE =
  API_URL;

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const totalIcon = "/images/admin/advertisement.png";
const createdIcon = "/images/admin/active.png";
const updatedIcon = "/images/admin/update.png";
const deletedIcon = "/images/admin/deleted.png";

function optionClass() {
  return "bg-[#11121a] text-white";
}

function actionTone(a: HistoryAction) {
  if (a === "Created") {
    return "border-sky-400/20 bg-sky-500/15 text-sky-300";
  }

  if (a === "Updated") {
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  }

  if (a === "Activated") {
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  }

  if (a === "Deactivated") {
    return "border-slate-400/20 bg-white/5 text-slate-300";
  }

  if (a === "Scheduled") {
    return "border-violet-400/20 bg-violet-500/15 text-violet-300";
  }

  return "border-red-400/20 bg-red-500/15 text-red-300";
}

function fmtDateTime(s?: string | null) {
  if (!s) return "-";

  const d = new Date(s);

  if (Number.isNaN(d.getTime())) return String(s || "-");

  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseDateSafe(value?: string) {
  if (!value) return 0;

  const time = Date.parse(value);

  return Number.isFinite(time) ? time : 0;
}

function normalizeAdType(value?: string): AdType {
  if (value === "Carousel") return "Carousel";
  if (value === "Pop-up") return "Pop-up";
  if (value === "Video") return "Video";
  return "Banner";
}

function normalizeAction(value?: string): HistoryAction {
  if (value === "Updated") return "Updated";
  if (value === "Activated") return "Activated";
  if (value === "Deactivated") return "Deactivated";
  if (value === "Scheduled") return "Scheduled";
  if (value === "Expired") return "Expired";
  if (value === "Deleted") return "Deleted";
  return "Created";
}

function normalizeHistoryRow(row: any, index: number): HistoryRow {
  const changedBy =
    typeof row?.changedBy === "object"
      ? row?.changedBy?.name || row?.changedBy?.email || "Admin"
      : row?.changedBy || row?.adminName || row?.adminEmail || "Admin";

  return {
    id: String(row?.id || row?._id || row?.logId || `history-${index}`),
    title: String(row?.title || row?.adTitle || row?.advertisementTitle || "-"),
    type: normalizeAdType(row?.type || row?.adType),
    action: normalizeAction(row?.action || row?.event),
    changedBy: String(changedBy || "Admin"),
    changedAt: String(row?.changedAt || row?.createdAt || row?.updatedAt || ""),
    note: row?.note ? String(row.note) : row?.message ? String(row.message) : "",
  };
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function AdvertisementHistoryPage() {
  return (
    <AdminPageGuard permission="advertisementView">
      <AdvertisementHistoryInner />
    </AdminPageGuard>
  );
}

function AdvertisementHistoryInner() {
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [type, setType] = React.useState<AdType | "All">("All");
  const [action, setAction] = React.useState<HistoryAction | "All">("All");

  const [items, setItems] = React.useState<HistoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(q.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [q]);

  const fetchHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (debouncedQ) params.set("q", debouncedQ);
      if (type !== "All") params.set("type", type);
      if (action !== "All") params.set("action", action);

      const query = params.toString();
      const url = query
        ? `${API_BASE}/admin/ads/history?${query}`
        : `${API_BASE}/admin/ads/history`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error((json as any)?.message || "Failed to load history");
      }

      const rawItems = Array.isArray((json as any)?.items)
        ? (json as any).items
        : Array.isArray((json as any)?.data)
        ? (json as any).data
        : Array.isArray((json as any)?.history)
        ? (json as any).history
        : Array.isArray((json as any)?.logs)
        ? (json as any).logs
        : [];

      const nextItems: HistoryRow[] = rawItems
        .map(normalizeHistoryRow)
        .filter((row: HistoryRow) => Boolean(row.id));

      setItems(nextItems);
    } catch (e: any) {
      console.error(e);
      setItems([]);
      setError(e?.message || "Failed to load advertisement history.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, type, action]);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const sortedItems = React.useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => parseDateSafe(b.changedAt) - parseDateSafe(a.changedAt)),
    [items]
  );

  const createdCount = React.useMemo(
    () => items.filter((x) => x.action === "Created").length,
    [items]
  );

  const updatedCount = React.useMemo(
    () => items.filter((x) => x.action === "Updated").length,
    [items]
  );

  const deletedCount = React.useMemo(
    () => items.filter((x) => x.action === "Deleted").length,
    [items]
  );

  return (
    <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
      <div className="space-y-6">
        <section
          className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Admin / Advertisement / History
              </div>

              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                Advertisement History
              </h1>

              <p className="mt-2 max-w-[760px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                Track advertisement changes, campaign actions, changed-by admin,
                notes, and timestamp history from the API.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchHistory}
                disabled={loading}
                className={secondaryBtnClass}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <Link href="/admin/advertisement" className={secondaryBtnClass}>
                Back to Ads
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_220px]">
            <div className="flex h-[48px] items-center rounded-full border border-white/10 bg-white/5 px-4">
              <label htmlFor="ad-history-search" className="sr-only">
                Search advertisement history
              </label>

              <input
                id="ad-history-search"
                name="adHistorySearch"
                title="Search advertisement history"
                aria-label="Search advertisement history"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, admin, action..."
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
              label="Filter advertisement history by type"
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
              label="Filter advertisement history by action"
              value={action}
              onChange={(v) => setAction(v as HistoryAction | "All")}
            >
              <option value="All" className={optionClass()}>
                All Actions
              </option>
              <option value="Created" className={optionClass()}>
                Created
              </option>
              <option value="Updated" className={optionClass()}>
                Updated
              </option>
              <option value="Activated" className={optionClass()}>
                Activated
              </option>
              <option value="Deactivated" className={optionClass()}>
                Deactivated
              </option>
              <option value="Scheduled" className={optionClass()}>
                Scheduled
              </option>
              <option value="Expired" className={optionClass()}>
                Expired
              </option>
              <option value="Deleted" className={optionClass()}>
                Deleted
              </option>
            </Select>
          </div>
        </section>

        {error ? (
          <AlertBox type="error" message={error} onClose={() => setError("")} />
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Logs"
            value={String(items.length)}
            iconSrc={totalIcon}
          />

          <StatCard
            label="Created"
            value={String(createdCount)}
            iconSrc={createdIcon}
          />

          <StatCard
            label="Updated"
            value={String(updatedCount)}
            iconSrc={updatedIcon}
          />

          <StatCard
            label="Deleted"
            value={String(deletedCount)}
            iconSrc={deletedIcon}
          />
        </section>

        <section className={`${panelClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                Change Log
              </div>

              <h2 className="mt-1 text-[20px] font-semibold text-white">
                Campaign Activity
              </h2>

              <p className="mt-1 text-[13px] text-[#a7aec4]">
                Newest advertisement changes appear on top.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
              {loading ? "Loading..." : `${items.length} records`}
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : sortedItems.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[980px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Ad Title</th>
                      <th className="px-5 py-4 font-medium">Type</th>
                      <th className="px-5 py-4 font-medium">Action</th>
                      <th className="px-5 py-4 font-medium">Changed By</th>
                      <th className="px-5 py-4 font-medium">Date / Time</th>
                      <th className="px-5 py-4 font-medium">Note</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedItems.map((h) => (
                      <tr
                        key={h.id}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {h.title}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">{h.type}</td>

                        <td className="px-5 py-4">
                          <ActionPill action={h.action} />
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {h.changedBy}
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {fmtDateTime(h.changedAt)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="max-w-[340px] truncate text-[#a7aec4]">
                            {h.note || "-"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-5 xl:hidden">
                {sortedItems.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[18px] font-semibold text-white">
                          {h.title}
                        </h3>

                        <p className="mt-1 text-[12px] text-[#7f879f]">
                          {h.type} • {fmtDateTime(h.changedAt)}
                        </p>
                      </div>

                      <ActionPill action={h.action} />
                    </div>

                    <div className="mt-4 grid gap-2 text-[13px] text-[#a7aec4]">
                      <div>
                        Changed By:{" "}
                        <span className="text-[#d6dbeb]">{h.changedBy}</span>
                      </div>

                      <div>
                        Note:{" "}
                        <span className="text-[#d6dbeb]">
                          {h.note || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
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

function ActionPill({ action }: { action: HistoryAction }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        actionTone(action),
      ].join(" ")}
    >
      {action}
    </span>
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
          <Image src={iconSrc} alt={label} width={24} height={24} />
        </div>
      </div>
    </div>
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

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src={totalIcon}
          alt="Advertisement history"
          width={28}
          height={28}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No history found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Advertisement history will appear here when campaigns are created,
        updated, activated, deactivated, scheduled, expired, or deleted.
      </p>
    </div>
  );
}
