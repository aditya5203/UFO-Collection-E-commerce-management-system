"use client";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

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

export default function TicketConversation({
  ticket,
  reply,
  setReply,
  saving,
  sendReply,
}: {
  ticket: any;
  reply: string;
  setReply: (value: string) => void;
  saving: boolean;
  sendReply: () => void;
}) {
  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <div className="mt-0">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
          Conversation
        </div>

        <div className="mt-4 space-y-3">
          {ticket.replies.length === 0 ? (
            <div className="rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-6 text-center text-[14px] text-[#a7aec4]">
              No replies yet.
            </div>
          ) : (
            ticket.replies.map((r: any) => (
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
  );
}