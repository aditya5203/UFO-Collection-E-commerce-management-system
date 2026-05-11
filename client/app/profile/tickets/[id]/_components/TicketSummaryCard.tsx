"use client";

import TicketStatusBadge from "../../_components/TicketStatusBadge";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

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

export default function TicketSummaryCard({
  ticket,
  orderUrl,
  copyTicketId,
  goToOrder,
}: {
  ticket: any;
  orderUrl: string;
  copyTicketId: () => void;
  goToOrder: () => void;
}) {
  return (
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
            <span className="text-[#d6dbeb]">{ticket.size || "-"}</span> •
            Color:{" "}
            <span className="text-[#d6dbeb]">{ticket.color || "-"}</span>
          </div>

          {orderUrl ? (
            <button
              type="button"
              onClick={goToOrder}
              className={`${secondaryBtnClass} mt-5`}
            >
              View Order
            </button>
          ) : null}
        </div>

        <TicketStatusBadge status={ticket.status} />
      </div>
    </section>
  );
}