"use client";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export default function TicketMessageCard({
  ticket,
  setAttachmentPreview,
}: {
  ticket: any;
  setAttachmentPreview: (value: string | null) => void;
}) {
  return (
    <>
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

              <div className="mt-1 text-[14px] text-[#d6dbeb]">{value}</div>
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
              onClick={() => setAttachmentPreview(ticket.imageUrl || null)}
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
              onClick={() => setAttachmentPreview(ticket.imageUrl || null)}
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
      </section>
    </>
  );
}