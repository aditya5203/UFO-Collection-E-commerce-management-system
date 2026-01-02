"use client";

import * as React from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-semibold text-white">Dashboard</h1>

      {/* Top stats */}
      <section className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value="1,234" />
        <StatCard label="Total Revenue" value="$56,789" />
        <StatCard label="Total Customers" value="456" />
        <StatCard label="Total Products Live" value="123" />
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
                Sales last 7 days · Last 7 days{" "}
                <span className="text-[#4ade80]">+15%</span>
              </div>
            </div>
            <div className="text-[12px] text-[#9ca3af]">This Week</div>
          </div>

          <div className="mb-2 text-[24px] font-semibold text-white">
            $12,345
          </div>

          {/* Chart mock */}
          <div className="relative mt-[6px] h-[180px] overflow-hidden rounded-[12px] border border-[#111827] bg-[radial-gradient(circle_at_0_0,#1f2937,#020617_55%)]">
            <div className="absolute inset-[14px_10px_16px_10px] rounded-[10px] border-b border-l border-dashed border-[#1f2937]" />

            <div className="absolute inset-[20px_16px_18px_16px] flex items-end gap-[10px]">
              <ChartBar h="h-[20px]" />
              <ChartBar h="h-[40px]" />
              <ChartBar h="h-[30px]" />
              <ChartBar h="h-[60px]" />
              <ChartBar h="h-[45px]" />
              <ChartBar h="h-[70px]" />
              <ChartBar h="h-[25px]" />
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
                1,234 total · <span className="text-[#4ade80]">+10%</span>
              </div>
            </div>
          </div>

          <div className="mt-[6px] flex h-[120px] items-end gap-[12px]">
            <StatusBar label="Pending" height="h-[70px]" />
            <StatusBar label="Shipped" height="h-[60px]" />
            <StatusBar label="Delivered" height="h-[80px]" />
            <StatusBar label="Cancelled" height="h-[40px]" />
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
                <Tr
                  id="#12345"
                  name="Ethan Harper"
                  total="$123"
                  date="2023-08-15"
                  badge={<Badge variant="shipped">Shipped</Badge>}
                />
                <Tr
                  id="#12346"
                  name="Olivia Bennett"
                  total="$456"
                  date="2023-08-14"
                  badge={<Badge variant="delivered">Delivered</Badge>}
                />
                <Tr
                  id="#12347"
                  name="Liam Carter"
                  total="$789"
                  date="2023-08-13"
                  badge={<Badge variant="pending">Pending</Badge>}
                />
                <Tr
                  id="#12348"
                  name="Sophia Evans"
                  total="$101"
                  date="2023-08-12"
                  badge={<Badge variant="cancelled">Cancelled</Badge>}
                />
                <Tr
                  id="#12349"
                  name="Noah Foster"
                  total="$234"
                  date="2023-08-11"
                  badge={<Badge variant="shipped">Shipped</Badge>}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Side cards */}
        <div className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
          <div className="text-[16px] font-medium text-white">
            Low Stock Alerts
          </div>

          <div className="mt-2 grid gap-[6px] text-[13px]">
            <SmallItem left="Product A" right="10 items left" />
            <SmallItem left="Product B" right="5 items left" />
            <SmallItem left="Product C" right="2 items left" />
          </div>

          <div className="mt-[22px]">
            <div className="text-[16px] font-medium text-white">
              New Users This Week
            </div>

            <div className="mt-2 grid gap-[6px] text-[13px]">
              <SmallItem left="Alex Johnson" right="2023-08-15" />
              <SmallItem left="Maria Lopez" right="2023-08-14" />
              <SmallItem left="David Kim" right="2023-08-13" />
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

function ChartBar({ h }: { h: string }) {
  return (
    <div
      className={[
        "flex-1 rounded-full opacity-50",
        "bg-gradient-to-t from-[#1d4ed8] to-[#38bdf8]",
        h,
      ].join(" ")}
    />
  );
}

function StatusBar({ label, height }: { label: string; height: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-[6px]">
      <div className={["w-[70%] rounded-[8px] bg-[#1f2937]", height].join(" ")} />
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
    <span className={["rounded-full px-[10px] py-[3px] text-[11px]", styles[variant]].join(" ")}>
      {children}
    </span>
  );
}
