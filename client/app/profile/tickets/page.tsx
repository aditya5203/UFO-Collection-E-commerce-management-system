"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type TicketStatus = "Open" | "Pending" | "Closed" | "Resolved" | "In Progress";
type ToastType = "success" | "error" | "info";
type StatusFilter = "All" | "Open" | "In Progress" | "Resolved" | "Closed";
type SortValue = "newest" | "oldest";

type MyTicketRow = {
  id: string;
  ticketId: string;
  issueType: string;
  subject: string;
  productName: string;
  orderId?: string | null;
  size?: string | null;
  color?: string | null;
  submittedAt: string;
  status: TicketStatus;
};

type TicketDetail = {
  id: string;
  ticketCode: string;
  status: TicketStatus;
  submittedAt: string;
  issueType: string;
  subject: string;
  message: string;
  imageUrl?: string | null;
  orderId?: string | null;
  size?: string | null;
  color?: string | null;
  product: { id?: string | null; name: string };
  replies: Array<{
    id: string;
    sender: "customer" | "admin";
    text: string;
    createdAt: string;
  }>;
};

type TicketSocketPayload = {
  ticketId?: string;
  ticketCode?: string;
  status?: TicketStatus;
  message?: string;
  reply?: {
    id?: string;
    sender?: "customer" | "admin";
    text?: string;
    createdAt?: string;
  };
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;
const SOCKET_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const inputClass =
  "h-12 w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

function displayStatus(s: TicketStatus) {
  if (s === "Pending") return "In Progress";
  return s;
}

function pillClass(s: TicketStatus) {
  const ds = displayStatus(s);

  if (ds === "Open") return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  if (ds === "In Progress")
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (ds === "Resolved")
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (ds === "Closed")
    return "border-slate-500/30 bg-slate-500/10 text-slate-200";

  return "border-[#d6c7ff]/30 bg-[#d6c7ff]/10 text-[#d6c7ff]";
}

function formatDate(value?: string) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);

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

