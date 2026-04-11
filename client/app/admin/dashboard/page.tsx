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
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
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

      const json = (await safeJson(res)) as SummaryResponse & { message?: string };

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
        Number(countJson?.count ?? countJson?.data ?? countJson?.unreadCount) || 0;

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

    return padded.map((x, idx) => {
      const ratio = Number(x.totalPaisa || 0) / max;
      const px = Math.round(18 + ratio * 82);

      return {
        label:
          x.label || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx] || "",
        heightPx: px,
      };
    });
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
    const toH = (v: number) => `${Math.round(40 + (v / max) * 70)}px`;

    return [
      { label: "Pending", height: toH(pending) },
      { label: "Shipped", height: toH(shipped) },
      { label: "Delivered", height: toH(delivered) },
      { label: "Cancelled", height: toH(cancelled) },
    ];
  }, [summary]);

  return (
    <AdminPageGuard permission="dashboardView">
      <div className="space-y-6">
        {loading ? (
          <div className="text-[13px] text-[#9ca3af]">Loading dashboard…</div>
        ) : error ? (
          <div className="rounded-[14px] border border-[#111827] bg-[#020617] p-4 text-[13px] text-[#fca5a5]">
            {error}
            <div className="mt-2">
              <button
                onClick={fetchSummary}
                className="rounded-lg bg-[#2563eb] px-3 py-2 text-[12px] text-white hover:bg-[#1d4ed8]"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-[22px] font-semibold text-white">Dashboard</h1>

              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    if (next) fetchNotifications();
                  }}
                  className="relative grid h-[42px] w-[42px] place-items-center rounded-[12px] border border-[#111827] bg-[#020617] hover:bg-[#0b1220]"
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
                    <span className="absolute -right-[6px] -top-[6px] grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ef4444] px-[5px] text-[11px] font-semibold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-[48px] z-50 w-[340px] overflow-hidden rounded-[14px] border border-[#111827] bg-[#020617] shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
                    <div className="flex items-center justify-between border-b border-[#111827] px-[14px] py-[12px]">
                      <div className="text-[13px] font-semibold text-white">
                        Notifications
                      </div>
                      <button
                        className="text-[12px] text-[#60a5fa] hover:underline"
                        onClick={fetchNotifications}
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto">
                      {notifLoading && (
                        <div className="px-[14px] py-[12px] text-[12px] text-[#9ca3af]">
                          Loading...
                        </div>
                      )}

                      {!notifLoading && notifications.length === 0 && (
                        <div className="px-[14px] py-[12px] text-[12px] text-[#9ca3af]">
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
                                      `${API_BASE_URL}/api/notifications/admin/${encodeURIComponent(rawId)}/read`,
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
                                "block border-b border-[#111827] px-[14px] py-[12px] hover:bg-[#0b1220]",
                                isRead ? "opacity-80" : "opacity-100",
                              ].join(" ")}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-medium text-white">
                                    {n.title || "Notification"}
                                  </div>
                                  <div className="mt-[2px] line-clamp-2 text-[12px] text-[#9ca3af]">
                                    {n.message || ""}
                                  </div>
                                  <div className="mt-[6px] text-[11px] text-[#6b7280]">
                                    {timeAgo(n.createdAt)}
                                    {n.type ? ` • ${n.type}` : ""}
                                  </div>
                                </div>

                                {!isRead && (
                                  <span className="mt-[4px] h-[8px] w-[8px] flex-none rounded-full bg-[#60a5fa]" />
                                )}
                              </div>
                            </Link>
                          );
                        })}
                    </div>

                    <div className="flex items-center justify-between px-[14px] py-[10px]">
                      <Link
                        href="/admin/notifications"
                        className="text-[12px] text-[#60a5fa] hover:underline"
                        onClick={() => setNotifOpen(false)}
                      >
                        View all
                      </Link>

                      <div className="flex items-center gap-3">
                        <button
                          className="text-[12px] text-[#9ca3af] hover:text-white"
                          onClick={async () => {
                            try {
                              await fetch(
                                `${API_BASE_URL}/api/notifications/admin/read-all`,
                                {
                                  method: "PATCH",
                                  credentials: "include",
                                  headers: { "Content-Type": "application/json" },
                                }
                              );

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
                          className="text-[12px] text-[#9ca3af] hover:text-white"
                          onClick={() => setNotifOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <section className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Orders" value={String(summary?.top?.totalOrders ?? 0)} />
              <StatCard
                label="Total Revenue"
                value={formatMoneyNPR(summary?.top?.totalRevenuePaisa ?? 0)}
              />
              <StatCard
                label="Total Customers"
                value={String(summary?.top?.totalCustomers ?? 0)}
              />
              <StatCard
                label="Total Products Live"
                value={String(summary?.top?.totalProductsLive ?? 0)}
              />
            </section>

            <section className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
                <div className="mb-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-[16px] font-medium text-white">
                      Sales Overview
                    </div>
                    <div className="text-[12px] text-[#9ca3af]">
                      Sales last 7 days
                    </div>
                  </div>
                  <div className="text-[12px] text-[#9ca3af]">This Week</div>
                </div>

                <div className="mb-2 text-[24px] font-semibold text-white">
                  {formatMoneyNPR(
                    (summary?.salesLast7Days || []).reduce(
                      (sum, x) => sum + Number(x.totalPaisa || 0),
                      0
                    )
                  )}
                </div>

                <div className="relative mt-[6px] h-[180px] overflow-hidden rounded-[12px] border border-[#111827] bg-[radial-gradient(circle_at_0_0,#1f2937,#020617_55%)]">
                  <div className="absolute inset-[14px_10px_16px_10px] rounded-[10px] border-b border-l border-dashed border-[#1f2937]" />

                  <div className="absolute inset-[20px_16px_18px_16px] flex items-end gap-[10px]">
                    {salesBars.map((b, idx) => (
                      <ChartBar key={idx} px={b.heightPx} />
                    ))}
                  </div>

                  <div className="absolute bottom-[6px] left-[18px] right-[18px] flex justify-between text-[11px] text-[#6b7280]">
                    {salesBars.map((b, idx) => (
                      <span key={`${b.label}-${idx}`}>{b.label || "-"}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
                <div className="mb-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-[16px] font-medium text-white">
                      Orders by Status
                    </div>
                    <div className="text-[12px] text-[#9ca3af]">
                      {totalOrdersByStatus.toLocaleString("en-US")} total
                    </div>
                  </div>
                </div>

                <div className="mt-[6px] flex h-[120px] items-end gap-[12px]">
                  {statusBars.map((s) => (
                    <StatusBar key={s.label} label={s.label} heightPx={s.height} />
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
                <div className="mb-2 text-[16px] font-medium text-white">
                  Recent Orders
                </div>

                <div className="mt-[10px] overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-[#111827] text-left text-[12px] text-[#9ca3af]">
                        <th className="px-[12px] py-[10px]">Order ID</th>
                        <th className="px-[12px] py-[10px]">Customer</th>
                        <th className="px-[12px] py-[10px]">Total</th>
                        <th className="px-[12px] py-[10px]">Status</th>
                        <th className="px-[12px] py-[10px]">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(summary?.recentOrders || []).map((o) => (
                        <Tr
                          key={o.id}
                          id={o.orderCode || o.id}
                          name={o.customerName || "Customer"}
                          total={formatMoneyNPR(o.totalPaisa)}
                          date={formatDate(o.createdAt)}
                          badge={
                            <Badge
                              variant={
                                (String(o.orderStatus || "Pending").toLowerCase() as any) ===
                                "delivered"
                                  ? "delivered"
                                  : (String(o.orderStatus || "Pending").toLowerCase() as any) ===
                                    "shipped"
                                  ? "shipped"
                                  : (String(o.orderStatus || "Pending").toLowerCase() as any) ===
                                    "cancelled"
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

                  {(!summary?.recentOrders || summary.recentOrders.length === 0) && (
                    <div className="py-3 text-[13px] text-[#9ca3af]">
                      No recent orders yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
                <div className="text-[16px] font-medium text-white">
                  Low Stock Alerts
                </div>

                <div className="mt-2 grid gap-[6px] text-[13px]">
                  {(summary?.lowStock || []).map((p) => (
                    <SmallItem key={p.id} left={p.name} right={`${p.stock} items left`} />
                  ))}
                  {(!summary?.lowStock || summary.lowStock.length === 0) && (
                    <SmallItem left="No low stock items" right="" />
                  )}
                </div>

                <div className="mt-[22px]">
                  <div className="text-[16px] font-medium text-white">
                    New Users This Week
                  </div>

                  <div className="mt-2 grid gap-[6px] text-[13px]">
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
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminPageGuard>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[6px] rounded-[14px] border border-[#111827] bg-[#020617] px-[16px] py-[14px]">
      <div className="text-[12px] text-[#9ca3af]">{label}</div>
      <div className="text-[20px] font-semibold text-[#f9fafb]">{value}</div>
    </div>
  );
}

function ChartBar({ px }: { px: number }) {
  return (
    <div
      className="flex-1 rounded-full bg-gradient-to-t from-[#1d4ed8] to-[#38bdf8] opacity-50"
      style={{ height: `${px}px` }}
    />
  );
}

function StatusBar({ label, heightPx }: { label: string; heightPx: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-[6px]">
      <div
        className="w-[70%] rounded-[8px] bg-[#1f2937]"
        style={{ height: heightPx }}
      />
      <div className="text-[11px] text-[#9ca3af]">{label}</div>
    </div>
  );
}

function Tr({
  id,
  name,
  total,
  date,
  badge,
}: {
  id: string;
  name: string;
  total: string;
  date: string;
  badge: React.ReactNode;
}) {
  return (
    <tr className="border-t border-[#111827]">
      <td className="px-[12px] py-[10px] text-white">{id}</td>
      <td className="px-[12px] py-[10px]">
        <Link href="#" className="text-[#60a5fa] hover:underline">
          {name}
        </Link>
      </td>
      <td className="px-[12px] py-[10px] text-white">{total}</td>
      <td className="px-[12px] py-[10px]">{badge}</td>
      <td className="px-[12px] py-[10px] text-white">{date}</td>
    </tr>
  );
}

function SmallItem({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white">{left}</span>
      <span className="text-[12px] text-[#9ca3af]">{right}</span>
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
    shipped: "bg-[rgba(59,130,246,0.15)] text-[#60a5fa]",
    delivered: "bg-[rgba(34,197,94,0.15)] text-[#4ade80]",
    pending: "bg-[rgba(234,179,8,0.15)] text-[#facc15]",
    cancelled: "bg-[rgba(248,113,113,0.15)] text-[#f97373]",
  };

  return (
    <span
      className={[
        "rounded-full px-[10px] py-[3px] text-[11px]",
        styles[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}