// client/app/admin/notifications/page.tsx
"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../_components/AdminPageGuard";

type AdminNotification = {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: string;
  updatedAt?: string;
  audience?: string;
  meta?: Record<string, unknown>;
};

type FilterValue = "all" | "unread" | "read";

const RAW_API_BASE =
  API_BASE_URL;

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

const SOCKET_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE.replace(/\/api$/, "")
  : CLEAN_API_BASE;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function pickId(n: AdminNotification) {
  return String(n._id || n.id || "");
}

function safeJsonParse<T = unknown>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function safeJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  return text ? safeJsonParse<T>(text) || ({} as T) : ({} as T);
}

function normalizeNotification(row: any): AdminNotification {
  return {
    _id: String(row?._id || row?.id || ""),
    id: String(row?.id || row?._id || ""),
    title: String(row?.title || "Notification"),
    message: String(row?.message || ""),
    type: String(row?.type || "system"),
    link: typeof row?.link === "string" ? row.link : "",
    isRead: Boolean(row?.isRead),
    createdAt: row?.createdAt ? String(row.createdAt) : "",
    updatedAt: row?.updatedAt ? String(row.updatedAt) : "",
    audience: row?.audience ? String(row.audience) : "admin",
    meta: row?.meta && typeof row.meta === "object" ? row.meta : {},
  };
}

