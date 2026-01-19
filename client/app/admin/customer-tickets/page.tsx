"use client";

import * as React from "react";
import Link from "next/link";

type TicketStatus = "Open" | "Pending" | "Closed";

type TicketRow = {
  id: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  issueType: string;
  submittedAt: string;
  status: TicketStatus;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

function pillClass(s: TicketStatus) {
  if (s === "Open") return "bg-[#1d2a3b] text-white border-[#2b3a52]";
  if (s === "Pending") return "bg-[#2a2a1d] text-white border-[#3a3a2b]";
  return "bg-[#202a2a] text-white border-[#2b3a3a]";
}

function showTicketId(v: string) {
  const s = String(v || "").trim();
  if (!s) return "-";
  return s.startsWith("#") ? s : `#${s}`;
}

export default function AdminCustomerTicketsPage() {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<TicketRow[]>([]);
  const [err, setErr] = React.useState("");

  const loadTickets = React.useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(
        `${API}/admin/tickets?q=${encodeURIComponent(q)}`,
        { credentials: "include", cache: "no-store" }
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load tickets");

      setRows(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between gap-4 rounded-[12px] border border-[#1b2a40] bg-[#0f1a2b]/55 px-5 py-4">
        <div>
          <div className="text-[28px] font-semibold tracking-tight text-white">
            Product Support Tickets
          </div>
          <div className="mt-1 text-sm text-[#9aa7c3]">
            Manage customer product issues and replies
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH */}
          <div className="flex items-center rounded-[10px] border border-[#1b2a40] bg-[#0b1220] px-3 py-2">
            <span className="mr-2 text-[#9aa7c3]">🔎</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-[200px] bg-transparent text-sm text-white placeholder:text-[#7f8aa6] outline-none"
            />
          </div>

          {/* REFRESH BUTTON */}
          <button
            onClick={loadTickets}
            disabled={loading}
            className="rounded-[10px] border border-[#1b2a40] bg-[#0b1220] px-4 py-2 text-sm text-white hover:bg-[#14233a] disabled:opacity-60"
            title="Refresh tickets"
          >
            {loading ? "Refreshing…" : "⟳ Refresh"}
          </button>

          <div className="text-sm text-[#9aa7c3]">
            {loading ? "Loading…" : `${rows.length} tickets`}
          </div>
        </div>
      </div>

      {/* ERROR */}
      {err && (
        <div className="mb-5 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* TABLE (fixed overlap) */}
      <section className="rounded-[12px] border border-[#1b2a40] bg-[#0f1a2b]/55 overflow-hidden">
        {/* ✅ scrollbar wrapper */}
        <div className="overflow-x-auto">
          {/* ✅ give space for scrollbar so it doesn't sit on rows */}
          <div className="min-w-[1200px] pb-4">
            <div className="grid grid-cols-[140px_260px_180px_180px_160px_140px_120px] border-b border-[#1b2a40] px-6 py-4 text-[13px] font-medium text-white/90">
              <div>Ticket ID</div>
              <div>Customer</div>
              <div>Product</div>
              <div>Issue Type</div>
              <div>Submission Date</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>

            {rows.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[140px_260px_180px_180px_160px_140px_120px] items-center border-b border-[#162338] px-6 py-5 last:border-0"
              >
                <div className="font-semibold text-white/95 whitespace-nowrap">
                  {showTicketId(t.ticketId)}
                </div>

                <div className="min-w-0">
                  <div className="text-[#a9c1ff] truncate">{t.customerName}</div>
                  <div className="text-sm text-[#8aa0c9] truncate">
                    ({t.customerEmail})
                  </div>
                </div>

                <div className="text-[#9bb2dd] whitespace-nowrap">
                  {t.productName || "-"}
                </div>

                <div className="text-[#9bb2dd] whitespace-nowrap">{t.issueType}</div>

                <div className="text-[#9bb2dd] whitespace-nowrap">
                  {String(t.submittedAt).slice(0, 10)}
                </div>

                <Link href={`/admin/customer-tickets/${t.id}`}>
                  <span
                    className={`inline-flex min-w-[92px] justify-center rounded-[10px] border px-4 py-2 text-[13px] cursor-pointer hover:opacity-90 ${pillClass(
                      t.status
                    )}`}
                  >
                    {t.status}
                  </span>
                </Link>

                <div className="text-right whitespace-nowrap">
                  <Link
                    href={`/admin/customer-tickets/${t.id}`}
                    className="text-[#9cc2ff] hover:text-white"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}

            {!loading && rows.length === 0 && (
              <div className="px-6 py-10 text-center text-[#9aa7c3]">
                No tickets found.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
