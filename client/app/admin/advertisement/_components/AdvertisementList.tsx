"use client";

import * as React from "react";
import Image from "next/image";
import {
  AdRow,
  dangerBtnClass,
  fmtDate,
  panelClass,
  secondaryBtnClass,
  totalIcon,
} from "./advertisementTypes";
import { StatusPill } from "./AdvertisementShared";

type Props = {
  ads: AdRow[];
  loading: boolean;
  selected: AdRow | null;
  canEdit: boolean;
  canDelete: boolean;
  onSelect: (ad: AdRow) => void;
  onEdit: (ad: AdRow) => void;
  onToggle: (ad: AdRow) => void;
  onDelete: (ad: AdRow) => void;
};

function TableSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image src={totalIcon} alt="Advertisements" width={28} height={28} />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No advertisements found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Advertisements will appear here when you create campaigns or when your
        filters match existing ads.
      </p>
    </div>
  );
}

export default function AdvertisementList({
  ads,
  loading,
  selected,
  canEdit,
  canDelete,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
}: Props) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Campaign List
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">
            Advertisements
          </h2>

          <p className="mt-1 text-[13px] text-[#a7aec4]">
            Click any row to preview and manage the campaign.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
          {loading ? "Loading..." : `${ads.length} showing`}
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : ads.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[980px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                  <th className="px-5 py-4 font-medium">Ad Title</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Start</th>
                  <th className="px-5 py-4 font-medium">End</th>
                  <th className="px-5 py-4 font-medium">Audience</th>
                  <th className="px-5 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {ads.map((a) => {
                  const isSel = selected?.id === a.id;

                  return (
                    <tr
                      key={a.id}
                      onClick={() => onSelect(a)}
                      className={[
                        "cursor-pointer border-t border-[#26293a] transition",
                        isSel ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                      ].join(" ")}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{a.title}</div>

                        <div className="mt-1 text-[12px] text-[#7f879f]">
                          {a.position || "No placement"} • Priority{" "}
                          {a.priority ?? "-"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">{a.type}</td>

                      <td className="px-5 py-4">
                        <StatusPill status={a.status} />
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        {fmtDate(a.startDate)}
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">
                        {fmtDate(a.endDate)}
                      </td>

                      <td className="px-5 py-4 text-[#a7aec4]">{a.audience}</td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {canEdit ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(a);
                                }}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggle(a);
                                }}
                                className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-semibold text-blue-200 transition hover:bg-blue-500/15"
                              >
                                {a.status === "Active" ? "Deactivate" : "Activate"}
                              </button>
                            </>
                          ) : (
                            <span className="text-[12px] text-[#7f879f]">
                              View only
                            </span>
                          )}

                          {canDelete ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(a);
                              }}
                              className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/15"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-5 xl:hidden">
            {ads.map((a) => (
              <div
                key={a.id}
                onClick={() => onSelect(a)}
                className={[
                  "rounded-[22px] border bg-[#161824] p-5 transition",
                  selected?.id === a.id ? "border-[#d6c7ff]/35" : "border-[#26293a]",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[18px] font-semibold text-white">
                      {a.title}
                    </h3>

                    <p className="mt-1 text-[12px] text-[#7f879f]">
                      {a.position || "No placement"} • Priority {a.priority ?? "-"}
                    </p>
                  </div>

                  <StatusPill status={a.status} />
                </div>

                <div className="mt-4 grid gap-2 text-[13px] text-[#a7aec4]">
                  <div>
                    Type: <span className="text-[#d6dbeb]">{a.type}</span>
                  </div>

                  <div>
                    Audience:{" "}
                    <span className="text-[#d6dbeb]">{a.audience}</span>
                  </div>

                  <div>
                    Dates:{" "}
                    <span className="text-[#d6dbeb]">
                      {fmtDate(a.startDate)} → {fmtDate(a.endDate)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {canEdit ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(a);
                        }}
                        className={secondaryBtnClass}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(a);
                        }}
                        className={secondaryBtnClass}
                      >
                        {a.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </>
                  ) : null}

                  {canDelete ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(a);
                      }}
                      className={dangerBtnClass}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}