function timeAgo(iso?: string) {
  if (!iso) return "—";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const diff = Math.max(0, Date.now() - d.getTime());
  const s = Math.floor(diff / 1000);

  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function typeTone(type?: string) {
  const t = String(type || "").toLowerCase();

  if (t === "order") return "border-sky-400/20 bg-sky-500/15 text-sky-300";
  if (t === "payment")
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  if (t === "ticket")
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  if (t === "chat")
    return "border-violet-400/20 bg-violet-500/15 text-violet-300";
  if (t === "promo" || t === "offer")
    return "border-pink-400/20 bg-pink-500/15 text-pink-300";
  if (t === "product" || t === "stock")
    return "border-blue-400/20 bg-blue-500/15 text-blue-300";
  if (t === "review")
    return "border-yellow-400/20 bg-yellow-500/15 text-yellow-300";
  if (t === "user" || t === "account")
    return "border-cyan-400/20 bg-cyan-500/15 text-cyan-300";

  return "border-slate-400/20 bg-white/5 text-slate-300";
}

function getTypeIconSrc(type?: string) {
  const t = String(type || "").toLowerCase();

  if (t === "order") return "/images/admin/orders.png";
  if (t === "payment") return "/images/admin/payment.png";
  if (t === "ticket") return "/images/admin/tickets.png";
  if (t === "chat") return "/images/admin/chat.png";
  if (t === "promo" || t === "offer") return "/images/admin/offer.png";
  if (t === "product" || t === "stock") return "/images/admin/product.png";
  if (t === "review") return "/images/admin/reviews.png";
  if (t === "user" || t === "account") return "/images/admin/customer.png";

  return "/images/admin/notifications.png";
}

function safeHref(link?: string) {
  const value = String(link || "").trim();

  if (!value || value === "#") return "/admin/notifications";
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  return "/admin/notifications";
}

export default function AdminNotificationsPage() {
  return (
    <AdminPageGuard permission="notificationView">
      <AdminNotificationsInner />
    </AdminPageGuard>
  );
}

function AdminNotificationsInner() {
  const [loading, setLoading] = React.useState(true);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [items, setItems] = React.useState<AdminNotification[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterValue>("all");
  const [query, setQuery] = React.useState("");

  const socketRef = React.useRef<Socket | null>(null);

  const fetchAll = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch(`${API_BASE}/notifications/admin?limit=50`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin/adminlogin";
        return;
      }

      const json = await safeJson<any>(res);

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load notifications");
      }

      const list: AdminNotification[] = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.notifications)
        ? json.notifications
        : [];

      setItems(list.map(normalizeNotification));
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();

    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      fetchAll();
    });

    socket.on("admin:notification:new", (payload: any) => {
      const nextRaw = payload?.notification;
      if (!nextRaw) return;

      const next = normalizeNotification(nextRaw);
      const id = pickId(next);

      setItems((prev) => {
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

  const stats = React.useMemo(() => {
    const total = items.length;
    const unread = items.filter((item) => !item.isRead).length;
    const read = total - unread;
    const latest = items[0]?.createdAt ? timeAgo(items[0].createdAt) : "—";

    return { total, unread, read, latest };
  }, [items]);

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      if (filter === "unread" && item.isRead) return false;
      if (filter === "read" && !item.isRead) return false;

      if (!q) return true;

      return (
        String(item.title || "").toLowerCase().includes(q) ||
        String(item.message || "").toLowerCase().includes(q) ||
        String(item.type || "").toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  const markOneRead = React.useCallback(async (id: string) => {
    if (!id) return;

    let previous: AdminNotification[] = [];

    setItems((prev) => {
      previous = prev;

      return prev.map((item) =>
        pickId(item) === id ? { ...item, isRead: true } : item
      );
    });

    try {
      const res = await fetch(
        `${API_BASE}/notifications/admin/${encodeURIComponent(id)}/read`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const json = await safeJson<any>(res);
        throw new Error(json?.message || "Failed to mark notification as read");
      }
    } catch (e: any) {
      setItems(previous);
      setError(e?.message || "Failed to mark notification as read");
    }
  }, []);

  const markAllRead = React.useCallback(async () => {
    let previous: AdminNotification[] = [];

    setItems((prev) => {
      previous = prev;
      return prev.map((item) => ({ ...item, isRead: true }));
    });

    try {
      setMarkingAll(true);
      setError(null);

      const res = await fetch(`${API_BASE}/notifications/admin/read-all`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const json = await safeJson<any>(res);
        throw new Error(json?.message || "Failed to mark all as read");
      }
    } catch (e: any) {
      setItems(previous);
      setError(e?.message || "Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }, []);

  return (
    <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
      <div className="space-y-6">
        <section
          className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Admin / Notifications
              </div>

              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                Notifications
              </h1>

              <p className="mt-2 max-w-[760px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                View real-time admin alerts for orders, payments, tickets,
                chats, customers, reviews, promotions, and system activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/admin/notifications/send" className={primaryBtnClass}>
                Send Broadcast
              </Link>

              <button
                type="button"
                onClick={fetchAll}
                disabled={loading}
                className={secondaryBtnClass}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <Link href="/admin/dashboard" className={secondaryBtnClass}>
                Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_170px_170px_auto]">
            <div className="flex h-[48px] items-center rounded-full border border-white/10 bg-white/5 px-4">
              <label htmlFor="notification-search" className="sr-only">
                Search notifications
              </label>

              <input
                id="notification-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, message, type..."
                className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="ml-2 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-[12px] font-bold text-white transition hover:bg-white/10"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterButton>

            <FilterButton
              active={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              Unread
            </FilterButton>

            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || stats.unread === 0}
              className={secondaryBtnClass}
            >
              {markingAll ? "Saving..." : "Mark All Read"}
            </button>
          </div>
        </section>

        {error ? (
          <AlertBox message={error} onClose={() => setError(null)} />
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total"
            value={String(stats.total)}
            hint="All admin alerts"
            iconSrc="/images/admin/notifications.png"
          />

          <StatCard
            label="Unread"
            value={String(stats.unread)}
            hint="Need attention"
            iconSrc="/images/admin/open.png"
          />

          <StatCard
            label="Read"
            value={String(stats.read)}
            hint="Already checked"
            iconSrc="/images/admin/active.png"
          />

          <StatCard
            label="Latest"
            value={stats.latest}
            hint="Newest alert"
            iconSrc="/images/admin/clock.png"
            small
          />
        </section>

        <section className={`${panelClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                Notification Center
              </div>

              <h2 className="mt-1 text-[20px] font-semibold text-white">
                Admin Alerts
              </h2>

              <p className="mt-1 text-[13px] text-[#a7aec4]">
                Showing {filteredItems.length} of {items.length} notifications.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filter === "read"}
                onClick={() => setFilter("read")}
              >
                Read
              </FilterButton>

              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
                {loading ? "Loading..." : `${filteredItems.length} visible`}
              </span>
            </div>
          </div>

          {loading ? (
            <NotificationsSkeleton />
          ) : filteredItems.length === 0 ? (
            <EmptyState filter={filter} query={query} />
          ) : (
            <div className="divide-y divide-[#26293a]">
              {filteredItems.map((n) => {
                const id = pickId(n);
                const isRead = Boolean(n.isRead);
                const href = safeHref(n.link);

                return (
                  <Link
                    key={id || `${n.title}-${n.createdAt}`}
                    href={href}
                    onClick={() => {
                      if (id && !isRead) {
                        markOneRead(id);
                      }
                    }}
                    className={[
                      "block px-5 py-4 transition hover:bg-white/[0.035] sm:px-6",
                      isRead ? "bg-transparent" : "bg-[#d6c7ff]/[0.035]",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
                        <Image
                          src={getTypeIconSrc(n.type)}
                          alt={n.type || "Notification"}
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-[14px] font-semibold text-white">
                                {n.title || "Notification"}
                              </h3>

                              {!isRead ? (
                                <span className="inline-flex rounded-full border border-[#d6c7ff]/30 bg-[#d6c7ff]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff]">
                                  New
                                </span>
                              ) : null}

                              {n.type ? (
                                <span
                                  className={[
                                    "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                                    typeTone(n.type),
                                  ].join(" ")}
                                >
                                  {n.type}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[#a7aec4]">
                              {n.message || ""}
                            </p>
                          </div>

                          <div className="shrink-0 text-left text-[11px] text-[#7f879f] sm:text-right">
                            <div>{timeAgo(n.createdAt)}</div>
                            <div className="mt-1 hidden sm:block">
                              {formatDateTime(n.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#7f879f]">
                          <span>{isRead ? "Read" : "Unread"}</span>

                          <span>•</span>

                          <span className="break-all text-[#93c5fd]">
                            {href}
                          </span>
                        </div>
                      </div>

                      {!isRead ? (
                        <span className="mt-4 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d6c7ff]" />
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-[48px] rounded-full px-5 text-[12px] font-semibold uppercase tracking-[0.14em] transition",
        active
          ? "bg-white text-[#090a12]"
          : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  hint,
  iconSrc,
  small,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconSrc: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div
            className={[
              "mt-3 font-semibold tracking-[-0.03em] text-white",
              small ? "truncate text-[18px]" : "text-[26px]",
            ].join(" ")}
          >
            {value}
          </div>

          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image
            src={iconSrc}
            alt={label}
            width={22}
            height={22}
            className="h-[22px] w-[22px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function AlertBox({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
      <p className="leading-6">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white"
        aria-label="Dismiss error"
        title="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-[92px] animate-pulse rounded-[20px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function EmptyState({
  filter,
  query,
}: {
  filter: FilterValue;
  query: string;
}) {
  const hasSearch = Boolean(query.trim());

  const text = hasSearch
    ? "No notifications match your search."
    : filter === "unread"
    ? "No unread notifications."
    : filter === "read"
    ? "No read notifications."
    : "No notifications yet.";

  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/notifications.png"
          alt="Notifications"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">{text}</div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Admin alerts will appear here when new orders, tickets, chats, payments,
        reviews, or system events are created.
      </p>
    </div>
  );
}
