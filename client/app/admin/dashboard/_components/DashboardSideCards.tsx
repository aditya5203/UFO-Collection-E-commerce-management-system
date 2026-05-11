"use client";

import * as React from "react";
import {
  SummaryResponse,
  formatDate,
  panelClass,
} from "./dashboardTypes";

type Props = {
  summary: SummaryResponse["data"] | null;
};

export default function DashboardSideCards({ summary }: Props) {
  return (
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
            <SmallItem key={u.id} left={u.name} right={formatDate(u.createdAt)} />
          ))}

          {(!summary?.newUsers || summary.newUsers.length === 0) && (
            <SmallItem left="No new users" right="-" />
          )}
        </div>
      </InfoCard>
    </div>
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