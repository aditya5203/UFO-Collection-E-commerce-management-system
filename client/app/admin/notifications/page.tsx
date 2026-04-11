"use client";

import * as React from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

type AdminNotification = {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function pickId(n: AdminNotification) {
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

export default function AdminNotificationsPage() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<AdminNotification[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const socketRef = React.useRef<Socket | null>(null);

  const fetchAll = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/notifications/admin?limit=50`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/adminlogin";
        return;
      }

      const json = await res.json().catch(() => ({} as any));

      const list: AdminNotification[] =
        json?.items || json?.data || json?.notifications || [];

      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();

    const socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      fetchAll();
    });

    socket.on("admin:notification:new", (payload: any) => {
      const next = payload?.notification;
      if (!next) return;

      setItems((prev) => {
        const id = String(next?._id || next?.id || "");
        if (!id) return [next, ...prev];

        const exists = prev.some((item) => pickId(item) === id);
        if (exists) return prev;

        return [next, ...prev];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchAll]);

  const markOneRead = React.useCallback(async (id: string) => {
    if (!id) return;

    setItems((prev) =>
      prev.map((item) =>
        pickId(item) === id ? { ...item, isRead: true } : item
      )
    );

    try {
      await fetch(
        `${API_BASE_URL}/api/notifications/admin/${encodeURIComponent(id)}/read`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch {}
  }, []);

  const markAllRead = React.useCallback(async () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));

    try {
      await fetch(`${API_BASE_URL}/api/notifications/admin/read-all`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {}
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-white">Notifications</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllRead}
            className="rounded-lg border border-[#1f2937] px-3 py-2 text-[12px] text-[#9ca3af] hover:text-white"
          >
            Mark all read
          </button>

          <Link
            href="/admin/dashboard"
            className="text-[12px] text-[#60a5fa] hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {loading && <div className="text-[13px] text-[#9ca3af]">Loading…</div>}

      {error && (
        <div className="rounded-[14px] border border-[#111827] bg-[#020617] p-4 text-[13px] text-[#fca5a5]">
          {error}
          <div className="mt-2">
            <button
              onClick={fetchAll}
              className="rounded-lg bg-[#2563eb] px-3 py-2 text-[12px] text-white hover:bg-[#1d4ed8]"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-[14px] border border-[#111827] bg-[#020617]">
          {items.length === 0 ? (
            <div className="px-4 py-4 text-[13px] text-[#9ca3af]">
              No notifications yet.
            </div>
          ) : (
            items.map((n) => {
              const id = pickId(n);
              const isRead = Boolean(n.isRead);

              return (
                <Link
                  key={id || `${n.title}-${n.createdAt}`}
                  href={n.link || "#"}
                  onClick={() => {
                    if (id && !isRead) {
                      markOneRead(id);
                    }
                  }}
                  className="block border-b border-[#111827] px-4 py-3 hover:bg-[#0b1220]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-white">
                        {n.title || "Notification"}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[12px] text-[#9ca3af]">
                        {n.message || ""}
                      </div>
                      <div className="mt-2 text-[11px] text-[#6b7280]">
                        {timeAgo(n.createdAt)}
                        {n.type ? ` • ${n.type}` : ""}
                      </div>
                    </div>

                    {!isRead && (
                      <span className="mt-[6px] h-[8px] w-[8px] flex-none rounded-full bg-[#60a5fa]" />
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}