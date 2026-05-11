"use client";

import * as React from "react";
import Link from "next/link";
import { DeliveryStatusBadge } from "./OrderHero";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-[#26293a] py-5 last:border-0 md:grid-cols-[220px_1fr]">
      <div className="text-[14px] text-[#a7aec4]">{label}</div>
      <div className="break-words text-[14px] font-medium text-white">
        {value}
      </div>
    </div>
  );
}

export default function OrderPaymentShippingInfo({
  order,
  trackingNumber,
}: {
  order: any;
  trackingNumber: string;
}) {
  return (
    <>
      <section className={`${panelClass} p-5 sm:p-7`}>
        <SectionTitle eyebrow="Payment" title="Payment Information" />

        <div className="mt-5">
          <InfoRow label="Method" value={order.payment.method} />
        </div>
      </section>

      <section className={`${panelClass} p-5 sm:p-7`}>
        <SectionTitle eyebrow="Shipping" title="Shipping Information" />

        <div className="mt-5">
          <InfoRow label="Method" value={order.shipping.method} />
          <InfoRow
            label="Estimated Delivery"
            value={order.shipping.estimatedDelivery || "—"}
          />

          {order.deliveryAssignment?.status ? (
            <InfoRow
              label="Delivery Status"
              value={<DeliveryStatusBadge status={order.deliveryAssignment.status} />}
            />
          ) : null}

          {order.deliveryAssignment?.name ? (
            <InfoRow
              label="Delivery Rider"
              value={`${order.deliveryAssignment.name}${
                order.deliveryAssignment.phone
                  ? ` • ${order.deliveryAssignment.phone}`
                  : ""
              }`}
            />
          ) : null}

          {order.deliveryAssignment?.assignedAt ? (
            <InfoRow
              label="Assigned At"
              value={formatDateTime(order.deliveryAssignment.assignedAt)}
            />
          ) : null}

          {order.deliveryAssignment?.pickedUpAt ? (
            <InfoRow
              label="Picked Up At"
              value={formatDateTime(order.deliveryAssignment.pickedUpAt)}
            />
          ) : null}

          {order.deliveryAssignment?.outForDeliveryAt ? (
            <InfoRow
              label="Out for Delivery At"
              value={formatDateTime(order.deliveryAssignment.outForDeliveryAt)}
            />
          ) : null}

          {order.deliveryAssignment?.deliveredAt ? (
            <InfoRow
              label="Delivered At"
              value={formatDateTime(order.deliveryAssignment.deliveredAt)}
            />
          ) : null}

          <InfoRow
            label="Track Order"
            value={
              <Link
                href={`/order-tracking?code=${encodeURIComponent(trackingNumber)}&from=details`}
                className="text-white underline underline-offset-4 hover:text-[#d6c7ff]"
              >
                Click here to track
              </Link>
            }
          />
        </div>
      </section>
    </>
  );
}