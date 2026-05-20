// client/app/admin/chat/[id]/page.tsx
"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../../_components/AdminPageGuard";
import {
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../../_components/adminPermissions";

type MessageSenderRole = "user" | "admin" | "bot" | "system";
type ConversationStatus = "OPEN" | "ENDED";

type Message = {
  _id: string;
  senderRole: MessageSenderRole;
  text: string;
  createdAt: string;
};

type Conversation = {
  _id: string;
  status: ConversationStatus;
};

type ChatSocketPayload = {
  conversationId?: string;
  _id?: string;
  id?: string;
  status?: ConversationStatus;
  message?: any;
  text?: string;
  senderRole?: MessageSenderRole | "customer";
  createdAt?: string;
  updatedAt?: string;
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

const MAX_MESSAGE_LENGTH = 2000;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const dangerBtnClass =
  "rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60";

function fmtTime(s?: string) {
  if (!s) return "";

  const d = new Date(s);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status?: string): ConversationStatus {
  return status === "ENDED" ? "ENDED" : "OPEN";
}

function normalizeSenderRole(role?: string): MessageSenderRole {
  if (role === "admin") return "admin";
  if (role === "bot") return "bot";
  if (role === "system") return "system";
  return "user";
}

function normalizeMessage(row: any, fallbackId?: string): Message {
  return {
    _id: String(row?._id || row?.id || fallbackId || `msg-${Date.now()}`),
    senderRole: normalizeSenderRole(row?.senderRole || row?.sender || row?.role),
    text: String(row?.text || row?.message || row?.content || ""),
    createdAt: String(row?.createdAt || row?.timestamp || new Date().toISOString()),
  };
}

function normalizeConversation(row: any, fallbackId: string): Conversation {
  return {
    _id: String(row?._id || row?.id || row?.conversationId || fallbackId),
    status: normalizeStatus(row?.status),
  };
}

function getPayloadConversationId(payload: ChatSocketPayload) {
  return String(payload?.conversationId || payload?._id || payload?.id || "").trim();
}

function getSocketMessage(payload: ChatSocketPayload): Message | null {
  const rawMessage = payload?.message || payload;

  const text = String(
    rawMessage?.text ||
      rawMessage?.message ||
      rawMessage?.content ||
      payload?.text ||
      ""
  ).trim();

  if (!text) return null;

  return normalizeMessage(rawMessage, `socket-${Date.now()}`);
}

function messageExists(messages: Message[], incoming: Message) {
  const incomingId = String(incoming._id || "");
  const incomingText = String(incoming.text || "").trim();
  const incomingTime = new Date(incoming.createdAt).getTime();

  if (incomingId && messages.some((m) => String(m._id) === incomingId)) {
    return true;
  }

  return messages.some((m) => {
    if (m.senderRole !== incoming.senderRole) return false;
    if (String(m.text || "").trim() !== incomingText) return false;

    const existingTime = new Date(m.createdAt).getTime();

    if (!Number.isFinite(existingTime) || !Number.isFinite(incomingTime)) {
      return false;
    }

    return Math.abs(existingTime - incomingTime) < 3000;
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

function Bubble({ m }: { m: Message }) {
  const isUser = m.senderRole === "user";
  const isSystem = m.senderRole === "system";
  const isBot = m.senderRole === "bot";

  if (isSystem) {
    return (
      <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-[#a7aec4]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="whitespace-pre-wrap">{m.text}</span>
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
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const [canReply, setCanReply] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const loadRef = React.useRef<(() => Promise<void>) | null>(null);

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  }

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
    if (!id) return;

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

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load chat.");
      }

      const rawMessages = Array.isArray((data as any)?.messages)
        ? (data as any).messages
        : Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : [];

      const nextMessages: Message[] = rawMessages
        .map((m: any, index: number) => normalizeMessage(m, `msg-${index}`))
        .filter((m: Message) => Boolean(m._id));

      const rawConversation =
        (data as any)?.conversation ||
        (data as any)?.conv ||
        (data as any)?.chat ||
        null;

      setMessages(nextMessages);
      setConv(normalizeConversation(rawConversation, id));
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Failed to load chat.");
      setConv((p) => p ?? { _id: id, status: "OPEN" });
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  React.useEffect(() => {
    loadRef.current = load;
  }, [load]);

  React.useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  React.useEffect(() => {
    if (!id) return;

    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("chat:join", { conversationId: id });
      loadRef.current?.();
    });

    socket.on("connect_error", () => {
      showToast({
        type: "info",
        message: "Live chat updates are reconnecting.",
      });
    });

    const handleMessage = (payload: ChatSocketPayload) => {
      const conversationId = getPayloadConversationId(payload);

      if (conversationId && conversationId !== id) return;

      const incoming = getSocketMessage(payload);

      if (!incoming) return;

      setMessages((prev) => {
        if (messageExists(prev, incoming)) return prev;
        return [...prev, incoming];
      });

      if (payload?.status) {
        setConv((prev) =>
          prev
            ? { ...prev, status: normalizeStatus(payload.status) }
            : { _id: id, status: normalizeStatus(payload.status) }
        );
      }
    };

    const handleConversationUpdate = (payload: ChatSocketPayload) => {
      const conversationId = getPayloadConversationId(payload);

      if (conversationId && conversationId !== id) return;

      if (payload?.status) {
        setConv((prev) =>
          prev
            ? { ...prev, status: normalizeStatus(payload.status) }
            : { _id: id, status: normalizeStatus(payload.status) }
        );
      }

      const incoming = getSocketMessage(payload);

      if (incoming) {
        setMessages((prev) => {
          if (messageExists(prev, incoming)) return prev;
          return [...prev, incoming];
        });
      }
    };

    socket.on("chat:new_message", handleMessage);
    socket.on("admin:chat:new_message", handleMessage);
    socket.on("chat:conversation:updated", handleConversationUpdate);
    socket.on("admin:chat:conversation:updated", handleConversationUpdate);

    return () => {
      socket.emit("chat:leave", { conversationId: id });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  const send = async () => {
    const t = text.trim();

    if (!t || !canReply) return;

    if (conv?.status === "ENDED") {
      setErr("This chat has already ended.");
      return;
    }

    if (t.length > MAX_MESSAGE_LENGTH) {
      setErr(`Message must be under ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setSending(true);
    setErr("");

    try {
      const res = await fetch(`${API}/admin/chat/conversations/${id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        setErr((data as any)?.message || "Failed to send message.");
        return;
      }

      setText("");

      const rawMessage = (data as any)?.message || (data as any)?.item || null;

      if (rawMessage) {
        const nextMessage = normalizeMessage(rawMessage);

        setMessages((prev) => {
          if (messageExists(prev, nextMessage)) return prev;
          return [...prev, nextMessage];
        });
      } else {
        await load();
      }

      showToast({
        type: "success",
        message: "Message sent successfully.",
      });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const endChat = async () => {
    if (!canReply || ending) return;

    if (conv?.status === "ENDED") return;

    setEnding(true);
    setErr("");

    try {
      const res = await fetch(`${API}/admin/chat/conversations/${id}/end`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        setErr((data as any)?.message || "Failed to end chat.");
        return;
      }

      setConv((p) => (p ? { ...p, status: "ENDED" } : { _id: id, status: "ENDED" }));

      showToast({
        type: "success",
        message: "Chat ended successfully.",
      });

      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Failed to end chat.");
    } finally {
      setEnding(false);
    }
  };

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

              <button
                type="button"
                onClick={load}
                disabled={loading}
                className={secondaryBtnClass}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              {canReply ? (
                <button
                  type="button"
                  onClick={endChat}
                  disabled={ending || conv?.status === "ENDED"}
                  className={dangerBtnClass}
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
          <AlertBox type="error" message={err} onClose={() => setErr("")} />
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
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="admin-chat-reply"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
                >
                  Reply
                </label>

                <span
                  className={[
                    "text-[11px]",
                    text.length > MAX_MESSAGE_LENGTH
                      ? "text-red-300"
                      : "text-[#7f879f]",
                  ].join(" ")}
                >
                  {text.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>

              <textarea
                id="admin-chat-reply"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending || conv?.status === "ENDED" || !canReply}
                maxLength={MAX_MESSAGE_LENGTH + 100}
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
                    type="button"
                    onClick={send}
                    disabled={
                      sending ||
                      conv?.status === "ENDED" ||
                      !text.trim() ||
                      text.trim().length > MAX_MESSAGE_LENGTH
                    }
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

function StatusPill({ status }: { status: ConversationStatus }) {
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
