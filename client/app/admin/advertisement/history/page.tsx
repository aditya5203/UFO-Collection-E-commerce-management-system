// client/app/admin/advertisement/history/page.tsx
"use client";

// Same API/logic, premium UI updated.

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

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
).replace(/\/+$/, "");

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

const totalIcon = "/images/admin/advertisement.png";
const createdIcon = "/images/admin/active.png";
const updatedIcon = "/images/admin/update.png";
const deletedIcon = "/images/admin/deleted.png";

function actionTone(a: HistoryAction) {
  if (a === "Created") return "border-sky-400/20 bg-sky-500/15 text-sky-300";
  if (a === "Updated")
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  if (a === "Activated")
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  if (a === "Deactivated")
    return "border-slate-400/20 bg-white/5 text-slate-300";
  if (a === "Scheduled")
    return "border-violet-400/20 bg-violet-500/15 text-violet-300";
  return "border-red-400/20 bg-red-500/15 text-red-300";
}

function fmtDateTime(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s || "-";

  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function AdvertisementHistoryInner() {
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<AdType | "All">("All");
  const [action, setAction] = React.useState<HistoryAction | "All">("All");

  const [items, setItems] = React.useState<HistoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function fetchHistory() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (q.trim()) params.set("q", q.trim());
      if (type !== "All") params.set("type", type);
      if (action !== "All") params.set("action", action);

      const res = await fetch(
        `${API_BASE}/admin/ads/history?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load history");
      }

      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, action]);

  const sortedItems = React.useMemo(
    () =>
      items
        .slice()
        .sort(
          (a, b) =>
            new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        ),
    [items]
  );

  const createdCount = items.filter((x) => x.action === "Created").length;
  const updatedCount = items.filter((x) => x.action === "Updated").length;
  const deletedCount = items.filter((x) => x.action === "Deleted").length;

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

            <Link href="/admin/advertisement" className={secondaryBtnClass}>
              Back to Ads
            </Link>
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
            </div>

            <Select
              label="Filter advertisement history by type"
              value={type}
              onChange={(v) => setType(v as any)}
            >
              <option value="All">All Types</option>
              <option value="Banner">Banner</option>
              <option value="Carousel">Carousel</option>
              <option value="Pop-up">Pop-up</option>
              <option value="Video">Video</option>
            </Select>

            <Select
              label="Filter advertisement history by action"
              value={action}
              onChange={(v) => setAction(v as any)}
            >
              <option value="All">All Actions</option>
              <option value="Created">Created</option>
              <option value="Updated">Updated</option>
              <option value="Activated">Activated</option>
              <option value="Deactivated">Deactivated</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Expired">Expired</option>
              <option value="Deleted">Deleted</option>
            </Select>
          </div>
        </section>

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
            <div className="overflow-x-auto">
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
                        <span
                          className={[
                            "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
                            actionTone(h.action),
                          ].join(" ")}
                        >
                          {h.action}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        {h.changedBy}
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        {fmtDateTime(h.changedAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[340px] truncate text-[#a7aec4]">
                          {h.note ?? "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AdvertisementHistoryPage() {
  return (
    <AdminPageGuard permission="advertisementView">
      <AdvertisementHistoryInner />
    </AdminPageGuard>
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
        <Image src={totalIcon} alt="Advertisement history" width={28} height={28} />
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