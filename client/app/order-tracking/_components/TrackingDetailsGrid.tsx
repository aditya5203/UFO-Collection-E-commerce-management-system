"use client";

import Image from "next/image";
import Link from "next/link";

type StepKey = "PLACED" | "CONFIRMED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

type OrderItem = {
  id: string;
  name: string;
  size?: string;
  color?: string;
  colorLabel?: string;
  qty: number;
  price: number;
  image: string;
};

type TrackingData = {
  trackingNumber: string;
  currentStatus: string;
  estimatedDelivery: string;
  activeStep: StepKey;
  timeline: Array<{ key: StepKey; title: string; date: string }>;
  locationUpdates: string;
  carrierInfo: string;
  orderId?: string;
  customer?: {
    name?: string;
    email?: string;
    shippingAddress?: string;
  };
  payment?: {
    method?: string;
  };
  shipping?: {
    method?: string;
    estimatedDelivery?: string;
  };
  summary?: {
    subtotal?: number;
    shipping?: number;
    discount?: number;
    taxes?: number;
    total?: number;
  };
  items: OrderItem[];
};

const STEP_ORDER: StepKey[] = [
  "PLACED",
  "CONFIRMED",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
];

const innerPanelClass = "rounded-[20px] border border-[#26293a] bg-[#161824]";

const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

function stepIndex(step: StepKey) {
  return STEP_ORDER.indexOf(step);
}

function progressWidthClass(active: StepKey) {
  const idx = stepIndex(active);

  if (idx <= 0) return "w-[10%]";
  if (idx === 1) return "w-[32%]";
  if (idx === 2) return "w-[55%]";
  if (idx === 3) return "w-[78%]";

  return "w-full";
}

function formatNPR(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
}

function colorDotClass(color?: string) {
  const c = String(color || "").trim().toLowerCase();

  if (c === "black" || c === "#000" || c === "#000000") return "bg-black";
  if (c === "white" || c === "#fff" || c === "#ffffff") return "bg-white";
  if (c === "red" || c === "#ff0000") return "bg-red-500";
  if (c === "blue" || c === "#0000ff") return "bg-blue-500";
  if (c === "green" || c === "#008000") return "bg-green-500";
  if (c === "yellow") return "bg-yellow-400";
  if (c === "purple") return "bg-purple-500";
  if (c === "pink") return "bg-pink-500";
  if (c === "gray" || c === "grey") return "bg-gray-500";
  if (c === "brown") return "bg-amber-900";
  if (c === "orange") return "bg-orange-500";

  return "bg-[#16191f]";
}

function TimelineIcon({ step, active }: { step: StepKey; active: StepKey }) {
  const done = stepIndex(step) <= stepIndex(active);

  const iconSrc =
    step === "PLACED"
      ? "/images/check.png"
      : step === "CONFIRMED"
        ? "/images/check.png"
        : step === "SHIPPED"
          ? "/images/truck.png"
          : step === "IN_TRANSIT"
            ? "/images/box.png"
            : "/images/home.png";

  const iconAlt =
    step === "PLACED"
      ? "Order placed"
      : step === "CONFIRMED"
        ? "Order confirmed"
        : step === "SHIPPED"
          ? "Shipped"
          : step === "IN_TRANSIT"
            ? "In transit"
            : "Delivered";

  return (
    <div
      className={[
        "relative z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_8px_30px_rgba(0,0,0,0.22)] transition-all",
        done
          ? "border-white/55 bg-white/10"
          : "border-white/15 bg-[#0c1220]",
      ].join(" ")}
      aria-hidden
    >
      <Image
        src={iconSrc}
        alt={iconAlt}
        width={20}
        height={20}
        className={done ? "brightness-0 invert" : "brightness-0 invert opacity-40"}
      />
    </div>
  );
}

function TrackingProgress({
  activeStep,
  estimatedDelivery,
}: {
  activeStep: StepKey;
  estimatedDelivery: string;
}) {
  const percentClass = progressWidthClass(activeStep);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium text-white">Order Progress</div>

        <div className="text-sm text-[#a7aec4]">
          Estimated Delivery: {estimatedDelivery}
        </div>
      </div>

      <div className="mt-5 h-[8px] w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-[8px] rounded-full bg-[#d6c7ff] transition-all duration-500 ${percentClass}`}
        />
      </div>
    </div>
  );
}

