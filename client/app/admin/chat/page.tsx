// client/app/admin/chat/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AdminPageGuard from "../_components/AdminPageGuard";

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

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function fmtTime(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function Badge({ status }: { status: "OPEN" | "ENDED" }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        status === "OPEN"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
          : "border-slate-400/20 bg-white/5 text-slate-300",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function ChatInboxInner() {
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
        cache: "no-store",
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

  const openCount = rows.filter((c) => c.status === "OPEN").length;
  const endedCount = rows.filter((c) => c.status === "ENDED").length;

  return (
    <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
      <div className="space-y-6">
        <section
          className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Admin / Live Chat
              </div>

              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                Live Chat
              </h1>

              <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                View customer chat conversations, check latest messages, and
                respond to active support chats in real time.
              </p>
            </div>

            <button type="button" onClick={load} disabled={loading} className={primaryBtnClass}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-6 flex h-[48px] max-w-[560px] items-center rounded-full border border-white/10 bg-white/5 px-4">
            <label htmlFor="chat-search" className="sr-only">
              Search by order ID, status, message
            </label>
            <input
              id="chat-search"
              name="chatSearch"
              title="Search by order ID, status, message"
              aria-label="Search by order ID, status, message"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by order ID, status, message..."
              className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Chats"
            value={String(rows.length)}
            hint="All conversations"
            iconSrc="/images/admin/chat.png"
          />
          <StatCard
            label="Open"
            value={String(openCount)}
            hint="Active conversations"
            iconSrc="/images/admin/open.png"
          />
          <StatCard
            label="Ended"
            value={String(endedCount)}
            hint="Closed conversations"
            iconSrc="/images/admin/closed.png"
          />
          <StatCard
            label="Visible"
            value={String(filtered.length)}
            hint="Current search result"
            iconSrc="/images/admin/visible.png"
          />
        </section>

        {err ? (
          <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
            {err}
          </div>
        ) : null}

        <section className={`${panelClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                Chat Inbox
              </div>
              <h2 className="mt-1 text-[20px] font-semibold text-white">
                Customer Conversations
              </h2>
              <p className="mt-1 text-[13px] text-[#a7aec4]">
                Conversation ID, order reference, status, latest message and
                action.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
              {loading ? "Loading..." : `${filtered.length} visible`}
            </div>
          </div>

          {loading ? (
            <ChatSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                    <th className="px-5 py-4 font-medium">Conversation</th>
                    <th className="px-5 py-4 font-medium">Order ID</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Last Message</th>
                    <th className="px-5 py-4 text-right font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c._id}
                      className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{c._id}</div>
                        <div className="mt-1 text-[12px] text-[#7f879f]">
                          Updated: {fmtTime(c.updatedAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        {c.orderId ? (
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
                            {c.orderId}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Badge status={c.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[420px]">
                          {c.lastMessage ? (
                            <span className="line-clamp-2 text-[#d8dcef]">
                              {c.lastMessage}
                            </span>
                          ) : (
                            <span className="text-[#7f879f]">-</span>
                          )}

                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            {fmtTime(c.lastMessageAt)}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link href={`/admin/chat/${c._id}`} className={secondaryBtnClass}>
                          View
                        </Link>
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

export default function AdminChatInboxPage() {
  return (
    <AdminPageGuard permission="liveChatView">
      <ChatInboxInner />
    </AdminPageGuard>
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
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function ChatSkeleton() {
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
          src="/images/admin/chat.png"
          alt="Chat"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No conversations found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Customer chat conversations will appear here when users start live chat
        or when your search matches existing conversations.
      </p>
    </div>
  );
}