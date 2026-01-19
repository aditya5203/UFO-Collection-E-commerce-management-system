// app/admin/advertisement/history/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";

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

function pillAction(a: HistoryAction) {
  if (a === "Created") return "bg-[#1d2a3b] text-[#cfe6ff] border-[#2b3a52]";
  if (a === "Updated") return "bg-[#2a2a1d] text-[#fff4c2] border-[#3a3a2b]";
  if (a === "Activated") return "bg-[#153225] text-[#b7f7d0] border-[#1f4b34]";
  if (a === "Deactivated") return "bg-[#1d2a3b] text-[#cfe6ff] border-[#2b3a52]";
  if (a === "Scheduled") return "bg-[#2a2a1d] text-[#fff4c2] border-[#3a3a2b]";
  return "bg-[#2a2020] text-[#ffd1d1] border-[#3a2b2b]";
}

function fmtDateTime(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function AdvertisementHistoryPage() {
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

      const res = await fetch(`${API_BASE}/admin/ads/history?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.message || "Failed to load history");

      setItems(json?.items || []);
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

  return (
    <div className="min-h-screen bg-[#0e1620] text-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Advertisement History</h1>
            <p className="mt-1 text-sm text-white/60">
              Track every change (API connected).
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/advertisement"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              ← Back to Advertisement
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-[#111c28] px-3 py-2">
              <span className="text-white/50">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, admin, action..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[560px]">
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
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#111c28] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="All">All Actions</option>
                <option value="Created">Created</option>
                <option value="Updated">Updated</option>
                <option value="Activated">Activated</option>
                <option value="Deactivated">Deactivated</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Expired">Expired</option>
                <option value="Deleted">Deleted</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Change Log</div>
              <div className="text-xs text-white/50">Newest changes appear on top.</div>
            </div>
            <div className="text-xs text-white/50">
              Showing <span className="text-white">{items.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs text-white/60">
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3">Ad Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Changed By</th>
                  <th className="px-4 py-3">Date/Time</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>

              <tbody className="text-white/80">
                {loading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-white/60" colSpan={6}>
                      Loading…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-white/60" colSpan={6}>
                      No history found.
                    </td>
                  </tr>
                ) : (
                  items
                    .slice()
                    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                    .map((h) => (
                      <tr key={h.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="px-4 py-3 font-medium text-white">{h.title}</td>
                        <td className="px-4 py-3 text-white/70">{h.type}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${pillAction(h.action)}`}>
                            {h.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/70">{h.changedBy}</td>
                        <td className="px-4 py-3 text-white/70">{fmtDateTime(h.changedAt)}</td>
                        <td className="px-4 py-3 text-white/70">{h.note ?? "-"}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-white/40">
          © {new Date().getFullYear()} UFO Collection • Admin
        </div>
      </div>
    </div>
  );
}
