"use client";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export default function TicketsHero({
  summary,
  loading,
  onRefresh,
}: {
  summary: {
    total: number;
    open: number;
    progress: number;
    resolved: number;
  };
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden p-6 sm:p-8`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
            Customer Support
          </div>

          <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
            Your Support Tickets
          </h1>

          <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-[#a7aec4] sm:text-[15px]">
            Track your submitted issues, view admin replies, and continue
            conversations with the support team in real time.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className={secondaryBtnClass}
            >
              {loading ? "Refreshing..." : "Refresh Tickets"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["Total", summary.total],
            ["Open", summary.open],
            ["Progress", summary.progress],
            ["Resolved", summary.resolved],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                {label}
              </div>

              <div className="mt-2 text-[26px] font-semibold text-white">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}