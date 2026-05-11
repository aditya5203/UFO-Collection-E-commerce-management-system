"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

import ChatHelpSidebar from "./_components/ChatHelpSidebar";
import ChatHero from "./_components/ChatHero";
import ChatWindow from "./_components/ChatWindow";
import ToastMessage from "./_components/ToastMessage";
import { Conversation, Msg, ToastType } from "./_components/chatTypes";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

function getOrderUrl(orderId?: string | null) {
  const clean = String(orderId || "").trim().replace("#", "");
  if (!clean) return "";
  return `/customerorderdetails/${encodeURIComponent(clean)}`;
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

  return (
    <>
      <CartHeader backHref="/profile" />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <ChatHero
            conv={conv}
            orderId={orderId}
            orderUrl={orderUrl}
            opening={opening}
            socketConnected={socketConnected}
            onRefresh={() => {
              if (conv?._id) loadMessages(conv._id, true);
            }}
            onCopyConversationId={copyConversationId}
            onStartNewChat={startNewChat}
            onViewOrder={() => router.push(orderUrl)}
          />

          {err ? (
            <div className="mt-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <ChatWindow
              conv={conv}
              messages={messages}
              opening={opening}
              loading={loading}
              typing={typing}
              text={text}
              sending={sending}
              ending={ending}
              listRef={listRef}
              onTextChange={(value) => {
                setText(value);
                sendTyping();
              }}
              onSend={send}
              onEndChat={endChat}
              onClear={() => setText("")}
            />

            <ChatHelpSidebar
              orderUrl={orderUrl}
              disabled={conv?.status === "ENDED"}
              onSetQuickText={(value) => {
                setText(value);
                sendTyping();
              }}
              onOrderTracking={() => router.push("/order-tracking")}
              onSupportTickets={() => router.push("/profile/tickets")}
              onViewOrder={() => router.push(orderUrl)}
            />
          </div>
        </div>
      </main>

      <MainFooter />
    </>
  );
}