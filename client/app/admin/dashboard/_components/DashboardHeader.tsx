"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  API_BASE_URL,
  AdminNotification,
  ToastType,
  panelClass,
  pickId,
  secondaryBtnClass,
  safeJson,
  timeAgo,
} from "./dashboardTypes";

type Props = {
  refreshing: boolean;
  unreadCount: number;
  notifOpen: boolean;
  setNotifOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notifRef: React.RefObject<HTMLDivElement | null>;
  notifLoading: boolean;
  notifications: AdminNotification[];
  fetchNotifications: () => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<AdminNotification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  showToast: (message: string, type?: ToastType) => void;
  onRefresh: () => void;
};

export default function DashboardHeader({
  refreshing,
  unreadCount,
  notifOpen,
  setNotifOpen,
  notifRef,
  notifLoading,
  notifications,
  fetchNotifications,
  setNotifications,
  setUnreadCount,
  showToast,
  onRefresh,
}: Props) {
  return (
    <div
      className={`${panelClass} relative overflow-visible bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
            Admin Overview
          </div>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            Dashboard
          </h1>

          <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            Track orders, revenue, product stock, customer activity, and
            real-time admin notifications from one premium control panel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className={secondaryBtnClass}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                const next = !notifOpen;
                setNotifOpen(next);
                if (next) fetchNotifications();
              }}
              className="relative grid h-[48px] w-[48px] place-items-center rounded-full border border-white/15 bg-white/5 transition hover:-translate-y-0.5 hover:bg-white/10"
              aria-label="Notifications"
            >
              <Image
                src="/images/notification.png"
                alt="Notifications"
                width={22}
                height={22}
                className="opacity-95"
              />

              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.75, opacity: 0 }}
                    className="absolute -right-[5px] -top-[5px] grid min-h-[20px] min-w-[20px] place-items-center rounded-full border border-[#0a0a0f] bg-[#ef4444] px-[6px] text-[11px] font-semibold text-white"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {notifOpen && (
                <NotificationDropdown
                  notifLoading={notifLoading}
                  notifications={notifications}
                  fetchNotifications={fetchNotifications}
                  setNotifOpen={setNotifOpen}
                  setNotifications={setNotifications}
                  setUnreadCount={setUnreadCount}
                  showToast={showToast}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationDropdown({
  notifLoading,
  notifications,
  fetchNotifications,
  setNotifOpen,
  setNotifications,
  setUnreadCount,
  showToast,
}: {
  notifLoading: boolean;
  notifications: AdminNotification[];
  fetchNotifications: () => Promise<void>;
  setNotifOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNotifications: React.Dispatch<React.SetStateAction<AdminNotification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  showToast: (message: string, type?: ToastType) => void;
}) {
  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/admin/read-all`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast("All notifications marked as read.", "success");
    } catch {
      showToast("Failed to mark notifications as read.", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="absolute right-0 top-[58px] z-50 w-[calc(100vw-32px)] max-w-[380px] overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:w-[380px]"
    >
      <div className="flex items-center justify-between border-b border-[#26293a] px-4 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#a7aec4]">
            Admin
          </div>

          <div className="text-[14px] font-semibold text-white">
            Notifications
          </div>
        </div>

        <button
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10"
          onClick={fetchNotifications}
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {notifLoading && (
          <div className="px-4 py-4 text-[12px] text-[#a7aec4]">
            Loading notifications...
          </div>
        )}

        {!notifLoading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5">
              <span className="text-lg">🔔</span>
            </div>

            <div className="mt-3 text-[13px] font-semibold text-white">
              No notifications yet
            </div>

            <div className="mt-1 text-[12px] text-[#a7aec4]">
              New admin alerts will appear here.
            </div>
          </div>
        )}

        {!notifLoading &&
          notifications.map((n, i) => {
            const rawId = pickId(n);
            const id = rawId || `notif-${i}`;
            const isRead = Boolean(n.isRead);

            return (
              <Link
                key={id}
                href={n.link || "#"}
                onClick={async () => {
                  setNotifOpen(false);

                  if (!isRead && rawId) {
                    setNotifications((prev) =>
                      prev.map((item) =>
                        pickId(item) === rawId
                          ? { ...item, isRead: true }
                          : item
                      )
                    );

                    setUnreadCount((prev) => Math.max(0, prev - 1));

                    try {
                      await fetch(
                        `${API_BASE_URL}/api/notifications/admin/${encodeURIComponent(
                          rawId
                        )}/read`,
                        {
                          method: "PATCH",
                          credentials: "include",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );
                    } catch {
                      showToast(
                        "Failed to update notification status.",
                        "error"
                      );
                    }
                  }
                }}
                className={[
                  "block border-b border-[#26293a] px-4 py-4 transition hover:bg-white/[0.04]",
                  isRead ? "opacity-75" : "opacity-100",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white">
                      {n.title || "Notification"}
                    </div>

                    <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#a7aec4]">
                      {n.message || ""}
                    </div>

                    <div className="mt-2 text-[11px] text-[#7f879f]">
                      {timeAgo(n.createdAt)}
                      {n.type ? ` • ${n.type}` : ""}
                    </div>
                  </div>

                  {!isRead && (
                    <span className="mt-1 h-[9px] w-[9px] flex-none rounded-full bg-[#d6c7ff]" />
                  )}
                </div>
              </Link>
            );
          })}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/admin/notifications"
          className="text-[12px] font-semibold text-[#d6c7ff] hover:underline"
          onClick={() => setNotifOpen(false)}
        >
          View all
        </Link>

        <div className="flex items-center gap-3">
          <button
            className="text-[12px] text-[#a7aec4] transition hover:text-white"
            onClick={markAllRead}
            type="button"
          >
            Mark all read
          </button>

          <button
            className="text-[12px] text-[#a7aec4] transition hover:text-white"
            onClick={() => setNotifOpen(false)}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}