import { API_BASE_URL as PUBLIC_API_BASE_URL } from "@/lib/api";
import type { AdminPermissions } from "../../_components/adminPermissions";

export const API_BASE_URL = PUBLIC_API_BASE_URL;

export type AdminRow = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  status?: "active" | "inactive" | "invited";
  mustChangePassword?: boolean;
  permissions?: Partial<AdminPermissions>;
};

export type AdminStats = {
  total: number;
  active: number;
  invited: number;
  inactive: number;
};

export const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

export const shellCard =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const softCard =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

export const inputClass =
  "h-12 w-full rounded-2xl border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] font-medium text-white placeholder:text-[#7f879f] outline-none transition focus:border-[#8b5cf6]/60 focus:ring-4 focus:ring-[#8b5cf6]/10";

export const buttonBase =
  "inline-flex h-11 items-center justify-center rounded-full px-5 text-[12px] font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-60";

export async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}
