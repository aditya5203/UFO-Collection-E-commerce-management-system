"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../_components/AdminPageGuard";

type SummaryResponse = {
  success: boolean;
  data: {
    top: {
      totalOrders: number;
      totalRevenuePaisa: number;
      totalRevenueRs?: number;
      totalCustomers: number;
      totalProductsLive: number;
    };
    ordersByStatus: Record<string, number>;
    salesLast7Days: Array<{
      date: string;
      label?: string;
      totalPaisa: number;
      totalRs?: number;
    }>;
    recentOrders: Array<{
      id: string;
      orderCode: string;
      totalPaisa: number;
      totalRs?: number;
      orderStatus: string;
      paymentStatus?: string;
      createdAt: string;
      customerName: string;
      customerEmail?: string;
    }>;
    lowStock: Array<{ id: string; name: string; stock: number }>;
    newUsers: Array<{ id: string; name: string; createdAt: string }>;
  };
};

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

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

const chartHeightClasses = [
  "h-[48px]",
  "h-[64px]",
  "h-[80px]",
  "h-[96px]",
  "h-[112px]",
  "h-[128px]",
  "h-[144px]",
];

function getHeightClass(value: number, max: number) {
  const safeMax = Math.max(1, max);
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const index = Math.round(ratio * (chartHeightClasses.length - 1));
  return chartHeightClasses[index] || "h-[48px]";
}

const formatMoneyNPR = (paisa: number) => {
  const rs = Math.round(Number(paisa || 0) / 100);
  return `Rs. ${rs.toLocaleString("en-US")}`;
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return iso || "";
  }
};

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

