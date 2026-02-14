"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type NotificationItem = {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: string;
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

export default function NotificationsPage() {
  const router = useRouter();
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api";

  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setErr(null);
      setLoading(true);

      // ✅ Adjust endpoint if your backend uses different route
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

      setItems(list);
    } catch {
      setErr("Failed to load notifications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    if (!id) return;

    // optimistic
    setItems((prev) =>
      prev.map((n) => (pickId(n) === id ? { ...n, isRead: true } : n))
    );

    try {
      // ✅ Adjust endpoint if needed
      await fetch(`${API_BASE}/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch {
      // ignore (UI already updated)
    }
  };

  const markAllRead = async () => {
    // optimistic
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      // ✅ Adjust endpoint if needed
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-40 h-[80px] border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-full w-full max-w-[1160px] items-center justify-between px-4">
          {/* Brand */}
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

          {/* Nav */}
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

          {/* Right Actions */}
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

      {/* PAGE */}
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

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/homepage")}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[12px] uppercase tracking-[0.16em] hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={markAllRead}
                className="rounded-full bg-white px-5 py-2 text-[12px] uppercase tracking-[0.16em] text-[#050611] hover:bg-white/90"
              >
                Mark all read
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

                  return (
                    <button
                      key={id || `${n.title}-${n.createdAt}-${Math.random()}`}
                      type="button"
                      onClick={() => {
                        if (id) markRead(id);
                        if (n.link) router.push(n.link);
                      }}
                      className={`w-full rounded-[14px] border p-4 text-left transition ${
                        unread
                          ? "border-[#3a3d5a] bg-white/5 hover:bg-white/10"
                          : "border-[#22253a] bg-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-semibold text-white">
                            {n.title || "Notification"}
                          </div>
                          {n.message ? (
                            <div className="mt-1 text-[12px] leading-[1.7] text-[#9aa3cc]">
                              {n.message}
                            </div>
                          ) : null}
                          <div className="mt-2 text-[11px] text-[#8b90ad]">
                            {n.type ? `${n.type} • ` : ""}
                            {timeAgo(n.createdAt)}
                          </div>
                        </div>

                        {unread ? (
                          <span className="mt-1 h-[10px] w-[10px] rounded-full bg-red-500" />
                        ) : null}
                      </div>

                      {n.link ? (
                        <div className="mt-3 text-[12px] text-white/80 underline underline-offset-4">
                          Open
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-[12px] text-[#8b90ad]">
            Tip: If this page shows error, your backend route might be different.
          </div>
        </div>
      </main>
    </>
  );
}
