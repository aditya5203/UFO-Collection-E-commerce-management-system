"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import AdminPageGuard from "../_components/AdminPageGuard";

import OrdersHeader from "./_components/OrdersHeader";
import OrdersStats from "./_components/OrdersStats";
import OrdersTable from "./_components/OrdersTable";
import OrdersToast from "./_components/OrdersToast";
import { ErrorBox } from "./_components/OrderShared";
import {
  API_BASE,
  ApiOrder,
  LoadMode,
  OrderListResponse,
  OrderRow,
  ToastState,
  ToastType,
  getAfterSalesLabels,
  getOrderArray,
  mapOrder,
  safeJson,
  shellClass,
} from "./_components/orderTypes";

export default function OrdersPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<OrderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState("");
  const [downloadingId, setDownloadingId] = React.useState<string>("");
  const [toast, setToast] = React.useState<ToastState>(null);

  const didSearchMountRef = React.useRef(false);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
    },
    []
  );

  React.useEffect(() => {
    if (!toast) return;

    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const load = React.useCallback(
    async (search: string, mode: LoadMode = "initial") => {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      if (mode === "search") setSearching(true);

      setError("");

      try {
        const res = await fetch(
          `${API_BASE}/api/admin/orders?search=${encodeURIComponent(search)}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const body = (await safeJson(res)) as OrderListResponse | ApiOrder[];

        if (!res.ok) {
          const message = Array.isArray(body)
            ? "Failed to load orders"
            : body?.message || "Failed to load orders";

          setRows([]);
          setError(message);

          if (mode === "refresh") showToast(message, "error");
          return;
        }

        const mapped = getOrderArray(body).map(mapOrder).filter((o) => o.id);

        setRows(mapped);

        if (mode === "refresh") {
          showToast("Orders refreshed successfully.", "success");
        }
      } catch {
        setRows([]);
        setError("Network error while loading orders");

        if (mode === "refresh") {
          showToast("Network error while loading orders", "error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setSearching(false);
      }
    },
    [showToast]
  );

  React.useEffect(() => {
    load("", "initial");
  }, [load]);

  React.useEffect(() => {
    if (!didSearchMountRef.current) {
      didSearchMountRef.current = true;
      return;
    }

    const t = window.setTimeout(() => {
      load(q, "search");
    }, 350);

    return () => window.clearTimeout(t);
  }, [q, load]);

  React.useEffect(() => {
    const socket: Socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("order:updated", () => {
      load(q, "silent");
    });

    return () => {
      socket.off("order:updated");
      socket.disconnect();
    };
  }, [load, q]);

  const downloadInvoice = async (orderId: string, orderCode?: string) => {
    try {
      setDownloadingId(orderId);

      const target = encodeURIComponent(orderId);

      const res = await fetch(`${API_BASE}/api/orders/${target}/invoice`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error((body as any)?.message || "Failed to download invoice");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const fileBase = (orderCode || orderId || "invoice").replace("#", "");
      const a = document.createElement("a");

      a.href = url;
      a.download = `invoice-${fileBase}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      showToast("Invoice downloaded successfully.", "success");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to download invoice";

      showToast(message, "error");
    } finally {
      setDownloadingId("");
    }
  };

  const paidCount = rows.filter((o) => o.paymentStatus === "Paid").length;
  const pendingCount = rows.filter(
  (o) => o.paymentStatus === "Pending"
).length;
  const afterSalesCount = rows.filter((o) => getAfterSalesLabels(o).length > 0)
    .length;

  const totalOrderValue = rows.reduce((sum, o) => {
    return sum + Number(o.totalPaisa || 0);
  }, 0);

  const hasSearch = q.trim().length > 0;

  return (
    <AdminPageGuard permission="orderView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <OrdersHeader
            refreshing={refreshing}
            onRefresh={() => load(q, "refresh")}
          />

          <OrdersStats
            totalOrders={rows.length}
            paidCount={paidCount}
            pendingCount={pendingCount}
            afterSalesCount={afterSalesCount}
            totalOrderValue={totalOrderValue}
          />

          {error ? <ErrorBox message={error} /> : null}

          <OrdersTable
            q={q}
            setQ={setQ}
            rows={rows}
            loading={loading}
            searching={searching}
            hasSearch={hasSearch}
            downloadingId={downloadingId}
            downloadInvoice={downloadInvoice}
          />
        </div>

        {toast ? <OrdersToast toast={toast} /> : null}
      </div>
    </AdminPageGuard>
  );
}