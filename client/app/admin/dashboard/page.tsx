"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../_components/AdminPageGuard";

type SummaryResponse = {
  success: boolean;
  message?: string;
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

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
} | null;

type SocketNotificationPayload = {
  notification?: AdminNotification;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const chartHeightClasses = [
  "h-[48px]",
  "h-[64px]",
  "h-[80px]",
  "h-[96px]",
  "h-[112px]",
  "h-[128px]",
  "h-[144px]",
];

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

function timeAgo(iso?: string) {
  if (!iso) return "";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diff = Date.now() - d.getTime();
  const s = Math.max(0, Math.floor(diff / 1000));

  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(iso);
}

function pickId(n: AdminNotification) {
  return String(n._id || n.id || "");
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function normalizeStatus(status?: string) {
  return String(status || "").trim().toLowerCase();
}

function getStatusValue(
  ordersByStatus: Record<string, number> | undefined,
  target: string
) {
  if (!ordersByStatus) return 0;

  const wanted = normalizeStatus(target);

  return Object.entries(ordersByStatus).reduce((sum, [key, value]) => {
    return normalizeStatus(key) === wanted ? sum + Number(value || 0) : sum;
  }, 0);
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
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
  const [toast, setToast] = React.useState<ToastState>(null);

  const socketRef = React.useRef<Socket | null>(null);
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const firstLoadRef = React.useRef(true);
  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2600);
    },
    []
  );

  const fetchSummary = React.useCallback(
    async (mode: "silent" | "manual" | "initial" = "silent") => {
      try {
        if (mode === "manual") setRefreshing(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/admin/dashboard/summary`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const json = (await safeJson(res)) as SummaryResponse;

        if (!res.ok || !json?.success) {
          throw new Error(json?.message || "Failed to load dashboard");
        }

        setSummary(json.data);

        if (mode === "manual") {
          showToast("Dashboard refreshed successfully.", "success");
        }
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Failed to load dashboard";

        setError(message);

        if (mode === "manual") {
          showToast(message, "error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

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
      showToast("Failed to load notifications.", "error");
    } finally {
      setNotifLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    fetchSummary("initial");
    fetchNotifications();

    const summaryInterval = window.setInterval(() => {
      fetchSummary("silent");
    }, 30000);

    const onFocus = () => {
      fetchSummary("silent");
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

    socket.on(
      "admin:notification:new",
      (payload: SocketNotificationPayload | AdminNotification) => {
        const next =
          payload && "notification" in payload
            ? payload.notification
            : (payload as AdminNotification);

        if (!next) return;

        setNotifications((prev) => {
          const id = pickId(next);

          if (!id) return [next, ...prev].slice(0, 10);

          const exists = prev.some((item) => pickId(item) === id);
          if (exists) return prev;

          return [next, ...prev].slice(0, 10);
        });

        setUnreadCount((prev) => prev + 1);

        if (!firstLoadRef.current) {
          showToast(next.title || "New admin notification received.", "info");
        }
      }
    );

    firstLoadRef.current = false;

    return () => {
      window.clearInterval(summaryInterval);
      window.removeEventListener("focus", onFocus);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchSummary, fetchNotifications, showToast]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!notifRef.current) return;

      if (!notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const salesBars = React.useMemo(() => {
    const arr = summary?.salesLast7Days || [];
    const sliced = arr.slice(-7);
    const totals = sliced.map((x) => Number(x.totalPaisa || 0));
    const max = Math.max(1, ...totals);

    const padded =
      sliced.length >= 7
        ? sliced
        : [
            ...Array.from({ length: 7 - sliced.length }).map(() => ({
              date: "",
              label: "",
              totalPaisa: 0,
            })),
            ...sliced,
          ];

    return padded.map((x, idx) => ({
      label: x.label || WEEK_LABELS[idx] || "",
      heightClass: getHeightClass(Number(x.totalPaisa || 0), max),
      totalPaisa: Number(x.totalPaisa || 0),
    }));
  }, [summary]);

  const weeklyRevenue = React.useMemo(() => {
    return (summary?.salesLast7Days || []).reduce(
      (sum, x) => sum + Number(x.totalPaisa || 0),
      0
    );
  }, [summary]);

  const hasSalesData = weeklyRevenue > 0;

  const statusBars = React.useMemo(() => {
    const pending = getStatusValue(summary?.ordersByStatus, "Pending");
    const shipped = getStatusValue(summary?.ordersByStatus, "Shipped");
    const delivered = getStatusValue(summary?.ordersByStatus, "Delivered");
    const cancelled = getStatusValue(summary?.ordersByStatus, "Cancelled");

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

  const totalOrdersByStatus = React.useMemo(() => {
    const values = Object.values(summary?.ordersByStatus || {});
    return values.reduce((sum, value) => sum + Number(value || 0), 0);
  }, [summary]);

  const hasStatusData = totalOrdersByStatus > 0;

  const handleManualRefresh = async () => {
    await Promise.all([fetchSummary("manual"), fetchNotifications()]);
  };

  return (
    <AdminPageGuard permission="dashboardView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <Toast toast={toast} />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${panelClass} p-5`}
          >
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#fca5a5]">
              Dashboard Error
            </div>

            <div className="mt-2 text-[15px] text-white">{error}</div>

            <button
              onClick={() => fetchSummary("manual")}
              className={`${primaryBtnClass} mt-5`}
              disabled={refreshing}
              type="button"
            >
              {refreshing ? "Retrying..." : "Retry"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
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
                    onClick={handleManualRefresh}
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
                  <div className="absolute inset-x-5 top-[152px] border-t border-dashed border-white/10" />

                  {!hasSalesData && (
                    <EmptyChartState message="No sales revenue recorded in the last 7 days." />
                  )}

                  <div className="relative flex h-full items-end gap-3 pb-7 pt-3">
                    {salesBars.map((b, idx) => (
                      <ChartBar
                        key={`${b.label}-${idx}`}
                        heightClass={b.heightClass}
                        label={b.label}
                        value={formatMoneyNPR(b.totalPaisa)}
                        muted={!hasSalesData}
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

                <div className="relative rounded-[22px] border border-[#26293a] bg-[#0d0f17] p-4">
                  {!hasStatusData && (
                    <EmptyChartState
                      message="No order status data available yet."
                      compact
                    />
                  )}

                  <div className="flex h-[190px] items-end gap-4">
                    {statusBars.map((s) => (
                      <StatusBar
                        key={s.label}
                        label={s.label}
                        value={s.value}
                        heightClass={s.heightClass}
                        tone={s.tone}
                        muted={!hasStatusData}
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
                      {(summary?.recentOrders || []).map((o) => {
                        const status = normalizeStatus(o.orderStatus);

                        return (
                          <Tr
                            key={o.id || o.orderCode}
                            id={o.orderCode || o.id}
                            name={o.customerName || "Customer"}
                            email={o.customerEmail}
                            total={formatMoneyNPR(o.totalPaisa)}
                            date={formatDate(o.createdAt)}
                            badge={
                              <Badge
                                variant={
                                  status === "delivered"
                                    ? "delivered"
                                    : status === "shipped"
                                    ? "shipped"
                                    : status === "cancelled"
                                    ? "cancelled"
                                    : "pending"
                                }
                              >
                                {o.orderStatus || "Pending"}
                              </Badge>
                            }
                          />
                        );
                      })}
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
                      <SmallItem left="No new users" right="-" />
                    )}
                  </div>
                </InfoCard>
              </div>
            </section>
          </motion.div>
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
                      showToast("Failed to update notification status.", "error");
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
            <div className="mt-4 h-3 w-28 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
        <div className={`${panelClass} h-[360px] animate-pulse`} />
        <div className={`${panelClass} h-[360px] animate-pulse`} />
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
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`${softPanelClass} group p-5 transition duration-300 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]`}
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
    </motion.div>
  );
}

function ChartBar({
  heightClass,
  label,
  value,
  muted,
}: {
  heightClass: string;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="group relative flex flex-1 flex-col items-center justify-end gap-2">
      <div
        title={value}
        className={[
          "w-full origin-bottom rounded-full bg-gradient-to-t from-[#7c3aed] via-[#8b5cf6] to-[#d6c7ff] shadow-[0_0_30px_rgba(139,92,246,0.25)] transition duration-300 group-hover:opacity-100",
          heightClass,
          muted ? "opacity-30 grayscale" : "opacity-80",
        ].join(" ")}
      />

      <div className="absolute bottom-0 translate-y-6 text-[11px] text-[#7f879f]">
        {label || "-"}
      </div>

      <div className="pointer-events-none absolute bottom-[74%] hidden rounded-full border border-white/10 bg-[#0d0f17] px-3 py-1 text-[11px] font-semibold text-white shadow-xl group-hover:block">
        {value}
      </div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  heightClass,
  tone,
  muted,
}: {
  label: string;
  value: number;
  heightClass: string;
  tone: string;
  muted?: boolean;
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
          "w-[72%] origin-bottom rounded-t-[14px] bg-gradient-to-t shadow-[0_0_26px_rgba(255,255,255,0.07)] transition duration-300",
          heightClass,
          colors[tone] || "from-[#374151] to-[#9ca3af]",
          muted ? "opacity-30 grayscale" : "opacity-85",
        ].join(" ")}
      />

      <div className="text-center text-[11px] text-[#a7aec4]">{label}</div>
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
        <div className="font-medium text-white">{name}</div>

        {email ? (
          <div className="mt-1 text-[12px] text-[#7f879f]">{email}</div>
        ) : null}
      </td>

      <td className="px-5 py-4 font-semibold text-[#d6c7ff]">{total}</td>
      <td className="px-5 py-4">{badge}</td>
      <td className="px-5 py-4 text-[#a7aec4]">{date || "-"}</td>
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
        {right || "-"}
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
  const styles: Record<
    "shipped" | "delivered" | "pending" | "cancelled",
    string
  > = {
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

function EmptyChartState({
  message,
  compact,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-4 z-10 flex items-center justify-center",
        compact ? "top-16" : "top-20",
      ].join(" ")}
    >
      <div className="rounded-full border border-white/10 bg-[#0d0f17]/80 px-4 py-2 text-center text-[12px] text-[#a7aec4] backdrop-blur">
        {message}
      </div>
    </div>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          className={[
            "fixed right-4 top-4 z-[80] max-w-[360px] rounded-[18px] border px-4 py-3 text-[13px] font-semibold shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur",
            toast.type === "success"
              ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
              : toast.type === "error"
              ? "border-red-400/20 bg-red-500/15 text-red-200"
              : "border-[#8b5cf6]/30 bg-[#8b5cf6]/15 text-[#e9ddff]",
          ].join(" ")}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}