function getOrderUrl(orderId?: string | null) {
  const clean = String(orderId || "").trim().replace("#", "");
  if (!clean) return "";
  return `/customerorderdetails/${encodeURIComponent(clean)}`;
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[10000] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${pillClass(
        status
      )}`}
    >
      {displayStatus(status)}
    </span>
  );
}

export default function ProfileTicketsPage() {
  const router = useRouter();

  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<MyTicketRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>("All");
  const [sortValue, setSortValue] = React.useState<SortValue>("newest");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [ticketLoading, setTicketLoading] = React.useState(false);

  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [modalErr, setModalErr] = React.useState("");

  const [attachmentPreview, setAttachmentPreview] = React.useState<
    string | null
  >(null);

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const socketRef = React.useRef<Socket | null>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${API}/tickets/my?q=${encodeURIComponent(q)}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(data?.message || "Failed to load tickets");
      }

      setRows(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setErr(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [q, router, showToast]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [load]);

  const loadTicket = React.useCallback(
    async (id: string) => {
      setTicketLoading(true);
      setModalErr("");

      try {
        const res = await fetch(`${API}/tickets/my/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }

          throw new Error(data?.message || "Failed to load ticket");
        }

        const item = data?.item || null;

        setTicket(
          item
            ? {
                ...item,
                product: item.product || {
                  id: item.productId || null,
                  name: item.productName || "-",
                },
                replies: Array.isArray(item.replies) ? item.replies : [],
              }
            : null
        );
      } catch (e: any) {
        const msg = e?.message || "Failed to load ticket";
        setTicket(null);
        setModalErr(msg);
        showToast(msg, "error");
      } finally {
        setTicketLoading(false);
      }
    },
    [router, showToast]
  );

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
      load();
    });

    socket.on("ticket:updated", (payload: TicketSocketPayload) => {
      const id = String(payload?.ticketId || "");
      const status = payload?.status;

      if (!id || !status) return;

      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status } : row))
      );

      setTicket((prev) =>
        prev && prev.id === id ? { ...prev, status } : prev
      );

      if (activeId === id) {
        loadTicket(id);
      }

      showToast(payload?.message || "Ticket status updated.", "info");
    });

    socket.on("ticket:reply:new", (payload: TicketSocketPayload) => {
      const id = String(payload?.ticketId || "");
      const incoming = payload?.reply;

      if (!id || !incoming?.text) return;

      setRows((prev) =>
        prev.map((row) =>
          row.id === id && payload.status
            ? { ...row, status: payload.status }
            : row
        )
      );

      setTicket((prev) => {
        if (!prev || prev.id !== id) return prev;

        const replyId = String(incoming.id || "");
        const exists =
          replyId && prev.replies.some((r) => String(r.id) === replyId);

        if (exists) {
          return payload.status ? { ...prev, status: payload.status } : prev;
        }

        return {
          ...prev,
          status: payload.status || prev.status,
          replies: [
            ...prev.replies,
            {
              id: replyId || `socket-${Date.now()}`,
              sender: incoming.sender || "admin",
              text: incoming.text || "",
              createdAt: incoming.createdAt || new Date().toISOString(),
            },
          ],
        };
      });

      if (activeId === id) {
        loadTicket(id);
      }

      if (incoming.sender === "admin") {
        showToast("Admin replied to your ticket.", "info");
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_BASE, activeId, load, loadTicket, showToast]);

  const openTicket = async (id: string) => {
    setActiveId(id);
    setTicket(null);
    setReply("");
    setModalErr("");
    setModalOpen(true);
    await loadTicket(id);
  };

  const closeModal = React.useCallback(() => {
    setModalOpen(false);
    setActiveId(null);
    setTicket(null);
    setReply("");
    setModalErr("");
  }, []);

  React.useEffect(() => {
    if (!modalOpen && !attachmentPreview) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modalOpen && modalRef.current && !modalRef.current.contains(target)) {
        closeModal();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (attachmentPreview) {
          setAttachmentPreview(null);
          return;
        }

        if (modalOpen) closeModal();
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [modalOpen, attachmentPreview, closeModal]);

  const sendReply = async () => {
    const text = reply.trim();

    if (!text || !activeId) {
      showToast("Please write a message first.", "error");
      return;
    }

    setSending(true);
    setModalErr("");

    try {
      const res = await fetch(`${API}/tickets/my/${activeId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(data?.message || "Failed to send reply");
      }

      setReply("");
      showToast("Reply sent successfully.", "success");

      await loadTicket(activeId);
      await load();
    } catch (e: any) {
      const msg = e?.message || "Failed to send reply";
      setModalErr(msg);
      showToast(msg, "error");
    } finally {
      setSending(false);
    }
  };

  const copyTicketId = async (ticketId?: string) => {
    const clean = String(ticketId || "").trim();

    if (!clean) {
      showToast("Ticket ID not found.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(clean);
      showToast("Ticket ID copied.", "success");
    } catch {
      showToast("Unable to copy ticket ID.", "error");
    }
  };

  const clearFilters = () => {
    setQ("");
    setStatusFilter("All");
    setSortValue("newest");
    showToast("Filters cleared.", "info");
  };

  const filteredRows = React.useMemo(() => {
  const keyword = q.trim().toLowerCase();
  let list = [...rows];

  if (keyword) {
    list = list.filter((row) => {
      return (
        String(row.ticketId || "").toLowerCase().includes(keyword) ||
        String(row.subject || "").toLowerCase().includes(keyword) ||
        String(row.productName || "").toLowerCase().includes(keyword) ||
        String(row.orderId || "").toLowerCase().includes(keyword) ||
        String(row.issueType || "").toLowerCase().includes(keyword)
      );
    });
  }

  if (statusFilter !== "All") {
      list = list.filter(
        (row) =>
          displayStatus(row.status).toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    list.sort((a, b) => {
      const da = parseDateSafe(a.submittedAt);
      const db = parseDateSafe(b.submittedAt);

      if (sortValue === "oldest") return da - db;
      return db - da;
    });

    return list;
  }, [rows, statusFilter, sortValue]);

  const summary = React.useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => displayStatus(r.status) === "Open").length;
    const progress = rows.filter(
      (r) => displayStatus(r.status) === "In Progress"
    ).length;
    const resolved = rows.filter(
      (r) => displayStatus(r.status) === "Resolved"
    ).length;

    return { total, open, progress, resolved };
  }, [rows]);

  return (
    <>
      <CartHeader backHref="/profile" />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-6 text-[13px] text-[#a7aec4]">
            <Link href="/profile" className="transition hover:text-white">
              Profile
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Support Tickets</span>
          </div>

          {err ? (
            <div className="mb-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden p-6 sm:p-8`}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Customer Support
                </div>

                <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                  Your Support Tickets
                </h1>

                <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-[#a7aec4] sm:text-[15px]">
                  Track your submitted issues, view admin replies, and continue
                  conversations with the support team in real time.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className={secondaryBtnClass}
                  >
                    {loading ? "Refreshing..." : "Refresh Tickets"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Total", summary.total],
                  ["Open", summary.open],
                  ["Progress", summary.progress],
                  ["Resolved", summary.resolved],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4"
                  >
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      {label}
                    </div>

                    <div className="mt-2 text-[26px] font-semibold text-white">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`${panelClass} mt-8 p-4 sm:p-5`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[20px] font-semibold tracking-[-0.02em] text-white">
                  Filter Tickets
                </div>

                <div className="mt-1 text-[13px] text-[#a7aec4]">
                  Search auto-updates while typing. You can also filter by
                  status and sort by submitted date.
                </div>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className={secondaryBtnClass}
              >
                Clear Filters
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_190px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search ticket ID, subject, product..."
                className={inputClass}
                aria-label="Search tickets"
              />

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className={inputClass}
                aria-label="Filter tickets by status"
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value as SortValue)}
                className={inputClass}
                aria-label="Sort tickets by date"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="mt-4 flex flex-col gap-2 text-[13px] text-[#a7aec4] sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing{" "}
                <span className="font-semibold text-white">
                  {filteredRows.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-white">{rows.length}</span>{" "}
                tickets.
              </div>

              {q.trim() ? (
                <div className="text-[#d6c7ff]">
                  Searching for:{" "}
                  <span className="font-semibold text-white">{q.trim()}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className={`${panelClass} mt-8 overflow-hidden`}>
            <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
              <div className="text-[20px] font-semibold text-white">
                Ticket History
              </div>

              <div className="mt-1 text-[13px] text-[#a7aec4]">
                Manage support conversations and view ticket status.
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 p-5 sm:p-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5"
                  >
                    <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
                    <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-white/5" />
                    <div className="mt-4 h-4 w-56 animate-pulse rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/5 text-2xl">
                  🎫
                </div>

                <h2 className="mt-5 text-[22px] font-semibold text-white">
                  No tickets found
                </h2>

                <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-7 text-[#a7aec4]">
                  Your search or filter did not match any tickets.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className={`${primaryBtnClass} mt-5`}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <div className="min-w-[1120px]">
                    <div className="grid grid-cols-[170px_minmax(0,1fr)_190px_160px_150px_220px] items-center border-b border-[#26293a] bg-[#161824] px-6 py-4 text-[12px] uppercase tracking-[0.14em] text-[#a7aec4]">
                      <div>Ticket ID</div>
                      <div>Subject</div>
                      <div>Product</div>
                      <div>Order ID</div>
                      <div className="text-center">Status</div>
                      <div className="text-right">Action</div>
                    </div>

                    <div className="divide-y divide-[#26293a]">
                      {filteredRows.map((t) => {
                        const orderUrl = getOrderUrl(t.orderId);

                        return (
                          <div
                            key={t.id}
                            className="grid grid-cols-[170px_minmax(0,1fr)_190px_160px_150px_220px] items-center px-6 py-5 transition hover:bg-white/[0.025]"
                          >
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => copyTicketId(t.ticketId)}
                                className="truncate font-semibold text-white transition hover:text-[#d6c7ff]"
                                title="Copy ticket ID"
                              >
                                {t.ticketId || "-"}
                              </button>

                              <div className="mt-1 text-[11px] text-[#7f879f]">
                                Click to copy
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-[14px] font-medium text-white">
                                {t.subject || "-"}
                              </div>

                              <div className="mt-1 text-[12px] text-[#a7aec4]">
                                {t.issueType || "-"} •{" "}
                                {formatDate(t.submittedAt)}
                              </div>
                            </div>

                            <div className="truncate text-[13px] text-[#a7aec4]">
                              {t.productName || "-"}
                            </div>

                            <div className="truncate text-[13px] text-[#a7aec4]">
                              {t.orderId || "-"}
                            </div>

                            <div className="flex justify-center">
                              <StatusBadge status={t.status} />
                            </div>

                            <div className="flex justify-end gap-3">
                              {orderUrl ? (
                                <button
                                  type="button"
                                  onClick={() => router.push(orderUrl)}
                                  className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:text-[#d6c7ff]"
                                >
                                  Order
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => openTicket(t.id)}
                                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#d6c7ff] transition hover:text-white"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:hidden">
                  {filteredRows.map((t) => {
                    const orderUrl = getOrderUrl(t.orderId);

                    return (
                      <div
                        key={t.id}
                        className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <button
                              type="button"
                              onClick={() => copyTicketId(t.ticketId)}
                              className="text-[13px] font-semibold text-[#d6c7ff]"
                            >
                              {t.ticketId || "-"}
                            </button>

                            <h3 className="mt-2 text-[18px] font-semibold text-white">
                              {t.subject || "-"}
                            </h3>
                          </div>

                          <StatusBadge status={t.status} />
                        </div>

                        <div className="mt-4 grid gap-2 text-[13px] text-[#a7aec4]">
                          <div>
                            Product:{" "}
                            <span className="text-[#d6dbeb]">
                              {t.productName || "-"}
                            </span>
                          </div>

                          <div>
                            Order ID:{" "}
                            <span className="text-[#d6dbeb]">
                              {t.orderId || "-"}
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
                              {formatDate(t.submittedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => openTicket(t.id)}
                            className={`${primaryBtnClass} flex-1`}
                          >
                            View Details
                          </button>

                          {orderUrl ? (
                            <button
                              type="button"
                              onClick={() => router.push(orderUrl)}
                              className={`${secondaryBtnClass} flex-1`}
                            >
                              View Order
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {modalOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-[4px] sm:p-6">
          <div
            ref={modalRef}
            className="my-6 w-full max-w-[860px] overflow-hidden rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#26293a] px-5 py-4 sm:px-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                  Support Conversation
                </div>

                <div className="mt-1 text-[22px] font-semibold text-white">
                  Ticket Details
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Close ticket modal"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {modalErr ? (
                <div className="mb-5 rounded-[18px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {modalErr}
                </div>
              ) : null}

              {ticketLoading || !ticket ? (
                <div className="rounded-[22px] border border-[#26293a] bg-[#161824] p-6 text-[#a7aec4]">
                  Loading ticket...
                </div>
              ) : (
                <>
                  <div className="rounded-[24px] border border-[#26293a] bg-[#161824] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-[24px] font-semibold text-white">
                            {ticket.ticketCode}
                          </div>

                          <button
                            type="button"
                            onClick={() => copyTicketId(ticket.ticketCode)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                          >
                            Copy ID
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#a7aec4]">
                          <span>
                            Submitted:{" "}
                            <span className="text-[#d6dbeb]">
                              {formatDate(ticket.submittedAt)}
                            </span>
                          </span>

                          <span>
                            Issue:{" "}
                            <span className="text-[#d6dbeb]">
                              {ticket.issueType}
                            </span>
                          </span>

                          <span>
                            Order ID:{" "}
                            <span className="text-[#d6dbeb]">
                              {ticket.orderId || "-"}
                            </span>
                          </span>
                        </div>

                        <div className="mt-2 text-[13px] text-[#a7aec4]">
                          Product:{" "}
                          <span className="text-[#d6dbeb]">
                            {ticket.product?.name || "-"}
                          </span>
                        </div>

                        <div className="mt-2 text-[13px] text-[#a7aec4]">
                          Size:{" "}
                          <span className="text-[#d6dbeb]">
                            {ticket.size || "-"}
                          </span>{" "}
                          • Color:{" "}
                          <span className="text-[#d6dbeb]">
                            {ticket.color || "-"}
                          </span>
                        </div>

                        {getOrderUrl(ticket.orderId) ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(getOrderUrl(ticket.orderId))
                            }
                            className={`${secondaryBtnClass} mt-4`}
                          >
                            View Order
                          </button>
                        ) : null}
                      </div>

                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5">
                    <div className="rounded-[24px] border border-[#26293a] bg-[#161824] p-5">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                        Subject
                      </div>

                      <div className="mt-2 text-[16px] font-semibold text-white">
                        {ticket.subject}
                      </div>

                      <div className="mt-5 text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                        Your Message
                      </div>

                      <div className="mt-2 rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4 text-[14px] leading-7 text-[#d6dbeb]">
                        {ticket.message}
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                          Attachment
                        </div>

                        {ticket.imageUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setAttachmentPreview(ticket.imageUrl || null)
                            }
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                          >
                            Fullscreen
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-2 rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4">
                        {ticket.imageUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setAttachmentPreview(ticket.imageUrl || null)
                            }
                            className="relative aspect-[16/9] w-full overflow-hidden rounded-[14px] border border-[#26293a]"
                          >
                            <img
                              src={ticket.imageUrl}
                              alt="Ticket attachment"
                              className="h-full w-full object-cover transition hover:scale-[1.02]"
                            />
                          </button>
                        ) : (
                          <div className="py-8 text-center text-[14px] text-[#a7aec4]">
                            No image uploaded.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#26293a] bg-[#161824] p-5">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                        Conversation
                      </div>

                      <div className="mt-4 space-y-3">
                        {ticket.replies.length === 0 ? (
                          <div className="rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-6 text-center text-[14px] text-[#a7aec4]">
                            No replies yet.
                          </div>
                        ) : (
                          ticket.replies.map((r) => (
                            <div
                              key={r.id}
                              className={`rounded-[18px] border px-4 py-3 ${
                                r.sender === "admin"
                                  ? "border-[#d6c7ff]/25 bg-[#d6c7ff]/10"
                                  : "border-[#26293a] bg-[#0d0f17]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[13px] font-semibold text-white">
                                  {r.sender === "admin" ? "Admin" : "You"}
                                </div>

                                <div className="text-[12px] text-[#7f879f]">
                                  {String(r.createdAt).slice(0, 19)}
                                </div>
                              </div>

                              <div className="mt-2 text-[14px] leading-6 text-[#d6dbeb]">
                                {r.text}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-6 text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                        Reply
                      </div>

                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={4}
                        placeholder="Write a message..."
                        className="mt-2 w-full resize-none rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-[14px] leading-7 text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                      />

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setReply("")}
                          className={secondaryBtnClass}
                        >
                          Clear
                        </button>

                        <button
                          type="button"
                          onClick={sendReply}
                          disabled={sending || !reply.trim()}
                          className={primaryBtnClass}
                        >
                          {sending ? "Sending..." : "Send Reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {attachmentPreview ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[4px]">
          <div className="relative w-full max-w-[1100px] overflow-hidden rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
            <div className="flex items-center justify-between border-b border-[#26293a] px-5 py-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                  Attachment Preview
                </div>
                <div className="mt-1 text-[18px] font-semibold text-white">
                  Support Ticket Image
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachmentPreview(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Close attachment preview"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[78vh] overflow-auto bg-[#0d0f17] p-4">
              <img
                src={attachmentPreview}
                alt="Fullscreen ticket attachment"
                className="mx-auto max-h-[72vh] w-auto max-w-full rounded-[18px] object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      <MainFooter />
    </>
  );
}