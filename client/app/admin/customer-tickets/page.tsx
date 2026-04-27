// client/app/admin/customer-tickets/page.tsx
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

type TicketStatus = "Open" | "Pending" | "Closed";

type TicketRow = {
  id: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  orderId?: string | null;
  size?: string | null;
  color?: string | null;
  issueType: string;
  submittedAt: string;
  status: TicketStatus;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function showTicketId(v: string) {
  const s = String(v || "").trim();
  if (!s) return "-";
  return s.startsWith("#") ? s : `#${s}`;
}

function formatDateShort(iso?: string) {
  if (!iso) return "-";
  return String(iso).slice(0, 10);
}

function statusTone(status: TicketStatus) {
  if (status === "Open") {
    return "border-sky-400/20 bg-sky-500/15 text-sky-300";
  }

  if (status === "Pending") {
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  }

  return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function AdminCustomerTicketsPage() {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<TicketRow[]>([]);
  const [err, setErr] = React.useState("");

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  const canReply = hasPermission(role, permissions, "ticketReply");
  const canClose = hasPermission(role, permissions, "ticketClose");

  React.useEffect(() => {
    let mounted = true;

    const loadAdminProfile = async () => {
      try {
        const res = await fetch(`${API}/admin/settings`, {
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
      } catch {}
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const loadTickets = React.useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(
        `${API}/admin/tickets?q=${encodeURIComponent(q)}`,
        { credentials: "include", cache: "no-store" }
      );

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load tickets");
      }

      setRows(Array.isArray((data as any)?.items) ? (data as any).items : []);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const stats = React.useMemo(() => {
    const open = rows.filter((t) => t.status === "Open").length;
    const pending = rows.filter((t) => t.status === "Pending").length;
    const closed = rows.filter((t) => t.status === "Closed").length;

    return {
      total: rows.length,
      open,
      pending,
      closed,
    };
  }, [rows]);

  return (
    <AdminPageGuard permission="ticketView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Admin / Customer Tickets
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Product Support Tickets
                </h1>

                <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Manage customer product issues, order support requests, admin
                  replies, and ticket status from one premium admin workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={loadTickets}
                disabled={loading}
                className={primaryBtnClass}
                title="Refresh tickets"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-6 flex h-[48px] max-w-[520px] items-center rounded-full border border-white/10 bg-white/5 px-4">
              <label htmlFor="ticket-search" className="sr-only">
                Search ticket, customer, product
              </label>
              <input
                id="ticket-search"
                name="ticketSearch"
                title="Search ticket, customer, product"
                aria-label="Search ticket, customer, product"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search ticket, customer, product..."
                className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Tickets"
              value={String(stats.total)}
              hint="Current result count"
              iconSrc="/images/admin/tickets.png"
            />
            <StatCard
              label="Open"
              value={String(stats.open)}
              hint="New support issues"
              iconSrc="/images/admin/open.png"
            />
            <StatCard
              label="Pending"
              value={String(stats.pending)}
              hint="Waiting for action"
              iconSrc="/images/admin/pending.png"
            />
            <StatCard
              label="Closed"
              value={String(stats.closed)}
              hint="Resolved tickets"
              iconSrc="/images/admin/active.png"
            />
          </section>

          {err ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
              {err}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Ticket Queue
                </div>
                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Customer Support Requests
                </h2>
                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Ticket ID, customer, product, issue type, submission date and
                  status.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
                {loading ? "Loading..." : `${rows.length} tickets`}
              </div>
            </div>

            {loading ? (
              <TicketSkeleton />
            ) : rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Ticket ID</th>
                      <th className="px-5 py-4 font-medium">Customer</th>
                      <th className="px-5 py-4 font-medium">Product / Order</th>
                      <th className="px-5 py-4 font-medium">Issue Type</th>
                      <th className="px-5 py-4 font-medium">Submitted</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {showTicketId(t.ticketId)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {t.customerName || "-"}
                          </div>
                          <div className="mt-1 max-w-[240px] truncate text-[12px] text-[#7f879f]">
                            {t.customerEmail || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="max-w-[260px] truncate font-medium text-white">
                            {t.productName || "-"}
                          </div>
                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            Order: {t.orderId || "-"}
                          </div>
                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            Size: {t.size || "-"} • Color: {t.color || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {t.issueType || "-"}
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {formatDateShort(t.submittedAt)}
                        </td>

                        <td className="px-5 py-4">
                          <Link href={`/admin/customer-tickets/${t.id}`}>
                            <span
                              className={[
                                "inline-flex cursor-pointer rounded-full border px-3 py-1 text-[11px] font-semibold transition hover:opacity-90",
                                statusTone(t.status),
                              ].join(" ")}
                            >
                              {t.status}
                            </span>
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {canReply || canClose ? (
                            <Link
                              href={`/admin/customer-tickets/${t.id}`}
                              className={secondaryBtnClass}
                            >
                              View Details
                            </Link>
                          ) : (
                            <span className="text-[12px] text-[#7f879f]">
                              No actions
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
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

function TicketSkeleton() {
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
          src="/images/admin/ticket.png"
          alt="Tickets"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No tickets found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Support tickets will appear here when customers submit product or order
        issues, or when your search matches existing tickets.
      </p>
    </div>
  );
}