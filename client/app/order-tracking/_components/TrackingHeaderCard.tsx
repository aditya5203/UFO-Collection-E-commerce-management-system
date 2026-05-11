"use client";

import Link from "next/link";

type StepKey = "PLACED" | "CONFIRMED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

type TrackingData = {
  trackingNumber: string;
  currentStatus: string;
  estimatedDelivery: string;
  activeStep: StepKey;
  orderId?: string;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function getStatusBadgeClasses(status: string) {
  const s = String(status || "").trim().toLowerCase();

  if (s.includes("delivered") || s.includes("completed")) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  }

  if (s.includes("transit") || s.includes("out for delivery")) {
    return "border-sky-400/30 bg-sky-500/10 text-sky-300";
  }

  if (s.includes("shipped") || s.includes("dispatch")) {
    return "border-violet-400/30 bg-violet-500/10 text-violet-300";
  }

  if (s.includes("confirm")) {
    return "border-blue-400/30 bg-blue-500/10 text-blue-300";
  }

  if (s.includes("cancel")) {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  return "border-amber-400/30 bg-amber-500/10 text-amber-300";
}

export default function TrackingHeaderCard({
  data,
  loading,
  error,
  trackingCode,
  cleanCode,
  canViewOrder,
  onTrackingNumberChange,
  onTrack,
  onCopy,
}: {
  data: TrackingData;
  loading: boolean;
  error: string | null;
  trackingCode: string;
  cleanCode: string;
  canViewOrder: boolean;
  onTrackingNumberChange: (value: string) => void;
  onTrack: () => void;
  onCopy: () => void;
}) {
  return (
    <>
      <div className="mb-8 text-[13px] text-[#a7aec4]">
        <Link href="/homepage" className="hover:text-white">
          Home
        </Link>

        <span className="mx-2">/</span>

        <Link href="/order-history" className="hover:text-white">
          Orders
        </Link>

        <span className="mx-2">/</span>

        <span className="text-white">Tracking</span>
      </div>

      <section className={`${panelClass} overflow-hidden`}>
        <div className="relative border-b border-[#26293a] px-5 py-8 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,199,255,0.14),transparent_38%)]" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Delivery Tracking
              </div>

              <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[48px]">
                Order Tracking
              </h1>

              <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[#a7aec4]">
                Track your order status, delivery progress, shipment updates,
                and order summary in real time.
              </p>
            </div>

            {data.currentStatus ? (
              <div
                className={[
                  "inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
                  getStatusBadgeClasses(data.currentStatus),
                ].join(" ")}
              >
                {data.currentStatus}
              </div>
            ) : null}
          </div>

          <div className="relative mt-8 grid max-w-[840px] gap-5">
            <div>
              <label htmlFor="trackingNumber" className="text-sm text-[#cfd3ff]">
                Tracking Number
              </label>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="trackingNumber"
                  value={data.trackingNumber}
                  onChange={(e) => onTrackingNumberChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      onTrack();
                    }
                  }}
                  className="h-[50px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                  placeholder="Enter order code, e.g. 597320"
                  autoComplete="off"
                />

                <button
                  type="button"
                  onClick={onTrack}
                  disabled={loading}
                  className={`${primaryBtnClass} shrink-0`}
                >
                  {loading ? "Tracking..." : "Track"}
                </button>

                <button
                  type="button"
                  onClick={onCopy}
                  className={`${secondaryBtnClass} shrink-0`}
                >
                  Copy
                </button>
              </div>

              {error ? (
                <div className="mt-3 rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}
            </div>

            {trackingCode ? (
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] text-[#a7aec4]">
                  Tracking Code:{" "}
                  <span className="font-semibold text-white">
                    {trackingCode}
                  </span>
                </span>

                {canViewOrder ? (
                  <Link
                    href={`/customerorderdetails/${encodeURIComponent(
                      data.orderId || cleanCode,
                    )}?from=tracking`}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
                  >
                    View Order Details
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}