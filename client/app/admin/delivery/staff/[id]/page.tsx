// client/app/admin/delivery/staff/[id]/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import AdminPageGuard from "../../../_components/AdminPageGuard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type DeliveryStaffDetails = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  area?: string;
  isActive?: boolean;
  assignedOrdersCount?: number;
  activeOrdersCount?: number;
  deliveredOrdersCount?: number;
  failedOrdersCount?: number;
  returnedOrdersCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
} | null;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

function safeStr(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function formatDateTime(iso?: string) {
  if (!iso) return "-";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name?: string) {
  const safe = safeStr(name).trim();

  if (!safe) return "DR";

  const parts = safe.split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "DR"
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

export default function DeliveryStaffDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = safeStr(params?.id);

  const [data, setData] = React.useState<DeliveryStaffDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState<ToastState>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
    },
    []
  );

  React.useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const load = React.useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!id) {
        setLoading(false);
        setData(null);
        setError("Delivery staff ID is missing.");
        return;
      }

      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/admin/delivery-staff/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          const message =
            (json as any)?.message || "Failed to load rider details";

          setError(message);
          setData(null);

          if (mode === "refresh") {
            showToast(message, "error");
          }

          return;
        }

        const item = (json as any)?.data || {};

        const normalized: DeliveryStaffDetails = {
          id: safeStr(item?.id || item?._id),
          name: safeStr(item?.name),
          email: safeStr(item?.email),
          phone: safeStr(item?.phone),
          vehicleType: safeStr(item?.vehicleType),
          vehicleNumber: safeStr(item?.vehicleNumber),
          area: safeStr(item?.area),
          isActive:
            typeof item?.isActive === "boolean"
              ? item.isActive
              : Boolean(item?.active),
          assignedOrdersCount: Number(item?.assignedOrdersCount || 0),
          activeOrdersCount: Number(item?.activeOrdersCount || 0),
          deliveredOrdersCount: Number(item?.deliveredOrdersCount || 0),
          failedOrdersCount: Number(item?.failedOrdersCount || 0),
          returnedOrdersCount: Number(item?.returnedOrdersCount || 0),
          createdAt: safeStr(item?.createdAt),
          updatedAt: safeStr(item?.updatedAt),
        };

        setData(normalized);

        if (mode === "refresh") {
          showToast("Rider details refreshed successfully.", "success");
        }
      } catch {
        const message = "Network error while loading rider details";

        setError(message);
        setData(null);

        if (mode === "refresh") {
          showToast(message, "error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, showToast]
  );

  React.useEffect(() => {
    load("initial");
  }, [load]);

  return (
    <AdminPageGuard permission="deliveryStaffView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin / Delivery Staff / Details
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-[18px] border border-white/10 bg-white/5 text-[15px] font-bold text-white">
                    {getInitials(data?.name)}
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                      {data?.name || "Delivery Rider Details"}
                    </h1>

                    {data?.email ? (
                      <p className="mt-1 break-all text-[13px] text-[#a7aec4]">
                        {data.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 max-w-[650px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  View rider profile, workload, account status, and delivery
                  performance from one premium panel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => load("refresh")}
                  disabled={refreshing || loading}
                  className={secondaryBtnClass}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                <Link href="/admin/delivery/staff" className={secondaryBtnClass}>
                  Back to Staff
                </Link>

                {data?.id ? (
                  <Link
                    href={`/admin/delivery/staff/${data.id}/edit`}
                    className={primaryBtnClass}
                  >
                    Edit Rider
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/15 p-5 text-[13px] font-medium text-red-300">
              <div>{error}</div>

              <button
                type="button"
                onClick={() => load("refresh")}
                disabled={refreshing}
                className={`${secondaryBtnClass} mt-4`}
              >
                Try Again
              </button>
            </div>
          ) : data ? (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard
                  label="Assigned"
                  value={String(Number(data.assignedOrdersCount || 0))}
                  iconSrc="/images/admin/orders.png"
                />

                <StatCard
                  label="Active Orders"
                  value={String(Number(data.activeOrdersCount || 0))}
                  iconSrc="/images/admin/delivery.png"
                />

                <StatCard
                  label="Delivered"
                  value={String(Number(data.deliveredOrdersCount || 0))}
                  iconSrc="/images/admin/active.png"
                />

                <StatCard
                  label="Failed"
                  value={String(Number(data.failedOrdersCount || 0))}
                  iconSrc="/images/admin/cancel.png"
                />

                <StatCard
                  label="Returned"
                  value={String(Number(data.returnedOrdersCount || 0))}
                  iconSrc="/images/admin/pending.png"
                />
              </section>

              <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className={`${panelClass} p-5 sm:p-6`}>
                  <div className="mb-5">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Profile
                    </div>

                    <h2 className="mt-1 text-[20px] font-semibold text-white">
                      Rider Information
                    </h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBlock label="Full Name" value={data.name} />
                    <InfoBlock label="Email" value={data.email} />
                    <InfoBlock label="Phone" value={data.phone} />
                    <InfoBlock label="Area" value={data.area} />
                    <InfoBlock label="Vehicle Type" value={data.vehicleType} />
                    <InfoBlock
                      label="Vehicle Number"
                      value={data.vehicleNumber}
                    />
                  </div>
                </div>

                <div className={`${panelClass} p-5 sm:p-6`}>
                  <div className="mb-5">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Account
                    </div>

                    <h2 className="mt-1 text-[20px] font-semibold text-white">
                      Account Status
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                        Current Status
                      </div>

                      <StatusPill active={data.isActive}>
                        {data.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                    </div>

                    <InfoBlock
                      label="Created At"
                      value={formatDateTime(data.createdAt)}
                    />

                    <InfoBlock
                      label="Updated At"
                      value={formatDateTime(data.updatedAt)}
                    />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div
              className={`${panelClass} p-10 text-center text-[13px] text-[#a7aec4]`}
            >
              Rider not found.
            </div>
          )}
        </div>

        {toast ? <Toast toast={toast} /> : null}
      </div>
    </AdminPageGuard>
  );
}

function StatusPill({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  const tone = active
    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
    : "border-red-400/20 bg-red-500/15 text-red-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  iconSrc: string;
}) {
  return (
    <div
      className={`${softPanelClass} group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 transition group-hover:bg-white/10">
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

function LoadingState() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`${softPanelClass} p-5`}>
            <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
            <div className="mt-4 h-8 w-16 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className={`${panelClass} p-5 sm:p-6`}>
          <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-7 w-52 animate-pulse rounded bg-white/5" />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[82px] animate-pulse rounded-[18px] bg-white/5"
              />
            ))}
          </div>
        </div>

        <div className={`${panelClass} p-5 sm:p-6`}>
          <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-7 w-44 animate-pulse rounded bg-white/5" />

          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[82px] animate-pulse rounded-[18px] bg-white/5"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Toast({ toast }: { toast: Exclude<ToastState, null> }) {
  return (
    <div
      className={[
        "fixed bottom-5 right-5 z-[1200] max-w-[380px] rounded-[18px] border px-5 py-4 text-[13px] font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur",
        toast.type === "success"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
          : toast.type === "error"
          ? "border-red-400/20 bg-red-500/15 text-red-200"
          : "border-[#8b5cf6]/30 bg-[#8b5cf6]/15 text-[#e9ddff]",
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}