"use client";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export default function OrderLoadingSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`${panelClass} p-6 sm:p-7`}>
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-7 w-64 animate-pulse rounded-full bg-white/10" />
            <div className="mt-7 space-y-4">
              <div className="h-14 animate-pulse rounded-[18px] bg-white/10" />
              <div className="h-14 animate-pulse rounded-[18px] bg-white/10" />
              <div className="h-14 animate-pulse rounded-[18px] bg-white/10" />
            </div>
          </div>
        ))}
      </div>

      <div className={`${panelClass} h-[360px] p-6`}>
        <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-7 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-8 space-y-4">
          <div className="h-5 animate-pulse rounded-full bg-white/10" />
          <div className="h-5 animate-pulse rounded-full bg-white/10" />
          <div className="h-5 animate-pulse rounded-full bg-white/10" />
          <div className="h-12 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}