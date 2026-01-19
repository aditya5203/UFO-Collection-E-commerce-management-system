"use client";

import * as React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

type TicketStatus = "Open" | "Pending" | "Closed";

type TicketDetail = {
  id: string;
  ticketCode: string;
  status: TicketStatus;
  submittedAt: string;

  issueType: string;
  subject: string;
  message: string;
  imageUrl?: string | null;

  product: { id?: string | null; name: string };

  replies: Array<{
    id: string;
    sender: "customer" | "admin";
    text: string;
    createdAt: string;
  }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

function pillClass(s: TicketStatus) {
  if (s === "Open") return "bg-[#1d2a3b] text-white border-[#2b3a52]";
  if (s === "Pending") return "bg-[#2a2a1d] text-white border-[#3a3a2b]";
  return "bg-[#202a2a] text-white border-[#2b3a3a]";
}

export default function MyTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any)?.id || "");

  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");
  const [reply, setReply] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr("");
    setOk("");
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

      setTicket(data.item);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  React.useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;

    setSaving(true);
    setErr("");
    setOk("");
    try {
      const res = await fetch(`${API}/tickets/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to send reply");

      setReply("");
      setOk("Message sent.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to send reply");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070a12] text-white">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="grid h-[40px] w-[40px] place-items-center rounded-[10px] border border-[#2b2f45] bg-[#0b1220] hover:bg-[#14233a]"
              aria-label="Back"
            >
              <span className="text-white/90">←</span>
            </button>

            <div>
              <div className="text-[14px] font-semibold text-white/90">Ticket Details</div>
              <div className="text-xs text-[#9aa3cc]">My Tickets / View</div>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-[10px] border border-[#2b2f45] bg-[#0b0f1a]/60 px-4 py-2 text-sm hover:bg-[#111827] disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
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
          <div className="rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-8 text-[#9aa3cc]">
            Loading ticket...
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[34px] font-semibold tracking-tight">{ticket.ticketCode}</div>
                <div className="mt-1 text-sm text-[#9aa3cc]">
                  Submitted: {String(ticket.submittedAt).slice(0, 10)} • Issue: {ticket.issueType} • Product:{" "}
                  {ticket.product?.name || "-"}
                </div>
              </div>

              <span
                className={`inline-flex min-w-[96px] justify-center rounded-[10px] border px-4 py-2 text-[13px] ${pillClass(
                  ticket.status
                )}`}
              >
                {ticket.status}
              </span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
              <section className="rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6">
                <div className="text-xs uppercase tracking-[0.18em] text-[#9aa3cc]">Subject</div>
                <div className="mt-2 text-white/95">{ticket.subject}</div>

                <div className="mt-6 h-px bg-[#1b2034]" />

                <div className="mt-6 text-xs uppercase tracking-[0.18em] text-[#9aa3cc]">Your Message</div>
                <div className="mt-3 rounded-[12px] border border-[#1b2034] bg-[#0b1220] p-4 text-[#d7def3] leading-7">
                  {ticket.message}
                </div>
              </section>

              <section className="rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6">
                <div className="text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Attachment</div>
                <div className="mt-3 rounded-[12px] border border-[#1b2034] bg-[#0b1220] p-4">
                  {ticket.imageUrl ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px] border border-[#2b2f45]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ticket.imageUrl} alt="Ticket attachment" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="py-10 text-center text-sm text-[#9aa3cc]">No image uploaded.</div>
                  )}
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
                            : "border-[#1b2034] bg-[#0b1220]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-[#a9c1ff]">
                            {r.sender === "admin" ? "Admin" : "You"}
                          </div>
                          <div className="text-xs text-[#7f8aa6]">{String(r.createdAt).slice(0, 19)}</div>
                        </div>
                        <div className="mt-2 text-sm text-[#d7def3] leading-6">{r.text}</div>
                      </div>
                    ))}

                    {ticket.replies.length === 0 ? (
                      <div className="rounded-[12px] border border-[#1b2034] bg-[#0b1220] px-4 py-6 text-sm text-[#9aa3cc]">
                        No replies yet.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#9aa7c3]">Reply</div>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    placeholder="Write a message..."
                    className="mt-3 w-full resize-none rounded-[12px] border border-[#2b2f45] bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-[#7f8aa6] outline-none focus:border-[#1f7cff]"
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={sendReply}
                      disabled={saving || !reply.trim()}
                      className="rounded-[10px] bg-[#1f7cff] px-6 py-3 text-sm font-semibold disabled:opacity-60"
                    >
                      {saving ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
