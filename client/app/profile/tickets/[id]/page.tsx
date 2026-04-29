"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type TicketStatus = "Open" | "Pending" | "Closed" | "Resolved" | "In Progress";
type ToastType = "success" | "error" | "info";

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
  "mx-auto max-w-[1180px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

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

function formatDateTime(value?: string) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 19);

  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderUrl(orderId?: string | null) {
  const clean = String(orderId || "").trim().replace("#", "");
  if (!clean) return "";
  return `/customerorderdetails/${encodeURIComponent(clean)}`;
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

export default function MyTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any)?.id || "");

  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [attachmentPreview, setAttachmentPreview] = React.useState<
    string | null
  >(null);

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);
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

  React.useEffect(() => {
    if (!attachmentPreview) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAttachmentPreview(null);
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [attachmentPreview]);

  const load = React.useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setErr("");

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
      const msg = e?.message || "Something went wrong";
      setErr(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!id) return;

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
      const payloadId = String(payload?.ticketId || "");
      const status = payload?.status;

      if (payloadId !== id || !status) return;

      setTicket((prev) => (prev ? { ...prev, status } : prev));
      showToast(payload?.message || "Ticket status updated.", "info");
      load();
    });

    socket.on("ticket:reply:new", (payload: TicketSocketPayload) => {
      const payloadId = String(payload?.ticketId || "");
      const incoming = payload?.reply;

      if (payloadId !== id || !incoming?.text) return;

      setTicket((prev) => {
        if (!prev) return prev;

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

      if (incoming.sender === "admin") {
        showToast("Admin replied to your ticket.", "info");
      }

      load();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_BASE, id, load, showToast]);

  const sendReply = async () => {
    const text = reply.trim();

    if (!text) {
      showToast("Please write a message first.", "error");
      return;
    }

    if (!id) {
      showToast("Ticket ID not found.", "error");
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const res = await fetch(`${API}/tickets/my/${id}/reply`, {
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
      await load();
    } catch (e: any) {
      const msg = e?.message || "Failed to send reply";
      setErr(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const copyTicketId = async () => {
    const clean = String(ticket?.ticketCode || "").trim();

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

  const orderUrl = getOrderUrl(ticket?.orderId);

  return (
    <>
      <CartHeader />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-6 text-[13px] text-[#a7aec4]">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="transition hover:text-white"
            >
              Profile
            </button>
            <span className="mx-2">/</span>
            <button
              type="button"
              onClick={() => router.push("/profile/tickets")}
              className="transition hover:text-white"
            >
              Support Tickets
            </button>
            <span className="mx-2">/</span>
            <span className="text-white">Ticket Details</span>
          </div>

          {err ? (
            <div className="mb-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden p-5 sm:p-6`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/profile/tickets")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  aria-label="Back to support tickets"
                >
                  ←
                </button>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    Support Conversation
                  </div>
                  <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[38px]">
                    Ticket Details
                  </h1>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className={secondaryBtnClass}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/profile/tickets")}
                  className={primaryBtnClass}
                >
                  Back to Tickets
                </button>
              </div>
            </div>
          </section>

          {loading || !ticket ? (
            <section className={`${panelClass} mt-8 p-6`}>
              <div className="rounded-[22px] border border-[#26293a] bg-[#161824] p-6 text-[#a7aec4]">
                Loading ticket...
              </div>
            </section>
          ) : (
            <>
              <section className={`${panelClass} mt-8 p-5 sm:p-6`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[36px]">
                        {ticket.ticketCode}
                      </h2>

                      <button
                        type="button"
                        onClick={copyTicketId}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                      >
                        Copy ID
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#a7aec4]">
                      <span>
                        Submitted:{" "}
                        <span className="text-[#d6dbeb]">
                          {formatDate(ticket.submittedAt)}
                        </span>
                      </span>

                      <span>
                        Issue:{" "}
                        <span className="text-[#d6dbeb]">
                          {ticket.issueType || "-"}
                        </span>
                      </span>

                      <span>
                        Order ID:{" "}
                        <span className="text-[#d6dbeb]">
                          {ticket.orderId || "-"}
                        </span>
                      </span>
                    </div>

                    <div className="mt-3 text-[13px] text-[#a7aec4]">
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

                    {orderUrl ? (
                      <button
                        type="button"
                        onClick={() => router.push(orderUrl)}
                        className={`${secondaryBtnClass} mt-5`}
                      >
                        View Order
                      </button>
                    ) : null}
                  </div>

                  <StatusBadge status={ticket.status} />
                </div>
              </section>

              <div className="mt-8 grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
                <section className={`${panelClass} p-5 sm:p-6`}>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                    Subject
                  </div>

                  <div className="mt-2 text-[17px] font-semibold text-white">
                    {ticket.subject || "-"}
                  </div>

                  <div className="mt-6 h-px bg-[#26293a]" />

                  <div className="mt-6 text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                    Your Message
                  </div>

                  <div className="mt-3 rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4 text-[14px] leading-7 text-[#d6dbeb]">
                    {ticket.message || "-"}
                  </div>

                  <div className="mt-6 h-px bg-[#26293a]" />

                  <div className="mt-6 grid gap-4">
                    {[
                      ["Product", ticket.product?.name || "-"],
                      ["Order ID", ticket.orderId || "-"],
                      ["Size", ticket.size || "-"],
                      ["Color", ticket.color || "-"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                          {label}
                        </div>
                        <div className="mt-1 text-[14px] text-[#d6dbeb]">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`${panelClass} p-5 sm:p-6`}>
                  <div className="flex items-center justify-between gap-3">
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

                  <div className="mt-3 rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4">
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
                      <div className="py-10 text-center text-[14px] text-[#a7aec4]">
                        No image uploaded.
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
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
                                {formatDateTime(r.createdAt)}
                              </div>
                            </div>

                            <div className="mt-2 text-[14px] leading-6 text-[#d6dbeb]">
                              {r.text}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                      Reply
                    </div>

                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={4}
                      placeholder="Write a message..."
                      className="mt-3 w-full resize-none rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-[14px] leading-7 text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                    />

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setReply("")}
                        disabled={saving || !reply}
                        className={secondaryBtnClass}
                      >
                        Clear
                      </button>

                      <button
                        type="button"
                        onClick={sendReply}
                        disabled={saving || !reply.trim()}
                        className={primaryBtnClass}
                      >
                        {saving ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>

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