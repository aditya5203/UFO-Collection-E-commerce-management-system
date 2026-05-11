"use client";

import * as React from "react";
import {
  Conversation,
  fmtTime,
  Msg,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./chatTypes";

type Props = {
  conv: Conversation | null;
  messages: Msg[];
  opening: boolean;
  loading: boolean;
  typing: boolean;
  text: string;
  sending: boolean;
  ending: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
  onTextChange: (value: string) => void;
  onSend: () => void;
  onEndChat: () => void;
  onClear: () => void;
};

function Bubble({ m }: { m: Msg }) {
  const isUser = m.senderRole === "user";
  const isSystem = m.senderRole === "system";
  const isBot = m.senderRole === "bot";

  if (isSystem) {
    return (
      <div className="rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3 text-[13px] text-[#a7aec4]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <span className="min-w-0 whitespace-pre-wrap break-words">
            {m.text}
          </span>

          <span className="shrink-0 text-[11px] text-[#7f879f] sm:ml-4">
            {fmtTime(m.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "min-w-0 max-w-[88%] rounded-[20px] border px-4 py-3 sm:max-w-[78%]",
          isUser
            ? "border-[#d6c7ff]/25 bg-[#d6c7ff]/10 text-white"
            : "border-[#26293a] bg-[#161824] text-white",
        ].join(" ")}
      >
        <div className="text-[12px] font-semibold text-[#a7aec4]">
          {isUser ? "You" : isBot ? "UFO Bot" : "Agent"}
        </div>

        <div className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-6 text-[#f5f7fb]">
          {m.text}
        </div>

        <div className="mt-2 text-[11px] text-[#7f879f]">
          {fmtTime(m.createdAt)}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[20px] border border-[#26293a] bg-[#161824] px-4 py-3">
        <div className="text-[12px] font-semibold text-[#a7aec4]">Agent</div>

        <div className="mt-2 flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6c7ff]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6c7ff] [animation-delay:120ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#d6c7ff] [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({
  conv,
  messages,
  opening,
  loading,
  typing,
  text,
  sending,
  ending,
  listRef,
  onTextChange,
  onSend,
  onEndChat,
  onClear,
}: Props) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#26293a] px-5 py-4 sm:px-6">
        <div>
          <div className="text-[20px] font-semibold text-white">
            Conversation
          </div>

          <div className="mt-1 text-[13px] text-[#a7aec4]">
            Enter to send • Shift+Enter for new line
          </div>
        </div>

        {conv?.status === "ENDED" ? (
          <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
            Ended
          </span>
        ) : null}
      </div>

      <div
        ref={listRef}
        className="h-[520px] overflow-y-auto px-4 py-5 [overflow-wrap:anywhere] sm:px-6"
      >
        {opening || loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`flex ${n % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div className="w-[72%] rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/5 text-2xl">
                💬
              </div>

              <h2 className="mt-5 text-[22px] font-semibold text-white">
                No messages yet
              </h2>

              <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-7 text-[#a7aec4]">
                Start the conversation by sending your first message.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <Bubble key={m._id} m={m} />
            ))}

            {typing ? <TypingIndicator /> : null}
          </div>
        )}
      </div>

      <div className="border-t border-[#26293a] px-4 py-5 sm:px-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
          Your Message
        </div>

        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={
            conv?.status === "ENDED" ? "Chat ended." : "Type your message..."
          }
          disabled={sending || conv?.status === "ENDED"}
          className="mt-3 min-h-[120px] w-full resize-none rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-[14px] leading-7 text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onSend}
            disabled={sending || conv?.status === "ENDED" || !text.trim()}
            className={primaryBtnClass}
          >
            {sending ? "Sending..." : "Send Message"}
          </button>

          <button
            type="button"
            onClick={onEndChat}
            disabled={ending || conv?.status === "ENDED" || !conv?._id}
            className={secondaryBtnClass}
          >
            {conv?.status === "ENDED"
              ? "Ended"
              : ending
                ? "Ending..."
                : "End Chat"}
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!text.trim()}
            className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}