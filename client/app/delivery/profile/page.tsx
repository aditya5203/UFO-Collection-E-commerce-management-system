"use client";

import * as React from "react";
import {
  DELIVERY_ENDPOINTS,
  DeliveryProfile,
  formatDateLong,
  safeJson,
  safeStr,
} from "@/app/lib/delivery";

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
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
      <div className="rounded-[14px] border border-[#111827] bg-[#020617] p-8 text-[#9ca3af]">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-8 text-red-200">
        {error || "Profile not found"}
      </div>
    );
  }

  const displayName = safeStr(profile.name) || "Delivery User";

  return (
    <div className="space-y-6">
      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-[16px] border border-[#111827] bg-[#0b1220] text-2xl font-bold text-white">
            {getInitials(displayName)}
          </div>

          <div className="space-y-2">
            <div className="text-[12px] text-[#9ca3af]">
              Delivery Panel / Profile
            </div>
            <h1 className="text-[22px] font-semibold text-white md:text-[28px]">
              {displayName}
            </h1>
            <p className="text-[13px] text-[#9ca3af]">
              Delivery rider account information from your existing user system.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-[18px] xl:grid-cols-2">
        <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
          <h2 className="text-[16px] font-medium text-white">Basic Information</h2>
          <p className="mt-1 text-[12px] text-[#9ca3af]">
            Current delivery rider profile details
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ProfileField label="Full Name" value={safeStr(profile.name) || "-"} />
            <ProfileField label="Email" value={safeStr(profile.email) || "-"} />
            <ProfileField label="Phone" value={safeStr(profile.phone) || "-"} />
            <ProfileField label="Role" value={safeStr(profile.role) || "delivery"} />
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

        <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
          <h2 className="text-[16px] font-medium text-white">
            Delivery Information
          </h2>
          <p className="mt-1 text-[12px] text-[#9ca3af]">
            Fields stored inside the existing users collection
          </p>

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
  );
}