"use client";

import * as React from "react";
import { panelClass, primaryBtnClass, secondaryBtnClass } from "./chatTypes";

type Props = {
  orderUrl: string;
  disabled?: boolean;
  onSetQuickText: (value: string) => void;
  onOrderTracking: () => void;
  onSupportTickets: () => void;
  onViewOrder: () => void;
};

const quickHelpItems = [
  "Track my order / मेरो order कहाँ छ?",
  "Delivery time / Delivery कति दिन?",
  "Return policy / Return कसरी?",
  "eSewa payment failed / eSewa चलेन",
  "Size guide / कुन size?",
];

export default function ChatHelpSidebar({
  orderUrl,
  disabled = false,
  onSetQuickText,
  onOrderTracking,
  onSupportTickets,
  onViewOrder,
}: Props) {
  return (
    <aside className="space-y-6">
      <section className={`${panelClass} p-5 sm:p-6`}>
        <div className="text-[20px] font-semibold text-white">Quick Help</div>

        <p className="mt-2 text-[14px] leading-7 text-[#a7aec4]">
          Try these common support questions while waiting for an agent.
        </p>

        <div className="mt-5 space-y-3 text-[14px] text-[#d6dbeb]">
          {quickHelpItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSetQuickText(item)}
              disabled={disabled}
              className="block w-full rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3 text-left transition hover:border-[#4a506b] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className={`${panelClass} p-5 sm:p-6`}>
        <div className="text-[20px] font-semibold text-white">
          Need faster help?
        </div>

        <p className="mt-2 text-[14px] leading-7 text-[#a7aec4]">
          You can also track your order directly from the order tracking page.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={onOrderTracking}
            className={primaryBtnClass}
          >
            Order Tracking
          </button>

          <button
            type="button"
            onClick={onSupportTickets}
            className={secondaryBtnClass}
          >
            Support Tickets
          </button>

          {orderUrl ? (
            <button
              type="button"
              onClick={onViewOrder}
              className={secondaryBtnClass}
            >
              View Order
            </button>
          ) : null}
        </div>
      </section>
    </aside>
  );
}