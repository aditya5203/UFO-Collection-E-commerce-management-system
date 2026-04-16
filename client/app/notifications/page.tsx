"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

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

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
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
        if (showLoader) setLoading(true);

        const res = await fetch(`${API_BASE}/notifications?limit=50`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const j = await safeJson(res);
          setErr((j as any)?.message || "Failed to load notifications");
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
        setErr("Failed to load notifications");
        setItems([]);
      } finally {
        if (showLoader) setLoading(false);
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

    socket.on("notification:new", (payload: { notification?: NotificationItem }) => {
      const next = payload?.notification;
      if (!next) return;

      setItems((prev) => {
        const id = pickId(next);
        const exists = prev.some((item) => pickId(item) === id);
        if (exists) return prev;
        return [{ ...next, isRead: false }, ...prev];
      });

      playNotificationSound();
    });

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
      <header className="sticky top-0 z-40 h-[80px] border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-full w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-[10px]">
            <div className="h-[44px] w-[44px] overflow-hidden rounded-full border-2 border-white">
              <Image
                src="/images/logo.png"
                alt="UFO Collection logo"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="text-[28px] font-bold uppercase tracking-[0.18em] text-white max-sm:text-[22px]">
              UFO Collection
            </div>
          </div>

          <nav className="flex gap-[42px] max-sm:flex-wrap max-sm:gap-5">
            <Link
              href="/homepage"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/homepage")}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[12px] uppercase tracking-[0.16em] text-white hover:bg-white/10"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-[#050611] text-white">
        <div className="mx-auto w-full max-w-[900px] px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[12px] uppercase tracking-[0.18em] text-[#8b90ad]">
                Notifications
              </div>
              <h1 className="mt-2 text-[26px] font-semibold">Your Updates</h1>
              <p className="mt-1 text-[13px] text-[#8b90ad]">
                Order updates, ticket replies, payment alerts and offers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-[#c7cce4]">
                Unread: <span className="font-semibold text-white">{unreadCount}</span>
              </div>

              <button
                onClick={() => router.push("/homepage")}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[12px] uppercase tracking-[0.16em] hover:bg-white/10"
              >
                Back
              </button>

              <button
                onClick={markAllRead}
                disabled={markingAll || items.length === 0}
                className={`rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.16em] ${
                  markingAll || items.length === 0
                    ? "cursor-not-allowed bg-white/20 text-white/50"
                    : "bg-white text-[#050611] hover:bg-white/90"
                }`}
              >
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[18px] border border-[#1f2136] bg-[#0b0d1a] p-4">
            {loading ? (
              <div className="p-6 text-white/70">Loading notifications…</div>
            ) : err ? (
              <div className="p-6 text-red-300">{err}</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-[#8b90ad]">No notifications yet.</div>
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
                      className={`w-full rounded-[16px] border p-4 text-left transition ${
                        unread
                          ? "border-[#3a3d5a] bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:bg-white/10"
                          : "border-[#22253a] bg-transparent hover:bg-white/5"
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
                              <div className="mt-1 text-[12px] leading-[1.7] text-[#9aa3cc]">
                                {n.message}
                              </div>
                            ) : null}

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8b90ad]">
                              <span>{timeAgo(n.createdAt)}</span>
                              {n.createdAt ? <span>•</span> : null}
                              <span>{formatAbsoluteDate(n.createdAt)}</span>
                            </div>

                            {n.link ? (
                              <div className="mt-3 text-[12px] text-white/80 underline underline-offset-4">
                                Open
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
        </div>
      </main>
    </>
  );
}