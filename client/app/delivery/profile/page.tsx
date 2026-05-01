"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  DELIVERY_ENDPOINTS,
  DeliveryProfile,
  formatDateLong,
  safeJson,
  safeStr,
} from "@/app/lib/delivery";

type ToastType = "success" | "error" | "info";

type Toast = {
  type: ToastType;
  message: string;
};

const panelClass =
  "rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const softPanelClass =
  "rounded-[22px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

function ProfileField({
  label,
  value,
  index,
}: {
  label: string;
  value: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.35, ease: "easeOut" }}
      className={`${softPanelClass} relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#8b5cf6]/10 blur-2xl" />

      <div className="relative">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
          {label}
        </div>

        <div className="mt-3 break-words text-sm font-semibold text-white">
          {value}
        </div>
      </div>
    </motion.div>
  );
}

function getInitials(name?: string) {
  const safe = safeStr(name).trim();

  if (!safe) return "DL";

  const parts = safe.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return initials || "DL";
}

function getStatusBadge(status?: string) {
  const s = safeStr(status).toLowerCase();

  if (s === "active") {
    return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
  }

  if (s === "inactive") {
    return "border-red-400/20 bg-red-500/10 text-red-200";
  }

  if (s === "invited") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }

  return "border-white/10 bg-white/[0.04] text-[#a7aec4]";
}

export default function DeliveryProfilePage() {
  const [profile, setProfile] = React.useState<DeliveryProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState<Toast | null>(null);

  React.useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadProfile = React.useCallback(async (mode: "initial" | "refresh") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      setError("");

      const res = await fetch(DELIVERY_ENDPOINTS.profile, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setProfile(null);
        setError((json as any)?.message || "Failed to load profile");
        return;
      }

      const nextProfile = ((json as any)?.data ||
        json ||
        null) as DeliveryProfile | null;

      setProfile(nextProfile);

      if (mode === "refresh") {
        setToast({
          type: "success",
          message: "Profile refreshed successfully.",
        });
      }
    } catch {
      setProfile(null);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfile("initial");
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)]" />

        <div className="relative space-y-6">
          <SkeletonHero />

          <div className="grid gap-5 xl:grid-cols-2">
            <SkeletonPanel />
            <SkeletonPanel />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)]" />

        <div className="relative space-y-4">
          <div className="rounded-[26px] border border-red-400/20 bg-red-500/10 p-8 text-red-200 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-200/80">
              Profile Error
            </div>

            <div className="mt-3 text-[15px] font-medium text-red-100">
              {error || "Profile not found"}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadProfile("refresh")}
                disabled={refreshing}
                className={primaryBtnClass}
              >
                {refreshing ? "Retrying..." : "Retry"}
              </button>

              <Link href="/delivery/dashboard" className={secondaryBtnClass}>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = safeStr(profile.name) || "Delivery User";
  const status = safeStr(profile.status) || "-";
  const vehicleType = safeStr(profile.vehicleType) || "-";
  const vehicleNumber = safeStr(profile.vehicleNumber) || "-";
  const deliveryArea = safeStr(profile.deliveryArea) || "-";

  return (
    <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)]" />

      <ToastView toast={toast} />

      <div className="relative space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${panelClass} relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_34%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6 lg:p-7`}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#8b5cf6]/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                className="grid h-20 w-20 shrink-0 place-items-center rounded-[24px] border border-white/10 bg-white/[0.05] text-2xl font-bold text-white shadow-[0_0_36px_rgba(139,92,246,0.18)]"
              >
                {getInitials(displayName)}
              </motion.div>

              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Delivery Panel / Profile
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-[30px] font-semibold tracking-[-0.045em] text-white sm:text-[38px]">
                    {displayName}
                  </h1>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>

                <p className="mt-2 max-w-[650px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Delivery rider account information from your existing user
                  system.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadProfile("refresh")}
                disabled={refreshing}
                className={primaryBtnClass}
              >
                {refreshing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
                    Refreshing
                  </>
                ) : (
                  "Refresh"
                )}
              </button>

              <Link href="/delivery/dashboard" className={secondaryBtnClass}>
                Dashboard
              </Link>

              <Link href="/delivery/orders" className={secondaryBtnClass}>
                Orders
              </Link>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
            <MiniSummary label="Vehicle" value={vehicleType} />
            <MiniSummary label="Vehicle No." value={vehicleNumber} />
            <MiniSummary label="Area" value={deliveryArea} />
          </div>
        </motion.section>

        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] font-medium text-red-200"
            >
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid gap-5 xl:grid-cols-2">
          <InfoSection
            eyebrow="Profile"
            title="Basic Information"
            description="Current delivery rider profile details"
          >
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileField
                index={0}
                label="Full Name"
                value={safeStr(profile.name) || "-"}
              />

              <ProfileField
                index={1}
                label="Email"
                value={safeStr(profile.email) || "-"}
              />

              <ProfileField
                index={2}
                label="Phone"
                value={safeStr(profile.phone) || "-"}
              />

              <ProfileField
                index={3}
                label="Role"
                value={safeStr(profile.role) || "delivery"}
              />

              <ProfileField
                index={4}
                label="Account Status"
                value={
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadge(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                }
              />

              <ProfileField
                index={5}
                label="Joined"
                value={formatDateLong(profile.createdAt) || "-"}
              />
            </div>
          </InfoSection>

          <InfoSection
            eyebrow="Delivery"
            title="Delivery Information"
            description="Fields stored inside the existing users collection"
          >
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileField
                index={0}
                label="Vehicle Type"
                value={vehicleType}
              />

              <ProfileField
                index={1}
                label="Vehicle Number"
                value={vehicleNumber}
              />

              <ProfileField
                index={2}
                label="Delivery Area"
                value={deliveryArea}
              />

              <ProfileField
                index={3}
                label="Must Change Password"
                value={
                  profile.mustChangePassword ? (
                    <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      No
                    </span>
                  )
                }
              />
            </div>
          </InfoSection>
        </div>
      </div>
    </div>
  );
}

