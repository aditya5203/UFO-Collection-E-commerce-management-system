"use client";

import * as React from "react";
import Link from "next/link";

type SummaryResponse = {
  success: boolean;
  data: {
    top: {
      totalOrders: number;
      totalRevenuePaisa: number;
      totalCustomers: number;
      totalProductsLive: number;
    };
    ordersByStatus: Record<string, number>;
    salesLast7Days: Array<{ date: string; totalPaisa: number }>;
    recentOrders: Array<{
      id: string;
      orderCode: string;
      totalPaisa: number;
      orderStatus: string;
      createdAt: string;
      customerName: string;
    }>;
    lowStock: Array<{ id: string; name: string; stock: number }>;
    newUsers: Array<{ id: string; name: string; createdAt: string }>;
  };
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

export default function AdminDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<SummaryResponse["data"] | null>(
    null
  );

  const fetchSummary = React.useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard/summary`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        // If you have admin login route, redirect there
        window.location.href = "/admin/login";
        return;
      }

      const json = (await res.json().catch(() => ({}))) as SummaryResponse;

      if (!res.ok || !json?.success) {
        throw new Error((json as any)?.message || "Failed to load dashboard");
      }

      setSummary(json.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSummary();

    // auto-refresh (10s)
    const interval = setInterval(fetchSummary, 10000);

    // refresh on focus
    const onFocus = () => fetchSummary();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchSummary]);

  // -------------------------
  // compute chart bars from API
  // -------------------------
  const salesBars = React.useMemo(() => {
    const arr = summary?.salesLast7Days || [];
    const totals = arr.map((x) => Number(x.totalPaisa || 0));
    const max = Math.max(1, ...totals);

    // we want exactly 7 bars (Mon-Sun style). If less, pad.
    const padded =
      arr.length >= 7
        ? arr.slice(-7)
        : [
            ...Array.from({ length: 7 - arr.length }).map(() => ({
              date: "",
              totalPaisa: 0,
            })),
            ...arr,
          ];

    return padded.map((x) => {
      const ratio = Number(x.totalPaisa || 0) / max; // 0..1
      const px = Math.round(18 + ratio * 82); // height range 18..100
      return {
        date: x.date,
        heightPx: px,
      };
    });
  }, [summary]);

  // orders by status -> counts
  const statusCount = (k: string) => Number(summary?.ordersByStatus?.[k] || 0);
  const totalOrdersByStatus =
    statusCount("Pending") +
    statusCount("Shipped") +
    statusCount("Delivered") +
    statusCount("Cancelled");

  // status bar height
  const statusBars = React.useMemo(() => {
    const pending = statusCount("Pending");
    const shipped = statusCount("Shipped");
    const delivered = statusCount("Delivered");
    const cancelled = statusCount("Cancelled");

    const max = Math.max(1, pending, shipped, delivered, cancelled);

    const toH = (v: number) => `${Math.round(40 + (v / max) * 70)}px`; // 40..110px

    return [
      { label: "Pending", height: toH(pending) },
      { label: "Shipped", height: toH(shipped) },
      { label: "Delivered", height: toH(delivered) },
      { label: "Cancelled", height: toH(cancelled) },
    ];
  }, [summary]);

  if (loading) {
    return <div className="text-[13px] text-[#9ca3af]">Loading dashboard…</div>;
  }

  if (error) {
    return (
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
    );
  }

  const top = summary?.top;

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-semibold text-white">Dashboard</h1>

      {/* Top stats */}
      <section className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={String(top?.totalOrders ?? 0)} />
        <StatCard
          label="Total Revenue"
          value={formatMoneyNPR(top?.totalRevenuePaisa ?? 0)}
        />
        <StatCard
          label="Total Customers"
          value={String(top?.totalCustomers ?? 0)}
        />
        <StatCard
          label="Total Products Live"
          value={String(top?.totalProductsLive ?? 0)}
        />
      </section>

      {/* Sales overview + Orders by status */}
      <section className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr]">
        {/* Sales Overview */}
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

          {/* Chart */}
          <div className="relative mt-[6px] h-[180px] overflow-hidden rounded-[12px] border border-[#111827] bg-[radial-gradient(circle_at_0_0,#1f2937,#020617_55%)]">
            <div className="absolute inset-[14px_10px_16px_10px] rounded-[10px] border-b border-l border-dashed border-[#1f2937]" />

            <div className="absolute inset-[20px_16px_18px_16px] flex items-end gap-[10px]">
              {salesBars.map((b, idx) => (
                <ChartBar key={idx} px={b.heightPx} />
              ))}
            </div>

            <div className="absolute bottom-[6px] left-[18px] right-[18px] flex justify-between text-[11px] text-[#6b7280]">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Orders by Status */}
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

      {/* Recent Orders + Side cards */}
      <section className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr]">
        {/* Recent Orders */}
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

        {/* Side cards */}
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
    </div>
  );
}

/* -------------------- Small Components -------------------- */

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
      className={[
        "flex-1 rounded-full opacity-50",
        "bg-gradient-to-t from-[#1d4ed8] to-[#38bdf8]",
      ].join(" ")}
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
