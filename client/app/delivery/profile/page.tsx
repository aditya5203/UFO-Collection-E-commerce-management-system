"use client";

import * as React from "react";
import {
  DELIVERY_ENDPOINTS,
  DeliveryProfile,
  formatDateLong,
  safeJson,
  safeStr,
} from "@/app/lib/delivery";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className={`${softPanelClass} p-5`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
        {label}
      </div>
      <div className="mt-3 break-words text-sm font-semibold text-white">
        {value}
      </div>
    </div>
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

export default function DeliveryProfilePage() {
  const [profile, setProfile] = React.useState<DeliveryProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(DELIVERY_ENDPOINTS.profile, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          if (!mounted) return;
          setProfile(null);
          setError((json as any)?.message || "Failed to load profile");
          return;
        }

        const nextProfile = ((json as any)?.data ||
          json ||
          null) as DeliveryProfile | null;

        if (!mounted) return;
        setProfile(nextProfile);
      } catch {
        if (!mounted) return;
        setProfile(null);
        setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
        <div className={`${panelClass} p-8`}>
          <div className="h-3 w-44 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-9 w-64 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-4 w-full max-w-[620px] animate-pulse rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
        <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-8 text-red-200 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          {error || "Profile not found"}
        </div>
      </div>
    );
  }

  const displayName = safeStr(profile.name) || "Delivery User";

  return (
    <div className="-m-6 min-h-screen bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section
          className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[22px] border border-white/10 bg-white/[0.05] text-2xl font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.14)]">
              {getInitials(displayName)}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                Delivery Panel / Profile
              </div>
              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                {displayName}
              </h1>
              <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                Delivery rider account information from your existing user
                system.
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          <section className={`${panelClass} p-5 sm:p-6`}>
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                Profile
              </div>
              <h2 className="mt-1 text-[20px] font-semibold text-white">
                Basic Information
              </h2>
              <p className="mt-1 text-[13px] text-[#a7aec4]">
                Current delivery rider profile details
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileField
                label="Full Name"
                value={safeStr(profile.name) || "-"}
              />
              <ProfileField label="Email" value={safeStr(profile.email) || "-"} />
              <ProfileField label="Phone" value={safeStr(profile.phone) || "-"} />
              <ProfileField
                label="Role"
                value={safeStr(profile.role) || "delivery"}
              />
              <ProfileField
                label="Account Status"
                value={safeStr(profile.status) || "-"}
              />
              <ProfileField
                label="Joined"
                value={formatDateLong(profile.createdAt) || "-"}
              />
            </div>
          </section>

          <section className={`${panelClass} p-5 sm:p-6`}>
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                Delivery
              </div>
              <h2 className="mt-1 text-[20px] font-semibold text-white">
                Delivery Information
              </h2>
              <p className="mt-1 text-[13px] text-[#a7aec4]">
                Fields stored inside the existing users collection
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileField
                label="Vehicle Type"
                value={safeStr(profile.vehicleType) || "-"}
              />
              <ProfileField
                label="Vehicle Number"
                value={safeStr(profile.vehicleNumber) || "-"}
              />
              <ProfileField
                label="Delivery Area"
                value={safeStr(profile.deliveryArea) || "-"}
              />
              <ProfileField
                label="Must Change Password"
                value={profile.mustChangePassword ? "Yes" : "No"}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}