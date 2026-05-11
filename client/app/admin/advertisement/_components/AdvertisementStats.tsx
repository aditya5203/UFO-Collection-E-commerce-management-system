"use client";

import * as React from "react";
import Image from "next/image";
import {
  activeIcon,
  expiredIcon,
  scheduledIcon,
  totalIcon,
} from "./advertisementTypes";

type Props = {
  totalCount: number;
  activeCount: number;
  scheduledCount: number;
  expiredCount: number;
};

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

          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>

          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={24} height={24} />
        </div>
      </div>
    </div>
  );
}

export default function AdvertisementStats({
  totalCount,
  activeCount,
  scheduledCount,
  expiredCount,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Ads"
        value={String(totalCount)}
        hint="Current result count"
        iconSrc={totalIcon}
      />

      <StatCard
        label="Active Ads"
        value={String(activeCount)}
        hint="Visible to customers"
        iconSrc={activeIcon}
      />

      <StatCard
        label="Scheduled"
        value={String(scheduledCount)}
        hint="Upcoming campaigns"
        iconSrc={scheduledIcon}
      />

      <StatCard
        label="Expired"
        value={String(expiredCount)}
        hint="Ended campaigns"
        iconSrc={expiredIcon}
      />
    </section>
  );
}