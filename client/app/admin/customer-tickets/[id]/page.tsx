// client/app/admin/customer-tickets/[id]/page.tsx
"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import AdminPageGuard from "../../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../../_components/adminPermissions";

type TicketStatus = "Open" | "Pending" | "In Progress" | "Resolved" | "Closed";
type NormalizedTicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

type TicketDetail = {
  id: string;
  ticketCode: string;
  status: TicketStatus;
  submittedAt: string;
  customer: { name: string; email: string };
  product: { name: string; id?: string | null };
  orderId?: string | null;
  size?: string | null;
  color?: string | null;
  issueType: string;
  subject: string;
  message: string;
  imageUrl?: string | null;
  replies: Array<{
    id: string;
    sender: "customer" | "admin";
    text: string;
    createdAt: string;
  }>;
};

type AdminTicketSocketPayload = {
  ticketId?: string;
  ticketCode?: string;
  status?: TicketStatus;
  reply?: {
    id?: string;
    sender?: "customer" | "admin";
    text?: string;
    createdAt?: string;
  };
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

const RAW_API_BASE =
  API_BASE_URL;

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

const SOCKET_BASE = CLEAN_API_BASE.replace(/\/api$/, "");

const MAX_REPLY_LENGTH = 2000;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function optionClass() {
  return "bg-[#11121a] text-white";
}

function normalizeStatus(status?: string): NormalizedTicketStatus {
  if (status === "Pending") return "In Progress";
  if (status === "Open") return "Open";
  if (status === "In Progress") return "In Progress";
  if (status === "Resolved") return "Resolved";
  if (status === "Closed") return "Closed";
  return "Open";
}

function statusTone(s: TicketStatus | NormalizedTicketStatus) {
  const status = normalizeStatus(s);

  if (status === "Open") return "border-sky-400/20 bg-sky-500/15 text-sky-300";
  if (status === "In Progress") {
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  }
  if (status === "Resolved") {
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

function normalizeTicketDetail(item: any): TicketDetail | null {
  if (!item) return null;

  return {
    id: String(item?.id || item?._id || ""),
    ticketCode: String(item?.ticketCode || item?.ticketId || "-"),
    status: normalizeStatus(item?.status),
    submittedAt: String(item?.submittedAt || item?.createdAt || ""),
    customer: {
      name: String(item?.customer?.name || item?.customerName || "Customer"),
      email: String(item?.customer?.email || item?.customerEmail || "-"),
    },
    product: {
      name: String(item?.product?.name || item?.productName || "-"),
      id: item?.product?.id ? String(item.product.id) : item?.productId ? String(item.productId) : null,
    },
    orderId: item?.orderId ? String(item.orderId) : null,
    size: item?.size ? String(item.size) : null,
    color: item?.color ? String(item.color) : null,
    issueType: String(item?.issueType || "-"),
    subject: String(item?.subject || "-"),
    message: String(item?.message || "-"),
    imageUrl: item?.imageUrl ? String(item.imageUrl) : null,
    replies: Array.isArray(item?.replies)
      ? item.replies.map((r: any, index: number) => ({
          id: String(r?.id || r?._id || `reply-${index}`),
          sender: r?.sender === "admin" ? "admin" : "customer",
          text: String(r?.text || ""),
          createdAt: String(r?.createdAt || new Date().toISOString()),
        }))
      : [],
  };
}

function replyAlreadyExists(
  replies: TicketDetail["replies"],
  incoming: NonNullable<AdminTicketSocketPayload["reply"]>
) {
  const replyId = String(incoming.id || "");
  const incomingText = String(incoming.text || "").trim();
  const incomingSender = incoming.sender || "customer";
  const incomingTime = incoming.createdAt
    ? new Date(incoming.createdAt).getTime()
    : 0;

  if (replyId && replies.some((r) => String(r.id) === replyId)) return true;

  return replies.some((r) => {
    if (r.sender !== incomingSender) return false;
    if (String(r.text || "").trim() !== incomingText) return false;

    const existingTime = new Date(r.createdAt).getTime();

    if (!Number.isFinite(existingTime) || !Number.isFinite(incomingTime)) {
      return false;
    }

    return Math.abs(existingTime - incomingTime) < 3000;
  });
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function AdminTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [toast, setToast] = React.useState<ToastState | null>(null);

  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [status, setStatus] = React.useState<NormalizedTicketStatus>("Open");
  const [reply, setReply] = React.useState("");
  const [attachmentPreview, setAttachmentPreview] = React.useState<string | null>(
    null
  );

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] = React.useState<AdminPermissions | null>(
    null
  );

  const socketRef = React.useRef<Socket | null>(null);
  const loadRef = React.useRef<(() => Promise<void>) | null>(null);

  const canReply = hasPermission(role, permissions, "ticketReply");
  const canClose = hasPermission(role, permissions, "ticketClose");

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3500);
  }

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
      const res = await fetch(`${API}/admin/tickets/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load ticket");
      }

      const item = normalizeTicketDetail((data as any).item || null);

      setTicket(item);
      setStatus(normalizeStatus(item?.status));
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadRef.current = load;
  }, [load]);

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
      loadRef.current?.();
    });

    socket.on("connect_error", () => {
      showToast({
        type: "info",
        message: "Live ticket updates are reconnecting.",
      });
    });

    socket.on("admin:ticket:updated", (payload: AdminTicketSocketPayload) => {
      const payloadId = String(payload?.ticketId || "");
      const nextStatus = normalizeStatus(payload?.status);

      if (payloadId !== id) return;

      setStatus(nextStatus);
      setTicket((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    });

    socket.on("admin:ticket:reply:new", (payload: AdminTicketSocketPayload) => {
      const payloadId = String(payload?.ticketId || "");
      const incoming = payload?.reply;

      if (payloadId !== id || !incoming?.text) return;

      setTicket((prev) => {
        if (!prev) return prev;

        const nextStatus = payload.status
          ? normalizeStatus(payload.status)
          : normalizeStatus(prev.status);

        if (replyAlreadyExists(prev.replies, incoming)) {
          return { ...prev, status: nextStatus };
        }

        return {
          ...prev,
          status: nextStatus,
          replies: [
            ...prev.replies,
            {
              id: String(incoming.id || `socket-${Date.now()}`),
              sender: incoming.sender === "admin" ? "admin" : "customer",
              text: String(incoming.text || ""),
              createdAt: String(incoming.createdAt || new Date().toISOString()),
            },
          ],
        };
      });

      if (payload.status) {
        setStatus(normalizeStatus(payload.status));
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  const saveStatus = async (nextStatus: NormalizedTicketStatus) => {
    if (!canClose) {
      setErr("You do not have permission to update ticket status.");
      return;
    }

    if (!id) {
      setErr("Invalid ticket id.");
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const res = await fetch(`${API}/admin/tickets/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to update status");
      }

      setStatus(nextStatus);
      setTicket((prev) => (prev ? { ...prev, status: nextStatus } : prev));

      showToast({
        type: "success",
        message: "Status updated successfully.",
      });

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!canReply) {
      setErr("You do not have permission to reply to tickets.");
      return;
    }

    if (!id) {
      setErr("Invalid ticket id.");
      return;
    }

    const text = reply.trim();

    if (!text) {
      setErr("Please write a reply first.");
      return;
    }

    if (text.length > MAX_REPLY_LENGTH) {
      setErr(`Reply must be under ${MAX_REPLY_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const res = await fetch(`${API}/admin/tickets/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to send reply");
      }

      setReply("");

      showToast({
        type: "success",
        message: "Reply sent successfully.",
      });

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to send reply.");
    } finally {
      setSaving(false);
    }
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
                  Customer Tickets / Details
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Ticket Details
                </h1>

                <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Review customer issue details, attachment, product/order
                  information, conversation history, and reply as admin.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/admin/customer-tickets")}
                  className={secondaryBtnClass}
                >
                  Back
                </button>

                <Link href="/admin/customer-tickets" className={primaryBtnClass}>
                  All Tickets
                </Link>
              </div>
            </div>
          </section>

          {err ? (
            <AlertBox type="error" message={err} onClose={() => setErr("")} />
          ) : null}

          {loading ? (
            <TicketSkeleton />
          ) : !ticket ? (
            <div
              className={`${panelClass} p-10 text-center text-[13px] text-[#a7aec4]`}
            >
              Ticket not found.
            </div>
          ) : (
            <>
              <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Ticket Summary
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]">
                        {ticket.ticketCode}
                      </h2>

                      <StatusPill status={status} />
                    </div>

                    <p className="mt-2 text-[13px] text-[#a7aec4]">
                      Submitted: {formatDateShort(ticket.submittedAt)} • Issue:{" "}
                      {ticket.issueType}
                    </p>
                  </div>

                  {canClose ? (
                    <div>
                      <label
                        htmlFor="ticket-status"
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
                      >
                        Update Status
                      </label>

                      <select
                        id="ticket-status"
                        value={status}
                        onChange={(e) =>
                          saveStatus(e.target.value as NormalizedTicketStatus)
                        }
                        disabled={saving}
                        className="h-[48px] rounded-full border border-white/10 bg-white/5 px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60"
                        title="Update ticket status"
                        aria-label="Update ticket status"
                      >
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
                    </div>
                  ) : null}
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                <section className={`${panelClass} p-5 sm:p-6`}>
                  <InfoSection title="Customer">
                    <InfoBlock label="Name" value={ticket.customer.name} />
                    <InfoBlock label="Email" value={ticket.customer.email} />
                  </InfoSection>

                  <Divider />

                  <InfoSection title="Product">
                    <InfoBlock
                      label="Product Name"
                      value={ticket.product.name || "-"}
                    />

                    {ticket.product.id ? (
                      <Link
                        href={`/admin/products/${ticket.product.id}`}
                        className={`${secondaryBtnClass} mt-4 inline-flex`}
                      >
                        View Product
                      </Link>
                    ) : null}
                  </InfoSection>

                  <Divider />

                  <InfoSection title="Order Details">
                    <InfoBlock label="Order ID" value={ticket.orderId || "-"} />
                    <InfoBlock label="Size" value={ticket.size || "-"} />
                    <InfoBlock label="Color" value={ticket.color || "-"} />
                  </InfoSection>

                  <Divider />

                  <InfoSection title="Subject">
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-6 text-white">
                      {ticket.subject}
                    </div>
                  </InfoSection>
                </section>

                <section className={`${panelClass} p-5 sm:p-6`}>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Customer Message
                    </div>

                    <div className="mt-3 rounded-[18px] border border-white/10 bg-[#0d0f17] p-4 text-[13px] leading-7 text-[#d8dcef]">
                      {ticket.message}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
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

                    <div className="mt-3 rounded-[18px] border border-white/10 bg-[#0d0f17] p-4">
                      {ticket.imageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setAttachmentPreview(ticket.imageUrl || null)
                          }
                          className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] border border-white/10"
                          aria-label="Open attachment preview"
                          title="Open attachment preview"
                        >
                          <img
                            src={ticket.imageUrl}
                            alt="Ticket attachment"
                            className="h-full w-full object-cover transition hover:scale-[1.02]"
                          />
                        </button>
                      ) : (
                        <div className="py-10 text-center text-[13px] text-[#a7aec4]">
                          No image uploaded.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Conversation
                    </div>

                    <div className="mt-3 space-y-3">
                      {ticket.replies.length ? (
                        ticket.replies.map((r) => (
                          <div
                            key={r.id}
                            className={[
                              "rounded-[18px] border px-4 py-3",
                              r.sender === "admin"
                                ? "border-[#d6c7ff]/25 bg-[#d6c7ff]/10"
                                : "border-white/10 bg-white/[0.03]",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[13px] font-semibold text-white">
                                {r.sender === "admin" ? "Admin" : "Customer"}
                              </div>

                              <div className="text-[11px] text-[#7f879f]">
                                {formatDateTime(r.createdAt)}
                              </div>
                            </div>

                            <div className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[#d8dcef]">
                              {r.text}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-[#a7aec4]">
                          No replies yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {canReply ? (
                    <div className="mt-8">
                      <div className="flex items-center justify-between gap-3">
                        <label
                          htmlFor="ticket-reply"
                          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a7aec4]"
                        >
                          Reply as Admin
                        </label>

                        <span
                          className={[
                            "text-[11px]",
                            reply.length > MAX_REPLY_LENGTH
                              ? "text-red-300"
                              : "text-[#7f879f]",
                          ].join(" ")}
                        >
                          {reply.length}/{MAX_REPLY_LENGTH}
                        </span>
                      </div>

                      <textarea
                        id="ticket-reply"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={4}
                        maxLength={MAX_REPLY_LENGTH + 100}
                        placeholder="Write a reply..."
                        className="mt-3 w-full resize-none rounded-[18px] border border-white/10 bg-[#0d0f17] px-4 py-3 text-[13px] leading-7 text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
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
                          disabled={
                            saving ||
                            !reply.trim() ||
                            reply.trim().length > MAX_REPLY_LENGTH
                          }
                          className={primaryBtnClass}
                        >
                          {saving ? "Sending..." : "Send Reply"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
            </>
          )}
        </div>
      </div>

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

function StatusPill({
  status,
}: {
  status: TicketStatus | NormalizedTicketStatus;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        statusTone(status),
      ].join(" ")}
    >
      {normalizeStatus(status)}
    </span>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
        {title}
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
        {label}
      </div>

      <div className="mt-2 break-words text-[13px] font-medium text-white">
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-6 h-px bg-[#26293a]" />;
}

function TicketSkeleton() {
  return (
    <div className="space-y-5">
      <div className={`${panelClass} p-6`}>
        <div className="h-3 w-40 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-9 w-64 animate-pulse rounded bg-white/5" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="h-[520px] animate-pulse rounded-[24px] border border-white/5 bg-white/[0.03]" />
        <div className="h-[520px] animate-pulse rounded-[24px] border border-white/5 bg-white/[0.03]" />
      </div>
    </div>
  );
}
