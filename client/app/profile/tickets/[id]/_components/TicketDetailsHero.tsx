"use client";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export default function TicketDetailsHero({
  loading,
  onBack,
  onRefresh,
}: {
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden p-5 sm:p-6`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Back to support tickets"
          >
            ←
          </button>

          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
              Support Conversation
            </div>

            <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[38px]">
              Ticket Details
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={secondaryBtnClass}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button type="button" onClick={onBack} className={primaryBtnClass}>
            Back to Tickets
          </button>
        </div>
      </div>
    </section>
  );
}