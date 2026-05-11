"use client";

import * as React from "react";

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

export default function OrderCustomerInfo({ order }: { order: any }) {
  return (
    <section className={`${panelClass} p-5 sm:p-7`}>
      <SectionTitle eyebrow="Customer" title="Customer Information" />

      <div className="mt-5">
        <InfoRow label="Name" value={order.customer.name} />
        <InfoRow label="Email" value={order.customer.email} />
        <InfoRow
          label="Shipping Address"
          value={
            <span className="whitespace-pre-line">
              {order.customer.shippingAddress}
            </span>
          }
        />
      </div>
    </section>
  );
}