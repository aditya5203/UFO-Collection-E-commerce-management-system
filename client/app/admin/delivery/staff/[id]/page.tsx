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

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90";

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
      <div className="mt-2 text-[13px] font-medium text-white">
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
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin / Delivery Staff / Details
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Delivery Rider Details
                </h1>

                <p className="mt-2 max-w-[650px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  View rider profile, workload, account status, and delivery
                  performance from one premium panel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
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
            <div className={`${panelClass} p-10 text-center text-[13px] text-[#a7aec4]`}>
              Loading rider details...
            </div>
          ) : error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/15 p-4 text-[13px] font-medium text-red-300">
              {error}
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
            <div className={`${panelClass} p-10 text-center text-[13px] text-[#a7aec4]`}>
              Rider not found.
            </div>
          )}
        </div>
      </div>
    </AdminPageGuard>
  );
}