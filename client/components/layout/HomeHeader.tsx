"use client";

import { API_BASE_URL, API_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

type UserLite = {
  id?: string;
  name?: string;
  email?: string;
};

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

function getInitials(name: string) {
  const clean = String(name || "").trim();
  if (!clean) return "U";
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last =
    parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return (first + last).toUpperCase();
}

function pickId(n: NotificationItem) {
  return String(n._id || n.id || "");
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
  return `${Math.floor(h / 24)}d ago`;
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function HomeHeader({
  onSearchClick,
}: {
  onSearchClick?: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();

  const API_BASE =
    API_URL;

  const SOCKET_BASE =
    API_BASE_URL;

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<UserLite | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  const [cartCount, setCartCount] = React.useState(0);

  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [notificationItems, setNotificationItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [markingAllNotifications, setMarkingAllNotifications] = React.useState(false);

  const notificationRef = React.useRef<HTMLDivElement | null>(null);

  const syncCartCount = React.useCallback(() => {
    try {
      const raw = localStorage.getItem("ufo_cart");
      const cart = raw ? JSON.parse(raw) : [];
      const count = Array.isArray(cart)
        ? cart.reduce((sum: number, item: any) => sum + (Number(item?.qty) || 0), 0)
        : 0;
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, []);

  const fetchMe = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const json = await safeJson(res);
      const me = json?.user || json?.data?.user || json?.data || null;
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, [API_BASE]);

  const fetchNotificationItems = React.useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch(`${API_BASE}/notifications?limit=5`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setNotificationItems([]);
        return;
      }

      const json = await safeJson(res);
      const items: NotificationItem[] =
        (Array.isArray(json) && json) ||
        (Array.isArray(json?.items) && json.items) ||
        (Array.isArray(json?.data) && json.data) ||
        (Array.isArray(json?.data?.items) && json.data.items) ||
        [];

      setNotificationItems(Array.isArray(items) ? items : []);
    } catch {
      setNotificationItems([]);
    }
  }, [API_BASE, user]);

  const syncUnreadCount = React.useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setUnreadCount(0);
        return;
      }

      const json = await safeJson(res);
      const count =
        Number(json?.count) ||
        Number(json?.data?.count) ||
        Number(json?.data) ||
        0;

      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [API_BASE, user]);

  const markNotificationRead = React.useCallback(
    async (id: string) => {
      if (!id) return;

      setNotificationItems((prev) =>
        prev.map((item) =>
          pickId(item) === id ? { ...item, isRead: true } : item
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await fetch(
          `${API_BASE}/notifications/${encodeURIComponent(id)}/read`,
          {
            method: "PATCH",
            credentials: "include",
          }
        );

        if (!res.ok) {
          await syncUnreadCount();
          await fetchNotificationItems();
        }
      } catch {
        await syncUnreadCount();
        await fetchNotificationItems();
      }
    },
    [API_BASE, syncUnreadCount, fetchNotificationItems]
  );

  const markAllNotificationsRead = React.useCallback(async () => {
    if (markingAllNotifications || !user) return;

    const previousItems = notificationItems;
    setMarkingAllNotifications(true);
    setNotificationItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        setNotificationItems(previousItems);
        await syncUnreadCount();
      }
    } catch {
      setNotificationItems(previousItems);
      await syncUnreadCount();
    } finally {
      setMarkingAllNotifications(false);
    }
  }, [API_BASE, markingAllNotifications, notificationItems, user, syncUnreadCount]);

  React.useEffect(() => {
    fetchMe();
    syncCartCount();
  }, [fetchMe, syncCartCount]);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    const update = () => syncCartCount();

    update();
    window.addEventListener("ufo_cart_updated", update);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "ufo_cart") update();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("ufo_cart_updated", update);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncCartCount]);

  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotificationItems([]);
      return;
    }

    syncUnreadCount();
    fetchNotificationItems();
  }, [user, syncUnreadCount, fetchNotificationItems]);

  React.useEffect(() => {
    if (!notificationOpen) return;

    const onDocClick = (event: MouseEvent) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [notificationOpen]);

  React.useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      syncUnreadCount();
      fetchNotificationItems();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncUnreadCount();
        fetchNotificationItems();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, syncUnreadCount, fetchNotificationItems]);

  React.useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      syncUnreadCount();
      fetchNotificationItems();
    });

    socket.on("notification:new", async (payload: { notification?: NotificationItem }) => {
      const next = payload?.notification;
      if (!next) return;

      setNotificationItems((prev) => {
        const id = pickId(next);
        const exists = prev.some((item) => pickId(item) === id);
        if (exists) return prev;
        return [{ ...next, isRead: false }, ...prev].slice(0, 5);
      });

      setUnreadCount((prev) => prev + 1);
      await syncUnreadCount();
    });

    return () => {
      socket.disconnect();
    };
  }, [SOCKET_BASE, user, syncUnreadCount, fetchNotificationItems]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1b1e2b] bg-[rgba(10,10,15,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/homepage" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="h-[42px] w-[42px] overflow-hidden rounded-full border border-white/15 bg-white/5 sm:h-[48px] sm:w-[48px]">
              <Image
                src="/images/logo.png"
                alt="UFO Collection logo"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="truncate text-[16px] font-bold uppercase tracking-[0.14em] text-white sm:text-[22px] lg:text-[26px]">
              UFO Collection
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-10">
          <Link href="/homepage" className="text-[14px] uppercase tracking-[0.16em] text-[#d6c7ff]">
            {t("nav.home")}
          </Link>
          <Link
            href="/collection"
            className="text-[14px] uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
          >
            {t("nav.collection")}
          </Link>
          <Link
            href="/about"
            className="text-[14px] uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
          >
            {t("nav.about")}
          </Link>
          <Link
            href="/contact"
            className="text-[14px] uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
          >
            {t("nav.contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10 md:hidden"
            aria-label={t("nav.openMenu")}
          >
            ☰
          </button>

          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Search"
            className="hidden rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 sm:flex"
          >
            <Image
              src="/images/search.png"
              width={18}
              height={18}
              alt="Search"
              className="brightness-0 invert"
            />
          </button>

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push("/signup");
                  return;
                }
                setNotificationOpen((prev) => !prev);
              }}
              aria-label="Notifications"
              className="relative rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
              title={user ? t("nav.notifications") : "Login to view notifications"}
            >
              <Image
                src="/images/notification.png"
                width={18}
                height={18}
                alt="Notifications"
                className="brightness-0 invert"
              />
              {user && unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>

            {user && notificationOpen ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[360px] overflow-hidden rounded-[22px] border border-[#17233c] bg-[#020817] shadow-[0_24px_70px_rgba(0,0,0,0.5)] max-sm:w-[92vw]">
                <div className="flex items-center justify-between border-b border-[#152039] px-5 py-4">
                  <div className="text-[18px] font-semibold text-white">Notifications</div>

                  <button
                    type="button"
                    onClick={() => {
                      syncUnreadCount();
                      fetchNotificationItems();
                    }}
                    className="text-[14px] text-[#4ea1ff] transition hover:text-[#84beff]"
                  >
                    Refresh
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {notificationItems.length === 0 ? (
                    <div className="p-5 text-sm text-gray-400">No notifications</div>
                  ) : (
                    notificationItems.map((n) => {
                      const id = pickId(n);

                      return (
                        <button
                          key={id || `${n.title}-${n.createdAt}`}
                          type="button"
                          onClick={() => {
                            if (id) void markNotificationRead(id);
                            setNotificationOpen(false);
                            router.push(n.link || "/notifications");
                          }}
                          className="block w-full border-b border-[#121d33] px-5 py-5 text-left transition hover:bg-white/[0.03]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[16px] font-semibold text-[#e6ebff]">
                                {n.title || "Notification"}
                              </div>

                              {n.message ? (
                                <div className="mt-2 text-[15px] leading-7 text-[#7f8bad]">
                                  {n.message}
                                </div>
                              ) : null}

                              <div className="mt-3 text-[13px] text-[#5f6b8a]">
                                {timeAgo(n.createdAt)}
                                {n.type ? ` • ${String(n.type).toLowerCase()}` : ""}
                              </div>
                            </div>

                            {n.isRead === false ? (
                              <span className="mt-1 h-[10px] w-[10px] shrink-0 rounded-full bg-red-500" />
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between px-5 py-4 text-[15px]">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen(false);
                      router.push("/notifications");
                    }}
                    className="text-[#4ea1ff] transition hover:text-[#84beff]"
                  >
                    View all
                  </button>

                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => void markAllNotificationsRead()}
                      disabled={markingAllNotifications || notificationItems.length === 0}
                      className={`transition ${
                        markingAllNotifications || notificationItems.length === 0
                          ? "cursor-not-allowed text-gray-500"
                          : "text-[#aeb7d6] hover:text-white"
                      }`}
                    >
                      {markingAllNotifications ? "Marking..." : "Mark all read"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="text-[#aeb7d6] transition hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {loadingUser ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <button
              type="button"
              aria-label="Open user profile"
              title={user.name || t("nav.profile")}
              onClick={() => router.push("/profile")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white text-[12px] font-semibold text-[#090a12]"
            >
              {getInitials(user.name || user.email || "User")}
            </button>
          ) : (
            <Link
              href="/signup"
              aria-label="Signup"
              className="hidden rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 sm:flex"
            >
              <Image
                src="/images/profile.png"
                width={18}
                height={18}
                alt="Profile"
                className="brightness-0 invert"
              />
            </Link>
          )}

          <Link
            href="/cartpage"
            aria-label="Cart"
            title="Cart"
            className="relative rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
          >
            <Image
              src="/images/wishlist.png"
              width={18}
              height={18}
              alt="Cart"
              className="brightness-0 invert"
            />
            {cartCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-[#1b1e2b] bg-[rgba(10,10,15,0.98)] md:hidden">
          <div className="mx-auto grid max-w-[1240px] gap-3 px-4 py-4 sm:px-5">
            <Link onClick={() => setMobileMenuOpen(false)} href="/homepage" className="text-[13px] uppercase tracking-[0.16em] text-[#d6c7ff]">
              {t("nav.home")}
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/collection" className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]">
              {t("nav.collection")}
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/about" className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]">
              {t("nav.about")}
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/contact" className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]">
              {t("nav.contact")}
            </Link>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSearchClick?.();
                }}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                {t("nav.search")}
              </button>

              <Link
                onClick={() => setMobileMenuOpen(false)}
                href={user ? "/profile" : "/signup"}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                {user ? t("nav.profile") : t("nav.signup")}
              </Link>

              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/cartpage"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Cart {cartCount > 0 ? `(${cartCount})` : ""}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}