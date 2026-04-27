"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90";

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
    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
    : "border-red-400/20 bg-red-500/15 text-red-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
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

export default function DeliveryStaffPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<DeliveryStaffRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

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

  const onDelete = async (item: DeliveryStaffRow) => {
    const ok = window.confirm(
      `Are you sure you want to delete ${
        item.name || "this delivery staff"
      } (${item.email || "-"})? This will permanently delete the account from the database.`
    );

    if (!ok) return;

    try {
      setDeletingId(item.id);

      const res = await fetch(`${API_BASE}/api/admin/delivery-staff/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        alert((json as any)?.message || "Failed to delete delivery staff");
        return;
      }

      await load(q);
      alert((json as any)?.message || "Delivery staff deleted successfully");
    } catch {
      alert("Network error while deleting delivery staff");
    } finally {
      setDeletingId(null);
    }
  };

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
    <AdminPageGuard permission="deliveryStaffView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin / Delivery Staff
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Delivery Staff
                </h1>

                <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Create, search, monitor, and manage delivery riders from one
                  premium control panel.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 xl:w-auto">
                <div className="relative">
                  <input
                    aria-label="Search delivery staff"
                    title="Search delivery staff"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, email, phone"
                    className="h-12 w-full rounded-2xl border border-[#26293a] bg-[#0d0f17] px-4 pr-12 text-[13px] font-medium text-white outline-none transition placeholder:text-[#7f879f] focus:border-[#8b5cf6]/60 xl:w-[340px]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] xl:w-[520px]">
                  <Select
                    label="Filter delivery staff by status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </Select>

                  <Link
                    href="/admin/delivery/staff/create"
                    className={`${primaryBtnClass} h-12`}
                  >
                    + Add Delivery Man
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Staff"
              value={String(totalStaff)}
              helper="All registered riders"
              iconSrc="/images/admin/customer.png"
            />
            <StatCard
              label="Active"
              value={String(activeStaff)}
              helper="Available for assignment"
              iconSrc="/images/admin/active.png"
            />
            <StatCard
              label="Inactive"
              value={String(inactiveStaff)}
              helper="Currently disabled"
              iconSrc="/images/admin/pending.png"
            />
            <StatCard
              label="Assigned Orders"
              value={String(assignedLoad)}
              helper="Current rider workload"
              iconSrc="/images/admin/orders.png"
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
                  Riders
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Delivery Riders
                </h2>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Manage rider details, delivery area, vehicle information, and
                  account status.
                </p>
              </div>

              <Link href="/admin/delivery" className={secondaryBtnClass}>
                Delivery Orders
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1480px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                    <th className="px-5 py-4 font-medium">Name</th>
                    <th className="px-5 py-4 font-medium">Contact</th>
                    <th className="px-5 py-4 font-medium">Vehicle</th>
                    <th className="px-5 py-4 font-medium">Area</th>
                    <th className="px-5 py-4 font-medium">Assigned</th>
                    <th className="px-5 py-4 font-medium">Delivered</th>
                    <th className="px-5 py-4 font-medium">Failed</th>
                    <th className="px-5 py-4 font-medium">Status</th>
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
                        colSpan={10}
                        className="px-6 py-12 text-center text-[13px] text-[#a7aec4]"
                      >
                        Loading delivery staff...
                      </td>
                    </tr>
                  ) : filteredRows.length ? (
                    filteredRows.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {item.name || "-"}
                          </div>
                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            {item.email || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {item.phone || "-"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-white">
                            {item.vehicleType || "-"}
                          </div>
                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            {item.vehicleNumber || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {item.area || "-"}
                        </td>

                        <td className="px-5 py-4 font-semibold text-[#d6c7ff]">
                          {Number(item.assignedOrdersCount || 0)}
                        </td>

                        <td className="px-5 py-4 font-semibold text-emerald-300">
                          {Number(item.deliveredOrdersCount || 0)}
                        </td>

                        <td className="px-5 py-4 font-semibold text-red-300">
                          {Number(item.failedOrdersCount || 0)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusPill active={item.isActive}>
                            {item.isActive ? "Active" : "Inactive"}
                          </StatusPill>
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {formatDateShort(item.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-3">
                            <Link
                              href={`/admin/delivery/staff/${item.id}`}
                              className="font-semibold text-[#d6c7ff] transition hover:text-white"
                            >
                              View
                            </Link>

                            <span className="text-[#4a506b]">/</span>

                            <Link
                              href={`/admin/delivery/staff/${item.id}/edit`}
                              className="font-semibold text-white transition hover:text-[#d6c7ff]"
                            >
                              Edit
                            </Link>

                            <span className="text-[#4a506b]">/</span>

                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              disabled={deletingId === item.id}
                              className="font-semibold text-red-300 transition hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === item.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-12 text-center text-[13px] text-[#a7aec4]"
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
      </div>
    </AdminPageGuard>
  );
}