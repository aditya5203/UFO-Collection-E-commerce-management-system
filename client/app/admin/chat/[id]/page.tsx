"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

function fmtTime(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function Bubble({ m }: { m: Message }) {
  const isUser = m.senderRole === "user";
  const isSystem = m.senderRole === "system";
  const isBot = m.senderRole === "bot";

  if (isSystem) {
    return (
      <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span>{m.text}</span>
          <span className="text-xs text-slate-500">{fmtTime(m.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={[
          "max-w-[78%] rounded-2xl border px-4 py-3 text-sm text-white",
          isUser
            ? "border-slate-800/70 bg-slate-950/35"
            : "border-emerald-500/25 bg-emerald-500/10",
        ].join(" ")}
      >
        <div className="text-xs font-semibold text-slate-300">
          {isUser ? "Customer" : isBot ? "Bot" : "Admin"}
        </div>
        <div className="mt-1 whitespace-pre-wrap">{m.text}</div>
        <div className="mt-2 text-xs text-slate-500">{fmtTime(m.createdAt)}</div>
      </div>
    </div>
  );
}

export default function AdminChatDetailPage() {
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

  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const load = React.useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/chat/conversations/${id}/messages`, {
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/admin/adminlogin");
        return;
      }

      const data = await res.json().catch(() => ({} as any));
      const msgs: Message[] = data?.messages || [];
      setMessages(Array.isArray(msgs) ? msgs : []);

      // minimal conversation object (optional improvement: backend endpoint to fetch conversation)
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
    if (!t) return;
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

      // optimistic append
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
    if (ending) return;
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
    <div className="p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Chat Details</h1>
          <p className="mt-1 text-sm text-slate-300">
            Conversation ID: <span className="text-slate-100">{id}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/chat"
            className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900/70"
          >
            Back to Inbox
          </Link>

          <button
            onClick={load}
            className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900/70"
          >
            Refresh
          </button>

          <button
            onClick={endChat}
            disabled={ending || conv?.status === "ENDED"}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/15 disabled:opacity-50"
          >
            {conv?.status === "ENDED"
              ? "Chat Ended"
              : ending
              ? "Ending..."
              : "End Chat"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/30">
        {/* Messages */}
        <div ref={listRef} className="h-[520px] overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="text-sm text-slate-300">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-slate-300">No messages yet.</div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <Bubble key={m._id} m={m} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800/70" />

        {/* Reply box */}
        <div className="px-5 py-5">
          <label className="text-sm font-semibold text-slate-200">Reply</label>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending || conv?.status === "ENDED"}
            placeholder={conv?.status === "ENDED" ? "Chat ended." : "Type your message..."}
            className="mt-3 min-h-[120px] w-full resize-none rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={send}
              disabled={sending || conv?.status === "ENDED" || !text.trim()}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>

            <span className="text-xs text-slate-500">
              Enter to send • Shift+Enter for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
