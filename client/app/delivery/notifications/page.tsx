"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DELIVERY_ENDPOINTS,
  DeliveryNotification,
  safeJson,
  safeStr,
  timeAgo,
  formatDateTime,
} from "@/app/lib/delivery";

function NotificationTypeBadge({ type }: { type?: string }) {
  const t = safeStr(type).toLowerCase();

  let cls = "border-slate-700/60 bg-slate-900/40 text-slate-300";

  if (t === "order") {
    cls = "border-sky-500/30 bg-sky-500/10 text-sky-200";
  } else if (t === "payment") {
    cls = "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  } else if (t === "system") {
    cls = "border-violet-500/30 bg-violet-500/10 text-violet-200";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${cls}`}
    >
      {safeStr(type) || "system"}
    </span>
  );
}

export default function DeliveryNotificationsPage() {
  const [items, setItems] = React.useState<DeliveryNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [markingAll, setMarkingAll] = React.useState(false);

  const loadNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${DELIVERY_ENDPOINTS.notifications}?limit=100`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setItems([]);
        setError((json as any)?.message || "Failed to load notifications");
        return;
      }

      const nextItems = (json as any)?.items ?? (json as any)?.data ?? [];
      setItems(Array.isArray(nextItems) ? nextItems : []);
    } catch {
      setItems([]);
      setError("Network error while loading notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markOneRead = async (id: string) => {
    try {
      const res = await fetch(`${DELIVERY_ENDPOINTS.notifications}/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) return;

      setItems((prev) =>
        prev.map((item) =>
          safeStr(item.id || item._id) === id ? { ...item, isRead: true } : item
        )
      );
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);

      const res = await fetch(DELIVERY_ENDPOINTS.notificationReadAll, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) return;

      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[16px] border border-[#111827] bg-[#020617] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-[12px] text-[#94a3b8]">Delivery Panel</div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#13203a] bg-[#020f24] text-white">
                <Image
                  src="/images/delivery/bell.png"
                  alt="Notifications"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>

              <div>
                <h1 className="text-[22px] font-semibold text-white">
                  Notifications
                </h1>
                <p className="text-[13px] text-[#94a3b8]">
                  Track assigned order alerts and delivery updates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-[#13203a] bg-[#020f24] px-4 py-2 text-[13px] font-medium text-white">
              {unreadCount} unread
            </div>

            <button
              type="button"
              onClick={loadNotifications}
              className="rounded-lg border border-[#13203a] bg-[#020f24] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#09152c]"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || !items.length}
              className="rounded-lg border border-[#13203a] bg-[#020f24] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#09152c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingAll ? "Marking..." : "Mark all read"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-[16px] border border-[#111827] bg-[#020617]">
        <div className="border-b border-[#111827] px-5 py-4">
          <div className="text-[16px] font-semibold text-white">
            All Notifications
          </div>
          <div className="mt-1 text-[12px] text-[#94a3b8]">
            Latest delivery-related alerts sent to your account.
          </div>
        </div>

        <div>
          {loading ? (
            <div className="px-5 py-8 text-[14px] text-[#94a3b8]">
              Loading notifications...
            </div>
          ) : items.length ? (
            <div className="divide-y divide-[#111827]">
              {items.map((item) => {
                const id = safeStr(item.id || item._id);
                const unread = !item.isRead;

                const content = (
                  <div
                    className={`flex items-start justify-between gap-4 px-5 py-5 transition ${
                      unread ? "bg-[#071226]/40" : ""
                    } hover:bg-[#071226]`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-[16px] font-semibold text-white">
                          {safeStr(item.title) || "Notification"}
                        </div>

                        <NotificationTypeBadge type={item.type} />

                        {unread ? (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#60a5fa]" />
                        ) : null}
                      </div>

                      <div className="mt-2 text-[14px] leading-6 text-[#cbd5e1]">
                        {safeStr(item.message)}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[#64748b]">
                        <span>{timeAgo(item.createdAt)}</span>
                        <span>•</span>
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                    </div>

                    {unread ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (id) markOneRead(id);
                        }}
                        className="shrink-0 rounded-lg border border-[#13203a] bg-[#020f24] px-3 py-2 text-[12px] font-medium text-white transition hover:bg-[#09152c]"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                );

                if (item.link) {
                  return (
                    <Link
                      key={id}
                      href={item.link}
                      onClick={() => {
                        if (id && unread) {
                          markOneRead(id);
                        }
                      }}
                      className="block"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={id} className="block">
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] border border-[#13203a] bg-[#020f24] text-white">
                <Image
                  src="/images/delivery/bell.png"
                  alt="Notifications"
                  width={22}
                  height={22}
                  className="object-contain"
                />
              </div>

              <div className="mt-4 text-[16px] font-semibold text-white">
                No notifications yet
              </div>

              <div className="mt-2 text-[13px] text-[#94a3b8]">
                New delivery assignments and order status alerts will appear here.
              </div>

              <div className="mt-5">
                <Link
                  href="/delivery/dashboard"
                  className="inline-flex items-center rounded-lg border border-[#13203a] bg-[#020f24] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#09152c]"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}