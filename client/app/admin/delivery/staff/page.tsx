"use client";

import * as React from "react";
import Link from "next/link";
import AdminPageGuard from "../../_components/AdminPageGuard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type DeliveryStaffRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  area?: string;
  isActive?: boolean;
  assignedOrdersCount?: number;
  deliveredOrdersCount?: number;
  failedOrdersCount?: number;
  createdAt?: string;
};

function safeStr(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function formatDateShort(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

function StatusPill({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  const tone = active
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : "border-red-500/30 bg-red-500/10 text-red-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
      {hint ? <div className="mt-1 text-sm text-slate-400">{hint}</div> : null}
    </div>
  );
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function DeliveryStaffPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<DeliveryStaffRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const load = React.useCallback(async (search: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/delivery-staff?search=${encodeURIComponent(
          search
        )}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        setRows([]);
        setError((json as any)?.message || "Failed to load delivery staff");
        return;
      }

      const data = Array.isArray((json as any)?.data) ? (json as any).data : [];

      const normalized: DeliveryStaffRow[] = data.map((item: any) => ({
        id: safeStr(item?.id || item?._id),
        name: safeStr(item?.name),
        email: safeStr(item?.email),
        phone: safeStr(item?.phone),
        vehicleType: safeStr(item?.vehicleType),
        vehicleNumber: safeStr(item?.vehicleNumber),
        area: safeStr(item?.area),
        isActive:
          typeof item?.isActive === "boolean"
            ? item.isActive
            : Boolean(item?.active),
        assignedOrdersCount: Number(item?.assignedOrdersCount || 0),
        deliveredOrdersCount: Number(item?.deliveredOrdersCount || 0),
        failedOrdersCount: Number(item?.failedOrdersCount || 0),
        createdAt: safeStr(item?.createdAt),
      }));

      setRows(normalized);
    } catch {
      setRows([]);
      setError("Network error while loading delivery staff");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load("");
  }, [load]);

  React.useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  const filteredRows = React.useMemo(() => {
    if (statusFilter === "all") return rows;
    if (statusFilter === "active") return rows.filter((item) => item.isActive);
    if (statusFilter === "inactive") return rows.filter((item) => !item.isActive);
    return rows;
  }, [rows, statusFilter]);

  const totalStaff = filteredRows.length;
  const activeStaff = filteredRows.filter((item) => item.isActive).length;
  const inactiveStaff = filteredRows.filter((item) => !item.isActive).length;
  const assignedLoad = filteredRows.reduce(
    (sum, item) => sum + Number(item.assignedOrdersCount || 0),
    0
  );

  return (
    <AdminPageGuard permission="orderView">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-700/50 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_35%),linear-gradient(180deg,rgba(10,19,36,1),rgba(7,14,27,1))] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.32)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Admin <span className="mx-2">/</span> Delivery Staff
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                Delivery Staff
              </h1>

              <p className="text-sm text-slate-400">
                Create and manage delivery riders from one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, phone"
                className="h-11 w-[280px] rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 text-sm text-slate-100 placeholder:text-slate-400 outline-none"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 text-sm text-slate-100 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <Link
                href="/admin/delivery/staff/create"
                className="inline-flex h-11 items-center rounded-xl bg-sky-500 px-5 text-sm font-bold text-white transition hover:bg-sky-600"
              >
                + Add Delivery Man
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Staff"
              value={String(totalStaff)}
              hint="All registered delivery riders"
            />
            <StatCard
              label="Active"
              value={String(activeStaff)}
              hint="Available for assignment"
            />
            <StatCard
              label="Inactive"
              value={String(inactiveStaff)}
              hint="Currently disabled"
            />
            <StatCard
              label="Assigned Orders"
              value={String(assignedLoad)}
              hint="Current rider workload"
            />
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-slate-700/50 bg-[#0A1324] shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between border-b border-slate-700/40 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Delivery Riders
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Manage rider details, area, vehicle, and status
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1480px] w-full border-collapse">
              <thead className="bg-slate-900/30">
                <tr className="text-left text-sm font-semibold text-slate-200">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Area</th>
                  <th className="px-6 py-4">Assigned</th>
                  <th className="px-6 py-4">Delivered</th>
                  <th className="px-6 py-4">Failed</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-10 text-center text-sm text-slate-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-700/40 text-sm text-slate-100 hover:bg-slate-900/20"
                    >
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-200">
                            {item.name || "-"}
                          </div>
                          <div className="text-slate-400">{item.email || "-"}</div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {item.phone || "-"}
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="text-slate-200">
                            {item.vehicleType || "-"}
                          </div>
                          <div className="text-slate-400">
                            {item.vehicleNumber || "-"}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {item.area || "-"}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {Number(item.assignedOrdersCount || 0)}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {Number(item.deliveredOrdersCount || 0)}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {Number(item.failedOrdersCount || 0)}
                      </td>

                      <td className="px-6 py-5">
                        <StatusPill active={item.isActive}>
                          {item.isActive ? "Active" : "Inactive"}
                        </StatusPill>
                      </td>

                      <td className="px-6 py-5 text-slate-400">
                        {formatDateShort(item.createdAt)}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/admin/delivery/staff/${item.id}`}
                          className="font-semibold text-slate-200 hover:text-slate-100"
                        >
                          View
                        </Link>
                        <span className="mx-2 text-slate-500">/</span>
                        <Link
                          href={`/admin/delivery/staff/${item.id}/edit`}
                          className="font-semibold text-slate-200 hover:text-slate-100"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-10 text-center text-sm text-slate-400"
                    >
                      No delivery staff found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageGuard>
  );
}