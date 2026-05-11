export type ToastType = "success" | "error" | "info";

export type Msg = {
  _id: string;
  senderRole: "user" | "admin" | "bot" | "system";
  text: string;
  createdAt: string;
};

export type Conversation = {
  _id: string;
  status: "OPEN" | "ENDED";
  adminId?: string | null;
  orderId?: string | null;
};

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export function fmtTime(s?: string) {
  if (!s) return "";

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";

  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  return d.toLocaleString([], {
    month: isToday ? undefined : "short",
    day: isToday ? undefined : "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}