function pickId(n: AdminNotification) {
  return (n._id || n.id || "") as string;
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<SummaryResponse["data"] | null>(
    null
  );

  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifLoading, setNotifLoading] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AdminNotification[]>(
    []
  );
  const [unreadCount, setUnreadCount] = React.useState(0);

  const socketRef = React.useRef<Socket | null>(null);
  const notifRef = React.useRef<HTMLDivElement | null>(null);

  const fetchSummary = React.useCallback(async () => {
    try {
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard/summary`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const json = (await safeJson(res)) as SummaryResponse & {
        message?: string;
      };

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to load dashboard");
      }

      setSummary(json.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setNotifLoading(true);

      const [listRes, countRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/notifications/admin?limit=10`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }),
        fetch(`${API_BASE_URL}/api/notifications/admin/unread-count`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }),
      ]);

      const listJson = await safeJson(listRes);
      const countJson = await safeJson(countRes);

      const items: AdminNotification[] =
        listJson?.items || listJson?.data || listJson?.notifications || [];

      const count =
        Number(countJson?.count ?? countJson?.data ?? countJson?.unreadCount) ||
        0;

      setNotifications(Array.isArray(items) ? items : []);
      setUnreadCount(count);
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSummary();
    fetchNotifications();

    const summaryInterval = setInterval(() => {
      fetchSummary();
    }, 30000);

    const onFocus = () => {
      fetchSummary();
      fetchNotifications();
    };

    window.addEventListener("focus", onFocus);

    const socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      fetchNotifications();
    });

    socket.on("admin:notification:new", (payload: any) => {
      const next = payload?.notification;
      if (!next) return;

      setNotifications((prev) => {
        const id = String(next?._id || next?.id || "");
        if (!id) return [next, ...prev].slice(0, 10);

        const exists = prev.some((item) => pickId(item) === id);
        if (exists) return prev;

        return [next, ...prev].slice(0, 10);
      });

      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      clearInterval(summaryInterval);
      window.removeEventListener("focus", onFocus);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchSummary, fetchNotifications]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const salesBars = React.useMemo(() => {
    const arr = summary?.salesLast7Days || [];
    const totals = arr.map((x) => Number(x.totalPaisa || 0));
    const max = Math.max(1, ...totals);

    const padded =
      arr.length >= 7
        ? arr.slice(-7)
        : [
            ...Array.from({ length: 7 - arr.length }).map(() => ({
              date: "",
              label: "",
              totalPaisa: 0,
            })),
            ...arr,
          ];

    return padded.map((x, idx) => ({
      label:
        x.label || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx] || "",
      heightClass: getHeightClass(Number(x.totalPaisa || 0), max),
      totalPaisa: Number(x.totalPaisa || 0),
    }));
  }, [summary]);

  const statusCount = (k: string) => Number(summary?.ordersByStatus?.[k] || 0);
  const totalOrdersByStatus =
    statusCount("Pending") +
    statusCount("Shipped") +
    statusCount("Delivered") +
    statusCount("Cancelled");

  const statusBars = React.useMemo(() => {
    const pending = statusCount("Pending");
    const shipped = statusCount("Shipped");
    const delivered = statusCount("Delivered");
    const cancelled = statusCount("Cancelled");

    const max = Math.max(1, pending, shipped, delivered, cancelled);

    return [
      {
        label: "Pending",
        value: pending,
        heightClass: getHeightClass(pending, max),
        tone: "pending",
      },
      {
        label: "Shipped",
        value: shipped,
        heightClass: getHeightClass(shipped, max),
        tone: "shipped",
      },
      {
        label: "Delivered",
        value: delivered,
        heightClass: getHeightClass(delivered, max),
        tone: "delivered",
      },
      {
        label: "Cancelled",
        value: cancelled,
        heightClass: getHeightClass(cancelled, max),
        tone: "cancelled",
      },
    ];
  }, [summary]);

  const weeklyRevenue = React.useMemo(() => {
    return (summary?.salesLast7Days || []).reduce(
      (sum, x) => sum + Number(x.totalPaisa || 0),
      0
    );
  }, [summary]);

  return (
    <AdminPageGuard permission="dashboardView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className={`${panelClass} p-5`}>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#fca5a5]">
              Dashboard Error
            </div>
            <div className="mt-2 text-[15px] text-white">{error}</div>
            <button onClick={fetchSummary} className={`${primaryBtnClass} mt-5`}>
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
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
                    onClick={() => {
                      fetchSummary();
                      fetchNotifications();
                    }}
                    className={secondaryBtnClass}
                  >
                    Refresh
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

                      {unreadCount > 0 && (
                        <span className="absolute -right-[5px] -top-[5px] grid min-h-[20px] min-w-[20px] place-items-center rounded-full border border-[#0a0a0f] bg-[#ef4444] px-[6px] text-[11px] font-semibold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <NotificationDropdown
                        notifLoading={notifLoading}
                        notifications={notifications}
                        unreadCount={unreadCount}
                        fetchNotifications={fetchNotifications}
                        setNotifOpen={setNotifOpen}
                        setNotifications={setNotifications}
                        setUnreadCount={setUnreadCount}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Orders"
                value={String(summary?.top?.totalOrders ?? 0)}
                helper="All customer orders"
                iconSrc="/images/admin/orders.png"
              />
              <StatCard
                label="Total Revenue"
                value={formatMoneyNPR(summary?.top?.totalRevenuePaisa ?? 0)}
                helper="Completed revenue"
                iconSrc="/images/admin/revenue.png"
              />
              <StatCard
                label="Total Customers"
                value={String(summary?.top?.totalCustomers ?? 0)}
                helper="Registered users"
                iconSrc="/images/admin/customer.png"
              />
              <StatCard
                label="Products Live"
                value={String(summary?.top?.totalProductsLive ?? 0)}
                helper="Active catalog items"
                iconSrc="/images/admin/product.png"
              />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
              <div className={`${panelClass} p-5 sm:p-6`}>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Sales Performance
                    </div>
                    <div className="mt-1 text-[20px] font-semibold text-white">
                      Sales Overview
                    </div>
                    <div className="mt-1 text-[13px] text-[#a7aec4]">
                      Last 7 days revenue trend
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white">
                    {formatMoneyNPR(weeklyRevenue)}
                  </div>
                </div>

                <div className="relative h-[260px] overflow-hidden rounded-[22px] border border-[#26293a] bg-[radial-gradient(circle_at_0_0,rgba(139,92,246,0.20),transparent_35%),linear-gradient(180deg,#161824,#0d0f17)] p-4">
                  <div className="absolute inset-x-5 top-10 border-t border-dashed border-white/10" />
                  <div className="absolute inset-x-5 top-24 border-t border-dashed border-white/10" />
                  <div className="absolute inset-x-5 top-38 border-t border-dashed border-white/10" />

                  <div className="relative flex h-full items-end gap-3 pb-7 pt-3">
                    {salesBars.map((b, idx) => (
                      <ChartBar
                        key={idx}
                        heightClass={b.heightClass}
                        label={b.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={`${panelClass} p-5 sm:p-6`}>
                <div className="mb-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    Order Pipeline
                  </div>
                  <div className="mt-1 text-[20px] font-semibold text-white">
                    Orders by Status
                  </div>
                  <div className="mt-1 text-[13px] text-[#a7aec4]">
                    {totalOrdersByStatus.toLocaleString("en-US")} total orders
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#26293a] bg-[#0d0f17] p-4">
                  <div className="flex h-[190px] items-end gap-4">
                    {statusBars.map((s) => (
                      <StatusBar
                        key={s.label}
                        label={s.label}
                        value={s.value}
                        heightClass={s.heightClass}
                        tone={s.tone}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
              <div className={`${panelClass} overflow-hidden`}>
                <div className="flex items-center justify-between border-b border-[#26293a] px-5 py-4 sm:px-6">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Orders
                    </div>
                    <div className="mt-1 text-[20px] font-semibold text-white">
                      Recent Orders
                    </div>
                  </div>

                  <Link href="/admin/orders" className={secondaryBtnClass}>
                    View All
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                        <th className="px-5 py-4 font-medium">Order ID</th>
                        <th className="px-5 py-4 font-medium">Customer</th>
                        <th className="px-5 py-4 font-medium">Total</th>
                        <th className="px-5 py-4 font-medium">Status</th>
                        <th className="px-5 py-4 font-medium">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(summary?.recentOrders || []).map((o) => (
                        <Tr
                          key={o.id}
                          id={o.orderCode || o.id}
                          name={o.customerName || "Customer"}
                          email={o.customerEmail}
                          total={formatMoneyNPR(o.totalPaisa)}
                          date={formatDate(o.createdAt)}
                          badge={
                            <Badge
                              variant={
                                String(o.orderStatus || "Pending").toLowerCase() ===
                                "delivered"
                                  ? "delivered"
                                  : String(
                                      o.orderStatus || "Pending"
                                    ).toLowerCase() === "shipped"
                                  ? "shipped"
                                  : String(
                                      o.orderStatus || "Pending"
                                    ).toLowerCase() === "cancelled"
                                  ? "cancelled"
                                  : "pending"
                              }
                            >
                              {o.orderStatus || "Pending"}
                            </Badge>
                          }
                        />
                      ))}
                    </tbody>
                  </table>

                  {(!summary?.recentOrders ||
                    summary.recentOrders.length === 0) && (
                    <div className="px-6 py-8 text-center text-[13px] text-[#a7aec4]">
                      No recent orders yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <InfoCard title="Low Stock Alerts" eyebrow="Inventory">
                  <div className="grid gap-3">
                    {(summary?.lowStock || []).map((p) => (
                      <SmallItem
                        key={p.id}
                        left={p.name}
                        right={`${p.stock} left`}
                        tone="warning"
                      />
                    ))}
                    {(!summary?.lowStock || summary.lowStock.length === 0) && (
                      <SmallItem left="No low stock items" right="Healthy" />
                    )}
                  </div>
                </InfoCard>

                <InfoCard title="New Users This Week" eyebrow="Customers">
                  <div className="grid gap-3">
                    {(summary?.newUsers || []).map((u) => (
                      <SmallItem
                        key={u.id}
                        left={u.name}
                        right={formatDate(u.createdAt)}
                      />
                    ))}
                    {(!summary?.newUsers || summary.newUsers.length === 0) && (
                      <SmallItem left="No new users" right="" />
                    )}
                  </div>
                </InfoCard>
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminPageGuard>
  );
}

function NotificationDropdown({
  notifLoading,
  notifications,
  fetchNotifications,
  setNotifOpen,
  setNotifications,
  setUnreadCount,
}: {
  notifLoading: boolean;
  notifications: AdminNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  setNotifOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNotifications: React.Dispatch<React.SetStateAction<AdminNotification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div className="absolute right-0 top-[58px] z-50 w-[360px] overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
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
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/10"
          onClick={fetchNotifications}
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
          <div className="px-4 py-5 text-center text-[12px] text-[#a7aec4]">
            No notifications yet.
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
                    } catch {}
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

      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/admin/notifications"
          className="text-[12px] font-semibold text-[#d6c7ff] hover:underline"
          onClick={() => setNotifOpen(false)}
        >
          View all
        </Link>

        <div className="flex items-center gap-3">
          <button
            className="text-[12px] text-[#a7aec4] hover:text-white"
            onClick={async () => {
              try {
                await fetch(`${API_BASE_URL}/api/notifications/admin/read-all`, {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                });

                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true }))
                );
                setUnreadCount(0);
              } catch {}
            }}
          >
            Mark all read
          </button>

          <button
            className="text-[12px] text-[#a7aec4] hover:text-white"
            onClick={() => setNotifOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className={`${panelClass} p-6`}>
        <div className="h-3 w-36 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-9 w-56 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-4 w-full max-w-[620px] animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${softPanelClass} p-5`}>
            <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-7 w-32 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  iconSrc,
}: {
  label: string;
  value: string;
  helper: string;
  iconSrc: string;
}) {
  return (
    <div
      className={`${softPanelClass} group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>
          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
          <div className="mt-2 text-[12px] text-[#7f879f]">{helper}</div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 transition group-hover:bg-white/10">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function ChartBar({
  heightClass,
  label,
}: {
  heightClass: string;
  label: string;
}) {
  return (
    <div className="group relative flex flex-1 flex-col items-center justify-end gap-2">
      <div
        className={[
          "w-full rounded-full bg-gradient-to-t from-[#7c3aed] via-[#8b5cf6] to-[#d6c7ff] opacity-80 shadow-[0_0_30px_rgba(139,92,246,0.25)] transition group-hover:opacity-100",
          heightClass,
        ].join(" ")}
      />
      <div className="absolute bottom-0 translate-y-6 text-[11px] text-[#7f879f]">
        {label || "-"}
      </div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  heightClass,
  tone,
}: {
  label: string;
  value: number;
  heightClass: string;
  tone: string;
}) {
  const colors: Record<string, string> = {
    pending: "from-[#f59e0b] to-[#fde68a]",
    shipped: "from-[#2563eb] to-[#93c5fd]",
    delivered: "from-[#16a34a] to-[#86efac]",
    cancelled: "from-[#dc2626] to-[#fca5a5]",
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-2">
      <div className="text-[12px] font-semibold text-white">{value}</div>

      <div
        className={[
          "w-[72%] rounded-t-[14px] bg-gradient-to-t opacity-85 shadow-[0_0_26px_rgba(255,255,255,0.07)]",
          heightClass,
          colors[tone] || "from-[#374151] to-[#9ca3af]",
        ].join(" ")}
      />

      <div className="text-[11px] text-[#a7aec4]">{label}</div>
    </div>
  );
}

function Tr({
  id,
  name,
  email,
  total,
  date,
  badge,
}: {
  id: string;
  name: string;
  email?: string;
  total: string;
  date: string;
  badge: React.ReactNode;
}) {
  return (
    <tr className="border-t border-[#26293a] transition hover:bg-white/[0.03]">
      <td className="px-5 py-4">
        <div className="font-semibold text-white">{id}</div>
      </td>

      <td className="px-5 py-4">
        <Link href="#" className="font-medium text-white hover:text-[#d6c7ff]">
          {name}
        </Link>
        {email ? (
          <div className="mt-1 text-[12px] text-[#7f879f]">{email}</div>
        ) : null}
      </td>

      <td className="px-5 py-4 font-semibold text-[#d6c7ff]">{total}</td>
      <td className="px-5 py-4">{badge}</td>
      <td className="px-5 py-4 text-[#a7aec4]">{date}</td>
    </tr>
  );
}

function InfoCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${panelClass} p-5 sm:p-6`}>
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          {eyebrow}
        </div>
        <div className="mt-1 text-[20px] font-semibold text-white">{title}</div>
      </div>
      {children}
    </div>
  );
}

function SmallItem({
  left,
  right,
  tone,
}: {
  left: string;
  right: string;
  tone?: "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="line-clamp-1 text-[13px] font-medium text-white">
        {left}
      </span>
      <span
        className={[
          "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold",
          tone === "warning"
            ? "bg-amber-500/15 text-amber-300"
            : "bg-white/5 text-[#a7aec4]",
        ].join(" ")}
      >
        {right}
      </span>
    </div>
  );
}

function Badge({
  variant,
  children,
}: {
  variant: "shipped" | "delivered" | "pending" | "cancelled";
  children: React.ReactNode;
}) {
  const styles: Record<typeof variant, string> = {
    shipped: "border-blue-400/20 bg-blue-500/15 text-blue-300",
    delivered: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    pending: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    cancelled: "border-red-400/20 bg-red-500/15 text-red-300",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}