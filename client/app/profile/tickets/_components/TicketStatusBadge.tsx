"use client";

export type TicketStatus =
  | "Open"
  | "Pending"
  | "Closed"
  | "Resolved"
  | "In Progress";

export function displayStatus(s: TicketStatus) {
  if (s === "Pending") return "In Progress";
  return s;
}

export function pillClass(s: TicketStatus) {
  const ds = displayStatus(s);

  if (ds === "Open") return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  if (ds === "In Progress")
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (ds === "Resolved")
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (ds === "Closed")
    return "border-slate-500/30 bg-slate-500/10 text-slate-200";

  return "border-[#d6c7ff]/30 bg-[#d6c7ff]/10 text-[#d6c7ff]";
}

export default function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${pillClass(
        status
      )}`}
    >
      {displayStatus(status)}
    </span>
  );
}