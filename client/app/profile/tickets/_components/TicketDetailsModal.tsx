"use client";

import * as React from "react";
import TicketStatusBadge, { type TicketStatus } from "./TicketStatusBadge";

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

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

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

function getOrderUrl(orderId?: string | null) {
  const clean = String(orderId || "").trim().replace("#", "");
  if (!clean) return "";
  return `/customerorderdetails/${encodeURIComponent(clean)}`;
}

export default function TicketDetailsModal({
  modalOpen,
  modalRef,
  modalErr,
  ticketLoading,
  ticket,
  reply,
  setReply,
  sending,
  closeModal,
  copyTicketId,
  setAttachmentPreview,
  sendReply,
  goToOrder,
}: {
  modalOpen: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
  modalErr: string;
  ticketLoading: boolean;
  ticket: TicketDetail | null;
  reply: string;
  setReply: (value: string) => void;
  sending: boolean;
  closeModal: () => void;
  copyTicketId: (ticketId?: string) => void;
  setAttachmentPreview: (value: string | null) => void;
  sendReply: () => void;
  goToOrder: (url: string) => void;
}) {
  if (!modalOpen) return null;

  return (
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
                        onClick={() => goToOrder(getOrderUrl(ticket.orderId))}
                        className={`${secondaryBtnClass} mt-4`}
                      >
                        View Order
                      </button>
                    ) : null}
                  </div>

                  <TicketStatusBadge status={ticket.status} />
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
  );
}