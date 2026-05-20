// client/app/admin/chat/page.tsx
"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../_components/AdminPageGuard";

type ChatUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

type ConversationStatus = "OPEN" | "ENDED";

type Conversation = {
  _id: string;
  userId?: string | ChatUser | null;
  adminId?: string | ChatUser | null;
  status: ConversationStatus;
  orderId?: string | null;
  lastMessage?: string;
  lastMessageAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

type ChatSocketPayload = {
  conversationId?: string;
  _id?: string;
  id?: string;
  status?: ConversationStatus;
  orderId?: string | null;
  lastMessage?: string;
  message?: string;
  text?: string;
  lastMessageAt?: string;
  updatedAt?: string;
  createdAt?: string;
  userId?: string | ChatUser | null;
  adminId?: string | ChatUser | null;
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

const RAW_API_BASE =
  API_BASE_URL;

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

const SOCKET_BASE = CLEAN_API_BASE.replace(/\/api$/, "");

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

  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserName(user?: string | ChatUser | null) {
  if (!user) return "Customer";
  if (typeof user === "string") return "Customer";

  return user.name || "Customer";
}

function getUserEmail(user?: string | ChatUser | null) {
  if (!user) return "";
  if (typeof user === "string") return "";

  return user.email || "";
}

function getConversationId(payload: ChatSocketPayload) {
  return String(payload.conversationId || payload._id || payload.id || "").trim();
}

function normalizeStatus(status?: string): ConversationStatus {
  return status === "ENDED" ? "ENDED" : "OPEN";
}

function normalizeConversation(row: any): Conversation {
  return {
    _id: String(row?._id || row?.id || row?.conversationId || ""),
    userId: row?.userId || row?.user || null,
    adminId: row?.adminId || row?.admin || null,
    status: normalizeStatus(row?.status),
    orderId: row?.orderId ? String(row.orderId) : null,
    lastMessage: String(row?.lastMessage || row?.message || row?.text || ""),
    lastMessageAt: row?.lastMessageAt || row?.updatedAt || row?.createdAt || null,
    updatedAt: row?.updatedAt || row?.lastMessageAt || row?.createdAt || undefined,
    createdAt: row?.createdAt || undefined,
  };
}

function conversationMatchesSearch(c: Conversation, term: string) {
  const id = String(c._id || "").toLowerCase();
  const orderId = String(c.orderId || "").toLowerCase();
  const last = String(c.lastMessage || "").toLowerCase();
  const status = String(c.status || "").toLowerCase();
  const customerName = getUserName(c.userId).toLowerCase();
  const customerEmail = getUserEmail(c.userId).toLowerCase();

  return (
    id.includes(term) ||
    orderId.includes(term) ||
    last.includes(term) ||
    status.includes(term) ||
    customerName.includes(term) ||
    customerEmail.includes(term)
  );
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function Badge({ status }: { status: ConversationStatus }) {
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
  const [toast, setToast] = React.useState<ToastState | null>(null);

  const socketRef = React.useRef<Socket | null>(null);
  const loadRef = React.useRef<(() => Promise<void>) | null>(null);

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  }

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

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load conversations");
      }

      const rawList = Array.isArray((data as any)?.conversations)
        ? (data as any).conversations
        : Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : [];

      const nextRows: Conversation[] = rawList
        .map(normalizeConversation)
        .filter((c: Conversation) => Boolean(c._id));

      setRows(nextRows);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadRef.current = load;
  }, [load]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      loadRef.current?.();
    });

    socket.on("connect_error", () => {
      showToast({
        type: "info",
        message: "Live chat updates are reconnecting.",
      });
    });

    const updateConversationFromSocket = (payload: ChatSocketPayload) => {
      const conversationId = getConversationId(payload);

      if (!conversationId) {
        loadRef.current?.();
        return;
      }

      setRows((prev) => {
        const nextMessage = String(
          payload.lastMessage || payload.message || payload.text || ""
        );

        const nextUpdatedAt =
          payload.lastMessageAt ||
          payload.updatedAt ||
          payload.createdAt ||
          new Date().toISOString();

        const exists = prev.some((c) => c._id === conversationId);

        if (!exists) {
          const nextConversation: Conversation = {
            _id: conversationId,
            userId: payload.userId || null,
            adminId: payload.adminId || null,
            status: normalizeStatus(payload.status),
            orderId: payload.orderId || null,
            lastMessage: nextMessage,
            lastMessageAt: nextUpdatedAt,
            updatedAt: nextUpdatedAt,
            createdAt: payload.createdAt || nextUpdatedAt,
          };

          return [nextConversation, ...prev];
        }

        return prev
          .map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  status: payload.status ? normalizeStatus(payload.status) : c.status,
                  orderId:
                    payload.orderId !== undefined ? payload.orderId : c.orderId,
                  userId: payload.userId || c.userId,
                  adminId: payload.adminId || c.adminId,
                  lastMessage: nextMessage || c.lastMessage,
                  lastMessageAt: nextUpdatedAt || c.lastMessageAt,
                  updatedAt: nextUpdatedAt || c.updatedAt,
                }
              : c
          )
          .sort((a, b) => {
            const da = Date.parse(a.lastMessageAt || a.updatedAt || a.createdAt || "");
            const db = Date.parse(b.lastMessageAt || b.updatedAt || b.createdAt || "");
            return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
          });
      });
    };

    socket.on("admin:chat:new", updateConversationFromSocket);
    socket.on("chat:new_message", updateConversationFromSocket);
    socket.on("chat:conversation:updated", updateConversationFromSocket);
    socket.on("admin:chat:conversation:updated", updateConversationFromSocket);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();

    const sorted = [...rows].sort((a, b) => {
      const da = Date.parse(a.lastMessageAt || a.updatedAt || a.createdAt || "");
      const db = Date.parse(b.lastMessageAt || b.updatedAt || b.createdAt || "");

      return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
    });

    if (!term) return sorted;

    return sorted.filter((c) => conversationMatchesSearch(c, term));
  }, [rows, q]);

  const openCount = rows.filter((c) => c.status === "OPEN").length;
  const endedCount = rows.filter((c) => c.status === "ENDED").length;

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
                Admin / Live Chat
              </div>

              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                Live Chat
              </h1>

              <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                View customer chat conversations, check latest messages, and
                respond to active support chats from one admin inbox.
              </p>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className={primaryBtnClass}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-6 flex h-[48px] max-w-[620px] items-center rounded-full border border-white/10 bg-white/5 px-4">
            <label htmlFor="chat-search" className="sr-only">
              Search by customer, order ID, status, or message
            </label>

            <input
              id="chat-search"
              name="chatSearch"
              title="Search by customer, order ID, status, or message"
              aria-label="Search by customer, order ID, status, or message"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customer, order ID, status, message..."
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
          <AlertBox type="error" message={err} onClose={() => setErr("")} />
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
                Conversation ID, customer, order reference, status, latest
                message and action.
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
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1120px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Conversation</th>
                      <th className="px-5 py-4 font-medium">Customer</th>
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
                          <div className="max-w-[220px] truncate font-semibold text-white">
                            {c._id}
                          </div>

                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            Updated: {fmtTime(c.updatedAt || c.lastMessageAt)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {getUserName(c.userId)}
                          </div>

                          <div className="mt-1 max-w-[220px] truncate text-[12px] text-[#7f879f]">
                            {getUserEmail(c.userId) || "-"}
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
                          <Link
                            href={`/admin/chat/${c._id}`}
                            className={secondaryBtnClass}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-5 xl:hidden">
                {filtered.map((c) => (
                  <div
                    key={c._id}
                    className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="max-w-[240px] truncate text-[13px] font-semibold text-[#d6c7ff]">
                          {c._id}
                        </div>

                        <h3 className="mt-2 text-[18px] font-semibold text-white">
                          {getUserName(c.userId)}
                        </h3>

                        <p className="mt-1 text-[12px] text-[#7f879f]">
                          {getUserEmail(c.userId) || "No email"}
                        </p>
                      </div>

                      <Badge status={c.status} />
                    </div>

                    <div className="mt-4 grid gap-2 text-[13px] text-[#a7aec4]">
                      <div>
                        Order:{" "}
                        <span className="text-[#d6dbeb]">
                          {c.orderId || "-"}
                        </span>
                      </div>

                      <div>
                        Last Message:{" "}
                        <span className="text-[#d6dbeb]">
                          {c.lastMessage || "-"}
                        </span>
                      </div>

                      <div>
                        Updated:{" "}
                        <span className="text-[#d6dbeb]">
                          {fmtTime(c.updatedAt || c.lastMessageAt)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/chat/${c._id}`}
                      className={`${primaryBtnClass} mt-5 inline-flex w-full justify-center`}
                    >
                      View
                    </Link>
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

export default function AdminChatInboxPage() {
  return (
    <AdminPageGuard permission="liveChatView">
      <ChatInboxInner />
    </AdminPageGuard>
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
