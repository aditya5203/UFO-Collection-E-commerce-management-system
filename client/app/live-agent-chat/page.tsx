"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type ToastType = "success" | "error" | "info";

type Msg = {
  _id: string;
  senderRole: "user" | "admin" | "bot" | "system";
  text: string;
  createdAt: string;
};

type Conversation = {
  _id: string;
  status: "OPEN" | "ENDED";
  adminId?: string | null;
  orderId?: string | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

function fmtTime(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";

  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  return d.toLocaleString([], {
    month: isToday ? undefined : "short",
    day: isToday ? undefined : "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderUrl(orderId?: string | null) {
  const clean = String(orderId || "").trim().replace("#", "");
  if (!clean) return "";
  return `/customerorderdetails/${encodeURIComponent(clean)}`;
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[10000] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isUser = m.senderRole === "user";
  const isSystem = m.senderRole === "system";
  const isBot = m.senderRole === "bot";

  if (isSystem) {
    return (
      <div className="rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3 text-[13px] text-[#a7aec4]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <span className="min-w-0 whitespace-pre-wrap break-words">
            {m.text}
          </span>
          <span className="shrink-0 text-[11px] text-[#7f879f] sm:ml-4">
            {fmtTime(m.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "min-w-0 max-w-[88%] rounded-[20px] border px-4 py-3 sm:max-w-[78%]",
          isUser
            ? "border-[#d6c7ff]/25 bg-[#d6c7ff]/10 text-white"
            : "border-[#26293a] bg-[#161824] text-white",
        ].join(" ")}
      >
        <div className="text-[12px] font-semibold text-[#a7aec4]">
          {isUser ? "You" : isBot ? "UFO Bot" : "Agent"}
        </div>

        <div className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-6 text-[#f5f7fb]">
          {m.text}
        </div>

        <div className="mt-2 text-[11px] text-[#7f879f]">
          {fmtTime(m.createdAt)}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[20px] border border-[#26293a] bg-[#161824] px-4 py-3">
        <div className="text-[12px] font-semibold text-[#a7aec4]">Agent</div>
        <div className="mt-2 flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6c7ff]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6c7ff] [animation-delay:120ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6c7ff] [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

export default function LiveAgentChatPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const orderId = sp.get("orderId")?.trim() || undefined;
  const orderUrl = getOrderUrl(orderId);

  const socketRef = React.useRef<Socket | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [opening, setOpening] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [ending, setEnding] = React.useState(false);

  const [conv, setConv] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState("");

  const [socketConnected, setSocketConnected] = React.useState(false);
  const [typing, setTyping] = React.useState(false);

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);
  const typingTimerRef = React.useRef<number | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = React.useRef(false);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const scrollToBottom = React.useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  React.useEffect(() => {
    if (!didInitialScrollRef.current && messages.length > 0) {
      didInitialScrollRef.current = true;
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  React.useEffect(() => {
    if (messages.length > 0) {
      window.setTimeout(scrollToBottom, 50);
    }
  }, [messages, scrollToBottom]);

  const handleAuthStatus = React.useCallback(
    async (res: Response) => {
      if (res.status === 401) {
        showToast("Please login to continue chat.", "info");
        router.push("/login");
        return { handled: true, data: null as any };
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({} as any));
        const msg =
          data?.message ||
          "Access denied. Please login using a customer account.";
        setErr(msg);
        showToast(msg, "error");
        return { handled: true, data };
      }

      return { handled: false, data: null as any };
    },
    [router, showToast]
  );

  const openConversation = React.useCallback(
    async (forceNew = false) => {
      setErr("");
      setOpening(true);

      try {
        const body: Record<string, any> = {};
        if (orderId) body.orderId = orderId;
        if (forceNew) body.forceNew = true;

        const res = await fetch(`${API}/chat/open`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const auth = await handleAuthStatus(res);
        if (auth.handled) return;

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          const msg = data?.message || "Failed to open chat.";
          setErr(msg);
          showToast(msg, "error");
          return;
        }

        setConv(data?.conversation || null);
      } catch {
        setErr("Failed to open chat.");
        showToast("Failed to open chat.", "error");
      } finally {
        setOpening(false);
      }
    },
    [orderId, handleAuthStatus, showToast]
  );

  const loadMessages = React.useCallback(
    async (conversationId: string, silent = false) => {
      setErr("");
      if (!silent) setLoading(true);

      try {
        const res = await fetch(
          `${API}/chat/${conversationId}/messages?limit=200`,
          { credentials: "include", cache: "no-store" }
        );

        const auth = await handleAuthStatus(res);
        if (auth.handled) return;

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          const msg = data?.message || "Failed to load messages.";
          setErr(msg);
          showToast(msg, "error");
          return;
        }

        const msgs: Msg[] = data?.messages || [];
        setMessages(Array.isArray(msgs) ? msgs : []);

        if (silent) showToast("Chat refreshed.", "info");
      } catch {
        setErr("Failed to load messages.");
        showToast("Failed to load messages.", "error");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [handleAuthStatus, showToast]
  );

  React.useEffect(() => {
    openConversation();
  }, [openConversation]);

  React.useEffect(() => {
    if (!conv?._id) return;
    didInitialScrollRef.current = false;
    loadMessages(conv._id);
  }, [conv?._id, loadMessages]);

  React.useEffect(() => {
    if (!conv?._id) return;

    const socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("chat:join", { conversationId: conv._id });
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("chat:message", (payload: any) => {
      const conversationId = String(
        payload?.conversationId || payload?.conversation?._id || ""
      );

      if (conversationId && conversationId !== conv._id) return;

      const msg: Msg | null =
        payload?.message && typeof payload.message === "object"
          ? payload.message
          : payload?._id
            ? payload
            : null;

      if (!msg?._id) {
        loadMessages(conv._id, true);
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      if (msg.senderRole !== "user") {
        showToast("New reply received.", "info");
      }

      window.setTimeout(scrollToBottom, 60);
    });

    socket.on("chat:updated", (payload: any) => {
      const conversationId = String(
        payload?.conversationId || payload?.conversation?._id || ""
      );

      if (conversationId && conversationId !== conv._id) return;

      if (payload?.conversation?.status) {
        setConv((prev) =>
          prev
            ? {
                ...prev,
                status: payload.conversation.status,
                adminId: payload.conversation.adminId ?? prev.adminId,
              }
            : prev
        );
      }

      loadMessages(conv._id, true);
    });

    socket.on("chat:typing", (payload: any) => {
      const conversationId = String(payload?.conversationId || "");
      const role = String(payload?.senderRole || "");

      if (conversationId && conversationId !== conv._id) return;
      if (role === "user") return;

      setTyping(true);

      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }

      typingTimerRef.current = window.setTimeout(() => {
        setTyping(false);
      }, 1800);
    });

    return () => {
      socket.emit("chat:leave", { conversationId: conv._id });

      socket.off("connect");
      socket.off("disconnect");
      socket.off("chat:message");
      socket.off("chat:updated");
      socket.off("chat:typing");
      socket.disconnect();

      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [conv?._id, loadMessages, showToast, scrollToBottom]);

  const sendTyping = React.useCallback(() => {
    if (!conv?._id || conv.status === "ENDED") return;

    socketRef.current?.emit?.("chat:typing", {
      conversationId: conv._id,
      senderRole: "user",
    });
  }, [conv?._id, conv?.status]);

  const send = async () => {
    if (!conv?._id) return;

    if (conv.status === "ENDED") {
      showToast("This chat has already ended.", "error");
      return;
    }

    const t = text.trim();

    if (!t) {
      showToast("Please write a message first.", "error");
      return;
    }

    setSending(true);
    setErr("");

    try {
      const res = await fetch(`${API}/chat/${conv._id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });

      const auth = await handleAuthStatus(res);
      if (auth.handled) return;

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const msg = data?.message || "Failed to send message.";
        setErr(msg);
        showToast(msg, "error");
        return;
      }

      setText("");

      const msg = data?.message;
      if (msg?._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      } else {
        await loadMessages(conv._id, true);
      }

      showToast("Message sent.", "success");
      window.setTimeout(scrollToBottom, 60);
    } catch {
      setErr("Failed to send message.");
      showToast("Failed to send message.", "error");
    } finally {
      setSending(false);
    }
  };

  const endChat = async () => {
    if (!conv?._id) return;

    if (conv.status === "ENDED") {
      showToast("Chat already ended.", "info");
      return;
    }

    setEnding(true);
    setErr("");

    try {
      const res = await fetch(`${API}/chat/${conv._id}/end`, {
        method: "PATCH",
        credentials: "include",
      });

      const auth = await handleAuthStatus(res);
      if (auth.handled) return;

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const msg = data?.message || "Failed to end chat.";
        setErr(msg);
        showToast(msg, "error");
        return;
      }

      setConv((p) => (p ? { ...p, status: "ENDED" } : p));
      await loadMessages(conv._id, true);
      showToast("Chat ended.", "success");
      window.setTimeout(scrollToBottom, 60);
    } catch {
      setErr("Failed to end chat.");
      showToast("Failed to end chat.", "error");
    } finally {
      setEnding(false);
    }
  };

  const startNewChat = async () => {
    setConv(null);
    setMessages([]);
    setText("");
    setErr("");
    setTyping(false);
    didInitialScrollRef.current = false;
    setLoading(true);
    await openConversation(true);
  };

  const copyConversationId = async () => {
    if (!conv?._id) {
      showToast("Conversation ID not found.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(conv._id);
      showToast("Conversation ID copied.", "success");
    } catch {
      showToast("Unable to copy conversation ID.", "error");
    }
  };

  const agentStatus =
    conv?.status === "ENDED"
      ? "Ended"
      : conv?.adminId
        ? "Agent Connected"
        : "Agent Offline";

  const statusTone =
    conv?.status === "ENDED"
      ? "border-slate-500/30 bg-slate-500/10 text-slate-200"
      : conv?.adminId
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
        : "border-amber-500/30 bg-amber-500/10 text-amber-200";

  return (
    <>
      <CartHeader backHref="/profile" />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-6 text-[13px] text-[#a7aec4]">
            <Link href="/profile" className="transition hover:text-white">
              Profile
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Live Chat</span>
          </div>

          <section className={`${panelClass} overflow-hidden p-6 sm:p-8`}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Customer Support
                </div>

                <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                  Live Agent Chat
                </h1>

                <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-[#a7aec4] sm:text-[15px]">
                  Chat with the UFO Collection support team. Leave a message
                  even when agents are offline and get replies in real time.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {conv?._id ? (
                    <button
                      type="button"
                      onClick={() => loadMessages(conv._id, true)}
                      className={secondaryBtnClass}
                    >
                      Refresh Chat
                    </button>
                  ) : null}

                  {conv?._id ? (
                    <button
                      type="button"
                      onClick={copyConversationId}
                      className={secondaryBtnClass}
                    >
                      Copy Chat ID
                    </button>
                  ) : null}

                  {conv?.status === "ENDED" ? (
                    <button
                      type="button"
                      onClick={startNewChat}
                      disabled={opening}
                      className={primaryBtnClass}
                    >
                      Start New Chat
                    </button>
                  ) : null}

                  {orderUrl ? (
                    <button
                      type="button"
                      onClick={() => router.push(orderUrl)}
                      className={primaryBtnClass}
                    >
                      View Order
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                    Status
                  </div>

                  <div
                    className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] ${statusTone}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {opening ? "Opening..." : agentStatus}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                    Socket
                  </div>

                  <div
                    className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] ${
                      socketConnected
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-500/30 bg-slate-500/10 text-slate-200"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {socketConnected ? "Live Connected" : "Offline"}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                    Linked Order
                  </div>

                  <div className="mt-2 truncate text-[16px] font-semibold text-white">
                    {orderId || "No order linked"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {err ? (
            <div className="mt-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className={`${panelClass} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#26293a] px-5 py-4 sm:px-6">
                <div>
                  <div className="text-[20px] font-semibold text-white">
                    Conversation
                  </div>

                  <div className="mt-1 text-[13px] text-[#a7aec4]">
                    Enter to send • Shift+Enter for new line
                  </div>
                </div>

                {conv?.status === "ENDED" ? (
                  <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                    Ended
                  </span>
                ) : null}
              </div>

              <div
                ref={listRef}
                className="h-[520px] overflow-y-auto px-4 py-5 [overflow-wrap:anywhere] sm:px-6"
              >
                {opening || loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`flex ${
                          n % 2 === 0 ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className="w-[72%] rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                          <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
                          <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
                          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/5 text-2xl">
                        💬
                      </div>

                      <h2 className="mt-5 text-[22px] font-semibold text-white">
                        No messages yet
                      </h2>

                      <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-7 text-[#a7aec4]">
                        Start the conversation by sending your first message.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => (
                      <Bubble key={m._id} m={m} />
                    ))}

                    {typing ? <TypingIndicator /> : null}
                  </div>
                )}
              </div>

              <div className="border-t border-[#26293a] px-4 py-5 sm:px-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                  Your Message
                </div>

                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    sendTyping();
                  }}
                  placeholder={
                    conv?.status === "ENDED"
                      ? "Chat ended."
                      : "Type your message..."
                  }
                  disabled={sending || conv?.status === "ENDED"}
                  className="mt-3 min-h-[120px] w-full resize-none rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-[14px] leading-7 text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={send}
                    disabled={
                      sending || conv?.status === "ENDED" || !text.trim()
                    }
                    className={primaryBtnClass}
                  >
                    {sending ? "Sending..." : "Send Message"}
                  </button>

                  <button
                    type="button"
                    onClick={endChat}
                    disabled={ending || conv?.status === "ENDED" || !conv?._id}
                    className={secondaryBtnClass}
                  >
                    {conv?.status === "ENDED"
                      ? "Ended"
                      : ending
                        ? "Ending..."
                        : "End Chat"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setText("")}
                    disabled={!text.trim()}
                    className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="text-[20px] font-semibold text-white">
                  Quick Help
                </div>

                <p className="mt-2 text-[14px] leading-7 text-[#a7aec4]">
                  Try these common support questions while waiting for an agent.
                </p>

                <div className="mt-5 space-y-3 text-[14px] text-[#d6dbeb]">
                  {[
                    "Track my order / मेरो order कहाँ छ?",
                    "Delivery time / Delivery कति दिन?",
                    "Return policy / Return कसरी?",
                    "eSewa payment failed / eSewa चलेन",
                    "Size guide / कुन size?",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setText(item);
                        sendTyping();
                      }}
                      disabled={conv?.status === "ENDED"}
                      className="block w-full rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3 text-left transition hover:border-[#4a506b] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="text-[20px] font-semibold text-white">
                  Need faster help?
                </div>

                <p className="mt-2 text-[14px] leading-7 text-[#a7aec4]">
                  You can also track your order directly from the order tracking
                  page.
                </p>

                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/order-tracking")}
                    className={primaryBtnClass}
                  >
                    Order Tracking
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/profile/tickets")}
                    className={secondaryBtnClass}
                  >
                    Support Tickets
                  </button>

                  {orderUrl ? (
                    <button
                      type="button"
                      onClick={() => router.push(orderUrl)}
                      className={secondaryBtnClass}
                    >
                      View Order
                    </button>
                  ) : null}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      <MainFooter />
    </>
  );
}