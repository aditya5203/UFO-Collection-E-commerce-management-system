"use client";

import * as React from "react";
import Link from "next/link";

type CustomerRole = "customer" | "admin" | "superadmin";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  role: CustomerRole;
  createdAt: string; // ISO
  lastLogin?: string; // ISO (optional)
  numberOfOrders?: number;
  orders?: number; // fallback
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/35 px-4 py-2 text-xs font-semibold text-slate-100">
      {children}
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

export default function CustomersPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<CustomerRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async (search: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/customers?search=${encodeURIComponent(search)}`,
        { credentials: "include" }
      );

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setRows([]);
        setError(json?.message || "Failed to load customers");
        return;
      }

      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setRows([]);
      setError("Network error while loading customers");
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

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Customers</h1>

      <div className="flex justify-end">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="h-11 w-[280px] rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 text-sm text-slate-100 placeholder:text-slate-400 outline-none"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0A1324]">
        <div className="overflow-x-auto">
          <table className="min-w-[1020px] w-full border-collapse">
            <thead className="bg-slate-900/30">
              <tr className="text-left text-sm font-semibold text-slate-200">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">CreatedAt</th>
                <th className="px-6 py-4">Last login</th>
                <th className="px-6 py-4">Number of orders</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((c) => {
                  const ordersCount = Number(c.numberOfOrders ?? c.orders ?? 0);

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
                      <td className="px-6 py-5 text-slate-400">{formatDateShort(c.createdAt)}</td>
                      <td className="px-6 py-5 text-slate-400">{formatDateShort(c.lastLogin)}</td>
                      <td className="px-6 py-5 text-slate-300">{ordersCount}</td>
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="font-semibold text-slate-200 hover:text-slate-100"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
