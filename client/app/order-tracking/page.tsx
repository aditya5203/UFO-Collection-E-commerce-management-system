"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type StepKey = "PLACED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

type TrackingData = {
  trackingNumber: string;
  currentStatus: string;
  estimatedDelivery: string;
  activeStep: StepKey;
  timeline: Array<{ key: StepKey; title: string; date: string }>;
  locationUpdates: string;
  carrierInfo: string;
};

const STEP_ORDER: StepKey[] = ["PLACED", "SHIPPED", "IN_TRANSIT", "DELIVERED"];

function stepIndex(step: StepKey) {
  return STEP_ORDER.indexOf(step);
}

function progressPercent(active: StepKey) {
  const idx = stepIndex(active);
  if (idx <= 0) return 10;
  if (idx === 1) return 45;
  if (idx === 2) return 75;
  return 100;
}

function TimelineIcon({ step, active }: { step: StepKey; active: StepKey }) {
  const done = stepIndex(step) <= stepIndex(active);

  const iconSrc =
    step === "PLACED"
      ? "/images/check.png"
      : step === "SHIPPED"
      ? "/images/truck.png"
      : step === "IN_TRANSIT"
      ? "/images/box.png"
      : "/images/home.png";

  const iconAlt =
    step === "PLACED"
      ? "Order placed"
      : step === "SHIPPED"
      ? "Shipped"
      : step === "IN_TRANSIT"
      ? "In transit"
      : "Delivered";

  return (
    <div
      className={[
        "flex h-9 w-9 items-center justify-center rounded-full border",
        done ? "border-white/70 bg-white/10" : "border-white/20 bg-transparent",
      ].join(" ")}
      aria-hidden
    >
      <Image
        src={iconSrc}
        alt={iconAlt}
        width={18}
        height={18}
        className={done ? "brightness-0 invert" : "brightness-0 invert opacity-50"}
      />
    </div>
  );
}

export default function OrderTrackingPage() {
  const router = useRouter();

  const [data, setData] = React.useState<TrackingData>({
    trackingNumber: "",
    currentStatus: "",
    estimatedDelivery: "July 26, 2024, 2:00 PM",
    activeStep: "IN_TRANSIT",
    timeline: [
      { key: "PLACED", title: "Order Placed", date: "July 22, 2024" },
      { key: "SHIPPED", title: "Shipped", date: "July 23, 2024" },
      { key: "IN_TRANSIT", title: "In Transit", date: "July 24, 2024" },
      { key: "DELIVERED", title: "Delivered", date: "July 26, 2024" },
    ],
    locationUpdates:
      "Package is currently in transit and moving towards its destination. Last scanned at the distribution center in Metropolis on July 24, 2024, at 10:00 AM.",
    carrierInfo:
      "Shipped via Speedy Delivery. For more details, contact their customer service at 1-800-SPEEDY.",
  });

  const percent = progressPercent(data.activeStep);

  return (
    <>
      {/* ✅ HEADER (same as CartPage, NO cart/wishlist) */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-2">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-white">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-10">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          {/* spacer only */}
          <div className="w-[26px]" />
        </div>
      </header>

      {/* PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] px-10 py-10">
            <h1 className="text-[36px] font-semibold">Order Tracking</h1>

            {/* Inputs */}
            <div className="mt-10 space-y-8 max-w-[520px]">
              <div>
                <label htmlFor="trackingNumber" className="text-sm text-white/85">
                  Tracking Number
                </label>
                <input
                  id="trackingNumber"
                  value={data.trackingNumber}
                  onChange={(e) =>
                    setData((p) => ({ ...p, trackingNumber: e.target.value }))
                  }
                  className="mt-3 h-[44px] w-full rounded-[8px] border border-white/15 bg-[#0b0f1a]/70 px-4 text-white outline-none focus:border-white/35"
                />
              </div>

              <div>
                <label htmlFor="currentStatus" className="text-sm text-white/85">
                  Current Status
                </label>
                <input
                  id="currentStatus"
                  value={data.currentStatus}
                  onChange={(e) =>
                    setData((p) => ({ ...p, currentStatus: e.target.value }))
                  }
                  className="mt-3 h-[44px] w-full rounded-[8px] border border-white/15 bg-[#0b0f1a]/70 px-4 text-white outline-none focus:border-white/35"
                />
              </div>
            </div>

            {/* Progress */}
            <div className="mt-12">
              <div className="text-sm text-white/85">Order Progress</div>

              <div className="mt-4 h-[6px] w-full rounded-full bg-white/15">
                <div
                  className="h-[6px] rounded-full bg-[#1f7cff]"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-4 text-sm text-white/60">
                Estimated Delivery: {data.estimatedDelivery}
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-12 grid gap-7 max-w-[520px]">
              {data.timeline.map((t, idx) => {
                const isLast = idx === data.timeline.length - 1;
                const done = stepIndex(t.key) <= stepIndex(data.activeStep);

                return (
                  <div key={t.key} className="relative flex items-start gap-4">
                    {!isLast && (
                      <div
                        className={[
                          "absolute left-[18px] top-[40px] w-px h-[44px]",
                          done ? "bg-white/35" : "bg-white/15",
                        ].join(" ")}
                      />
                    )}

                    <TimelineIcon step={t.key} active={data.activeStep} />

                    <div className="pt-1">
                      <div className="text-base font-semibold text-white/90">
                        {t.title}
                      </div>
                      <div className="mt-1 text-sm text-white/60">{t.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Location Updates */}
            <div className="mt-14">
              <h2 className="text-[22px] font-semibold">Location Updates</h2>
              <p className="mt-4 max-w-[900px] text-white/75 leading-relaxed">
                {data.locationUpdates}
              </p>
            </div>

            {/* Carrier Information */}
            <div className="mt-12">
              <h2 className="text-[22px] font-semibold">Carrier Information</h2>
              <p className="mt-4 max-w-[900px] text-white/75 leading-relaxed">
                {data.carrierInfo}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-14 flex flex-col items-center gap-4 text-white/60">
            <div className="flex items-center gap-6">
              <span className="text-lg">◎</span>
              <span className="text-lg">◯</span>
            </div>
            <p className="text-sm text-white/50">
              © 2025 UFO Collection — All Rights Reserved
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
