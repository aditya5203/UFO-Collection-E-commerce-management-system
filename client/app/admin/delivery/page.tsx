"use client";

import * as React from "react";
import Link from "next/link";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type DeliveryAssignmentStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned";

type DeliveryRow = {
  id: string;
  orderCode?: string;
  createdAt?: string;
  totalPaisa?: number;
  total?: number;
  paymentMethod?: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  address?: {
    fullName?: string;
    phone?: string;
    city?: string;
    cityOrMunicipality?: string;
    district?: string;
    addressLine?: string;
    area?: string;
    street?: string;
  };
  deliveryAssignment?: {
    deliveryManId?: string;
    name?: string;
    phone?: string;
    email?: string;
    vehicleType?: string;
    note?: string;
    assignedAt?: string;
    status?: DeliveryAssignmentStatus | string;
  };
};

type RiderOption = {
  id: string;
  name: string;
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

function formatNPR(paisa?: number, total?: number) {
  const finalPaisa = Number.isFinite(paisa as number)
    ? Number(paisa)
    : Math.round(Number(total || 0) * 100);

  return `Rs. ${(finalPaisa / 100).toFixed(2)}`;
}

function getStatusTone(status?: string) {
  const s = safeStr(status).toLowerCase();

  if (s === "assigned" || s === "picked up" || s === "out for delivery") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  }

  if (s === "delivered") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (s === "failed delivery" || s === "returned") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getStatusTone(String(children));

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

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 text-sm text-slate-100 outline-none"
    >
      {children}
    </select>
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

export default function AdminDeliveryPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<DeliveryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] = React.useState<AdminPermissions | null>(
    null
  );

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [riderFilter, setRiderFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");

  const canView = hasPermission(role, permissions, "deliveryView");

  React.useEffect(() => {
    let mounted = true;

    const loadAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const body = (await safeJson(res)) as AdminSettingsResponse;
        const nextRole = (body?.profile?.role || "admin") as
          | "admin"
          | "superadmin";
        const nextPermissions = normalizeAdminPermissions(
          nextRole,
          body?.profile?.permissions
        );

        if (!mounted) return;

        setRole(nextRole);
        setPermissions(nextPermissions);
      } catch {
        // ignore
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const load = React.useCallback(async (search: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/orders?search=${encodeURIComponent(search)}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        setRows([]);
        setError((json as any)?.message || "Failed to load delivery orders");
        return;
      }

      const data = Array.isArray((json as any)?.data) ? (json as any).data : [];
      setRows(data);
    } catch {
      setRows([]);
      setError("Network error while loading delivery orders");
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

  const deliveryRows = React.useMemo(() => {
    let filtered = rows.filter((item) => item.deliveryAssignment);

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (item) =>
          safeStr(item.deliveryAssignment?.status).toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    if (riderFilter !== "all") {
      filtered = filtered.filter(
        (item) => safeStr(item.deliveryAssignment?.deliveryManId) === riderFilter
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();

      filtered = filtered.filter((item) => {
        if (!item.createdAt) return false;

        const created = new Date(item.createdAt);
        if (Number.isNaN(created.getTime())) return false;

        const diffMs = now.getTime() - created.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (dateFilter === "today") {
          return created.toDateString() === now.toDateString();
        }

        if (dateFilter === "7days") {
          return diffDays <= 7;
        }

        if (dateFilter === "30days") {
          return diffDays <= 30;
        }

        return true;
      });
    }

    return filtered;
  }, [rows, statusFilter, riderFilter, dateFilter]);

  const riderOptions = React.useMemo<RiderOption[]>(() => {
    const map = new Map<string, RiderOption>();

    rows.forEach((item) => {
      const id = safeStr(item.deliveryAssignment?.deliveryManId);
      const name = safeStr(item.deliveryAssignment?.name);

      if (id) {
        map.set(id, {
          id,
          name: name || "Unknown Rider",
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [rows]);

  const totalAssigned = deliveryRows.length;

  const outForDelivery = deliveryRows.filter(
    (item) =>
      safeStr(item.deliveryAssignment?.status).toLowerCase() ===
      "out for delivery"
  ).length;

  const delivered = deliveryRows.filter(
    (item) =>
      safeStr(item.deliveryAssignment?.status).toLowerCase() === "delivered"
  ).length;

  const failed = deliveryRows.filter((item) => {
    const s = safeStr(item.deliveryAssignment?.status).toLowerCase();
    return s === "failed delivery" || s === "returned";
  }).length;

  return (
    <AdminPageGuard permission="deliveryView">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-700/50 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_35%),linear-gradient(180deg,rgba(10,19,36,1),rgba(7,14,27,1))] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.32)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Admin <span className="mx-2">/</span> Delivery
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Delivery Management
                </h1>
              </div>

              <p className="text-sm text-slate-400">
                View assigned orders and manage delivery flow from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search order, customer, rider"
                className="h-11 w-[280px] rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 text-sm text-slate-100 placeholder:text-slate-400 outline-none"
              />

              <Select value={statusFilter} onChange={setStatusFilter}>
                <option value="all">All Status</option>
                <option value="Assigned">Assigned</option>
                <option value="Picked Up">Picked Up</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Failed Delivery">Failed Delivery</option>
                <option value="Returned">Returned</option>
              </Select>

              <Select value={riderFilter} onChange={setRiderFilter}>
                <option value="all">All Riders</option>
                {riderOptions.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name}
                  </option>
                ))}
              </Select>

              <Select value={dateFilter} onChange={setDateFilter}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </Select>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Assigned Orders"
              value={String(totalAssigned)}
              hint="Orders with rider assigned"
            />
            <StatCard
              label="Out for Delivery"
              value={String(outForDelivery)}
              hint="Currently on the way"
            />
            <StatCard
              label="Delivered"
              value={String(delivered)}
              hint="Completed deliveries"
            />
            <StatCard
              label="Failed / Returned"
              value={String(failed)}
              hint="Need follow-up"
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
                Assigned Delivery Orders
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Open an order to assign or update delivery rider details
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/35"
            >
              Open Orders
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1320px] w-full border-collapse">
              <thead className="bg-slate-900/30">
                <tr className="text-left text-sm font-semibold text-slate-200">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Delivery Address</th>
                  <th className="px-6 py-4">Rider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-slate-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : !canView ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-slate-400"
                    >
                      You do not have permission to view delivery orders.
                    </td>
                  </tr>
                ) : deliveryRows.length ? (
                  deliveryRows.map((o) => {
                    const code = o.orderCode || o.id;

                    const customerName =
                      safeStr(o.customer?.name) ||
                      safeStr(o.address?.fullName) ||
                      "-";

                    const customerContact =
                      safeStr(o.customer?.phone) ||
                      safeStr(o.address?.phone) ||
                      safeStr(o.customer?.email) ||
                      "-";

                    const area =
                      safeStr(o.address?.addressLine) ||
                      safeStr(o.address?.area) ||
                      safeStr(o.address?.district) ||
                      "-";

                    const city =
                      safeStr(o.address?.cityOrMunicipality) ||
                      safeStr(o.address?.city) ||
                      "-";

                    const riderName =
                      safeStr(o.deliveryAssignment?.name) || "Unassigned";

                    const riderPhone =
                      safeStr(o.deliveryAssignment?.phone) || "-";

                    const riderVehicle =
                      safeStr(o.deliveryAssignment?.vehicleType) || "-";

                    const status =
                      safeStr(o.deliveryAssignment?.status) || "Unassigned";

                    return (
                      <tr
                        key={o.id}
                        className="border-t border-slate-700/40 text-sm text-slate-100 hover:bg-slate-900/20"
                      >
                        <td className="px-6 py-5 font-semibold">{code}</td>

                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-200">
                              {customerName}
                            </div>
                            <div className="text-slate-400">
                              {customerContact}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="text-slate-200">{area}</div>
                            <div className="text-slate-400">{city}</div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-200">
                              {riderName}
                            </div>
                            <div className="text-slate-400">{riderPhone}</div>
                            <div className="text-xs text-slate-500">
                              {riderVehicle}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <StatusPill>{status}</StatusPill>
                        </td>

                        <td className="px-6 py-5 text-slate-300">
                          {formatNPR(o.totalPaisa, o.total)}
                        </td>

                        <td className="px-6 py-5 text-slate-400">
                          {formatDateShort(o.createdAt)}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="inline-flex items-center gap-3">
                            {safeStr(o.deliveryAssignment?.deliveryManId) ? (
                              <Link
                                href={`/admin/delivery/staff/${safeStr(
                                  o.deliveryAssignment?.deliveryManId
                                )}`}
                                className="font-semibold text-slate-200 hover:text-slate-100"
                              >
                                Rider
                              </Link>
                            ) : null}

                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="font-semibold text-slate-200 hover:text-slate-100"
                            >
                              View Order
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-slate-400"
                    >
                      No assigned delivery orders found.
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