function ToastView({ toast }: { toast: Toast | null }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          className={[
            "fixed right-4 top-4 z-50 max-w-[360px] rounded-[18px] border px-4 py-3 text-sm font-semibold shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl",
            toast.type === "success"
              ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-100"
              : toast.type === "info"
              ? "border-blue-400/25 bg-blue-500/15 text-blue-100"
              : "border-red-400/25 bg-red-500/15 text-red-100",
          ].join(" ")}
        >
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MiniSummary({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.045] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f98b3]">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function InfoSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`${panelClass} p-5 sm:p-6`}
    >
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          {eyebrow}
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">{title}</h2>

        <p className="mt-1 text-[13px] text-[#a7aec4]">{description}</p>
      </div>

      {children}
    </motion.section>
  );
}

function SkeletonHero() {
  return (
    <div className={`${panelClass} p-5 sm:p-6 lg:p-7`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="h-20 w-20 animate-pulse rounded-[24px] bg-white/5" />

        <div className="flex-1">
          <div className="h-3 w-52 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-9 w-72 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-4 w-full max-w-[620px] animate-pulse rounded bg-white/5" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="h-16 animate-pulse rounded-[18px] bg-white/5" />
        <div className="h-16 animate-pulse rounded-[18px] bg-white/5" />
        <div className="h-16 animate-pulse rounded-[18px] bg-white/5" />
      </div>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className={`${panelClass} p-5 sm:p-6`}>
      <div className="h-3 w-28 animate-pulse rounded bg-white/5" />
      <div className="mt-4 h-6 w-56 animate-pulse rounded bg-white/5" />
      <div className="mt-3 h-4 w-full max-w-[420px] animate-pulse rounded bg-white/5" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`${softPanelClass} h-[104px] animate-pulse`}
          />
        ))}
      </div>
    </div>
  );
}