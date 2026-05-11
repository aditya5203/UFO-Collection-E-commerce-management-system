"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../_components/AdminPageGuard";

import DashboardCharts from "./_components/DashboardCharts";
import DashboardHeader from "./_components/DashboardHeader";
import DashboardSideCards from "./_components/DashboardSideCards";
import DashboardStats from "./_components/DashboardStats";
import RecentOrdersTable from "./_components/RecentOrdersTable";
import {
  DashboardSkeleton,
  Toast,
} from "./_components/DashboardShared";
import {
  API_BASE_URL,
  AdminNotification,
  SocketNotificationPayload,
  SummaryResponse,
  ToastState,
  ToastType,
  WEEK_LABELS,
  getHeightClass,
  getStatusValue,
  panelClass,
  pickId,
  primaryBtnClass,
  safeJson,
  shellClass,
} from "./_components/dashboardTypes";

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
            <DashboardHeader
              refreshing={refreshing}
              unreadCount={unreadCount}
              notifOpen={notifOpen}
              setNotifOpen={setNotifOpen}
              notifRef={notifRef}
              notifLoading={notifLoading}
              notifications={notifications}
              fetchNotifications={fetchNotifications}
              setNotifications={setNotifications}
              setUnreadCount={setUnreadCount}
              showToast={showToast}
              onRefresh={handleManualRefresh}
            />

            <DashboardStats summary={summary} />

            <DashboardCharts
              salesBars={salesBars}
              weeklyRevenue={weeklyRevenue}
              hasSalesData={hasSalesData}
              statusBars={statusBars}
              totalOrdersByStatus={totalOrdersByStatus}
              hasStatusData={hasStatusData}
            />

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
              <RecentOrdersTable summary={summary} />
              <DashboardSideCards summary={summary} />
            </section>
          </motion.div>
        )}
      </div>
    </AdminPageGuard>
  );
}