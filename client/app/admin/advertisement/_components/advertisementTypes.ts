export type AdType = "Banner" | "Carousel" | "Pop-up" | "Video";

export type AdStatus = "Active" | "Inactive" | "Scheduled" | "Expired";

export type Audience = "All Customers" | "New Customers" | "Returning Customers";

export type AdPosition =
  | "Home Top"
  | "Home Mid"
  | "Home Bottom"
  | "Category Top"
  | "Product Page";

export type AdRow = {
  id: string;
  title: string;
  type: AdType;
  status: AdStatus;
  startDate: string;
  endDate: string;
  audience: Audience;
  mediaKind: "image" | "video";
  mediaUrl: string;
  mediaUrls?: string[];
  clickUrl?: string;
  position?: AdPosition;
  priority?: number;
};

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

export const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerBtnClass =
  "rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60";

export const totalIcon = "/images/admin/advertisement.png";
export const activeIcon = "/images/admin/active.png";
export const scheduledIcon = "/images/admin/clock.png";
export const expiredIcon = "/images/admin/pending.png";

export function statusTone(s: AdStatus) {
  if (s === "Active") {
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  }

  if (s === "Inactive") {
    return "border-slate-400/20 bg-white/5 text-slate-300";
  }

  if (s === "Scheduled") {
    return "border-amber-400/20 bg-amber-500/15 text-amber-300";
  }

  return "border-red-400/20 bg-red-500/15 text-red-300";
}

export function optionClass() {
  return "bg-[#11121a] text-white";
}

export function fmtDate(s?: string | null) {
  if (!s) return "-";

  const d = new Date(s);

  if (Number.isNaN(d.getTime())) return String(s || "-");

  return d.toISOString().slice(0, 10);
}

export function isRemote(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function toISODateInput(v: any) {
  const d = new Date(v);

  if (Number.isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
}

export function firstMedia(ad: AdRow) {
  const arr = Array.isArray(ad.mediaUrls) ? ad.mediaUrls.filter(Boolean) : [];

  if (arr.length) return arr[0];

  return ad.mediaUrl || "/images/products/placeholder.png";
}

export function isValidClickUrl(value: string) {
  const v = value.trim();

  if (!v) return true;

  if (v.startsWith("/")) return true;

  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

export async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function inputClassName() {
  return "h-[44px] w-full rounded-full border border-white/10 bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]";
}