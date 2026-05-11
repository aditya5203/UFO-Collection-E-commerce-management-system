"use client";

import * as React from "react";
import Link from "next/link";
import {
  Conversation,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./chatTypes";

type Props = {
  conv: Conversation | null;
  orderId?: string;
  orderUrl: string;
  opening: boolean;
  socketConnected: boolean;
  onRefresh: () => void;
  onCopyConversationId: () => void;
  onStartNewChat: () => void;
  onViewOrder: () => void;
};

export default function ChatHero({
  conv,
  orderId,
  orderUrl,
  opening,
  socketConnected,
  onRefresh,
  onCopyConversationId,
  onStartNewChat,
  onViewOrder,
}: Props) {
  const agentStatus =
    conv?.status === "ENDED"
      ? "Ended"
      : conv?.adminId
        ? "Agent Connected"
        : "Agent Offline";

  const statusTone =
    conv?.status === "ENDED"
      ? "border-slate-500/30 bg-slate-500/10 text-slate-200"
      : conv?.adminId
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
        : "border-amber-500/30 bg-amber-500/10 text-amber-200";

  return (
    <>
      <div className="mb-6 text-[13px] text-[#a7aec4]">
        <Link href="/profile" className="transition hover:text-white">
          Profile
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Live Chat</span>
      </div>

      <section className={`${panelClass} overflow-hidden p-6 sm:p-8`}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Customer Support
            </div>

            <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
              Live Agent Chat
            </h1>

            <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-[#a7aec4] sm:text-[15px]">
              Chat with the UFO Collection support team. Leave a message even
              when agents are offline and get replies in real time.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {conv?._id ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className={secondaryBtnClass}
                >
                  Refresh Chat
                </button>
              ) : null}

              {conv?._id ? (
                <button
                  type="button"
                  onClick={onCopyConversationId}
                  className={secondaryBtnClass}
                >
                  Copy Chat ID
                </button>
              ) : null}

              {conv?.status === "ENDED" ? (
                <button
                  type="button"
                  onClick={onStartNewChat}
                  disabled={opening}
                  className={primaryBtnClass}
                >
                  Start New Chat
                </button>
              ) : null}

              {orderUrl ? (
                <button
                  type="button"
                  onClick={onViewOrder}
                  className={primaryBtnClass}
                >
                  View Order
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                Status
              </div>

              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] ${statusTone}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {opening ? "Opening..." : agentStatus}
              </div>
            </div>

            <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                Socket
              </div>

              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] ${
                  socketConnected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-500/30 bg-slate-500/10 text-slate-200"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {socketConnected ? "Live Connected" : "Offline"}
              </div>
            </div>

            <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                Linked Order
              </div>

              <div className="mt-2 truncate text-[16px] font-semibold text-white">
                {orderId || "No order linked"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}