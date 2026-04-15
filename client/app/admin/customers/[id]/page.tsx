// client/app/admin/customers/[id]/page.tsx
"use client";

import Link from "next/link";
import React from "react";
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

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  numberOfOrders?: number;
  status?: "active" | "blocked" | "deleted";
  isBlocked?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
};

type PaymentStatus = "Paid" | "Pending" | "Failed";
type OrderStatus = "Delivered" | "Shipped" | "Pending" | "Cancelled";

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

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-xl border border-slate-700/60 bg-slate-900/35 px-3 py-1 text-xs font-semibold text-slate-100">
      {text}
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
        "rounded-xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-slate-800/40 ring-1 ring-slate-700/60 text-slate-100"
          : "text-slate-300 hover:bg-slate-800/25",
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
    <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0A1324]">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {right ? <div className="text-sm text-slate-400">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

function formatDateShort(iso?: string) {
  if (!iso) return "-";
  return String(iso).slice(0, 10);
}

function formatNPR(paisa: number) {
  const safe = Number.isFinite(paisa) ? paisa : 0;
  return `Rs. ${(safe / 100).toFixed(2)}`;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/35 px-4 py-2 text-xs font-semibold text-slate-100">
      {children}
    </span>
  );
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

function AddressCard({ a }: { a: Address }) {
  const id = a._id || a.id || "";

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-slate-100">
              {a.label || "Home"}
            </div>

            <span className="rounded-full border border-slate-700/60 bg-slate-800/40 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
              {a.type}
            </span>

            {a.isDefault ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                Default
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {nameFromAddress(a)}
          </div>

          {a.phone ? (
            <div className="mt-1 text-xs text-slate-400">{a.phone}</div>
          ) : null}

          {a.email ? (
            <div className="mt-1 text-xs text-slate-500">{a.email}</div>
          ) : null}
        </div>

        {id ? <div className="text-xs text-slate-500">ID: {id}</div> : null}
      </div>

      <div className="mt-4 text-sm leading-6 text-slate-200">
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

      <div className="mt-4 rounded-xl border border-slate-700/40 bg-slate-950/30 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Map Location
        </div>
        <div
          className={`mt-1 text-xs ${
            hasLatLng(a) ? "text-slate-200" : "text-slate-500"
          }`}
        >
          {latLngText(a)}
        </div>

        {hasLatLng(a) ? (
          <div className="mt-3">
            <a
              href={getGoogleMapsUrl(a)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/15"
            >
              View on Google Maps
            </a>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Created: {formatDateShort(a.createdAt)}</span>
        <span>Updated: {formatDateShort(a.updatedAt)}</span>
      </div>
    </div>
  );
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
      } catch {
        // ignore
      }
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const canViewOrders = hasPermission(role, permissions, "orderView");
  const canViewTickets = hasPermission(role, permissions, "ticketView");

  const loadCustomer = async (id: string) => {
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
  };

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
  }, [customerId]);

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

  const ordersCount = customer?.numberOfOrders ?? 0;
  const ticketsCount = 0;
  const addressesCount = shipping.length + billing.length;

  if (loading) {
    return (
      <AdminPageGuard permission="customerView">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold">Customer</h1>
            <Link
              href="/admin/customers"
              className="rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/55"
            >
              Back
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-6 text-slate-300">
            Loading...
          </div>
        </div>
      </AdminPageGuard>
    );
  }

  if (!customer) {
    return (
      <AdminPageGuard permission="customerView">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold">Customer</h1>
            <Link
              href="/admin/customers"
              className="rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/55"
            >
              Back
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-6 text-slate-300">
            {error || "Customer not found."}
          </div>
        </div>
      </AdminPageGuard>
    );
  }

  return (
    <AdminPageGuard permission="customerView">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {customer.name || "-"}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge text={customer.role || "customer"} />
              <span className="text-sm text-slate-400">
                {customer.email || "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/customers"
              className="rounded-xl border border-slate-700/50 bg-slate-900/35 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/55"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/50 bg-[#0A1324] p-3">
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
          >
            Overview
          </TabButton>

          {canViewOrders ? (
            <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
              Orders{" "}
              <span className="ml-2 text-xs opacity-70">({ordersCount})</span>
            </TabButton>
          ) : null}

          {canViewTickets ? (
            <TabButton
              active={tab === "tickets"}
              onClick={() => setTab("tickets")}
            >
              Tickets{" "}
              <span className="ml-2 text-xs opacity-70">({ticketsCount})</span>
            </TabButton>
          ) : null}

          <TabButton
            active={tab === "addresses"}
            onClick={() => setTab("addresses")}
          >
            Addresses{" "}
            <span className="ml-2 text-xs opacity-70">
              ({tab === "addresses" ? addressesCount : "—"})
            </span>
          </TabButton>
        </div>

        {tab === "overview" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Created At
              </p>
              <p className="mt-2 text-lg font-bold text-slate-100">
                {formatDateShort(customer.createdAt)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Account creation date
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Last Login
              </p>
              <p className="mt-2 text-lg font-bold text-slate-100">
                {formatDateShort(customer.lastLogin)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Last time user logged in
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Orders
              </p>
              <p className="mt-2 text-lg font-bold text-slate-100">
                {ordersCount}
              </p>
              <p className="mt-1 text-sm text-slate-400">Lifetime orders</p>
            </div>
          </div>
        )}

        {tab === "orders" && canViewOrders && (
          <TableShell title="Orders" right={<span>{ordersCount} total</span>}>
            {ordersError ? (
              <div className="px-6 py-6">
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {ordersError}
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse">
                <thead className="bg-slate-900/30">
                  <tr className="text-left text-sm font-semibold text-slate-200">
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {ordersLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm text-slate-400"
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
                          className="border-t border-slate-700/40 text-sm text-slate-100 hover:bg-slate-900/20"
                        >
                          <td className="px-6 py-5 font-semibold">{code}</td>
                          <td className="px-6 py-5 text-slate-300">
                            {formatNPR(paisa)}
                          </td>
                          <td className="px-6 py-5">
                            <Pill>{o.paymentStatus}</Pill>
                          </td>
                          <td className="px-6 py-5">
                            <Pill>{o.orderStatus}</Pill>
                          </td>
                          <td className="px-6 py-5 text-slate-400">
                            {formatDateShort(o.createdAt)}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="font-semibold text-slate-200 hover:text-slate-100"
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
                        className="px-6 py-10 text-center text-sm text-slate-400"
                      >
                        No orders for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableShell>
        )}

        {tab === "tickets" && canViewTickets && (
          <TableShell title="Customer Tickets" right={<span>0 total</span>}>
            <div className="px-6 py-10 text-sm text-slate-400">
              Tickets module not connected yet.
            </div>
          </TableShell>
        )}

        {tab === "addresses" && (
          <TableShell
            title="Addresses"
            right={
              <button
                type="button"
                onClick={() => customerId && loadAddresses(customerId)}
                className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900/40"
                disabled={addrLoading}
              >
                {addrLoading ? "Refreshing..." : "Refresh"}
              </button>
            }
          >
            {addrError ? (
              <div className="px-6 py-6">
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {addrError}
                </div>
              </div>
            ) : null}

            <div className="px-6 pb-6">
              {addrLoading ? (
                <div className="py-8 text-sm text-slate-400">
                  Loading addresses...
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-100">
                        Shipping
                      </h3>
                      <span className="text-xs text-slate-400">
                        {shipping.length} saved
                      </span>
                    </div>

                    {shipping.length ? (
                      <div className="space-y-4">
                        {shipping.map((a, index) => (
                          <AddressCard
                            key={a._id || a.id || `shipping-${index}`}
                            a={a}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/15 p-5 text-sm text-slate-400">
                        No shipping addresses found.
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-100">
                        Billing
                      </h3>
                      <span className="text-xs text-slate-400">
                        {billing.length} saved
                      </span>
                    </div>

                    {billing.length ? (
                      <div className="space-y-4">
                        {billing.map((a, index) => (
                          <AddressCard
                            key={a._id || a.id || `billing-${index}`}
                            a={a}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/15 p-5 text-sm text-slate-400">
                        No billing addresses found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TableShell>
        )}
      </div>
    </AdminPageGuard>
  );
}