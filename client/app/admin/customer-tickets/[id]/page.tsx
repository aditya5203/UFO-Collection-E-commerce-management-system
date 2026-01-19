"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type TicketStatus = "Open" | "Pending" | "Closed";

type TicketDetail = {
  id: string;
  ticketCode: string;
  status: TicketStatus;
  submittedAt: string;

  customer: { name: string; email: string };
  product: { name: string; id?: string | null };

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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

function pillClass(s: TicketStatus) {
  if (s === "Open") return "bg-[#1d2a3b] text-white border-[#2b3a52]";
  if (s === "Pending") return "bg-[#2a2a1d] text-white border-[#3a3a2b]";
  return "bg-[#202a2a] text-white border-[#2b3a3a]";
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

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr("");
    setOk("");
    try {
      const res = await fetch(`${API}/admin/tickets/${id}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load ticket");

      setTicket(data.item);
      setStatus(data.item.status);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const saveStatus = async (nextStatus: TicketStatus) => {
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
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update status");

      setStatus(nextStatus);
      setOk("Status updated.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;

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
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to send reply");

      setReply("");
      setOk("Reply sent.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to send reply.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-0px)]">
      <div className="mb-8 flex items-center justify-between gap-4 rounded-[12px] border border-[#1b2a40] bg-[#0f1a2b]/55 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="grid h-[40px] w-[40px] place-items-center rounded-[10px] border border-[#1b2a40] bg-[#0b1220] hover:bg-[#14233a]"
          >
            <span className="text-white/90">←</span>
          </button>

          <div>
            <div className="text-[14px] font-semibold text-white/90">Ticket Details</div>
            <div className="text-xs text-[#9aa7c3]">Customer Tickets / View</div>
          </div>
        </div>

        <div className="grid h-[40px] w-[40px] place-items-center overflow-hidden rounded-full border border-[#1b2a40] bg-[#0b1220]">
          <Image src="/images/logo.png" alt="Admin" width={40} height={40} className="h-full w-full object-cover" />
        </div>
      </div>

      {err ? (
        <div className="mb-5 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}
      {ok ? (
        <div className="mb-5 rounded-[10px] border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {ok}
        </div>
      ) : null}

      {loading || !ticket ? (
        <div className="rounded-[12px] border border-[#1b2a40] bg-[#0f1a2b]/55 p-8 text-[#9aa7c3]">
          Loading ticket...
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[34px] font-semibold tracking-tight">{ticket.ticketCode}</div>
              <div className="mt-1 text-sm text-[#9aa7c3]">
                Submitted: {String(ticket.submittedAt).slice(0, 10)} • Issue: {ticket.issueType}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex min-w-[96px] justify-center rounded-[10px] border px-4 py-2 text-[13px] ${pillClass(
                  status
                )}`}
              >
                {status}
              </span>

              <select
                value={status}
                onChange={(e) => saveStatus(e.target.value as TicketStatus)}
                disabled={saving}
                className="rounded-[10px] border border-[#1b2a40] bg-[#0f1a2b] px-3 py-2 text-sm text-white outline-none disabled:opacity-60"
              >
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
            <section className="rounded-[12px] border border-[#1b2a40] bg-[#0f1a2b]/55 p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Customer</div>
              <div className="mt-3 text-lg text-white/95">{ticket.customer.name}</div>
              <div className="mt-1 text-sm text-[#a9c1ff]">{ticket.customer.email}</div>

              <div className="mt-6 h-px bg-[#162338]" />

              <div className="mt-6 text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Product</div>
              <div className="mt-3 text-white/95">{ticket.product.name}</div>

              {ticket.product.id ? (
                <Link
                  href={`/admin/products/${ticket.product.id}`}
                  className="mt-2 inline-block text-sm text-[#9cc2ff] hover:text-white"
                >
                  View Product →
                </Link>
              ) : null}

              <div className="mt-6 h-px bg-[#162338]" />

              <div className="mt-6 text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Subject</div>
              <div className="mt-2 text-white/95">{ticket.subject}</div>
            </section>

            <section className="rounded-[12px] border border-[#1b2a40] bg-[#0f1a2b]/55 p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Customer Message</div>

              <div className="mt-3 rounded-[12px] border border-[#162338] bg-[#0b1220] p-4 text-[#d7def3] leading-7">
                {ticket.message}
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Attachment</div>

                <div className="mt-3 rounded-[12px] border border-[#162338] bg-[#0b1220] p-4">
                  {ticket.imageUrl ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px] border border-[#1b2a40]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ticket.imageUrl} alt="Ticket attachment" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="py-10 text-center text-sm text-[#9aa7c3]">No image uploaded.</div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <div className="text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Conversation</div>

                <div className="mt-3 space-y-3">
                  {ticket.replies.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-[12px] border px-4 py-3 ${
                        r.sender === "admin"
                          ? "border-[#2b3a52] bg-[#0b172a]"
                          : "border-[#162338] bg-[#0b1220]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-[#a9c1ff]">
                          {r.sender === "admin" ? "Admin" : "Customer"}
                        </div>
                        <div className="text-xs text-[#7f8aa6]">{String(r.createdAt)}</div>
                      </div>
                      <div className="mt-2 text-sm text-[#d7def3] leading-6">{r.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Reply as Admin</div>

                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  placeholder="Write a reply..."
                  className="mt-3 w-full resize-none rounded-[12px] border border-[#1b2a40] bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-[#7f8aa6] outline-none focus:border-[#1f7cff]"
                />

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={saving || !reply.trim()}
                    className="rounded-[10px] bg-[#1f7cff] px-6 py-3 text-sm font-semibold disabled:opacity-60"
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
  );
}