function TrackingTimeline({ data }: { data: TrackingData }) {
  return (
    <div className={`${innerPanelClass} p-5 sm:p-6`}>
      <h2 className="text-[20px] font-semibold">Tracking Timeline</h2>

      <div className="mt-8 space-y-0">
        {data.timeline.map((t, idx) => {
          const isLast = idx === data.timeline.length - 1;
          const done = stepIndex(t.key) <= stepIndex(data.activeStep);

          return (
            <div key={t.key} className="relative flex gap-4 pb-7 last:pb-0">
              {!isLast ? (
                <div
                  className={[
                    "absolute left-[21px] top-[46px] h-[calc(100%-14px)] w-px",
                    done ? "bg-white/30" : "bg-white/12",
                  ].join(" ")}
                />
              ) : null}

              <TimelineIcon step={t.key} active={data.activeStep} />

              <div className="min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[17px] font-semibold text-white">
                    {t.title}
                  </div>

                  {t.key === data.activeStep ? (
                    <span className="rounded-full border border-[#d6c7ff]/25 bg-[#d6c7ff]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d6c7ff]">
                      Active
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-sm text-[#a7aec4]">
                  {t.date || "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackingItemsList({ items }: { items: OrderItem[] }) {
  return (
    <div className={`${innerPanelClass} mt-6 p-5 sm:p-6`}>
      <h2 className="text-[20px] font-semibold">Items in this Order</h2>

      {items.length === 0 ? (
        <div className="mt-4 rounded-[16px] border border-white/10 bg-[#0d0f17] p-4 text-sm text-[#a7aec4]">
          No order items found.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((it, idx) => (
            <div
              key={`${it.id}-${it.size || ""}-${it.color || ""}-${idx}`}
              className="flex gap-4 rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4"
            >
              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[14px] border border-[#26293a] bg-black/20">
                <Image
                  src={it.image || "/images/placeholder.png"}
                  alt={it.name || "Product"}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-white">
                      {it.name}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#a7aec4]">
                      <span>Qty: {it.qty}</span>
                      <span>Size: {it.size || "-"}</span>

                      <span className="inline-flex items-center gap-2">
                        Color:
                        <span
                          className={`h-3.5 w-3.5 rounded-full border border-white/15 ${colorDotClass(
                            it.color,
                          )}`}
                        />
                        {it.colorLabel || it.color || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-white">
                    {formatNPR(Number(it.price || 0) * Number(it.qty || 0))}
                  </div>
                </div>

                <div className="mt-2 text-xs text-[#7f879f]">
                  Unit Price: {formatNPR(Number(it.price || 0))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCards({
  data,
  trackingCode,
}: {
  data: TrackingData;
  trackingCode: string;
}) {
  return (
    <div className="space-y-6">
      <div className={`${innerPanelClass} p-5 sm:p-6`}>
        <h2 className="text-[20px] font-semibold">Location Updates</h2>

        <p className="mt-4 text-[15px] leading-7 text-[#a7aec4]">
          {data.locationUpdates}
        </p>
      </div>

      <div className={`${innerPanelClass} p-5 sm:p-6`}>
        <h2 className="text-[20px] font-semibold">Customer Information</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[#7f879f]">Name</span>
            <span className="text-white">{data.customer?.name || "—"}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#7f879f]">Email</span>
            <span className="break-all text-white">
              {data.customer?.email || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#7f879f]">Shipping Address</span>
            <span className="whitespace-pre-line text-white">
              {data.customer?.shippingAddress || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className={`${innerPanelClass} p-5 sm:p-6`}>
        <h2 className="text-[20px] font-semibold">Shipping Information</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[#7f879f]">Method</span>
            <span className="text-white">
              {data.shipping?.method || data.carrierInfo || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#7f879f]">Estimated Delivery</span>
            <span className="text-white">
              {data.shipping?.estimatedDelivery || data.estimatedDelivery || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#7f879f]">Tracking Code</span>
            <span className="text-white">{trackingCode || "—"}</span>
          </div>
        </div>
      </div>

      <div className={`${innerPanelClass} p-5 sm:p-6`}>
        <h2 className="text-[20px] font-semibold">Payment & Summary</h2>

        <div className="mt-4 space-y-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[#7f879f]">Payment Method</span>
            <span className="text-white">{data.payment?.method || "—"}</span>
          </div>

          <div className="h-px bg-[#26293a]" />

          <div className="flex justify-between text-[#a7aec4]">
            <span>Subtotal</span>
            <span className="text-white">{formatNPR(data.summary?.subtotal)}</span>
          </div>

          <div className="flex justify-between text-[#a7aec4]">
            <span>Shipping</span>
            <span className="text-white">{formatNPR(data.summary?.shipping)}</span>
          </div>

          {Number(data.summary?.discount || 0) > 0 ? (
            <div className="flex justify-between text-[#a7aec4]">
              <span>Discount</span>
              <span className="text-emerald-300">
                - {formatNPR(data.summary?.discount)}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between text-[#a7aec4]">
            <span>Taxes</span>
            <span className="text-white">{formatNPR(data.summary?.taxes)}</span>
          </div>

          <div className="h-px bg-[#26293a]" />

          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatNPR(data.summary?.total)}</span>
          </div>
        </div>
      </div>

      <div className={`${innerPanelClass} p-5 sm:p-6`}>
        <h2 className="text-[20px] font-semibold">Need Help?</h2>

        <p className="mt-4 text-[15px] leading-7 text-[#a7aec4]">
          If your delivery is delayed or you have any issue with this order,
          please contact our support team.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/contact" className={secondaryBtnClass}>
            Contact Support
          </Link>

          <Link href="/collection" className={primaryBtnClass}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TrackingDetailsGrid({
  data,
  trackingCode,
}: {
  data: TrackingData;
  trackingCode: string;
}) {
  return (
    <>
      <TrackingProgress
        activeStep={data.activeStep}
        estimatedDelivery={data.estimatedDelivery}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
        <div>
          <TrackingTimeline data={data} />
          <TrackingItemsList items={data.items} />
        </div>

        <InfoCards data={data} trackingCode={trackingCode} />
      </div>
    </>
  );
}