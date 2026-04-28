"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import CollectionHeader from "@/components/layout/CollectionHeader";
import MainFooter from "@/components/layout/MainFooter";

type NotificationItem = {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: string;
  meta?: Record<string, any>;
};

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1000px] px-4 pb-8 pt-4 sm:px-5 sm:pb-10 sm:pt-6 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function pickId(n: NotificationItem) {
  return (n._id || n.id || "") as string;
}

function timeAgo(iso?: string) {
  if (!iso) return "";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);

  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function formatAbsoluteDate(iso?: string) {
  if (!iso) return "";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTypeLabel(n: NotificationItem) {
  const type = String(n.type || "").toLowerCase();
  const action = String(n.meta?.action || "").toLowerCase();

  if (type === "ticket") {
    if (action === "ticket_created") return "Support Ticket";
    if (action === "ticket_reply") return "Support Reply";
    if (action === "ticket_status_changed") return "Ticket Status";
    return "Ticket";
  }

  if (type === "order") return "Order";
  if (type === "payment") return "Payment";
  if (type === "chat") return "Chat";
  if (type === "promo" || type === "offer") return "Offer";
  if (type === "review") return "Review";
  if (type === "stock") return "Stock";
  if (type === "system") return "System";
  if (type === "product") return "Product";
  if (type === "account") return "Account";

  return "Notification";
}

function getTypeIcon(n: NotificationItem) {
  const type = String(n.type || "").toLowerCase();
  const action = String(n.meta?.action || "").toLowerCase();

  if (type === "ticket") {
    if (action === "ticket_created") return "🎫";
    if (action === "ticket_reply") return "💬";
    if (action === "ticket_status_changed") return "🛠️";
    return "🎫";
  }

  if (type === "order") return "📦";
  if (type === "payment") return "💳";
  if (type === "chat") return "💬";
  if (type === "promo" || type === "offer") return "🏷️";
  if (type === "review") return "⭐";
  if (type === "stock") return "📊";
  if (type === "system") return "🔔";
  if (type === "product") return "🛍️";
  if (type === "account") return "👤";

  return "🔔";
}

function getTypeChipClass(n: NotificationItem) {
  const type = String(n.type || "").toLowerCase();

  if (type === "ticket") {
    return "border-[#5a4375] bg-[#241a34] text-[#d8b8ff]";
  }

  if (type === "order") {
    return "border-[#35506f] bg-[#142234] text-[#9ed0ff]";
  }

  if (type === "payment") {
    return "border-[#4b6842] bg-[#192816] text-[#b8f1a7]";
  }

  if (type === "promo" || type === "offer") {
    return "border-[#6b5030] bg-[#2a1c0d] text-[#ffd59a]";
  }

  if (type === "product") {
    return "border-[#1d4f63] bg-[#0d2530] text-[#9fe7ff]";
  }

  if (type === "account") {
    return "border-[#4f3d6d] bg-[#1d1730] text-[#d5b8ff]";
  }

  if (type === "chat") {
    return "border-[#4f4f72] bg-[#191a2b] text-[#c7cbff]";
  }

  if (type === "system") {
    return "border-[#444861] bg-[#161924] text-[#cfd6f6]";
  }

  if (type === "stock") {
    return "border-[#46604b] bg-[#162119] text-[#b6f0c0]";
  }

  if (type === "review") {
    return "border-[#66511d] bg-[#2b220d] text-[#ffe39c]";
  }

  return "border-[#444861] bg-[#161924] text-[#cfd6f6]";
}

export default function NotificationsPage() {
  const router = useRouter();

  const BASE = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, "");

  const API_BASE = `${BASE}/api`;
  const SOCKET_BASE = BASE;

  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [markingAll, setMarkingAll] = React.useState(false);

  const socketRef = React.useRef<Socket | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.preload = "auto";
  }, []);

  const playNotificationSound = React.useCallback(() => {
    try {
      if (!audioRef.current) return;

      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } catch {
      // ignore autoplay block
    }
  }, []);

  const fetchNotifications = React.useCallback(
    async (showLoader = true) => {
      try {
        setErr(null);

        if (showLoader) {
          setLoading(true);
        }

        const res = await fetch(`${API_BASE}/notifications?limit=50`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const j = await safeJson(res);
          setErr((j as any)?.message || "Failed to load notifications.");
          setItems([]);
          return;
        }

        const j = await safeJson(res);

        const list: NotificationItem[] =
          (Array.isArray(j) && j) ||
          (Array.isArray((j as any)?.data) && (j as any).data) ||
          (Array.isArray((j as any)?.items) && (j as any).items) ||
          (Array.isArray((j as any)?.data?.items) && (j as any).data.items) ||
          [];

        setItems(Array.isArray(list) ? list : []);
      } catch {
        setErr("Failed to load notifications.");
        setItems([]);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [API_BASE]
  );

  React.useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  React.useEffect(() => {
    const onFocus = () => {
      fetchNotifications(false);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications(false);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchNotifications]);

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
      fetchNotifications(false);
    });

    socket.on("reconnect", () => {
      fetchNotifications(false);
    });

    socket.on(
      "notification:new",
      (payload: { notification?: NotificationItem }) => {
        const next = payload?.notification;
        if (!next) return;

        setItems((prev) => {
          const id = pickId(next);
          const exists = prev.some((item) => pickId(item) === id);

          if (exists) return prev;

          return [{ ...next, isRead: false }, ...prev];
        });

        playNotificationSound();
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_BASE, playNotificationSound, fetchNotifications]);

  const markRead = async (id: string) => {
    if (!id) return;

    setItems((prev) =>
      prev.map((n) => (pickId(n) === id ? { ...n, isRead: true } : n))
    );

    try {
      const res = await fetch(
        `${API_BASE}/notifications/${encodeURIComponent(id)}/read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!res.ok) {
        fetchNotifications(false);
      }
    } catch {
      fetchNotifications(false);
    }
  };

  const markAllRead = async () => {
    if (markingAll) return;

    const previous = items;

    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        setItems(previous);
      }
    } catch {
      setItems(previous);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter((n) => n.isRead === false).length;

  return (
    <>
      <CollectionHeader />

      <main className={shellClass}>
        <section className={containerClass}>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Notifications
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                Your Updates
              </h1>

              <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-[#a7aec4]">
                Order updates, ticket replies, payment alerts, product news and
                exclusive offers.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/homepage" className={secondaryBtnClass}>
                Back Home
              </Link>

              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll || items.length === 0}
                className={primaryBtnClass}
              >
                {markingAll ? "Marking..." : "Mark All Read"}
              </button>
            </div>
          </div>

          <div className={`${panelClass} p-5 sm:p-6`}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Inbox
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Notification Center
                </h2>
              </div>

              <div className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c7cce4]">
                Unread:{" "}
                <span className="text-white">{unreadCount}</span>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-[18px] border border-[#26293a] bg-[#161824] p-4"
                  >
                    <div className="flex gap-3">
                      <div className="h-[42px] w-[42px] animate-pulse rounded-full bg-white/5" />
                      <div className="flex-1">
                        <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
                        <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/5" />
                        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : err ? (
              <div className="rounded-[18px] border border-red-400/30 bg-red-500/10 p-5 text-[14px] text-red-200">
                {err}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[18px] border border-[#26293a] bg-[#161824] p-8 text-center">
                <div className="text-[28px]">🔔</div>

                <h3 className="mt-3 text-[22px] font-semibold text-white">
                  No notifications yet
                </h3>

                <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-7 text-[#a7aec4]">
                  Your order updates, messages and offers will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((n) => {
                  const id = pickId(n);
                  const unread = n.isRead === false;
                  const typeLabel = getTypeLabel(n);
                  const typeIcon = getTypeIcon(n);

                  return (
                    <button
                      key={id || `${n.title}-${n.createdAt}`}
                      type="button"
                      onClick={() => {
                        if (id) void markRead(id);
                        if (n.link) router.push(n.link);
                      }}
                      className={`w-full rounded-[18px] border p-4 text-left transition hover:-translate-y-0.5 ${
                        unread
                          ? "border-[#4a506b] bg-white/[0.07] shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
                          : "border-[#26293a] bg-[#161824] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[18px]">
                            {typeIcon}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-[14px] font-semibold text-white">
                                {n.title || "Notification"}
                              </div>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getTypeChipClass(
                                  n
                                )}`}
                              >
                                {typeLabel}
                              </span>
                            </div>

                            {n.message ? (
                              <div className="mt-1 text-[12px] leading-[1.7] text-[#a7aec4]">
                                {n.message}
                              </div>
                            ) : null}

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8b90ad]">
                              {timeAgo(n.createdAt) ? (
                                <span>{timeAgo(n.createdAt)}</span>
                              ) : null}

                              {n.createdAt ? <span>•</span> : null}

                              {formatAbsoluteDate(n.createdAt) ? (
                                <span>{formatAbsoluteDate(n.createdAt)}</span>
                              ) : null}
                            </div>

                            {n.link ? (
                              <div className="mt-3 text-[12px] font-semibold text-[#d6c7ff] underline underline-offset-4">
                                Open notification
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {unread ? (
                          <span className="mt-1 h-[10px] w-[10px] shrink-0 rounded-full bg-red-500" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <MainFooter />
    </>
  );
}