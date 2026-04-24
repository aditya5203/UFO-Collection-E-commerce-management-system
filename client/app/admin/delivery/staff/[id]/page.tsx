"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

function safeStr(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function formatDateTime(iso?: string) {
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

function StatusPill({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  const tone = active
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : "border-red-500/30 bg-red-500/10 text-red-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
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
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-100">
        {value || "-"}
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

export default function DeliveryStaffDetailsPage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [data, setData] = React.useState<DeliveryStaffDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/admin/delivery-staff/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          if (mounted) {
            setError((json as any)?.message || "Failed to load rider details");
            setData(null);
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

        if (mounted) {
          setData(normalized);
        }
      } catch {
        if (mounted) {
          setError("Network error while loading rider details");
          setData(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) load();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <AdminPageGuard permission="deliveryStaffView">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-700/50 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_35%),linear-gradient(180deg,rgba(10,19,36,1),rgba(7,14,27,1))] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.32)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Admin <span className="mx-2">/</span> Delivery Staff{" "}
                <span className="mx-2">/</span> Details
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                Delivery Rider Details
              </h1>

              <p className="text-sm text-slate-400">
                View rider profile, workload, and delivery performance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/delivery/staff"
                className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/35"
              >
                Back to Staff
              </Link>

              {data?.id ? (
                <Link
                  href={`/admin/delivery/staff/${data.id}/edit`}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600"
                >
                  Edit Rider
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-10 text-center text-sm text-slate-400">
            Loading rider details...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Assigned Orders"
                value={String(Number(data.assignedOrdersCount || 0))}
              />
              <StatCard
                label="Active Orders"
                value={String(Number(data.activeOrdersCount || 0))}
              />
              <StatCard
                label="Delivered"
                value={String(Number(data.deliveredOrdersCount || 0))}
              />
              <StatCard
                label="Failed"
                value={String(Number(data.failedOrdersCount || 0))}
              />
              <StatCard
                label="Returned"
                value={String(Number(data.returnedOrdersCount || 0))}
              />
            </div>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                <h2 className="text-lg font-bold text-slate-100">
                  Rider Information
                </h2>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <InfoBlock label="Full Name" value={data.name} />
                  <InfoBlock label="Email" value={data.email} />
                  <InfoBlock label="Phone" value={data.phone} />
                  <InfoBlock label="Area" value={data.area} />
                  <InfoBlock label="Vehicle Type" value={data.vehicleType} />
                  <InfoBlock label="Vehicle Number" value={data.vehicleNumber} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                <h2 className="text-lg font-bold text-slate-100">
                  Account Status
                </h2>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
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
          <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-10 text-center text-sm text-slate-400">
            Rider not found.
          </div>
        )}
      </div>
    </AdminPageGuard>
  );
}