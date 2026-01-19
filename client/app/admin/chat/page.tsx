"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Conversation = {
  _id: string;
  userId: any;
  adminId?: any | null;
  status: "OPEN" | "ENDED";
  orderId?: string | null;
  lastMessage?: string;
  lastMessageAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

function Badge({ status }: { status: "OPEN" | "ENDED" }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        status === "OPEN"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-slate-700 bg-slate-900/30 text-slate-200",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function fmtTime(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function AdminChatInboxPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Conversation[]>([]);
  const [q, setQ] = React.useState("");
  const [err, setErr] = React.useState("");

  const load = React.useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/chat/conversations`, {
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/admin/adminlogin");
        return;
      }

      const data = await res.json().catch(() => ({} as any));
      const list: Conversation[] = data?.conversations || [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((c) => {
      const id = String(c._id || "").toLowerCase();
      const orderId = String(c.orderId || "").toLowerCase();
      const last = String(c.lastMessage || "").toLowerCase();
      const status = String(c.status || "").toLowerCase();
      return (
        id.includes(term) ||
        orderId.includes(term) ||
        last.includes(term) ||
        status.includes(term)
      );
    });
  }, [rows, q]);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Live Chat</h1>
          <p className="mt-1 text-sm text-slate-300">
            View and respond to customer chat conversations.
          </p>
        </div>

        <div className="flex w-full gap-3 md:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by orderId, status, message..."
            className="w-full md:w-[360px] rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
          />
          <button
            onClick={load}
            className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900/70"
          >
            Refresh
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/30">
        <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_1.4fr_0.6fr] gap-4 border-b border-slate-800/70 px-6 py-4 text-sm font-semibold text-slate-200 md:grid">
          <div>Conversation</div>
          <div>Order ID</div>
          <div>Status</div>
          <div>Last Message</div>
          <div>Action</div>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-300">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-300">
            No conversations found.
          </div>
        ) : (
          <div>
            {filtered.map((c) => (
              <div
                key={c._id}
                className="border-b border-slate-800/60 px-6 py-5 last:border-0"
              >
                <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_1.4fr_0.6fr] items-center gap-4 md:grid">
                  <div className="text-sm text-white">
                    <div className="font-semibold">{c._id}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      Updated: {fmtTime(c.updatedAt)}
                    </div>
                  </div>

                  <div className="text-sm text-slate-200">
                    {c.orderId ? c.orderId : "-"}
                  </div>

                  <div>
                    <Badge status={c.status} />
                  </div>

                  <div className="text-sm text-slate-200">
                    {c.lastMessage ? (
                      <span className="line-clamp-2">{c.lastMessage}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                    <div className="mt-1 text-xs text-slate-500">
                      {fmtTime(c.lastMessageAt)}
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/admin/chat/${c._id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                    >
                      View
                    </Link>
                  </div>
                </div>

                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {c._id}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Updated: {fmtTime(c.updatedAt)}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge status={c.status} />
                        <span className="text-xs text-slate-400">
                          Order: {c.orderId || "-"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/chat/${c._id}`}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
                    >
                      View
                    </Link>
                  </div>

                  <div className="mt-3 text-sm text-slate-200">
                    {c.lastMessage || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
