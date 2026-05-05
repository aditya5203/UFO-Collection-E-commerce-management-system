// client/app/admin/customers/[id]/page.tsx
"use client";

import Link from "next/link";
import React from "react";
import Image from "next/image";
import {
  usePathname,
  useRouter,
  useSearchParams,
  useParams,
} from "next/navigation";
import AdminPageGuard from "../../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../../_components/adminPermissions";

type TabKey = "overview" | "orders" | "tickets" | "addresses";

type CustomerStatus = "active" | "blocked" | "deleted";

type CustomerRow = {
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

type PaymentStatus = "Paid" | "Pending" | "Failed";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Shipped"
  | "Transit"
  | "Delivered"
  | "Cancelled";

type OrderRow = {
  id: string;
  orderCode?: string;
  totalPaisa?: number;
  total?: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
};

type AddressType = "Shipping" | "Billing";
type AddressLabel = "Home" | "Work" | "Other";

type Address = {
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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

function formatDateShort(iso?: string) {
  if (!iso) return "-";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toISOString().slice(0, 10);
}

function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;
  return `Rs. ${(safe / 100).toFixed(2)}`;
}

function nameFromAddress(a: Address) {
  const fn = (a.firstName || "").trim();
  const ln = (a.lastName || "").trim();
  const full = `${fn} ${ln}`.trim();

  return full || a.email || "—";
}

function addressLinePretty(a: Address) {
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

function hasLatLng(a: Address) {
  return (
    typeof a.lat === "number" &&
    Number.isFinite(a.lat) &&
    typeof a.lng === "number" &&
    Number.isFinite(a.lng)
  );
}

function latLngText(a: Address) {
  if (!hasLatLng(a)) return "No map location saved";
  return `${Number(a.lat).toFixed(6)}, ${Number(a.lng).toFixed(6)}`;
}

function getGoogleMapsUrl(a: Address) {
  if (!hasLatLng(a)) return "";
  return `https://www.google.com/maps?q=${a.lat},${a.lng}`;
}

function getCustomerStatus(customer: CustomerRow): CustomerStatus {
  if (customer.status === "deleted" || customer.isDeleted) return "deleted";
  if (customer.status === "blocked" || customer.isBlocked) return "blocked";
  return "active";
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id;

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const tab = ((sp.get("tab") as TabKey) || "overview") as TabKey;

  const setTab = (t: TabKey) => {
    const next = new URLSearchParams(sp.toString());
    next.set("tab", t);
    router.replace(`${pathname}?${next.toString()}`);
  };

  const [customer, setCustomer] = React.useState<CustomerRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");

  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState("");

  const [addrLoading, setAddrLoading] = React.useState(false);
  const [addrError, setAddrError] = React.useState("");
  const [shipping, setShipping] = React.useState<Address[]>([]);
  const [billing, setBilling] = React.useState<Address[]>([]);

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const body = (await safeJson(res)) as AdminSettingsResponse;
        const nextRole = (body?.profile?.role || "admin") as
          | "admin"
          | "superadmin";

        const nextPermissions = normalizeAdminPermissions(
          nextRole,
          body?.profile?.permissions
        );

        if (!mounted) return;

        setRole(nextRole);
        setPermissions(nextPermissions);
      } catch {}
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const canViewOrders = hasPermission(role, permissions, "orderView");
  const canViewTickets = hasPermission(role, permissions, "ticketView");

  const loadCustomer = React.useCallback(async (id: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/customers/${id}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setCustomer(null);
        setError(json?.message || "Customer not found");
        return;
      }

      setCustomer(json?.data || null);
    } catch {
      setCustomer(null);
      setError("Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = React.useCallback(async (id: string) => {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/orders?customerId=${encodeURIComponent(id)}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        setOrders([]);
        setOrdersError(json?.message || "Failed to load orders");
        return;
      }

      setOrders(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setOrders([]);
      setOrdersError("Network error while loading orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadAddresses = React.useCallback(async (id: string) => {
    setAddrLoading(true);
    setAddrError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/customers/${encodeURIComponent(id)}/addresses`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await safeJson(res);

      if (!res.ok) {
        setShipping([]);
        setBilling([]);
        setAddrError(json?.message || "Failed to load addresses");
        return;
      }

      const s: Address[] = Array.isArray(json?.shipping) ? json.shipping : [];
      const b: Address[] = Array.isArray(json?.billing) ? json.billing : [];

      setShipping(s);
      setBilling(b);
    } catch {
      setShipping([]);
      setBilling([]);
      setAddrError("Network error while loading addresses");
    } finally {
      setAddrLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!customerId) return;
    loadCustomer(customerId);
  }, [customerId, loadCustomer]);

  React.useEffect(() => {
    if (!customerId) return;
    if (tab !== "orders") return;
    if (!canViewOrders) return;

    if (orders.length === 0 && !ordersLoading && !ordersError) {
      loadOrders(customerId);
    }
  }, [
    tab,
    customerId,
    canViewOrders,
    loadOrders,
    orders.length,
    ordersLoading,
    ordersError,
  ]);

  React.useEffect(() => {
    if (!customerId) return;
    if (tab !== "addresses") return;

    const total = shipping.length + billing.length;

    if (total === 0 && !addrLoading && !addrError) {
      loadAddresses(customerId);
    }
  }, [
    tab,
    customerId,
    loadAddresses,
    shipping.length,
    billing.length,
    addrLoading,
    addrError,
  ]);

  const customerStatus = customer ? getCustomerStatus(customer) : "active";
  const ordersCount = customer?.numberOfOrders ?? 0;
  const ticketsCount = 0;
  const addressesCount = shipping.length + billing.length;

  if (loading) {
    return (
      <AdminPageGuard permission="customerView">
        <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
          <CustomerSkeleton />
        </div>
      </AdminPageGuard>
    );
  }

  if (!customer) {
    return (
      <AdminPageGuard permission="customerView">
        <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
          <div className="space-y-4">
            <div className={`${panelClass} p-6 text-[13px] text-red-200`}>
              {error || "Customer not found."}
            </div>

            <Link href="/admin/customers" className={secondaryBtnClass}>
              Back
            </Link>
          </div>
        </div>
      </AdminPageGuard>
    );
  }

  return (
    <AdminPageGuard permission="customerView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Admin / Customers / Details
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                    {customer.name || "-"}
                  </h1>

                  <Badge text={customer.role || "customer"} />
                  <CustomerStatusPill status={customerStatus} />
                </div>

                <p className="mt-2 max-w-[680px] text-[13px] leading-7 text-[#a7aec4]">
                  {customer.email || "-"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => customerId && loadCustomer(customerId)}
                  className={primaryBtnClass}
                >
                  Refresh
                </button>

                <Link href="/admin/customers" className={secondaryBtnClass}>
                  Back
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Created At"
              value={formatDateShort(customer.createdAt)}
              hint="Account creation date"
              iconSrc="/images/admin/calendar.png"
            />

            <StatCard
              label="Last Login"
              value={formatDateShort(customer.lastLogin)}
              hint="Last time user logged in"
              iconSrc="/images/admin/clock.png"
            />

            <StatCard
              label="Total Orders"
              value={String(ordersCount)}
              hint="Lifetime orders"
              iconSrc="/images/admin/orders.png"
            />
          </section>

          <section className={`${panelClass} p-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <TabButton
                active={tab === "overview"}
                onClick={() => setTab("overview")}
              >
                Overview
              </TabButton>

              {canViewOrders ? (
                <TabButton
                  active={tab === "orders"}
                  onClick={() => setTab("orders")}
                >
                  Orders <span className="ml-2 opacity-70">({ordersCount})</span>
                </TabButton>
              ) : null}

              {canViewTickets ? (
                <TabButton
                  active={tab === "tickets"}
                  onClick={() => setTab("tickets")}
                >
                  Tickets <span className="ml-2 opacity-70">({ticketsCount})</span>
                </TabButton>
              ) : null}

              <TabButton
                active={tab === "addresses"}
                onClick={() => setTab("addresses")}
              >
                Addresses{" "}
                <span className="ml-2 opacity-70">
                  ({tab === "addresses" ? addressesCount : "—"})
                </span>
              </TabButton>
            </div>
          </section>

          {tab === "overview" ? (
            <section className={`${panelClass} p-5 sm:p-6`}>
              <div className="mb-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Overview
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Customer Profile
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBlock label="Full Name" value={customer.name} />
                <InfoBlock label="Email" value={customer.email} />
                <InfoBlock label="Role" value={customer.role || "customer"} />
                <InfoBlock
                  label="Status"
                  value={
                    <CustomerStatusPill status={customerStatus} />
                  }
                />
                <InfoBlock
                  label="Created At"
                  value={formatDateShort(customer.createdAt)}
                />
                <InfoBlock
                  label="Last Login"
                  value={formatDateShort(customer.lastLogin)}
                />

                {customerStatus === "deleted" ? (
                  <InfoBlock
                    label="Deleted At"
                    value={formatDateShort(customer.deletedAt)}
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {tab === "orders" && canViewOrders ? (
            <TableShell
              title="Orders"
              right={
                <button
                  type="button"
                  onClick={() => customerId && loadOrders(customerId)}
                  className={secondaryBtnClass}
                  disabled={ordersLoading}
                >
                  {ordersLoading ? "Refreshing..." : "Refresh"}
                </button>
              }
            >
              {ordersError ? (
                <div className="px-5 py-4">
                  <div className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
                    {ordersError}
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Order</th>
                      <th className="px-5 py-4 font-medium">Total</th>
                      <th className="px-5 py-4 font-medium">Payment</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Created</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ordersLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-[#a7aec4]"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : orders.length ? (
                      orders.map((o) => {
                        const code = o.orderCode || o.id;
                        const paisa = Number.isFinite(o.totalPaisa as number)
                          ? (o.totalPaisa as number)
                          : Math.round(Number(o.total || 0) * 100);

                        return (
                          <tr
                            key={o.id}
                            className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                          >
                            <td className="px-5 py-4 font-semibold text-white">
                              {code}
                            </td>

                            <td className="px-5 py-4 font-semibold text-[#d6c7ff]">
                              {formatNPR(paisa)}
                            </td>

                            <td className="px-5 py-4">
                              <PaymentPill status={o.paymentStatus}>
                                {o.paymentStatus}
                              </PaymentPill>
                            </td>

                            <td className="px-5 py-4">
                              <OrderStatusPill status={o.orderStatus}>
                                {o.orderStatus}
                              </OrderStatusPill>
                            </td>

                            <td className="px-5 py-4 text-[#a7aec4]">
                              {formatDateShort(o.createdAt)}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className={actionBtnClass}
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-[#a7aec4]"
                        >
                          No orders for this customer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TableShell>
          ) : null}

          {tab === "tickets" && canViewTickets ? (
            <TableShell title="Customer Tickets" right={<span>0 total</span>}>
              <div className="px-5 py-10 text-[13px] text-[#a7aec4]">
                Tickets module not connected yet.
              </div>
            </TableShell>
          ) : null}

          {tab === "addresses" ? (
            <TableShell
              title="Addresses"
              right={
                <button
                  type="button"
                  onClick={() => customerId && loadAddresses(customerId)}
                  className={secondaryBtnClass}
                  disabled={addrLoading}
                >
                  {addrLoading ? "Refreshing..." : "Refresh"}
                </button>
              }
            >
              {addrError ? (
                <div className="px-5 py-4">
                  <div className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
                    {addrError}
                  </div>
                </div>
              ) : null}

              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                {addrLoading ? (
                  <div className="py-8 text-[13px] text-[#a7aec4]">
                    Loading addresses...
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <AddressColumn title="Shipping" addresses={shipping} />
                    <AddressColumn title="Billing" addresses={billing} />
                  </div>
                )}
              </div>
            </TableShell>
          ) : null}
        </div>
      </div>
    </AdminPageGuard>
  );
}

const actionBtnClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {text}
    </span>
  );
}

function PaymentPill({
  status,
  children,
}: {
  status: PaymentStatus;
  children: React.ReactNode;
}) {
  const tone =
    status === "Paid"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "Failed"
      ? "border-red-400/20 bg-red-500/15 text-red-300"
      : "border-amber-400/20 bg-amber-500/15 text-amber-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function OrderStatusPill({
  status,
  children,
}: {
  status: OrderStatus;
  children: React.ReactNode;
}) {
  const tone =
    status === "Delivered"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
      : status === "Transit"
      ? "border-violet-400/20 bg-violet-500/15 text-violet-300"
      : status === "Shipped"
      ? "border-blue-400/20 bg-blue-500/15 text-blue-300"
      : status === "Confirmed"
      ? "border-cyan-400/20 bg-cyan-500/15 text-cyan-300"
      : status === "Cancelled"
      ? "border-red-400/20 bg-red-500/15 text-red-300"
      : "border-amber-400/20 bg-amber-500/15 text-amber-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
      {children}
    </span>
  );
}

function CustomerStatusPill({ status }: { status: CustomerStatus }) {
  const styles =
    status === "blocked"
      ? "border-amber-400/20 bg-amber-500/15 text-amber-300"
      : status === "deleted"
      ? "border-red-400/20 bg-red-500/15 text-red-300"
      : "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        styles,
      ].join(" ")}
    >
      {status === "blocked"
        ? "Blocked"
        : status === "deleted"
        ? "Deleted"
        : "Active"}
    </span>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition",
        active
          ? "bg-white text-[#090a12]"
          : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function TableShell({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Customer Data
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">{title}</h2>
        </div>

        {right ? <div>{right}</div> : null}
      </div>

      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[20px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>

          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
        {label}
      </div>

      <div className="mt-2 break-words text-[13px] font-medium text-white">
        {value || "-"}
      </div>
    </div>
  );
}

function AddressColumn({
  title,
  addresses,
}: {
  title: string;
  addresses: Address[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">{title}</h3>

        <span className="text-[12px] text-[#a7aec4]">
          {addresses.length} saved
        </span>
      </div>

      {addresses.length ? (
        <div className="space-y-4">
          {addresses.map((a, index) => (
            <AddressCard key={a._id || a.id || `${title}-${index}`} a={a} />
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5 text-[13px] text-[#a7aec4]">
          No {title.toLowerCase()} addresses found.
        </div>
      )}
    </div>
  );
}

function AddressCard({ a }: { a: Address }) {
  const id = a._id || a.id || "";

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[14px] font-semibold text-white">
              {a.label || "Home"}
            </div>

            <Pill>{a.type}</Pill>

            {a.isDefault ? (
              <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                Default
              </span>
            ) : null}
          </div>

          <div className="mt-2 text-[12px] text-[#a7aec4]">
            {nameFromAddress(a)}
          </div>

          {a.phone ? (
            <div className="mt-1 text-[12px] text-[#a7aec4]">{a.phone}</div>
          ) : null}

          {a.email ? (
            <div className="mt-1 text-[12px] text-[#7f879f]">{a.email}</div>
          ) : null}
        </div>

        {id ? <div className="text-[11px] text-[#7f879f]">ID: {id}</div> : null}
      </div>

      <div className="mt-4 text-[13px] leading-6 text-white">
        {addressLinePretty(a)}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {a.cityOrMunicipality ? <Pill>{a.cityOrMunicipality}</Pill> : null}
        {a.district ? <Pill>{a.district}</Pill> : null}

        {a.provinceId ? (
          <Pill>
            {/^province/i.test(String(a.provinceId))
              ? String(a.provinceId)
              : `Province ${a.provinceId}`}
          </Pill>
        ) : null}

        {hasLatLng(a) ? <Pill>Map Saved</Pill> : null}
      </div>

      <div className="mt-4 rounded-[16px] border border-white/10 bg-[#0d0f17] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
          Map Location
        </div>

        <div
          className={`mt-2 text-[12px] ${
            hasLatLng(a) ? "text-white" : "text-[#7f879f]"
          }`}
        >
          {latLngText(a)}
        </div>

        {hasLatLng(a) ? (
          <a
            href={getGoogleMapsUrl(a)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${secondaryBtnClass} mt-4 inline-flex`}
          >
            View Map
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#7f879f]">
        <span>Created: {formatDateShort(a.createdAt)}</span>
        <span>Updated: {formatDateShort(a.updatedAt)}</span>
      </div>
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <div className="space-y-5">
      <div className={`${panelClass} p-6`}>
        <div className="h-3 w-40 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-9 w-64 animate-pulse rounded bg-white/5" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[116px] animate-pulse rounded-[20px] border border-white/5 bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}