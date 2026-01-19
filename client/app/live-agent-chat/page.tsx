"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

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

function fmtTime(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { hour: "2-digit", minute: "2-digit" });
}

function Bubble({ m }: { m: Msg }) {
  const isUser = m.senderRole === "user";
  const isSystem = m.senderRole === "system";
  const isBot = m.senderRole === "bot";

  if (isSystem) {
    return (
      <div className="rounded-[10px] border border-[#2b2f45] bg-[#070a12] px-4 py-3 text-sm text-[#9aa3cc]">
        {/* ✅ prevents overlap: stack on small screens, wrap text */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <span className="min-w-0 whitespace-pre-wrap break-words">
            {m.text}
          </span>
          <span className="shrink-0 text-xs text-[#7c86b1] sm:ml-4">
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
          "min-w-0 max-w-[78%] rounded-[12px] border px-4 py-3",
          isUser
            ? "border-[#2b2f45] bg-[#1f7cff]/10 text-white"
            : "border-[#2b2f45] bg-[#070a12] text-white",
        ].join(" ")}
      >
        <div className="text-xs font-semibold text-[#9aa3cc]">
          {isUser ? "You" : isBot ? "UFO Bot" : "Agent"}
        </div>
        <div className="mt-1 whitespace-pre-wrap break-words text-sm">
          {m.text}
        </div>
        <div className="mt-2 text-xs text-[#7c86b1]">{fmtTime(m.createdAt)}</div>
      </div>
    </div>
  );
}

