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

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function NotificationTypeBadge({ type }: { type?: string }) {
  const t = safeStr(type).toLowerCase();

  let cls = "border-white/10 bg-white/[0.04] text-[#a7aec4]";

  if (t === "order") cls = "border-sky-400/20 bg-sky-500/15 text-sky-300";
  else if (t === "payment")
    cls = "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  else if (t === "system")
    cls = "border-violet-400/20 bg-violet-500/15 text-violet-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${cls}`}
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
    <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section
          className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border border-white/10 bg-white/[0.05] shadow-[0_0_30px_rgba(139,92,246,0.16)]">
                <Image
                  src="/images/delivery/bell.png"
                  alt="Notifications"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>

              <div>
                <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Notifications
                </h1>
                <p className="mt-2 text-[13px] leading-6 text-[#a7aec4] sm:text-[14px]">
                  Track assigned order alerts and delivery updates.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white">
                {unreadCount} unread
              </div>

              <button
                type="button"
                onClick={loadNotifications}
                className={secondaryBtnClass}
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll || !items.length}
                className={secondaryBtnClass}
              >
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
            {error}
          </div>
        ) : null}

        <section className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
              Inbox
            </div>
            <div className="mt-1 text-[20px] font-semibold text-white">
              All Notifications
            </div>
            <div className="mt-1 text-[13px] text-[#a7aec4]">
              Latest delivery-related alerts sent to your account.
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-[14px] text-[#a7aec4]">
              Loading notifications...
            </div>
          ) : items.length ? (
            <div className="divide-y divide-[#26293a]">
              {items.map((item, index) => {
                const id = safeStr(item.id || item._id) || `notification-${index}`;
                const unread = !item.isRead;

                const content = (
                  <div
                    className={`flex items-start justify-between gap-4 px-5 py-5 transition sm:px-6 ${
                      unread ? "bg-[#8b5cf6]/[0.06]" : ""
                    } hover:bg-white/[0.03]`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-[16px] font-semibold text-white">
                          {safeStr(item.title) || "Notification"}
                        </div>

                        <NotificationTypeBadge type={item.type} />

                        {unread ? (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#d6c7ff]" />
                        ) : null}
                      </div>

                      <div className="mt-2 text-[14px] leading-6 text-[#cbd5e1]">
                        {safeStr(item.message)}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[#7f879f]">
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
                          const rawId = safeStr(item.id || item._id);
                          if (rawId) markOneRead(rawId);
                        }}
                        className={secondaryBtnClass}
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
                        const rawId = safeStr(item.id || item._id);
                        if (rawId && unread) markOneRead(rawId);
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
            <div className="px-5 py-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] border border-white/10 bg-white/[0.05] shadow-[0_0_30px_rgba(139,92,246,0.12)]">
                <Image
                  src="/images/delivery/bell.png"
                  alt="Notifications"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>

              <div className="mt-4 text-[18px] font-semibold text-white">
                No notifications yet
              </div>

              <div className="mx-auto mt-2 max-w-[420px] text-[13px] leading-6 text-[#a7aec4]">
                New delivery assignments and order status alerts will appear
                here.
              </div>

              <div className="mt-5">
                <Link href="/delivery/dashboard" className={secondaryBtnClass}>
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}