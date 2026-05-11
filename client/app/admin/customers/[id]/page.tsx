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
  hasPermission,
  normalizeAdminPermissions,
} from "../../_components/adminPermissions";

import CustomerAddresses from "./_components/CustomerAddresses";
import CustomerHeaderStats from "./_components/CustomerHeaderStats";
import CustomerOrdersTickets from "./_components/CustomerOrdersTickets";
import CustomerOverview from "./_components/CustomerOverview";
import CustomerTabs from "./_components/CustomerTabs";
import { CustomerSkeleton } from "./_components/CustomerShared";
import {
  Address,
  AdminSettingsJson,
  API_BASE,
  CustomerRow,
  getCustomerStatus,
  normalizeTicketRow,
  OrderRow,
  panelClass,
  safeJson,
  secondaryBtnClass,
  shellClass,
  TabKey,
  TicketRow,
} from "./_components/customerDetailsTypes";

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id;

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const tab = ((sp.get("tab") as TabKey) || "overview") as TabKey;

  const ordersLoadedForRef = React.useRef<string | null>(null);
  const ticketsLoadedForRef = React.useRef<string | null>(null);
  const addressesLoadedForRef = React.useRef<string | null>(null);

  const setTab = React.useCallback(
    (t: TabKey) => {
      const next = new URLSearchParams(sp.toString());
      next.set("tab", t);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [pathname, router, sp]
  );

  const [customer, setCustomer] = React.useState<CustomerRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");

  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState("");

  const [tickets, setTickets] = React.useState<TicketRow[]>([]);
  const [ticketsLoading, setTicketsLoading] = React.useState(false);
  const [ticketsError, setTicketsError] = React.useState("");

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

        const body = (await safeJson(res)) as AdminSettingsJson;

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
        // Silent fail because AdminPageGuard still protects this page.
      }
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
      const res = await fetch(
        `${API_BASE}/api/admin/customers/${encodeURIComponent(id)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

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

  const loadTickets = React.useCallback(
    async (id: string) => {
      setTicketsLoading(true);
      setTicketsError("");

      try {
        const query = new URLSearchParams();
        query.set("customerId", id);

        if (customer?.email) {
          query.set("customerEmail", customer.email);
        }

        const res = await fetch(
          `${API_BASE}/api/admin/tickets?${query.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const json = await safeJson(res);

        if (!res.ok) {
          setTickets([]);
          setTicketsError(json?.message || "Failed to load tickets");
          return;
        }

        const rawItems = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data)
            ? json.data
            : [];

        setTickets(
          rawItems.map(normalizeTicketRow).filter((t: TicketRow) => Boolean(t.id))
        );
      } catch {
        setTickets([]);
        setTicketsError("Network error while loading tickets");
      } finally {
        setTicketsLoading(false);
      }
    },
    [customer?.email]
  );

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

    ordersLoadedForRef.current = null;
    ticketsLoadedForRef.current = null;
    addressesLoadedForRef.current = null;

    setCustomer(null);
    setOrders([]);
    setTickets([]);
    setShipping([]);
    setBilling([]);

    setOrdersError("");
    setTicketsError("");
    setAddrError("");

    loadCustomer(customerId);
  }, [customerId, loadCustomer]);

  React.useEffect(() => {
    if (!customerId) return;
    if (loading) return;
    if (tab !== "orders") return;
    if (!canViewOrders) return;
    if (ordersLoadedForRef.current === customerId) return;

    ordersLoadedForRef.current = customerId;
    loadOrders(customerId);
  }, [customerId, loading, tab, canViewOrders, loadOrders]);

  React.useEffect(() => {
    if (!customerId) return;
    if (loading) return;
    if (!customer) return;
    if (tab !== "tickets") return;
    if (!canViewTickets) return;
    if (ticketsLoadedForRef.current === customerId) return;

    ticketsLoadedForRef.current = customerId;
    loadTickets(customerId);
  }, [customerId, loading, customer, tab, canViewTickets, loadTickets]);

  React.useEffect(() => {
    if (!customerId) return;
    if (loading) return;
    if (tab !== "addresses") return;
    if (addressesLoadedForRef.current === customerId) return;

    addressesLoadedForRef.current = customerId;
    loadAddresses(customerId);
  }, [customerId, loading, tab, loadAddresses]);

  const customerStatus = customer ? getCustomerStatus(customer) : "active";
  const ordersCount = customer?.numberOfOrders ?? orders.length;
  const ticketsCount = tickets.length;
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
          <CustomerHeaderStats
            customer={customer}
            customerStatus={customerStatus}
            ordersCount={ordersCount}
            onRefresh={() => {
              if (!customerId) return;
              loadCustomer(customerId);
            }}
          />

          <CustomerTabs
            tab={tab}
            setTab={setTab}
            canViewOrders={canViewOrders}
            canViewTickets={canViewTickets}
            ordersCount={ordersCount}
            ticketsCount={ticketsCount}
            addressesCount={addressesCount}
          />

          {tab === "overview" ? (
            <CustomerOverview
              customer={customer}
              customerStatus={customerStatus}
            />
          ) : null}

          <CustomerOrdersTickets
            tab={tab}
            canViewOrders={canViewOrders}
            canViewTickets={canViewTickets}
            orders={orders}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            onRefreshOrders={() => {
              if (!customerId) return;
              ordersLoadedForRef.current = customerId;
              loadOrders(customerId);
            }}
            tickets={tickets}
            ticketsLoading={ticketsLoading}
            ticketsError={ticketsError}
            onRefreshTickets={() => {
              if (!customerId) return;
              ticketsLoadedForRef.current = customerId;
              loadTickets(customerId);
            }}
          />

          <CustomerAddresses
            tab={tab}
            shipping={shipping}
            billing={billing}
            addrLoading={addrLoading}
            addrError={addrError}
            onRefreshAddresses={() => {
              if (!customerId) return;
              addressesLoadedForRef.current = customerId;
              loadAddresses(customerId);
            }}
          />
        </div>
      </div>
    </AdminPageGuard>
  );
}