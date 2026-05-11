"use client";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export default function TrackingEmptyState() {
  return (
    <div className={`${panelClass} p-8 text-center sm:p-10`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[26px]">
        📦
      </div>

      <h2 className="mt-5 text-[24px] font-semibold text-white">
        Track your order
      </h2>

      <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-7 text-[#a7aec4]">
        Enter your order code to view real-time delivery progress, product
        details, and payment summary.
      </p>
    </div>
  );
}