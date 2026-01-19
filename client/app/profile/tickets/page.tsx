"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TicketStatus = "Open" | "Pending" | "Closed" | "Resolved" | "In Progress";

type MyTicketRow = {
  id: string;
  ticketId: string;
  issueType: string;
  subject: string;
  productName: string;
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

// ✅ show "Pending" as "In Progress" (like screenshot)
function displayStatus(s: TicketStatus) {
  if (s === "Pending") return "In Progress";
  return s;
}

function pillClass(s: TicketStatus) {
  const ds = displayStatus(s);

  // keep your dark pill palette (no theme change)
  if (ds === "Open") return "bg-[#1d2a3b] text-white border-[#2b3a52]";
  if (ds === "In Progress") return "bg-[#2a2a1d] text-white border-[#3a3a2b]";
  if (ds === "Resolved") return "bg-[#202a2a] text-white border-[#2b3a3a]";
  return "bg-[#202024] text-white border-[#2b2f45]"; // Closed
}

export default function ProfileTicketsPage() {
  const router = useRouter();

  // list state
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<MyTicketRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  // modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [ticketLoading, setTicketLoading] = React.useState(false);

  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [modalErr, setModalErr] = React.useState("");
  const [modalOk, setModalOk] = React.useState("");

  const modalRef = React.useRef<HTMLDivElement | null>(null);

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
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [q, router]);

  React.useEffect(() => {
    load();
  }, [load]);

  // load one ticket (for modal)
  const loadTicket = React.useCallback(
    async (id: string) => {
      setTicketLoading(true);
      setModalErr("");
      setModalOk("");
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

        setTicket(data?.item || null);
      } catch (e: any) {
        setTicket(null);
        setModalErr(e?.message || "Failed to load ticket");
      } finally {
        setTicketLoading(false);
      }
    },
    [router]
  );

  const openTicket = async (id: string) => {
    setActiveId(id);
    setTicket(null);
    setReply("");
    setModalErr("");
    setModalOk("");
    setModalOpen(true);
    await loadTicket(id);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveId(null);
    setTicket(null);
    setReply("");
    setModalErr("");
    setModalOk("");
  };

  // close modal outside click + ESC
  React.useEffect(() => {
    if (!modalOpen) return;

    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modalRef.current && !modalRef.current.contains(target)) closeModal();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !activeId) return;

    setSending(true);
    setModalErr("");
    setModalOk("");
    try {
      const res = await fetch(`${API}/tickets/${activeId}/reply`, {
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
      setModalOk("Message sent.");
      await loadTicket(activeId);
    } catch (e: any) {
      setModalErr(e?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050611] text-white">
      {/* HEADER (unchanged theme, but removed wishlist/profile/3-dots like you asked) */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-2">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-white">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-10">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          {/* keep spacing so header stays aligned */}
          <div className="w-[44px]" />
        </div>
      </header>

      {/* ✅ MAIN (design like 2nd screenshot) */}
      <main className="mx-auto w-full max-w-[1160px] px-4 py-10">
        {err ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-extrabold tracking-tight">
              Your Support Tickets
            </h1>
          </div>

          {/* search + refresh (compact; keep if you want) */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center rounded-[10px] border border-[#2b2f45] bg-[#101223] px-3 py-2">
              <span className="mr-2 text-[#9aa3cc]">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="w-[220px] bg-transparent text-sm text-white placeholder:text-[#7f8aa6] outline-none"
              />
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-[10px] border border-[#2b2f45] bg-[#1a1d30] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#232844] disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <section className="mt-6 rounded-[10px] border border-[#2b2f45] bg-[#0f1116]">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[170px_1fr_190px_170px_150px] items-center border-b border-[#2b2f45] bg-[#1a1d22] px-6 py-4 text-[13px] font-semibold text-white/90">
                <div>Ticket ID</div>
                <div>Subject</div>
                <div>Submission Date</div>
                <div className="text-center">Status</div>
                <div className="text-right text-white/60">Action</div>
              </div>

              <div className="divide-y divide-[#2b2f45]">
                {!loading && rows.length === 0 ? (
                  <div className="px-6 py-10 text-center text-[#8b90ad]">
                    No tickets found.
                  </div>
                ) : null}

                {rows.map((t) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-[170px_1fr_190px_170px_150px] items-center px-6 py-5"
                  >
                    <div className="text-white/95">{t.ticketId || "-"}</div>
                    <div className="text-[#9aa3cc]">{t.subject || "-"}</div>
                    <div className="text-[#9aa3cc]">
                      {String(t.submittedAt).slice(0, 10)}
                    </div>

                    <div className="flex justify-center">
                      <span
                        className={`inline-flex min-w-[140px] justify-center rounded-[10px] border px-4 py-2 text-[13px] ${pillClass(
                          t.status
                        )}`}
                      >
                        {displayStatus(t.status)}
                      </span>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => openTicket(t.id)}
                        className="text-[13px] font-semibold text-[#8b90ad] hover:text-white"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-2" />
            </div>
          </div>
        </section>
      </main>

      {/* MODAL (unchanged) */}
      {modalOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
          <div
            ref={modalRef}
            className="w-full max-w-[760px] rounded-2xl border border-[#23253a] bg-[#101223] shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center justify-between border-b border-[#23253a] px-6 py-4">
              <div className="text-[18px] font-bold">Ticket Details</div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-[#2b2f45] px-3 py-1 text-sm text-[#cbd5ff] hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {modalErr ? (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {modalErr}
                </div>
              ) : null}

              {modalOk ? (
                <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
                  {modalOk}
                </div>
              ) : null}

              {ticketLoading || !ticket ? (
                <div className="rounded-xl border border-[#22253a] bg-[#101223] p-6 text-[#8b90ad]">
                  Loading ticket...
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[22px] font-bold">{ticket.ticketCode}</div>
                      <div className="mt-1 text-[13px] text-[#8b90ad]">
                        Submitted: {String(ticket.submittedAt).slice(0, 10)} • Issue:{" "}
                        {ticket.issueType}
                      </div>
                      <div className="mt-1 text-[13px] text-[#8b90ad]">
                        Product:{" "}
                        <span className="text-white/90">
                          {ticket.product?.name || "-"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex min-w-[92px] justify-center rounded-[10px] border px-4 py-2 text-[13px] ${pillClass(
                        ticket.status
                      )}`}
                    >
                      {displayStatus(ticket.status)}
                    </span>
                  </div>

                  <div className="mt-6 space-y-6">
                    <div className="rounded-2xl border border-[#23253a] bg-[#101223] p-5">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#8b90ad]">
                        Subject
                      </div>
                      <div className="mt-2 text-white/95">{ticket.subject}</div>

                      <div className="mt-4 text-xs uppercase tracking-[0.18em] text-[#8b90ad]">
                        Your Message
                      </div>
                      <div className="mt-2 rounded-[12px] border border-[#23253a] bg-[#0b1220] p-4 text-[#d7def3] leading-7">
                        {ticket.message}
                      </div>

                      <div className="mt-4 text-xs uppercase tracking-[0.18em] text-[#8b90ad]">
                        Attachment
                      </div>
                      <div className="mt-2 rounded-[12px] border border-[#23253a] bg-[#0b1220] p-4">
                        {ticket.imageUrl ? (
                          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px] border border-[#2b2f45]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ticket.imageUrl}
                              alt="Attachment"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="py-8 text-center text-sm text-[#8b90ad]">
                            No image uploaded.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#23253a] bg-[#101223] p-5">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#8b90ad]">
                        Conversation
                      </div>

                      <div className="mt-3 space-y-3">
                        {ticket.replies.length === 0 ? (
                          <div className="rounded-[12px] border border-[#23253a] bg-[#0b1220] px-4 py-6 text-sm text-[#8b90ad]">
                            No replies yet.
                          </div>
                        ) : (
                          ticket.replies.map((r) => (
                            <div
                              key={r.id}
                              className={`rounded-[12px] border px-4 py-3 ${
                                r.sender === "admin"
                                  ? "border-[#2b3a52] bg-[#0b172a]"
                                  : "border-[#23253a] bg-[#0b1220]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm text-[#a9c1ff]">
                                  {r.sender === "admin" ? "Admin" : "You"}
                                </div>
                                <div className="text-xs text-[#7f8aa6]">
                                  {String(r.createdAt).slice(0, 19)}
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-[#d7def3] leading-6">
                                {r.text}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8b90ad]">
                        Reply
                      </div>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={4}
                        placeholder="Write a message..."
                        className="mt-2 w-full resize-none rounded-[12px] border border-[#23253a] bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-[#7f8aa6] outline-none focus:border-[#2f7efc]"
                      />

                      <div className="mt-4 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setReply("")}
                          className="rounded-full border border-[#2b2f45] bg-transparent px-6 py-3 text-sm text-white hover:bg-white/10"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={sendReply}
                          disabled={sending || !reply.trim()}
                          className="rounded-full bg-[#2f7efc] px-6 py-3 text-sm hover:brightness-105 disabled:opacity-60"
                        >
                          {sending ? "Sending..." : "Send"}
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
    </div>
  );
}
