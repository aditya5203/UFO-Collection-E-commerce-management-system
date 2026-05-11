"use client";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div>
      {eyebrow ? (
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white">
        {title}
      </h2>
    </div>
  );
}

export default function OrderTimelineCard({ status }: { status: OrderStatus }) {
  const steps: OrderStatus[] = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Transit",
    "Delivered",
  ];

  const normalizedStatus =
    status === "Processing"
      ? "Confirmed"
      : status === "Out for Delivery"
        ? "Transit"
        : status;

  const currentIndex = ["Cancelled", "Returned", "Refunded"].includes(status)
    ? -1
    : Math.max(0, steps.indexOf(normalizedStatus as OrderStatus));

  return (
    <div className={`${panelClass} p-5 sm:p-7`}>
      <SectionTitle eyebrow="Progress" title="Order Timeline" />

      {["Cancelled", "Returned", "Refunded"].includes(status) ? (
        <div className="mt-5 rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          This order is currently marked as {status}.
        </div>
      ) : (
        <>
          <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-5">
            {steps.map((step, index) => {
              const done = index <= currentIndex;
              const active = index === currentIndex;

              return (
                <div key={step} className="relative">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-[13px] font-bold ${
                      done
                        ? "border-green-400/30 bg-green-500/15 text-green-200"
                        : "border-white/10 bg-white/5 text-[#7f879f]"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </div>

                  <div
                    className={`mt-3 text-[13px] font-semibold ${
                      active
                        ? "text-white"
                        : done
                          ? "text-green-200"
                          : "text-[#a7aec4]"
                    }`}
                  >
                    {step}
                  </div>

                  <div className="mt-1 text-[11px] text-[#7f879f]">
                    {active ? "Current status" : done ? "Completed" : "Pending"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-4 sm:hidden">
            {steps.map((step, index) => {
              const done = index <= currentIndex;
              const active = index === currentIndex;

              return (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-[12px] font-bold ${
                        done
                          ? "border-green-400/30 bg-green-500/15 text-green-200"
                          : "border-white/10 bg-white/5 text-[#7f879f]"
                      }`}
                    >
                      {done ? "✓" : index + 1}
                    </div>

                    {index !== steps.length - 1 ? (
                      <div className="mt-2 h-8 w-px bg-[#26293a]" />
                    ) : null}
                  </div>

                  <div className="pb-2">
                    <div
                      className={`text-[14px] font-semibold ${
                        active
                          ? "text-white"
                          : done
                            ? "text-green-200"
                            : "text-[#a7aec4]"
                      }`}
                    >
                      {step}
                    </div>

                    <div className="mt-1 text-[12px] text-[#7f879f]">
                      {active ? "Current status" : done ? "Completed" : "Pending"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}