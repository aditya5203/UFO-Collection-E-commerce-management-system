"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
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

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function safeStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function formatDateShort(iso?: string) {
  if (!iso) return "-";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNPR(paisa?: number, total?: number) {
  const finalPaisa = Number.isFinite(paisa as number)
    ? Number(paisa)
    : Math.round(Number(total || 0) * 100);

  return `Rs. ${(finalPaisa / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusTone(status?: string) {
  const s = safeStr(status).toLowerCase();

  if (s === "assigned") {
    return "border-slate-400/20 bg-slate-500/15 text-slate-300";
  }

  if (s === "picked up") {
    return "border-indigo-400/20 bg-indigo-500/15 text-indigo-300";
  }

  if (s === "out for delivery") {
    return "border-cyan-400/20 bg-cyan-500/15 text-cyan-300";
  }

  if (s === "delivered") {
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  }

  if (s === "failed delivery") {
    return "border-orange-400/20 bg-orange-500/15 text-orange-300";
  }

  if (s === "returned") {
    return "border-red-400/20 bg-red-500/15 text-red-300";
  }

  return "border-amber-400/20 bg-amber-500/15 text-amber-300";
}

function StatusPill({ children }: { children: React.ReactNode }) {
  const tone = getStatusTone(String(children));

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  helper,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  helper?: string;
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

          {helper ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{helper}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 transition group-hover:bg-white/10">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 rounded-2xl border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] font-medium text-white outline-none transition focus:border-[#8b5cf6]/60"
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
  const [refreshing, setRefreshing] = React.useState(false);
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
        // AdminPageGuard handles unauthorized access.
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const load = React.useCallback(
    async (search: string, mode: "initial" | "refresh" | "silent" = "initial") => {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

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

        const normalized: DeliveryRow[] = data
          .map((item: any) => ({
            id: safeStr(item?.id || item?._id),
            orderCode: safeStr(item?.orderCode),
            createdAt: safeStr(item?.createdAt),
            totalPaisa:
              item?.totalPaisa !== undefined ? Number(item.totalPaisa) : undefined,
            total: item?.total !== undefined ? Number(item.total) : undefined,
            paymentMethod: safeStr(item?.paymentMethod),
            customer: item?.customer
              ? {
                  id: safeStr(item.customer.id || item.customer._id),
                  name: safeStr(item.customer.name),
                  email: safeStr(item.customer.email),
                  phone: safeStr(item.customer.phone),
                }
              : undefined,
            address: item?.address || null,
            deliveryAssignment: item?.deliveryAssignment || null,
          }))
          .filter((item: DeliveryRow) => item.id);

        setRows(normalized);
      } catch {
        setRows([]);
        setError("Network error while loading delivery orders");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  React.useEffect(() => {
    load("", "initial");
  }, [load]);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      load(q, "silent");
    }, 300);

    return () => window.clearTimeout(t);
  }, [q, load]);

  React.useEffect(() => {
    const socket: Socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("order:updated", () => {
      load(q, "silent");
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
    };
  }, [load, q]);

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

  const clearFilters = () => {
    setStatusFilter("all");
    setRiderFilter("all");
    setDateFilter("all");
    setQ("");
  };

  return (
    <AdminPageGuard permission="deliveryView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin / Delivery
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Delivery Management
                </h1>

                <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  View assigned orders, track rider status, and manage delivery
                  flow from one premium control panel.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 xl:w-auto">
                <div className="relative">
                  <input
                    aria-label="Search delivery orders"
                    title="Search delivery orders"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search order, customer, rider"
                    className="h-12 w-full rounded-2xl border border-[#26293a] bg-[#0d0f17] px-4 pr-12 text-[13px] font-medium text-white outline-none transition placeholder:text-[#7f879f] focus:border-[#8b5cf6]/60 xl:w-[340px]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[620px]">
                  <Select
                    label="Filter delivery orders by status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                  >
                    <option value="all">All Status</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Picked Up">Picked Up</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Failed Delivery">Failed Delivery</option>
                    <option value="Returned">Returned</option>
                  </Select>

                  <Select
                    label="Filter delivery orders by rider"
                    value={riderFilter}
                    onChange={setRiderFilter}
                  >
                    <option value="all">All Riders</option>

                    {riderOptions.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Filter delivery orders by date"
                    value={dateFilter}
                    onChange={setDateFilter}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => load(q, "refresh")}
                    disabled={refreshing}
                    className={secondaryBtnClass}
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>

                  {(q ||
                    statusFilter !== "all" ||
                    riderFilter !== "all" ||
                    dateFilter !== "all") && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className={secondaryBtnClass}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Assigned Orders"
              value={String(totalAssigned)}
              helper="Orders with rider assigned"
              iconSrc="/images/admin/orders.png"
            />

            <StatCard
              label="Out for Delivery"
              value={String(outForDelivery)}
              helper="Currently on the way"
              iconSrc="/images/admin/delivery.png"
            />

            <StatCard
              label="Delivered"
              value={String(delivered)}
              helper="Completed deliveries"
              iconSrc="/images/admin/active.png"
            />

            <StatCard
              label="Failed / Returned"
              value={String(failed)}
              helper="Need follow-up"
              iconSrc="/images/admin/pending.png"
            />
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/15 p-4 text-[13px] font-medium text-red-300">
              {error}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Delivery Orders
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Assigned Delivery Orders
                </h2>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Open an order to assign or update delivery rider details.
                </p>
              </div>

              <Link href="/admin/orders" className={secondaryBtnClass}>
                Open Orders
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                    <th className="px-5 py-4 font-medium">Order ID</th>
                    <th className="px-5 py-4 font-medium">Customer</th>
                    <th className="px-5 py-4 font-medium">Delivery Address</th>
                    <th className="px-5 py-4 font-medium">Rider</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Total</th>
                    <th className="px-5 py-4 font-medium">Created</th>
                    <th className="px-5 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-[13px] text-[#a7aec4]"
                      >
                        Loading delivery orders...
                      </td>
                    </tr>
                  ) : !canView ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-[13px] text-[#a7aec4]"
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

                      const street = safeStr(o.address?.street);

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

                      const deliveryManId = safeStr(
                        o.deliveryAssignment?.deliveryManId
                      );

                      return (
                        <tr
                          key={o.id}
                          className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">
                              {code}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-white">
                              {customerName}
                            </div>

                            <div className="mt-1 text-[12px] text-[#7f879f]">
                              {customerContact}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[260px] line-clamp-1 text-white">
                              {area}
                              {street ? `, ${street}` : ""}
                            </div>

                            <div className="mt-1 text-[12px] text-[#7f879f]">
                              {city}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-white">
                              {riderName}
                            </div>

                            <div className="mt-1 text-[12px] text-[#7f879f]">
                              {riderPhone}
                            </div>

                            <div className="mt-1 text-[11px] text-[#7f879f]">
                              {riderVehicle}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusPill>{status}</StatusPill>
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#d6c7ff]">
                            {formatNPR(o.totalPaisa, o.total)}
                          </td>

                          <td className="px-5 py-4 text-[#a7aec4]">
                            {formatDateShort(o.createdAt)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-3">
                              {deliveryManId ? (
                                <Link
                                  href={`/admin/delivery/staff/${deliveryManId}`}
                                  className="font-semibold text-[#d6c7ff] transition hover:text-white"
                                >
                                  Rider
                                </Link>
                              ) : null}

                              <Link
                                href={`/admin/orders/${o.id}`}
                                className="font-semibold text-white transition hover:text-[#d6c7ff]"
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
                        className="px-6 py-12 text-center text-[13px] text-[#a7aec4]"
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
      </div>
    </AdminPageGuard>
  );
}