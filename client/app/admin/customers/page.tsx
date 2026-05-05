// client/app/admin/customers/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

type CustomerRole = "customer" | "admin" | "superadmin" | "delivery";
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

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const filterBtnBase =
  "rounded-full border px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:-translate-y-0.5";

function formatDateShort(iso?: string) {
  if (!iso) return "-";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toISOString().slice(0, 10);
}

function roleLabel(role: CustomerRole) {
  if (role === "superadmin") return "Super Admin";
  if (role === "admin") return "Admin";
  if (role === "delivery") return "Delivery";
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

function normalizeCustomer(item: any): CustomerRow {
  return {
    id: String(item?.id || item?._id || ""),
    name: String(item?.name || ""),
    email: String(item?.email || ""),
    role: (item?.role || "customer") as CustomerRole,
    createdAt: String(item?.createdAt || ""),
    lastLogin: item?.lastLogin ? String(item.lastLogin) : undefined,
    numberOfOrders: Number(item?.numberOfOrders ?? item?.orders ?? 0),
    orders: Number(item?.orders ?? item?.numberOfOrders ?? 0),
    status: item?.status as CustomerStatus | undefined,
    isBlocked: Boolean(item?.isBlocked),
    isDeleted: Boolean(item?.isDeleted),
    deletedAt: item?.deletedAt ? String(item.deletedAt) : undefined,
  };
}

export default function CustomersPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<CustomerRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(
    null
  );
  const [filter, setFilter] = React.useState<FilterKey>("all");

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

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
        // Ignore profile loading failure because AdminPageGuard already protects route.
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const load = React.useCallback(
    async (search: string, selectedFilter: FilterKey) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) params.set("search", search.trim());
        if (selectedFilter !== "all") params.set("filter", selectedFilter);

        const query = params.toString();

        const res = await fetch(
          `${API_BASE}/api/admin/customers${query ? `?${query}` : ""}`,
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

        const data = Array.isArray((json as any)?.data)
          ? (json as any).data
          : Array.isArray((json as any)?.customers)
            ? (json as any).customers
            : [];

        setRows(data.map(normalizeCustomer).filter((item: CustomerRow) => item.id));
      } catch {
        setRows([]);
        setError("Network error while loading customers");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      load(q, filter);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [q, filter, load]);

  const handleToggleBlock = async (customer: CustomerRow) => {
    if (!canEdit) {
      setError("You do not have permission to block or unblock customers.");
      return;
    }

    const status = getCustomerStatus(customer);

    if (status === "deleted") {
      setError("Deleted customers cannot be blocked or unblocked.");
      return;
    }

    const blocked = status === "blocked";
    const actionText = blocked ? "unblock" : "block";

    const ok = window.confirm(
      `Are you sure you want to ${actionText} ${
        customer.name || "this customer"
      }?`
    );

    if (!ok) return;

    setActionLoadingId(customer.id);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/customers/${customer.id}/${
          blocked ? "unblock" : "block"
        }`,
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
        return;
      }

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

    const status = getCustomerStatus(customer);

    if (status === "deleted") {
      setError("This customer is already deleted.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${
        customer.name || "this customer"
      }?\n\nThis customer will be moved to deleted records.`
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
        return;
      }

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

  const totalAll = rows.filter(
    (item) => getCustomerStatus(item) !== "deleted"
  ).length;

  const totalBlocked = rows.filter(
    (item) => getCustomerStatus(item) === "blocked"
  ).length;

  const totalDeleted = rows.filter(
    (item) => getCustomerStatus(item) === "deleted"
  ).length;

  const totalOrders = filteredRows.reduce(
    (sum, item) => sum + Number(item.numberOfOrders ?? item.orders ?? 0),
    0
  );

  return (
    <AdminPageGuard permission="customerView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Admin / Customers
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Customers
                </h1>

                <p className="mt-2 max-w-[660px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Manage customer accounts, view order activity, block or
                  unblock users, and review deleted customer records.
                </p>
              </div>

              <button
                type="button"
                onClick={() => load(q, filter)}
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="mt-6 flex h-[48px] max-w-[460px] items-center rounded-full border border-white/10 bg-white/5 px-4">
              <label htmlFor="customer-search" className="sr-only">
                Search customer
              </label>

              <input
                id="customer-search"
                name="customerSearch"
                title="Search customer"
                aria-label="Search customer"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customer..."
                className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active Customers"
              value={String(totalAll)}
              hint="Visible customer accounts"
              iconSrc="/images/admin/customers.png"
            />

            <StatCard
              label="Blocked"
              value={String(totalBlocked)}
              hint="Restricted accounts"
              iconSrc="/images/admin/blocked.png"
            />

            <StatCard
              label="Deleted"
              value={String(totalDeleted)}
              hint="Removed records"
              iconSrc="/images/admin/deleted.png"
            />

            <StatCard
              label="Orders"
              value={String(totalOrders)}
              hint="Orders in current view"
              iconSrc="/images/admin/orders.png"
            />
          </section>

          <section className="flex flex-wrap gap-3">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              View All ({totalAll})
            </FilterButton>

            <FilterButton
              active={filter === "blocked"}
              tone="warning"
              onClick={() => setFilter("blocked")}
            >
              Blocked ({totalBlocked})
            </FilterButton>

            <FilterButton
              active={filter === "deleted"}
              tone="danger"
              onClick={() => setFilter("deleted")}
            >
              Deleted ({totalDeleted})
            </FilterButton>
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Customer List
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Account Records
                </h2>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Customer profile, role, activity, and account status.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
                {filteredRows.length} visible
              </div>
            </div>

            {loading ? (
              <CustomerSkeleton />
            ) : filteredRows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1240px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Name</th>
                      <th className="px-5 py-4 font-medium">Email</th>
                      <th className="px-5 py-4 font-medium">Role</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Created At</th>
                      <th className="px-5 py-4 font-medium">Last Login</th>
                      <th className="px-5 py-4 font-medium">Orders</th>
                      <th className="px-5 py-4 font-medium">Deleted At</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map((customer) => {
                      const ordersCount = Number(
                        customer.numberOfOrders ?? customer.orders ?? 0
                      );
                      const status = getCustomerStatus(customer);
                      const actionLoading = actionLoadingId === customer.id;

                      return (
                        <tr
                          key={customer.id}
                          className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">
                              {customer.name || "-"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-[#a7aec4]">
                            {customer.email || "-"}
                          </td>

                          <td className="px-5 py-4">
                            <RolePill>
                              {roleLabel(customer.role || "customer")}
                            </RolePill>
                          </td>

                          <td className="px-5 py-4">
                            <CustomerStatusPill status={status} />
                          </td>

                          <td className="px-5 py-4 text-[#a7aec4]">
                            {formatDateShort(customer.createdAt)}
                          </td>

                          <td className="px-5 py-4 text-[#a7aec4]">
                            {formatDateShort(customer.lastLogin)}
                          </td>

                          <td className="px-5 py-4">
                            <CountBadge>{ordersCount}</CountBadge>
                          </td>

                          <td className="px-5 py-4 text-[#a7aec4]">
                            {formatDateShort(customer.deletedAt)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/customers/${customer.id}`}
                                className={actionBtnClass}
                              >
                                View
                              </Link>

                              {status !== "deleted" ? (
                                <>
                                  {canEdit ? (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBlock(customer)}
                                      disabled={actionLoading}
                                      className={[
                                        "rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
                                        status === "blocked"
                                          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20"
                                          : "border-amber-400/20 bg-amber-500/15 text-amber-300 hover:bg-amber-500/20",
                                      ].join(" ")}
                                    >
                                      {actionLoading
                                        ? "Wait"
                                        : status === "blocked"
                                          ? "Unblock"
                                          : "Block"}
                                    </button>
                                  ) : null}

                                  {canDelete ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(customer)}
                                      disabled={actionLoading}
                                      className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {actionLoading ? "Wait" : "Delete"}
                                    </button>
                                  ) : null}
                                </>
                              ) : (
                                <span className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
                                  Deleted
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </div>
    </AdminPageGuard>
  );
}

const actionBtnClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

function StatCard({
  label,
  value,
  hint,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>

          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  tone = "default",
  onClick,
  children,
}: {
  active: boolean;
  tone?: "default" | "warning" | "danger";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeStyle =
    tone === "danger"
      ? "border-red-400/20 bg-red-500/15 text-red-300"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-500/15 text-amber-300"
        : "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        filterBtnBase,
        active
          ? activeStyle
          : "border-white/10 bg-white/5 text-white hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function RolePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

function CustomerStatusPill({ status }: { status: CustomerStatus }) {
  const styles =
    status === "blocked"
      ? "border-amber-400/20 bg-amber-500/15 text-amber-300"
      : status === "deleted"
        ? "border-red-400/20 bg-red-500/15 text-red-300"
        : "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles,
      ].join(" ")}
    >
      {status === "blocked"
        ? "Blocked"
        : status === "deleted"
          ? "Deleted"
          : "Active"}
    </span>
  );
}

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-[42px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

function CustomerSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/customers.png"
          alt="Customers"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No customers found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Customer accounts will appear here once users register or match your
        current search and filter.
      </p>
    </div>
  );
}