export default function LiveAgentChatPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // optional: open chat about a specific order
  const orderId = sp.get("orderId") || undefined;

  const [loading, setLoading] = React.useState(true);
  const [opening, setOpening] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [ending, setEnding] = React.useState(false);

  const [conv, setConv] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState("");

  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  // ✅ Helper: handle auth errors consistently
  const handleAuthStatus = React.useCallback(
    async (res: Response) => {
      if (res.status === 401) {
        router.push("/login");
        return { handled: true, data: null as any };
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({} as any));
        setErr(
          data?.message ||
            "Access denied. Please login using a customer account."
        );
        return { handled: true, data };
      }

      return { handled: false, data: null as any };
    },
    [router]
  );

  const openConversation = React.useCallback(async () => {
    setErr("");
    setOpening(true);

    try {
      const res = await fetch(`${API}/chat/open`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderId ? { orderId } : {}),
      });

      const auth = await handleAuthStatus(res);
      if (auth.handled) return;

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setErr(data?.message || "Failed to open chat.");
        return;
      }

      setConv(data?.conversation || null);
    } catch (e) {
      console.error(e);
      setErr("Failed to open chat.");
    } finally {
      setOpening(false);
    }
  }, [orderId, handleAuthStatus]);

  const loadMessages = React.useCallback(
    async (conversationId: string) => {
      setErr("");
      setLoading(true);

      try {
        const res = await fetch(
          `${API}/chat/${conversationId}/messages?limit=200`,
          { credentials: "include" }
        );

        const auth = await handleAuthStatus(res);
        if (auth.handled) return;

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          setErr(data?.message || "Failed to load messages.");
          return;
        }

        const msgs: Msg[] = data?.messages || [];
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (e) {
        console.error(e);
        setErr("Failed to load messages.");
      } finally {
        setLoading(false);
      }
    },
    [handleAuthStatus]
  );

  React.useEffect(() => {
    openConversation();
  }, [openConversation]);

  React.useEffect(() => {
    if (!conv?._id) return;
    loadMessages(conv._id);
  }, [conv?._id, loadMessages]);

  React.useEffect(() => {
    if (!conv?._id) return;
    const t = setInterval(() => {
      loadMessages(conv._id);
    }, 2500);
    return () => clearInterval(t);
  }, [conv?._id, loadMessages]);

  const send = async () => {
    if (!conv?._id) return;
    if (conv.status === "ENDED") return;

    const t = text.trim();
    if (!t) return;

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
        setErr(data?.message || "Failed to send message.");
        return;
      }

      setText("");
      await loadMessages(conv._id);
    } catch (e) {
      console.error(e);
      setErr("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const endChat = async () => {
    if (!conv?._id) return;
    if (conv.status === "ENDED") return;

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
        setErr(data?.message || "Failed to end chat.");
        return;
      }

      setConv((p) => (p ? { ...p, status: "ENDED" } : p));
      await loadMessages(conv._id);
    } catch (e) {
      console.error(e);
      setErr("Failed to end chat.");
    } finally {
      setEnding(false);
    }
  };

  const agentStatus =
    conv?.status === "ENDED"
      ? "Ended"
      : conv?.adminId
      ? "Agent Connected"
      : "Agent Offline";

  return (
    <>
      {/* Header like Cart */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-2">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-white">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-10">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <Link href="/wishlist" aria-label="Wishlist" title="Wishlist">
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt="Wishlist icon"
              className="brightness-0 invert"
            />
          </Link>
        </div>
      </header>

      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <h1 className="text-[36px] font-semibold">Customer Support Chat</h1>
          <div className="mt-6 h-px bg-[#2b2f45]" />

          <div className="mt-6 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[#9aa3cc]">Status:</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2b2f45] bg-[#070a12] px-3 py-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-[#1f7cff]" />
                <span className="font-semibold text-white">{agentStatus}</span>
              </span>

              {orderId ? (
                <span className="text-sm text-[#9aa3cc]">
                  Order: <span className="text-white">{orderId}</span>
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-[#9aa3cc] text-sm">
              If no agent is available, you can still leave a message. An agent
              will reply once online.
            </p>
          </div>

          {err ? (
            <div className="mt-6 rounded-[12px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px]">
            {/* Chat */}
            <section className="rounded-[10px] border border-[#2b2f45] bg-[#0b0f1a]/60">
              <div className="border-b border-[#2b2f45] px-6 py-4 text-[#dfe3ff]">
                Conversation
              </div>

              {/* ✅ overflow wrap prevents any overlap */}
              <div
                ref={listRef}
                className="h-[520px] overflow-y-auto px-6 py-6 [overflow-wrap:anywhere]"
              >
                {opening ? (
                  <div className="text-sm text-[#9aa3cc]">Opening chat…</div>
                ) : loading ? (
                  <div className="text-sm text-[#9aa3cc]">Loading…</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-[#9aa3cc]">No messages yet.</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => (
                      <Bubble key={m._id} m={m} />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-[#2b2f45]" />

              <div className="px-6 py-6">
                <div className="text-sm font-medium text-[#dfe3ff]">
                  Your Message
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    conv?.status === "ENDED" ? "Chat ended." : "Type your message..."
                  }
                  disabled={sending || conv?.status === "ENDED"}
                  className="mt-3 min-h-[120px] w-full rounded-[10px] border border-[#2b2f45] bg-[#070a12] px-4 py-3 text-white placeholder:text-[#7c86b1] outline-none disabled:opacity-60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || conv?.status === "ENDED" || !text.trim()}
                    className="rounded-[10px] bg-[#1f7cff] px-6 py-3 font-semibold disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>

                  <button
                    type="button"
                    onClick={endChat}
                    disabled={ending || conv?.status === "ENDED"}
                    className="rounded-[10px] border border-[#2b2f45] px-6 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {conv?.status === "ENDED"
                      ? "Ended"
                      : ending
                      ? "Ending..."
                      : "End Chat"}
                  </button>

                  <span className="text-xs text-[#7c86b1]">
                    Enter to send • Shift+Enter for new line
                  </span>
                </div>
              </div>
            </section>

            {/* Help box */}
            <aside>
              <h2 className="text-[22px] font-semibold">Quick Help</h2>

              <div className="mt-6 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-[#9aa3cc]">
                <div className="space-y-3 text-sm">
                  <p className="text-white font-semibold">Try asking:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>“Track my order” / “मेरो order कहाँ छ?”</li>
                    <li>“Delivery time?” / “Delivery कति दिन?”</li>
                    <li>“Return policy” / “Return कसरी?”</li>
                    <li>“eSewa payment failed” / “eSewa चलेन”</li>
                    <li>“Size guide” / “कुन size?”</li>
                  </ul>
                </div>

                <div className="mt-6 h-px bg-[#2b2f45]" />

                <button
                  type="button"
                  onClick={() => router.push("/order-tracking")}
                  className="mt-6 w-full rounded-[10px] bg-[#1f7cff] py-3 font-semibold text-white"
                >
                  Go to Order Tracking
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
