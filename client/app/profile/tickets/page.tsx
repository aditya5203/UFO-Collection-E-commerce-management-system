"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";
import TicketToast from "./_components/TicketToast";
import TicketsBreadcrumb from "./_components/TicketsBreadcrumb";
import TicketsHero from "./_components/TicketsHero";
import TicketFilters from "./_components/TicketFilters";
import TicketHistoryList from "./_components/TicketHistoryList";
import TicketDetailsModal from "./_components/TicketDetailsModal";
import AttachmentPreviewModal from "./_components/AttachmentPreviewModal";
import { displayStatus, type TicketStatus } from "./_components/TicketStatusBadge";

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
  API_BASE_URL;
const API = `${API_BASE}/api`;
const SOCKET_BASE =
  API_BASE_URL;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

function parseDateSafe(value?: string) {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
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
  }, [q, rows, statusFilter, sortValue]);

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

      <TicketToast toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <TicketsBreadcrumb />

          {err ? (
            <div className="mb-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <TicketsHero summary={summary} loading={loading} onRefresh={load} />

          <TicketFilters
            q={q}
            setQ={setQ}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortValue={sortValue}
            setSortValue={setSortValue}
            filteredCount={filteredRows.length}
            totalCount={rows.length}
            clearFilters={clearFilters}
          />

          <TicketHistoryList
            loading={loading}
            filteredRows={filteredRows}
            copyTicketId={copyTicketId}
            openTicket={openTicket}
            goToOrder={(url) => router.push(url)}
            clearFilters={clearFilters}
          />
        </div>
      </main>

      <TicketDetailsModal
        modalOpen={modalOpen}
        modalRef={modalRef}
        modalErr={modalErr}
        ticketLoading={ticketLoading}
        ticket={ticket}
        reply={reply}
        setReply={setReply}
        sending={sending}
        closeModal={closeModal}
        copyTicketId={copyTicketId}
        setAttachmentPreview={setAttachmentPreview}
        sendReply={sendReply}
        goToOrder={(url) => router.push(url)}
      />

      <AttachmentPreviewModal
        attachmentPreview={attachmentPreview}
        onClose={() => setAttachmentPreview(null)}
      />

      <MainFooter />
    </>
  );
}