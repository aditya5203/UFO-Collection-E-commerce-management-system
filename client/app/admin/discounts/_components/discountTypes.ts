import { API_BASE_URL } from "@/lib/api";
export type CouponType = "PERCENT" | "FLAT" | "FREESHIP";
export type CouponScope = "ALL" | "CATEGORY" | "PRODUCT";
export type CouponStatus = "ACTIVE" | "PAUSED";
export type CouponDateStatus = "ACTIVE" | "UPCOMING" | "EXPIRED" | "PAUSED";

export type CouponRow = {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  scope: CouponScope;
  value: number;
  minOrder: number | null;
  maxDiscountCap: number | null;
  status: CouponStatus;
  startAt: string | null;
  endAt: string | null;
  usedCount: number;
  globalUsageLimit: number | null;
  maxUsesPerUser: number | null;
  eligibleCategoryIds?: string[];
  eligibleProductIds?: string[];
  createdAt?: string;
};

export type CollectedRow = {
  id: string;
  status: "COLLECTED" | "USED" | "EXPIRED";
  collectedAt: string;
  usedAt: string | null;
  orderId: string | null;
  user: { id: string; name: string; email: string };
  coupon: { id: string; code: string; title: string; type: CouponType };
};

export type FormState = {
  id?: string;
  code: string;
  title: string;
  description: string;
  type: CouponType;
  scope: CouponScope;
  value: number;
  maxDiscountCap: number | null;
  minOrder: number | null;
  startAt: string;
  endAt: string;
  globalUsageLimit: number | null;
  maxUsesPerUser: number | null;
  status: CouponStatus;
  eligibleCategoryIds: string;
  eligibleProductIds: string;
};

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

export type DiscountStats = {
  active: number;
  upcoming: number;
  expired: number;
  paused: number;
  usedTotal: number;
  total: number;
};

const RAW_API_BASE =
  API_BASE_URL;

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const API_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

export const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerBtnClass =
  "rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60";

export const inputClass =
  "h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

export const selectClass =
  "h-[48px] rounded-full border border-white/10 bg-[#141620] px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff]";

export const actionBtnClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const emptyForm: FormState = {
  code: "",
  title: "Discount",
  description: "",
  type: "PERCENT",
  scope: "ALL",
  value: 10,
  maxDiscountCap: 500,
  minOrder: 1000,
  startAt: "",
  endAt: "",
  globalUsageLimit: null,
  maxUsesPerUser: 1,
  status: "ACTIVE",
  eligibleCategoryIds: "",
  eligibleProductIds: "",
};

export function formatDate(d?: string | null) {
  if (!d) return "—";

  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  } catch {
    return "—";
  }
}

export function moneyLabelRs(v?: number | null) {
  if (v == null) return "—";

  const n = Number(v);
  if (Number.isNaN(n)) return "—";

  return `Rs ${n.toLocaleString("en-IN")}`;
}

export function typeLabel(t: CouponType, value: number, cap?: number | null) {
  if (t === "PERCENT") return `${value}%${cap ? ` (cap Rs ${cap})` : ""}`;
  if (t === "FLAT") return `Rs ${value}`;
  return "Free Shipping";
}

export function scopeLabel(s: CouponScope) {
  if (s === "ALL") return "All Products";
  if (s === "CATEGORY") return "Category";
  return "Product";
}

export function idsToText(ids?: string[]) {
  if (!Array.isArray(ids)) return "";
  return ids.filter(Boolean).join(", ");
}

export function textToIds(text: string) {
  return String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function optionClass() {
  return "bg-[#11121a] text-white";
}

export function getCouponDateStatus(row: CouponRow): CouponDateStatus {
  if (row.status === "PAUSED") return "PAUSED";

  const now = new Date();
  const start = row.startAt ? new Date(row.startAt) : null;
  const end = row.endAt ? new Date(row.endAt) : null;

  if (start && !Number.isNaN(start.getTime()) && now < start) {
    return "UPCOMING";
  }

  if (end && !Number.isNaN(end.getTime()) && now > end) {
    return "EXPIRED";
  }

  return "ACTIVE";
}

export async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    cache: "no-store",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error((data as any)?.message || "Request failed");
  }

  return data;
}