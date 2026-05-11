export type ToastType = "success" | "error" | "info";

export type SidebarItem = {
  label: string;
  href: string;
  icon: string;
};

export type ProfileFormState = {
  name: string;
  email: string;
  phone: string;
  height: string;
  weight: string;
  menSize: string;
  womenSize: string;
};

export const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

export const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "U";

  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last =
    parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";

  return (first + last).toUpperCase();
}

export function toOptionalNumber(value: string) {
  const clean = value.trim();
  if (!clean) return undefined;

  const num = Number(clean);
  return Number.isFinite(num) ? num : undefined;
}