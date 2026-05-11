"use client";

import TicketStatusBadge, { type TicketStatus } from "./TicketStatusBadge";

type MyTicketRow = {
  id: string;
  ticketId: string;
  issueType: string;
  subject: string;
  productName: string;
  orderId?: string | null;
  size?: string | null;
  color?: string | null;
  submittedAt: string;
  status: TicketStatus;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

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

export default function TicketHistoryList({
  loading,
  filteredRows,
  copyTicketId,
  openTicket,
  goToOrder,
  clearFilters,
}: {
  loading: boolean;
  filteredRows: MyTicketRow[];
  copyTicketId: (ticketId?: string) => void;
  openTicket: (id: string) => void;
  goToOrder: (url: string) => void;
  clearFilters: () => void;
}) {
  return (
    <section className={`${panelClass} mt-8 overflow-hidden`}>
      <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
        <div className="text-[20px] font-semibold text-white">
          Ticket History
        </div>

        <div className="mt-1 text-[13px] text-[#a7aec4]">
          Manage support conversations and view ticket status.
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 p-5 sm:p-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5"
            >
              <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
              <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-white/5" />
              <div className="mt-4 h-4 w-56 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/5 text-2xl">
            🎫
          </div>

          <h2 className="mt-5 text-[22px] font-semibold text-white">
            No tickets found
          </h2>

          <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-7 text-[#a7aec4]">
            Your search or filter did not match any tickets.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className={`${primaryBtnClass} mt-5`}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <div className="min-w-[1120px]">
              <div className="grid grid-cols-[170px_minmax(0,1fr)_190px_160px_150px_220px] items-center border-b border-[#26293a] bg-[#161824] px-6 py-4 text-[12px] uppercase tracking-[0.14em] text-[#a7aec4]">
                <div>Ticket ID</div>
                <div>Subject</div>
                <div>Product</div>
                <div>Order ID</div>
                <div className="text-center">Status</div>
                <div className="text-right">Action</div>
              </div>

              <div className="divide-y divide-[#26293a]">
                {filteredRows.map((t) => {
                  const orderUrl = getOrderUrl(t.orderId);

                  return (
                    <div
                      key={t.id}
                      className="grid grid-cols-[170px_minmax(0,1fr)_190px_160px_150px_220px] items-center px-6 py-5 transition hover:bg-white/[0.025]"
                    >
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => copyTicketId(t.ticketId)}
                          className="truncate font-semibold text-white transition hover:text-[#d6c7ff]"
                          title="Copy ticket ID"
                        >
                          {t.ticketId || "-"}
                        </button>

                        <div className="mt-1 text-[11px] text-[#7f879f]">
                          Click to copy
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium text-white">
                          {t.subject || "-"}
                        </div>

                        <div className="mt-1 text-[12px] text-[#a7aec4]">
                          {t.issueType || "-"} • {formatDate(t.submittedAt)}
                        </div>
                      </div>

                      <div className="truncate text-[13px] text-[#a7aec4]">
                        {t.productName || "-"}
                      </div>

                      <div className="truncate text-[13px] text-[#a7aec4]">
                        {t.orderId || "-"}
                      </div>

                      <div className="flex justify-center">
                        <TicketStatusBadge status={t.status} />
                      </div>

                      <div className="flex justify-end gap-3">
                        {orderUrl ? (
                          <button
                            type="button"
                            onClick={() => goToOrder(orderUrl)}
                            className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:text-[#d6c7ff]"
                          >
                            Order
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => openTicket(t.id)}
                          className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#d6c7ff] transition hover:text-white"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:hidden">
            {filteredRows.map((t) => {
              const orderUrl = getOrderUrl(t.orderId);

              return (
                <div
                  key={t.id}
                  className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => copyTicketId(t.ticketId)}
                        className="text-[13px] font-semibold text-[#d6c7ff]"
                      >
                        {t.ticketId || "-"}
                      </button>

                      <h3 className="mt-2 text-[18px] font-semibold text-white">
                        {t.subject || "-"}
                      </h3>
                    </div>

                    <TicketStatusBadge status={t.status} />
                  </div>

                  <div className="mt-4 grid gap-2 text-[13px] text-[#a7aec4]">
                    <div>
                      Product:{" "}
                      <span className="text-[#d6dbeb]">
                        {t.productName || "-"}
                      </span>
                    </div>

                    <div>
                      Order ID:{" "}
                      <span className="text-[#d6dbeb]">{t.orderId || "-"}</span>
                    </div>

                    <div>
                      Issue:{" "}
                      <span className="text-[#d6dbeb]">
                        {t.issueType || "-"}
                      </span>
                    </div>

                    <div>
                      Submitted:{" "}
                      <span className="text-[#d6dbeb]">
                        {formatDate(t.submittedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openTicket(t.id)}
                      className={`${primaryBtnClass} flex-1`}
                    >
                      View Details
                    </button>

                    {orderUrl ? (
                      <button
                        type="button"
                        onClick={() => goToOrder(orderUrl)}
                        className={`${secondaryBtnClass} flex-1`}
                      >
                        View Order
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}