import { API_BASE_URL as PUBLIC_API_BASE_URL } from "@/lib/api";
export type SummaryResponse = {
  success: boolean;
  message?: string;
  data: {
    top: {
      totalOrders: number;
      totalRevenuePaisa: number;
      totalRevenueRs?: number;
      totalCustomers: number;
      totalProductsLive: number;
    };
    ordersByStatus: Record<string, number>;
    salesLast7Days: Array<{
      date: string;
      label?: string;
      totalPaisa: number;
      totalRs?: number;
    }>;
    recentOrders: Array<{
      id: string;
      orderCode: string;
      totalPaisa: number;
      totalRs?: number;
      orderStatus: string;
      paymentStatus?: string;
      createdAt: string;
      customerName: string;
      customerEmail?: string;
    }>;
    lowStock: Array<{ id: string; name: string; stock: number }>;
    newUsers: Array<{ id: string; name: string; createdAt: string }>;
  };
};

export type AdminNotification = {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: string;
};

export type ToastType = "success" | "error" | "info";

export type ToastState = {
  type: ToastType;
  message: string;
} | null;

export type SocketNotificationPayload = {
  notification?: AdminNotification;
};

export type SalesBarItem = {
  label: string;
  heightClass: string;
  totalPaisa: number;
};

export type StatusBarItem = {
  label: string;
  value: number;
  heightClass: string;
  tone: string;
};

export const API_BASE_URL = PUBLIC_API_BASE_URL;

export const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

export const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const chartHeightClasses = [
  "h-[48px]",
  "h-[64px]",
  "h-[80px]",
  "h-[96px]",
  "h-[112px]",
  "h-[128px]",
  "h-[144px]",
];

export const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getHeightClass(value: number, max: number) {
  const safeMax = Math.max(1, max);
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const index = Math.round(ratio * (chartHeightClasses.length - 1));

  return chartHeightClasses[index] || "h-[48px]";
}

export const formatMoneyNPR = (paisa: number) => {
  const rs = Math.round(Number(paisa || 0) / 100);
  return `Rs. ${rs.toLocaleString("en-US")}`;
};

export const formatDate = (iso?: string) => {
  if (!iso) return "";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
};

export function timeAgo(iso?: string) {
  if (!iso) return "";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diff = Date.now() - d.getTime();
  const s = Math.max(0, Math.floor(diff / 1000));

  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(iso);
}

export function pickId(n: AdminNotification) {
  return String(n._id || n.id || "");
}

export async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function normalizeStatus(status?: string) {
  return String(status || "").trim().toLowerCase();
}

export function getStatusValue(
  ordersByStatus: Record<string, number> | undefined,
  target: string
) {
  if (!ordersByStatus) return 0;

  const wanted = normalizeStatus(target);

  return Object.entries(ordersByStatus).reduce((sum, [key, value]) => {
    return normalizeStatus(key) === wanted ? sum + Number(value || 0) : sum;
  }, 0);
}
