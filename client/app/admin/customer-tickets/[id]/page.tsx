"use client";

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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;
const SOCKET_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function displayStatus(status: TicketStatus) {
  if (status === "Pending") return "In Progress";
  return status;
}

function statusTone(s: TicketStatus) {
  const status = displayStatus(s);

  if (status === "Open") return "border-sky-400/20 bg-sky-500/15 text-sky-300";
  if (status === "In Progress")
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  if (status === "Resolved")
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";

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
  const [ok, setOk] = React.useState("");

  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [status, setStatus] = React.useState<TicketStatus>("Open");
  const [reply, setReply] = React.useState("");
  const [attachmentPreview, setAttachmentPreview] = React.useState<
    string | null
  >(null);

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  const socketRef = React.useRef<Socket | null>(null);

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
    setOk("");

    try {
      const res = await fetch(`${API}/admin/tickets/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load ticket");
      }

      const item = (data as any).item || null;

      setTicket(
        item
          ? {
              ...item,
              replies: Array.isArray(item.replies) ? item.replies : [],
            }
          : null
      );

      setStatus(item?.status || "Open");
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

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

    socket.on("admin:ticket:updated", (payload: AdminTicketSocketPayload) => {
      const payloadId = String(payload?.ticketId || "");
      const nextStatus = payload?.status;

      if (payloadId !== id || !nextStatus) return;

      setStatus(nextStatus);
      setTicket((prev) =>
        prev ? { ...prev, status: nextStatus } : prev
      );
    });

    socket.on("admin:ticket:reply:new", (payload: AdminTicketSocketPayload) => {
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
              sender: incoming.sender || "customer",
              text: incoming.text || "",
              createdAt: incoming.createdAt || new Date().toISOString(),
            },
          ],
        };
      });

      if (payload.status) {
        setStatus(payload.status);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_BASE, id, load]);

  const saveStatus = async (nextStatus: TicketStatus) => {
    if (!canClose) {
      setErr("You do not have permission to update ticket status.");
      return;
    }

    setSaving(true);
    setErr("");
    setOk("");

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
      setTicket((prev) =>
        prev ? { ...prev, status: nextStatus } : prev
      );
      setOk("Status updated successfully.");
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

    const text = reply.trim();

    if (!text) {
      setErr("Please write a reply first.");
      return;
    }

    setSaving(true);
    setErr("");
    setOk("");

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
      setOk("Reply sent successfully.");
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
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
              {err}
            </div>
          ) : null}

          {ok ? (
            <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/15 px-5 py-4 text-[13px] text-emerald-200">
              {ok}
            </div>
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
                          saveStatus(e.target.value as TicketStatus)
                        }
                        disabled={saving}
                        className="h-[48px] rounded-full border border-white/10 bg-white/5 px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="Open" className="bg-[#11121a]">
                          Open
                        </option>
                        <option value="In Progress" className="bg-[#11121a]">
                          In Progress
                        </option>
                        <option value="Resolved" className="bg-[#11121a]">
                          Resolved
                        </option>
                        <option value="Closed" className="bg-[#11121a]">
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

                            <div className="mt-2 text-[13px] leading-6 text-[#d8dcef]">
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
                      <label
                        htmlFor="ticket-reply"
                        className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a7aec4]"
                      >
                        Reply as Admin
                      </label>

                      <textarea
                        id="ticket-reply"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={4}
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
                          disabled={saving || !reply.trim()}
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

function StatusPill({ status }: { status: TicketStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
        statusTone(status),
      ].join(" ")}
    >
      {displayStatus(status)}
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

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
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