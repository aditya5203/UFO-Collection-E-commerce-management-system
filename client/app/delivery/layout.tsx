"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import DeliverySidebar from "./_components/DeliverySidebar";
import DeliveryPageGuard from "./_components/DeliveryPageGuard";
import {
  DELIVERY_ENDPOINTS,
  DeliveryNotification,
  safeJson,
  safeStr,
  timeAgo,
} from "@/app/lib/delivery";

type ToastItem = {
  id: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
};

const PUBLIC_DELIVERY_ROUTES = [
  "/delivery/login",
  "/delivery/forgot-password",
  "/delivery/reset-password",
];

function getToastBorder(type?: string) {
  const t = safeStr(type).toLowerCase();

  if (t === "order") return "border-sky-500/30";
  if (t === "payment") return "border-emerald-500/30";
  if (t === "system") return "border-violet-500/30";
  return "border-[#13203a]";
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifLoading, setNotifLoading] = React.useState(false);
  const [notifError, setNotifError] = React.useState("");
  const [notifications, setNotifications] = React.useState<
    DeliveryNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const isUnauthorizedRef = React.useRef(false);

  const isPublicPage = PUBLIC_DELIVERY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isChangePasswordPage = pathname === "/delivery/change-password";
  const shouldRunNotificationEffects = !isPublicPage;

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (isPublicPage) {
      setNotifOpen(false);
      setNotifError("");
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
      isUnauthorizedRef.current = false;
    }
  }, [isPublicPage]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };

    if (notifOpen) {
      document.addEventListener("mousedown", onClick);
    }

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, [notifOpen]);

  const handleUnauthorized = React.useCallback(() => {
    isUnauthorizedRef.current = true;
    setUnreadCount(0);
    setNotifications([]);
    setNotifOpen(false);
    setNotifError("");
  }, []);

  const loadUnreadCount = React.useCallback(async () => {
    if (!shouldRunNotificationEffects || isUnauthorizedRef.current) return;

    try {
      const res = await fetch(DELIVERY_ENDPOINTS.notificationUnreadCount, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const json = await safeJson(res);
      if (!res.ok) return;

      setUnreadCount(
        Number((json as any)?.count || (json as any)?.data?.count || 0)
      );
    } catch {
      // ignore
    }
  }, [handleUnauthorized, shouldRunNotificationEffects]);

  const loadNotifications = React.useCallback(async () => {
    if (!shouldRunNotificationEffects || isUnauthorizedRef.current) return;

    try {
      setNotifLoading(true);
      setNotifError("");

      const res = await fetch(`${DELIVERY_ENDPOINTS.notifications}?limit=20`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const json = await safeJson(res);

      if (!res.ok) {
        setNotifError((json as any)?.message || "Failed to load notifications");
        return;
      }

      const items = (json as any)?.items || (json as any)?.data || [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch {
      setNotifError("Failed to load notifications");
    } finally {
      setNotifLoading(false);
    }
  }, [handleUnauthorized, shouldRunNotificationEffects]);

  React.useEffect(() => {
    if (!shouldRunNotificationEffects) return;
    loadUnreadCount();
  }, [loadUnreadCount, shouldRunNotificationEffects]);

  React.useEffect(() => {
    if (!notifOpen || !shouldRunNotificationEffects || isUnauthorizedRef.current) {
      return;
    }

    loadNotifications();
  }, [notifOpen, loadNotifications, shouldRunNotificationEffects]);

  React.useEffect(() => {
    if (!shouldRunNotificationEffects || isUnauthorizedRef.current) return;

    const interval = window.setInterval(() => {
      loadUnreadCount();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadUnreadCount, shouldRunNotificationEffects]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = React.useCallback(
    (notification: any) => {
      const id = safeStr(notification?.id || notification?._id || Date.now());

      const nextToast: ToastItem = {
        id,
        title: safeStr(notification?.title) || "Notification",
        message: safeStr(notification?.message),
        link: safeStr(notification?.link),
        type: safeStr(notification?.type),
      };

      setToasts((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        return [nextToast, ...filtered].slice(0, 4);
      });

      window.setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  React.useEffect(() => {
    if (!shouldRunNotificationEffects || isUnauthorizedRef.current) return;

    const socketBase = (
      API_BASE_URL
    ).replace(/\/+$/, "");

    let socket: Socket | null = null;

    try {
      socket = io(socketBase, {
        withCredentials: true,
        transports: ["websocket"],
        autoConnect: true,
      });

      socket.on("connect", () => {
        console.log("✅ Delivery socket connected:", socket?.id);
      });

      socket.on("connect_error", (err) => {
        const msg = safeStr(err?.message).toLowerCase();

        if (
          msg.includes("unauthorized") ||
          msg.includes("authentication") ||
          msg.includes("token")
        ) {
          handleUnauthorized();
          return;
        }

        console.log("❌ Socket error:", err.message);
      });

      socket.on("delivery:notification:new", (payload: any) => {
        const notification = payload?.notification;
        if (!notification) return;

        setUnreadCount((prev) => prev + 1);

        setNotifications((prev) => {
          const next = [notification, ...prev];
          const seen = new Set<string>();

          return next.filter((item: any) => {
            const id = safeStr(item?.id || item?._id);
            if (!id) return true;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        });

        pushToast(notification);
      });
    } catch {
      // ignore
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [handleUnauthorized, pushToast, shouldRunNotificationEffects]);

  const openNotifications = async () => {
    if (isUnauthorizedRef.current) return;
    setNotifOpen((prev) => !prev);
  };

  const markAllRead = async () => {
    if (isUnauthorizedRef.current) return;

    try {
      const res = await fetch(DELIVERY_ENDPOINTS.notificationReadAll, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const markOneRead = async (id: string) => {
    if (isUnauthorizedRef.current) return;

    try {
      const res = await fetch(`${DELIVERY_ENDPOINTS.notifications}/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((item) =>
          safeStr(item.id || item._id) === id ? { ...item, isRead: true } : item
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <DeliveryPageGuard
      mode={isChangePasswordPage ? "change-password" : "protected"}
    >
      <div className="min-h-screen bg-[#041225] text-white">
        <div className="flex min-h-screen">
          <DeliverySidebar
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />

          <main className="min-w-0 flex-1 lg:ml-0">
            <div className="px-2 py-3 md:px-3 md:py-4 lg:px-3 lg:py-4">
              <div className="relative overflow-visible rounded-[22px] border border-[#0f172a] bg-[#06152b] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <div className="absolute right-4 top-4 z-40 flex items-center gap-3">
                  <div className="relative" ref={notifRef}>
                    <button
                      type="button"
                      onClick={openNotifications}
                      className="relative inline-flex h-[50px] w-[50px] items-center justify-center rounded-[18px] border border-[#13203a] bg-[#020f24] text-white transition hover:bg-[#09152c]"
                      aria-label="Open notifications"
                    >
                      <Image
                        src="/images/delivery/bell.png"
                        alt="Notifications"
                        width={20}
                        height={20}
                        className="object-contain"
                      />

                      {unreadCount > 0 ? (
                        <span className="absolute right-[-2px] top-[-2px] inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[12px] font-bold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : null}
                    </button>

                    {notifOpen ? (
                      <div className="absolute right-0 top-[62px] z-50 w-[360px] overflow-hidden rounded-[22px] border border-[#13203a] bg-[#020b1d] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:w-[410px]">
                        <div className="flex items-center justify-between border-b border-[#13203a] px-5 py-4">
                          <h3 className="text-[18px] font-bold text-white">
                            Notifications
                          </h3>

                          <button
                            type="button"
                            onClick={loadNotifications}
                            className="text-[14px] font-medium text-[#60a5fa] hover:text-[#93c5fd]"
                          >
                            Refresh
                          </button>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {notifLoading ? (
                            <div className="px-5 py-5 text-[14px] text-[#94a3b8]">
                              Loading...
                            </div>
                          ) : notifError ? (
                            <div className="px-5 py-5 text-[14px] text-red-300">
                              {notifError}
                            </div>
                          ) : notifications.length ? (
                            notifications.map((item) => {
                              const id = safeStr(item.id || item._id);
                              const unread = !item.isRead;

                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => {
                                    if (id && unread) {
                                      markOneRead(id);
                                    }

                                    if (item.link) {
                                      router.push(item.link);
                                      setNotifOpen(false);
                                    }
                                  }}
                                  className="flex w-full items-start justify-between gap-4 border-b border-[#13203a] px-5 py-4 text-left transition hover:bg-[#071226]"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[15px] font-semibold text-white">
                                      {safeStr(item.title) || "Notification"}
                                    </div>

                                    <div className="mt-1 text-[14px] text-[#94a3b8]">
                                      {safeStr(item.message)}
                                    </div>

                                    <div className="mt-2 text-[13px] text-[#64748b]">
                                      {timeAgo(item.createdAt)} •{" "}
                                      {safeStr(item.type) || "system"}
                                    </div>
                                  </div>

                                  {unread ? (
                                    <span className="mt-2 h-[10px] w-[10px] shrink-0 rounded-full bg-[#60a5fa]" />
                                  ) : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-5 py-5 text-[14px] text-[#94a3b8]">
                              No notifications found.
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between px-5 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              router.push("/delivery/notifications");
                              setNotifOpen(false);
                            }}
                            className="text-[14px] font-medium text-[#60a5fa] hover:text-[#93c5fd]"
                          >
                            View all
                          </button>

                          <div className="flex items-center gap-5">
                            <button
                              type="button"
                              onClick={markAllRead}
                              className="text-[14px] font-medium text-[#cbd5e1] hover:text-white"
                            >
                              Mark all read
                            </button>

                            <button
                              type="button"
                              onClick={() => setNotifOpen(false)}
                              className="text-[14px] font-medium text-[#cbd5e1] hover:text-white"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="inline-flex items-center rounded-xl border border-[#13203a] bg-[#020f24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#09152c] lg:hidden"
                  >
                    Menu
                  </button>
                </div>

                <div className="px-2 py-3 md:px-3 md:py-4 lg:px-4 lg:py-4">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>

        {toasts.length ? (
          <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-3">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`pointer-events-auto overflow-hidden rounded-[18px] border bg-[#020b1d] shadow-[0_20px_50px_rgba(0,0,0,0.38)] ${getToastBorder(
                  toast.type
                )}`}
              >
                <div className="flex items-start gap-3 px-4 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (toast.link) {
                        router.push(toast.link);
                      }

                      removeToast(toast.id);
                    }}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#13203a] bg-[#020f24]">
                      <Image
                        src="/images/delivery/bell.png"
                        alt="Notification"
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-white">
                        {toast.title}
                      </div>
                      <div className="mt-1 text-[13px] leading-5 text-[#cbd5e1]">
                        {toast.message}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="pointer-events-auto shrink-0 text-[12px] font-medium text-[#94a3b8] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </DeliveryPageGuard>
  );
}