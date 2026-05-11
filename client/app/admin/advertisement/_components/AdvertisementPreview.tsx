"use client";

import * as React from "react";
import Image from "next/image";
import {
  AdRow,
  firstMedia,
  fmtDate,
  isRemote,
  panelClass,
} from "./advertisementTypes";
import { MiniChip, StatusPill } from "./AdvertisementShared";

type Props = {
  selected: AdRow | null;
  canEdit: boolean;
  onEdit: (ad: AdRow) => void;
};

function SmartMedia({ ad }: { ad: AdRow }) {
  const src = firstMedia(ad);

  if (ad.mediaKind === "video") {
    return (
      <video
        className="h-full w-full object-cover"
        src={src}
        controls
        preload="metadata"
      />
    );
  }

  if (isRemote(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={ad.title} className="h-full w-full object-cover" />;
  }

  return (
    <Image
      src={src}
      alt={ad.title}
      fill
      sizes="480px"
      className="object-cover"
    />
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
        {label}
      </div>

      <div className="mt-2 truncate text-[13px] font-medium text-white">
        {value}
      </div>
    </div>
  );
}

export default function AdvertisementPreview({
  selected,
  canEdit,
  onEdit,
}: Props) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-[#26293a] px-5 py-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          Preview
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">
          Campaign Preview
        </h2>

        <p className="mt-1 text-[13px] text-[#a7aec4]">
          See the selected advertisement media and details.
        </p>
      </div>

      <div className="p-5">
        {!selected ? (
          <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-8 text-center text-[13px] text-[#a7aec4]">
            Select an advertisement to preview.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-white">
                  {selected.title}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <MiniChip>{selected.type}</MiniChip>
                  <StatusPill status={selected.status} />
                  <MiniChip>{selected.audience}</MiniChip>
                </div>
              </div>

              {canEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(selected)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                >
                  Edit
                </button>
              ) : null}
            </div>

            <div className="rounded-[20px] border border-white/10 bg-[#0d0f17] p-3">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] border border-white/10 bg-black/30">
                <SmartMedia ad={selected} />
              </div>

              {selected.type === "Carousel" && selected.mediaKind === "image" ? (
                <div className="mt-3 text-[12px] text-[#a7aec4]">
                  Slides:{" "}
                  <span className="font-semibold text-white">
                    {Array.isArray(selected.mediaUrls) && selected.mediaUrls.length
                      ? selected.mediaUrls.length
                      : selected.mediaUrl
                        ? 1
                        : 0}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard
                label="Start → End"
                value={`${fmtDate(selected.startDate)} → ${fmtDate(
                  selected.endDate
                )}`}
              />

              <InfoCard label="Placement" value={selected.position ?? "-"} />

              <InfoCard label="Priority" value={selected.priority ?? "-"} />

              <InfoCard label="Click URL" value={selected.clickUrl ?? "-"} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}