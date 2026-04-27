// client/app/admin/chat/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminPageGuard from "../../_components/AdminPageGuard";
import {
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../../_components/adminPermissions";

type Message = {
  _id: string;
  senderRole: "user" | "admin" | "bot" | "system";
  text: string;
  createdAt: string;
};

type Conversation = {
  _id: string;
  status: "OPEN" | "ENDED";
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

function fmtTime(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function Bubble({ m }: { m: Message }) {
  const isUser = m.senderRole === "user";
  const isSystem = m.senderRole === "system";
  const isBot = m.senderRole === "bot";

  if (isSystem) {
    return (
      <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-[#a7aec4]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{m.text}</span>
          <span className="text-[11px] text-[#7f879f]">
            {fmtTime(m.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={[
          "max-w-[82%] rounded-[20px] border px-4 py-3 text-[13px] shadow-[0_12px_30px_rgba(0,0,0,0.2)]",
          isUser
            ? "border-white/10 bg-white/[0.04] text-white"
            : isBot
            ? "border-violet-400/20 bg-violet-500/10 text-white"
            : "border-emerald-400/20 bg-emerald-500/10 text-white",
        ].join(" ")}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4]">
          {isUser ? "Customer" : isBot ? "Bot" : "Admin"}
        </div>

        <div className="mt-2 whitespace-pre-wrap leading-6">{m.text}</div>

        <div className="mt-2 text-[11px] text-[#7f879f]">
          {fmtTime(m.createdAt)}
        </div>
      </div>
    </div>
  );
}

function ChatDetailInner() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any)?.id || "");

  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [ending, setEnding] = React.useState(false);

  const [conv, setConv] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState("");
  const [canReply, setCanReply] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  React.useEffect(() => {
    let mounted = true;

    const loadPermissions = async () => {
      try {
        const res = await fetch(`${API}/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (mounted) setCanReply(false);
          return;
        }

        const json = (await safeJson(res)) as AdminSettingsResponse;
        const role = String(json?.profile?.role || "admin");
        const permissions = normalizeAdminPermissions(
          role,
          json?.profile?.permissions
        );

        if (mounted) {
          setCanReply(hasPermission(role, permissions, "liveChatReply"));
        }
      } catch {
        if (mounted) setCanReply(false);
      }
    };

    loadPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  const load = React.useCallback(async () => {
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/admin/chat/conversations/${id}/messages`, {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/admin/adminlogin");
        return;
      }

      const data = await res.json().catch(() => ({} as any));
      const msgs: Message[] = data?.messages || [];

      setMessages(Array.isArray(msgs) ? msgs : []);
      setConv((p) => p ?? ({ _id: id, status: "OPEN" } as Conversation));
    } catch (e) {
      console.error(e);
      setErr("Failed to load chat.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  React.useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const send = async () => {
    const t = text.trim();
    if (!t || !canReply) return;
    if (conv?.status === "ENDED") return;

    setSending(true);
    setErr("");

    try {
      const res = await fetch(`${API}/admin/chat/conversations/${id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setErr(data?.message || "Failed to send message.");
        return;
      }

      setText("");

      if (data?.message) {
        setMessages((p) => [...p, data.message]);
      } else {
        await load();
      }
    } catch (e) {
      console.error(e);
      setErr("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const endChat = async () => {
    if (!canReply || ending) return;

    setEnding(true);
    setErr("");

    try {
      const res = await fetch(`${API}/admin/chat/conversations/${id}/end`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setErr(data?.message || "Failed to end chat.");
        return;
      }

      setConv((p) => (p ? { ...p, status: "ENDED" } : p));
      await load();
    } catch (e) {
      console.error(e);
      setErr("Failed to end chat.");
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
      <div className="space-y-6">
        <section
          className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Admin / Live Chat / Details
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Chat Details
                </h1>

                <StatusPill status={conv?.status || "OPEN"} />
              </div>

              <p className="mt-2 max-w-[760px] break-all text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                Conversation ID: <span className="text-white">{id}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/admin/chat" className={secondaryBtnClass}>
                Back to Inbox
              </Link>

              <button onClick={load} className={secondaryBtnClass}>
                Refresh
              </button>

              {canReply ? (
                <button
                  onClick={endChat}
                  disabled={ending || conv?.status === "ENDED"}
                  className="rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {conv?.status === "ENDED"
                    ? "Chat Ended"
                    : ending
                    ? "Ending..."
                    : "End Chat"}
                </button>
              ) : null}
            </div>
          </div>
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
                Conversation
              </div>
              <h2 className="mt-1 text-[20px] font-semibold text-white">
                Customer Messages
              </h2>
              <p className="mt-1 text-[13px] text-[#a7aec4]">
                View all messages and reply as admin when the chat is open.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
              {messages.length} messages
            </div>
          </div>

          <div
            ref={listRef}
            className="h-[520px] overflow-y-auto bg-[radial-gradient(circle_at_top,#151827,#0d0f17_55%)] px-5 py-5"
          >
            {loading ? (
              <ChatSkeleton />
            ) : messages.length === 0 ? (
              <EmptyMessages />
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <Bubble key={m._id} m={m} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#26293a] px-5 py-5">
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                Reply
              </label>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending || conv?.status === "ENDED" || !canReply}
                placeholder={
                  !canReply
                    ? "You do not have reply permission."
                    : conv?.status === "ENDED"
                    ? "Chat ended."
                    : "Type your message..."
                }
                className="min-h-[120px] w-full resize-none rounded-[18px] border border-white/10 bg-[#0d0f17] px-4 py-3 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canReply) {
                    e.preventDefault();
                    send();
                  }
                }}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {canReply ? (
                  <button
                    onClick={send}
                    disabled={sending || conv?.status === "ENDED" || !text.trim()}
                    className={primaryBtnClass}
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                ) : (
                  <div className="text-[13px] text-amber-300">
                    You have view access only.
                  </div>
                )}

                <span className="text-[12px] text-[#7f879f]">
                  Enter to send • Shift+Enter for new line
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AdminChatDetailPage() {
  return (
    <AdminPageGuard permission="liveChatView">
      <ChatDetailInner />
    </AdminPageGuard>
  );
}

function StatusPill({ status }: { status: "OPEN" | "ENDED" }) {
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

function ChatSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={[
            "h-[78px] w-[70%] animate-pulse rounded-[20px] border border-white/5 bg-white/[0.03]",
            i % 2 === 0 ? "mr-auto" : "ml-auto",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function EmptyMessages() {
  return (
    <div className="flex h-full items-center justify-center text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px]">
          💬
        </div>

        <div className="mt-4 text-[18px] font-semibold text-white">
          No messages yet
        </div>

        <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
          Messages will appear here when the customer or admin sends a chat
          message.
        </p>
      </div>
    </div>
  );
}