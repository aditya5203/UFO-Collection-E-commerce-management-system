// client/app/admin/customers/page.tsx
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

type CustomerRole = "customer" | "admin" | "superadmin";
type CustomerStatus = "active" | "blocked" | "deleted";
type FilterKey = "all" | "blocked" | "deleted";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  role: CustomerRole;
  createdAt: string;
  lastLogin?: string;
  numberOfOrders?: number;
  orders?: number;
  status?: CustomerStatus;
  isBlocked?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/35 px-4 py-2 text-xs font-semibold text-slate-100">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: CustomerStatus }) {
  const styles =
    status === "blocked"
      ? "border border-amber-500/30 bg-amber-500/10 text-amber-200"
      : status === "deleted"
      ? "border border-red-500/30 bg-red-500/10 text-red-200"
      : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold ${styles}`}
    >
      {status === "blocked"
        ? "Blocked"
        : status === "deleted"
        ? "Deleted"
        : "Active"}
    </span>
  );
}

function formatDateShort(iso?: string) {
  if (!iso) return "-";
  return String(iso).slice(0, 10);
}

function roleLabel(role: CustomerRole) {
  if (role === "superadmin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "Customer";
}

function getCustomerStatus(customer: CustomerRow): CustomerStatus {
  if (customer.status === "deleted" || customer.isDeleted) return "deleted";
  if (customer.status === "blocked" || customer.isBlocked) return "blocked";
  return "active";
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function CustomersPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<CustomerRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterKey>("all");

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] = React.useState<AdminPermissions | null>(null);

  const canEdit = hasPermission(role, permissions, "customerEdit");
  const canDelete = hasPermission(role, permissions, "customerDelete");

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
        const nextRole = (body?.profile?.role || "admin") as "admin" | "superadmin";
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

  const load = React.useCallback(async (search: string, selectedFilter: FilterKey) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedFilter !== "all") params.set("filter", selectedFilter);

      const res = await fetch(
        `${API_BASE}/api/admin/customers?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        setRows([]);
        setError((json as any)?.message || "Failed to load customers");
        return;
      }

      setRows(Array.isArray((json as any)?.data) ? (json as any).data : []);
    } catch {
      setRows([]);
      setError("Network error while loading customers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => {
      load(q, filter);
    }, 300);

    return () => clearTimeout(t);
  }, [q, filter, load]);

  const handleToggleBlock = async (customer: CustomerRow) => {
    if (!canEdit) {
      setError("You do not have permission to block or unblock customers.");
      return;
    }

    const status = getCustomerStatus(customer);
    const blocked = status === "blocked";
    const actionText = blocked ? "unblock" : "block";

    const ok = window.confirm(
      `Are you sure you want to ${actionText} ${customer.name || "this customer"}?`
    );
    if (!ok) return;

    setActionLoadingId(customer.id);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/customers/${customer.id}/${blocked ? "unblock" : "block"}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        setError((json as any)?.message || `Failed to ${actionText} customer`);
        return;
      }

      if (filter === "blocked" && blocked) {
        setRows((prev) => prev.filter((item) => item.id !== customer.id));
      } else {
        setRows((prev) =>
          prev.map((item) =>
            item.id === customer.id
              ? {
                  ...item,
                  status: blocked ? "active" : "blocked",
                  isBlocked: !blocked,
                }
              : item
          )
        );
      }
    } catch {
      setError(`Network error while trying to ${actionText} customer`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (customer: CustomerRow) => {
    if (!canDelete) {
      setError("You do not have permission to delete customers.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${customer.name || "this customer"}?\n\nThis action cannot be undone.`
    );
    if (!ok) return;

    setActionLoadingId(customer.id);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/customers/${customer.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setError((json as any)?.message || "Failed to delete customer");
        return;
      }

      if (filter === "all" || filter === "blocked") {
        setRows((prev) => prev.filter((item) => item.id !== customer.id));
      } else {
        setRows((prev) =>
          prev.map((item) =>
            item.id === customer.id
              ? {
                  ...item,
                  status: "deleted",
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                }
              : item
          )
        );
      }
    } catch {
      setError("Network error while deleting customer");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRows = React.useMemo(() => {
    if (filter === "blocked") {
      return rows.filter((item) => getCustomerStatus(item) === "blocked");
    }

    if (filter === "deleted") {
      return rows.filter((item) => getCustomerStatus(item) === "deleted");
    }

    return rows.filter((item) => getCustomerStatus(item) !== "deleted");
  }, [rows, filter]);

  const totalAll = rows.filter((item) => getCustomerStatus(item) !== "deleted").length;
  const totalBlocked = rows.filter((item) => getCustomerStatus(item) === "blocked").length;
  const totalDeleted = rows.filter((item) => getCustomerStatus(item) === "deleted").length;

  return (
    <AdminPageGuard permission="customerView">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Customers</h1>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer..."
            className="h-11 w-full md:w-[280px] rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 text-sm text-slate-100 placeholder:text-slate-400 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === "all"
                ? "bg-emerald-600 text-white"
                : "border border-slate-700/60 bg-slate-900/35 text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            View All Customers ({totalAll})
          </button>

          <button
            type="button"
            onClick={() => setFilter("blocked")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === "blocked"
                ? "bg-amber-500 text-slate-950"
                : "border border-slate-700/60 bg-slate-900/35 text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            View Blocked Customers ({totalBlocked})
          </button>

          <button
            type="button"
            onClick={() => setFilter("deleted")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === "deleted"
                ? "bg-red-600 text-white"
                : "border border-slate-700/60 bg-slate-900/35 text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            View Deleted Customers ({totalDeleted})
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0A1324]">
          <div className="overflow-x-auto">
            <table className="min-w-[1240px] w-full border-collapse">
              <thead className="bg-slate-900/30">
                <tr className="text-left text-sm font-semibold text-slate-200">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Deleted At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((c) => {
                    const ordersCount = Number(c.numberOfOrders ?? c.orders ?? 0);
                    const status = getCustomerStatus(c);
                    const actionLoading = actionLoadingId === c.id;

                    return (
                      <tr
                        key={c.id}
                        className="border-t border-slate-700/40 text-sm text-slate-100 hover:bg-slate-900/20"
                      >
                        <td className="px-6 py-5 font-semibold">{c.name || "-"}</td>
                        <td className="px-6 py-5 text-slate-300">{c.email || "-"}</td>
                        <td className="px-6 py-5">
                          <Pill>{roleLabel(c.role || "customer")}</Pill>
                        </td>
                        <td className="px-6 py-5">
                          <StatusPill status={status} />
                        </td>
                        <td className="px-6 py-5 text-slate-400">
                          {formatDateShort(c.createdAt)}
                        </td>
                        <td className="px-6 py-5 text-slate-400">
                          {formatDateShort(c.lastLogin)}
                        </td>
                        <td className="px-6 py-5 text-slate-300">{ordersCount}</td>
                        <td className="px-6 py-5 text-slate-400">
                          {formatDateShort(c.deletedAt)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/admin/customers/${c.id}`}
                              className="rounded-lg border border-slate-700/60 px-3 py-2 font-semibold text-slate-200 transition hover:bg-slate-800/60 hover:text-white"
                            >
                              View
                            </Link>

                            {status !== "deleted" ? (
                              <>
                                {canEdit ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBlock(c)}
                                    disabled={actionLoading}
                                    className={`rounded-lg px-3 py-2 font-semibold transition ${
                                      status === "blocked"
                                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                                        : "border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                                    } disabled:cursor-not-allowed disabled:opacity-60`}
                                  >
                                    {actionLoading
                                      ? "Please wait..."
                                      : status === "blocked"
                                      ? "Unblock"
                                      : "Block"}
                                  </button>
                                ) : null}

                                {canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(c)}
                                    disabled={actionLoading}
                                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoading ? "Please wait..." : "Delete"}
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              <span className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-200">
                                Deleted customer
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-400">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminPageGuard>
  );
}