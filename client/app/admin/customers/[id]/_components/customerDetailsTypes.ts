import { API_BASE_URL } from "@/lib/api";
import { AdminSettingsResponse } from "../../../_components/adminPermissions";

export type TabKey = "overview" | "orders" | "tickets" | "addresses";

export type CustomerStatus = "active" | "blocked" | "deleted";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  numberOfOrders?: number;
  status?: CustomerStatus;
  isBlocked?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
};

export type PaymentStatus = "Paid" | "Pending" | "Failed";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Shipped"
  | "Transit"
  | "Delivered"
  | "Cancelled";

export type OrderRow = {
  id: string;
  orderCode?: string;
  totalPaisa?: number;
  total?: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
};

export type TicketStatus = "Open" | "Pending" | "In Progress" | "Resolved" | "Closed";

export type TicketRow = {
  id: string;
  ticketId?: string;
  ticketCode?: string;
  customerName?: string;
  customerEmail?: string;
  subject?: string;
  issueType?: string;
  productName?: string;
  orderId?: string | null;
  size?: string | null;
  color?: string | null;
  submittedAt?: string;
  status: TicketStatus;
};

export type AddressType = "Shipping" | "Billing";
export type AddressLabel = "Home" | "Work" | "Other";

export type Address = {
  _id?: string;
  id?: string;
  userId?: string;
  type: AddressType;
  label?: AddressLabel;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  provinceId?: string;
  district?: string;
  cityOrMunicipality?: string;
  addressLine?: string;
  street?: string;
  postalCode?: string;
  phone?: string;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSettingsJson = AdminSettingsResponse;

export const API_BASE = (
  API_BASE_URL
).replace(/\/+$/, "");

export const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const actionBtnClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

export function formatDateShort(iso?: string) {
  if (!iso) return "-";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toISOString().slice(0, 10);
}

export function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;
  return `Rs. ${(safe / 100).toFixed(2)}`;
}

export function nameFromAddress(a: Address) {
  const fn = (a.firstName || "").trim();
  const ln = (a.lastName || "").trim();
  const full = `${fn} ${ln}`.trim();

  return full || a.email || "—";
}

export function addressLinePretty(a: Address) {
  const provinceText = a.provinceId
    ? /^province/i.test(String(a.provinceId))
      ? String(a.provinceId)
      : `Province ${a.provinceId}`
    : "";

  const parts = [
    a.addressLine,
    a.street,
    a.cityOrMunicipality,
    a.district,
    provinceText,
    a.postalCode,
    a.country || "Nepal",
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "—";
}

export function hasLatLng(a: Address) {
  return (
    typeof a.lat === "number" &&
    Number.isFinite(a.lat) &&
    typeof a.lng === "number" &&
    Number.isFinite(a.lng)
  );
}

export function latLngText(a: Address) {
  if (!hasLatLng(a)) return "No map location saved";
  return `${Number(a.lat).toFixed(6)}, ${Number(a.lng).toFixed(6)}`;
}

export function getGoogleMapsUrl(a: Address) {
  if (!hasLatLng(a)) return "";
  return `https://www.google.com/maps?q=${a.lat},${a.lng}`;
}

export function getCustomerStatus(customer: CustomerRow): CustomerStatus {
  if (customer.status === "deleted" || customer.isDeleted) return "deleted";
  if (customer.status === "blocked" || customer.isBlocked) return "blocked";
  return "active";
}

export async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function normalizeTicketStatus(status?: string): TicketStatus {
  if (status === "Pending") return "Pending";
  if (status === "In Progress") return "In Progress";
  if (status === "Resolved") return "Resolved";
  if (status === "Closed") return "Closed";
  return "Open";
}

export function normalizeTicketRow(row: any): TicketRow {
  return {
    id: String(row?.id || row?._id || ""),
    ticketId: row?.ticketId ? String(row.ticketId) : undefined,
    ticketCode: row?.ticketCode ? String(row.ticketCode) : undefined,
    customerName: row?.customerName ? String(row.customerName) : undefined,
    customerEmail: row?.customerEmail ? String(row.customerEmail) : undefined,
    subject: row?.subject ? String(row.subject) : undefined,
    issueType: row?.issueType ? String(row.issueType) : undefined,
    productName: row?.productName ? String(row.productName) : undefined,
    orderId: row?.orderId ? String(row.orderId) : null,
    size: row?.size ? String(row.size) : null,
    color: row?.color ? String(row.color) : null,
    submittedAt: row?.submittedAt
      ? String(row.submittedAt)
      : row?.createdAt
        ? String(row.createdAt)
        : undefined,
    status: normalizeTicketStatus(row?.status),
  };
}