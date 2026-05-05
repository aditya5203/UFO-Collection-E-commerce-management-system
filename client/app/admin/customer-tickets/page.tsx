// client/app/admin/customer-tickets/page.tsx
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

type TicketStatus = "Open" | "Pending" | "In Progress" | "Resolved" | "Closed";
type NormalizedTicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
type StatusFilter = "All" | NormalizedTicketStatus;
type SortValue = "newest" | "oldest";

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

type AdminTicketSocketPayload = {
  ticketId?: string;
  ticketCode?: string;
  status?: TicketStatus;
  customerName?: string;
  customerEmail?: string;
  subject?: string;
  issueType?: string;
  productName?: string | null;
  orderId?: string | null;
  size?: string | null;
  color?: string | null;
  submittedAt?: string;
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

const SOCKET_BASE = CLEAN_API_BASE.replace(/\/api$/, "");

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const inputClass =
  "h-[48px] w-full rounded-full border border-white/10 bg-white/5 px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

function optionClass() {
  return "bg-[#11121a] text-white";
}

function showTicketId(v: string) {
  const s = String(v || "").trim();
  if (!s) return "-";
  return s.startsWith("#") ? s : `#${s}`;
}

function normalizeStatus(status?: string): NormalizedTicketStatus {
  if (status === "Pending") return "In Progress";
  if (status === "Open") return "Open";
  if (status === "In Progress") return "In Progress";
  if (status === "Resolved") return "Resolved";
  if (status === "Closed") return "Closed";
  return "Open";
}

function statusTone(status: TicketStatus | NormalizedTicketStatus) {
  const s = normalizeStatus(status);

  if (s === "Open") return "border-sky-400/20 bg-sky-500/15 text-sky-300";
  if (s === "In Progress") {
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  }
  if (s === "Resolved") {
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  }
  return "border-slate-400/20 bg-slate-500/15 text-slate-300";
}

function formatDateShort(iso?: string) {
  if (!iso) return "-";

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function parseDateSafe(value?: string) {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

function normalizeTicketRow(row: any): TicketRow {
  return {
    id: String(row?.id || row?._id || ""),
    ticketId: String(row?.ticketId || row?.ticketCode || "-"),
    customerName: String(row?.customerName || "Customer"),
    customerEmail: String(row?.customerEmail || "-"),
    productName: String(row?.productName || "-"),
    orderId: row?.orderId ? String(row.orderId) : null,
    size: row?.size ? String(row.size) : null,
    color: row?.color ? String(row.color) : null,
    issueType: String(row?.issueType || row?.subject || "-"),
    submittedAt: String(row?.submittedAt || row?.createdAt || new Date().toISOString()),
    status: normalizeStatus(row?.status),
  };
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
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<TicketRow[]>([]);
  const [err, setErr] = React.useState("");
  const [toast, setToast] = React.useState<ToastState | null>(null);

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("All");
  const [sortValue, setSortValue] = React.useState<SortValue>("newest");

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] = React.useState<AdminPermissions | null>(
    null
  );

  const socketRef = React.useRef<Socket | null>(null);

  const canReply = hasPermission(role, permissions, "ticketReply");
  const canClose = hasPermission(role, permissions, "ticketClose");

  const canOpenDetails = true;

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  }

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQ(q.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [q]);

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
      } catch {
        if (!mounted) return;
        setPermissions(null);
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const loadTickets = React.useCallback(
    async (searchText = debouncedQ, silent = false) => {
      if (!silent) setLoading(true);
      setErr("");

      try {
        const res = await fetch(
          `${API}/admin/tickets?q=${encodeURIComponent(searchText)}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await safeJson(res);

        if (!res.ok) {
          throw new Error((data as any)?.message || "Failed to load tickets");
        }

        const rawItems = Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

        setRows(
  rawItems
    .map(normalizeTicketRow)
    .filter((t: TicketRow) => Boolean(t.id))
);
      } catch (e: any) {
        setErr(e?.message || "Something went wrong");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [debouncedQ]
  );

  React.useEffect(() => {
    loadTickets(debouncedQ);
  }, [debouncedQ, loadTickets]);

  React.useEffect(() => {
    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      loadTickets(debouncedQ, true);
    });

    socket.on("connect_error", () => {
      showToast({
        type: "info",
        message: "Live ticket updates are reconnecting.",
      });
    });

    socket.on("admin:ticket:new", (payload: AdminTicketSocketPayload) => {
      const id = String(payload?.ticketId || "");

      if (!id) return;

      const nextRow: TicketRow = {
        id,
        ticketId: payload.ticketCode || "-",
        customerName: payload.customerName || "Customer",
        customerEmail: payload.customerEmail || "-",
        productName: payload.productName || "-",
        orderId: payload.orderId || null,
        size: payload.size || null,
        color: payload.color || null,
        issueType: payload.issueType || payload.subject || "-",
        submittedAt: payload.submittedAt || new Date().toISOString(),
        status: normalizeStatus(payload.status),
      };

      setRows((prev) => {
        const exists = prev.some((row) => row.id === id);
        if (exists) return prev;

        return [nextRow, ...prev];
      });

      showToast({
        type: "info",
        message: `New ticket received: ${showTicketId(nextRow.ticketId)}`,
      });
    });

    socket.on("admin:ticket:updated", (payload: AdminTicketSocketPayload) => {
      const id = String(payload?.ticketId || "");
      const status = normalizeStatus(payload?.status);

      if (!id) return;

      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status } : row))
      );
    });

    socket.on("admin:ticket:reply:new", (payload: AdminTicketSocketPayload) => {
      const id = String(payload?.ticketId || "");
      const status = payload?.status ? normalizeStatus(payload.status) : null;

      if (!id) return;

      if (status) {
        setRows((prev) =>
          prev.map((row) => (row.id === id ? { ...row, status } : row))
        );
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
    // Important: intentionally not depending on search/loadTickets.
    // This prevents socket reconnecting on every search input change.
  }, []);

  const filteredRows = React.useMemo(() => {
    let list = [...rows];

    if (statusFilter !== "All") {
      list = list.filter((t) => normalizeStatus(t.status) === statusFilter);
    }

    list.sort((a, b) => {
      const da = parseDateSafe(a.submittedAt);
      const db = parseDateSafe(b.submittedAt);

      return sortValue === "oldest" ? da - db : db - da;
    });

    return list;
  }, [rows, statusFilter, sortValue]);

  const stats = React.useMemo(() => {
    const open = rows.filter((t) => normalizeStatus(t.status) === "Open").length;

    const progress = rows.filter(
      (t) => normalizeStatus(t.status) === "In Progress"
    ).length;

    const resolved = rows.filter(
      (t) => normalizeStatus(t.status) === "Resolved"
    ).length;

    const closed = rows.filter(
      (t) => normalizeStatus(t.status) === "Closed"
    ).length;

    return {
      total: rows.length,
      open,
      progress,
      resolved,
      closed,
    };
  }, [rows]);

  const clearFilters = () => {
    setQ("");
    setDebouncedQ("");
    setStatusFilter("All");
    setSortValue("newest");
  };

  const refreshTickets = () => {
    loadTickets(debouncedQ);
  };

  return (
    <AdminPageGuard permission="ticketView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}

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

                <p className="mt-2 max-w-[760px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Manage customer product issues, order support requests, admin
                  replies, and ticket status from one premium admin workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshTickets}
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px_auto]">
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search ticket, customer, product, order..."
                  className={`${inputClass} pr-12`}
                  aria-label="Search tickets"
                  title="Search tickets"
                />

                {q ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQ("");
                      setDebouncedQ("");
                    }}
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-white/5 text-[12px] font-bold text-white transition hover:bg-white/10"
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={inputClass}
                aria-label="Filter by status"
                title="Filter by status"
              >
                <option value="All" className={optionClass()}>
                  All Status
                </option>
                <option value="Open" className={optionClass()}>
                  Open
                </option>
                <option value="In Progress" className={optionClass()}>
                  In Progress
                </option>
                <option value="Resolved" className={optionClass()}>
                  Resolved
                </option>
                <option value="Closed" className={optionClass()}>
                  Closed
                </option>
              </select>

              <select
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value as SortValue)}
                className={inputClass}
                aria-label="Sort tickets"
                title="Sort tickets"
              >
                <option value="newest" className={optionClass()}>
                  Newest First
                </option>
                <option value="oldest" className={optionClass()}>
                  Oldest First
                </option>
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className={secondaryBtnClass}
              >
                Clear
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Total"
              value={String(stats.total)}
              hint="All tickets"
              iconSrc="/images/admin/tickets.png"
            />

            <StatCard
              label="Open"
              value={String(stats.open)}
              hint="New issues"
              iconSrc="/images/admin/open.png"
            />

            <StatCard
              label="Progress"
              value={String(stats.progress)}
              hint="Admin handling"
              iconSrc="/images/admin/pending.png"
            />

            <StatCard
              label="Resolved"
              value={String(stats.resolved)}
              hint="Issue solved"
              iconSrc="/images/admin/active.png"
            />

            <StatCard
              label="Closed"
              value={String(stats.closed)}
              hint="Finished"
              iconSrc="/images/admin/active.png"
            />
          </section>

          {err ? (
            <AlertBox type="error" message={err} onClose={() => setErr("")} />
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
                  Showing {filteredRows.length} of {rows.length} tickets.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
                {loading ? "Loading..." : `${filteredRows.length} tickets`}
              </div>
            </div>

            {loading ? (
              <TicketSkeleton />
            ) : filteredRows.length ? (
              <>
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full min-w-[1180px] border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                        <th className="px-5 py-4 font-medium">Ticket ID</th>
                        <th className="px-5 py-4 font-medium">Customer</th>
                        <th className="px-5 py-4 font-medium">
                          Product / Order
                        </th>
                        <th className="px-5 py-4 font-medium">Issue</th>
                        <th className="px-5 py-4 font-medium">Submitted</th>
                        <th className="px-5 py-4 font-medium">Status</th>
                        <th className="px-5 py-4 text-right font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.map((t) => (
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
                                {normalizeStatus(t.status)}
                              </span>
                            </Link>
                          </td>

                          <td className="px-5 py-4 text-right">
                            {canOpenDetails ? (
                              <Link
                                href={`/admin/customer-tickets/${t.id}`}
                                className={secondaryBtnClass}
                              >
                                {canReply || canClose ? "View Details" : "View"}
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

                <div className="grid gap-4 p-5 xl:hidden">
                  {filteredRows.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[13px] font-semibold text-[#d6c7ff]">
                            {showTicketId(t.ticketId)}
                          </div>

                          <h3 className="mt-2 text-[18px] font-semibold text-white">
                            {t.customerName || "-"}
                          </h3>

                          <p className="mt-1 text-[12px] text-[#7f879f]">
                            {t.customerEmail || "-"}
                          </p>
                        </div>

                        <span
                          className={[
                            "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
                            statusTone(t.status),
                          ].join(" ")}
                        >
                          {normalizeStatus(t.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-[13px] text-[#a7aec4]">
                        <div>
                          Product:{" "}
                          <span className="text-[#d6dbeb]">
                            {t.productName || "-"}
                          </span>
                        </div>

                        <div>
                          Order:{" "}
                          <span className="text-[#d6dbeb]">
                            {t.orderId || "-"}
                          </span>
                        </div>

                        <div>
                          Size:{" "}
                          <span className="text-[#d6dbeb]">
                            {t.size || "-"}
                          </span>{" "}
                          • Color:{" "}
                          <span className="text-[#d6dbeb]">
                            {t.color || "-"}
                          </span>
                        </div>

                        <div>
                          Issue:{" "}
                          <span className="text-[#d6dbeb]">
                            {t.issueType || "-"}
                          </span>
                        </div>

                        <div>
                          Submitted:{" "}
                          <span className="text-[#d6dbeb]">
                            {formatDateShort(t.submittedAt)}
                          </span>
                        </div>
                      </div>

                      {canOpenDetails ? (
                        <Link
                          href={`/admin/customer-tickets/${t.id}`}
                          className={`${primaryBtnClass} mt-5 inline-flex w-full justify-center`}
                        >
                          {canReply || canClose ? "View Details" : "View"}
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </div>
    </AdminPageGuard>
  );
}

function Toast({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  const tone =
    toast.type === "success"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-100"
      : toast.type === "error"
      ? "border-red-400/20 bg-red-500/15 text-red-100"
      : "border-blue-400/20 bg-blue-500/15 text-blue-100";

  return (
    <div className="fixed right-4 top-4 z-[70] w-[calc(100vw-2rem)] max-w-[420px]">
      <div
        className={[
          "flex items-start justify-between gap-3 rounded-[20px] border px-4 py-3 shadow-2xl backdrop-blur",
          tone,
        ].join(" ")}
      >
        <p className="text-[13px] font-medium leading-6">{toast.message}</p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-bold text-white"
          aria-label="Close toast"
          title="Close toast"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function AlertBox({
  type,
  message,
  onClose,
}: {
  type: "error" | "info";
  message: string;
  onClose?: () => void;
}) {
  const tone =
    type === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : "border-blue-400/20 bg-blue-500/10 text-blue-200";

  return (
    <div
      className={[
        "flex items-start justify-between gap-3 rounded-[20px] border px-5 py-4 text-[13px]",
        tone,
      ].join(" ")}
    >
      <p className="leading-6">{message}</p>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      ) : null}
    </div>
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