"use client";

const innerPanelClass = "rounded-[20px] border border-[#26293a] bg-[#161824]";

export default function TrackingSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div className={`${innerPanelClass} p-5 sm:p-6`}>
        <div className="h-6 w-44 animate-pulse rounded bg-white/5" />

        <div className="mt-8 space-y-7">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-11 w-11 animate-pulse rounded-full bg-white/5" />

              <div className="flex-1 pt-1">
                <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${innerPanelClass} p-5 sm:p-6`}>
            <div className="h-5 w-44 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-20 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}