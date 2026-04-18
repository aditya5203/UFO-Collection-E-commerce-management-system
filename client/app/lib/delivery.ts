"use client";

export const DELIVERY_API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(
    /\/+$/,
    ""
  ) + "/api";

export const DELIVERY_ENDPOINTS = {
  me: `${DELIVERY_API_BASE}/auth/delivery/me`,
  login: `${DELIVERY_API_BASE}/auth/delivery/login`,
  logout: `${DELIVERY_API_BASE}/auth/delivery/logout`,
  changePassword: `${DELIVERY_API_BASE}/auth/delivery/change-password`,
  profile: `${DELIVERY_API_BASE}/auth/delivery/me`,

  dashboard: `${DELIVERY_API_BASE}/admin/delivery-staff/me/dashboard`,
  orders: `${DELIVERY_API_BASE}/admin/delivery-staff/me/orders`,
};

export async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function safeStr(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export function formatDateShort(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

export function formatDateLong(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

export function formatDateTime(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function formatNPR(paisa?: number, total?: number) {
  const finalPaisa = Number.isFinite(paisa as number)
    ? Number(paisa)
    : Math.round(Number(total || 0) * 100);

  return `Rs. ${(finalPaisa / 100).toFixed(2)}`;
}

export type DeliveryStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned";

export function getDeliveryStatusTone(status?: string) {
  const s = safeStr(status).toLowerCase();

  if (s === "assigned" || s === "picked up") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  if (s === "out for delivery") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  }

  if (s === "delivered") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (s === "failed delivery" || s === "returned") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-slate-700/60 bg-slate-900/35 text-slate-300";
}

export type DeliveryOrder = {
  id: string;
  _id?: string;
  orderCode?: string;
  createdAt?: string;
  totalPaisa?: number;
  total?: number;
  paymentMethod?: string;
  paymentRef?: string;
  shippingPaisa?: number;
  discountPaisa?: number;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  address?: {
    label?: string;
    fullName?: string;
    phone?: string;
    city?: string;
    cityOrMunicipality?: string;
    district?: string;
    addressLine?: string;
    area?: string;
    street?: string;
    provinceId?: string;
    lat?: number;
    lng?: number;
  };
  items?: Array<{
    productId?: string;
    name?: string;
    size?: string;
    color?: string;
    colorLabel?: string;
    qty?: number;
    pricePaisa?: number;
  }>;
  deliveryAssignment?: {
    deliveryManId?: string;
    name?: string;
    phone?: string;
    assignedAt?: string;
    pickedUpAt?: string;
    outForDeliveryAt?: string;
    deliveredAt?: string;
    failedAt?: string;
    returnedAt?: string;
    status?: DeliveryStatus | string;
    note?: string;
  };
};

export type DeliveryProfile = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  deliveryArea?: string;
  mustChangePassword?: boolean;
  status?: string;
  createdAt?: string;
};

export function pickId(item: any) {
  return safeStr(item?.id || item?._id);
}

export function getCustomerName(order: DeliveryOrder) {
  return safeStr(order.customer?.name) || safeStr(order.address?.fullName) || "-";
}

export function getCustomerContact(order: DeliveryOrder) {
  return (
    safeStr(order.customer?.phone) ||
    safeStr(order.address?.phone) ||
    safeStr(order.customer?.email) ||
    "-"
  );
}

export function getArea(order: DeliveryOrder) {
  return (
    safeStr(order.address?.addressLine) ||
    safeStr(order.address?.area) ||
    safeStr(order.address?.district) ||
    "-"
  );
}

export function getCity(order: DeliveryOrder) {
  return (
    safeStr(order.address?.cityOrMunicipality) ||
    safeStr(order.address?.city) ||
    safeStr(order.address?.provinceId) ||
    "-"
  );
}

export function hasLatLng(addr: any) {
  return (
    typeof addr?.lat === "number" &&
    Number.isFinite(addr?.lat) &&
    typeof addr?.lng === "number" &&
    Number.isFinite(addr?.lng)
  );
}

export function getGoogleMapsUrl(addr: any) {
  if (!hasLatLng(addr)) return "";
  return `https://www.google.com/maps?q=${addr.lat},${addr.lng}`;
}