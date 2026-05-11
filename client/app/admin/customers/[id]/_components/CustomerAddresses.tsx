"use client";

import * as React from "react";
import {
  Address,
  addressLinePretty,
  formatDateShort,
  getGoogleMapsUrl,
  hasLatLng,
  latLngText,
  nameFromAddress,
  secondaryBtnClass,
  TabKey,
} from "./customerDetailsTypes";
import { Pill, TableShell } from "./CustomerShared";

type Props = {
  tab: TabKey;
  shipping: Address[];
  billing: Address[];
  addrLoading: boolean;
  addrError: string;
  onRefreshAddresses: () => void;
};

function AddressColumn({
  title,
  addresses,
}: {
  title: string;
  addresses: Address[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">{title}</h3>

        <span className="text-[12px] text-[#a7aec4]">{addresses.length} saved</span>
      </div>

      {addresses.length ? (
        <div className="space-y-4">
          {addresses.map((a, index) => (
            <AddressCard key={a._id || a.id || `${title}-${index}`} a={a} />
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5 text-[13px] text-[#a7aec4]">
          No {title.toLowerCase()} addresses found.
        </div>
      )}
    </div>
  );
}

function AddressCard({ a }: { a: Address }) {
  const id = a._id || a.id || "";

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[14px] font-semibold text-white">
              {a.label || "Home"}
            </div>

            <Pill>{a.type}</Pill>

            {a.isDefault ? (
              <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                Default
              </span>
            ) : null}
          </div>

          <div className="mt-2 text-[12px] text-[#a7aec4]">
            {nameFromAddress(a)}
          </div>

          {a.phone ? (
            <div className="mt-1 text-[12px] text-[#a7aec4]">{a.phone}</div>
          ) : null}

          {a.email ? (
            <div className="mt-1 text-[12px] text-[#7f879f]">{a.email}</div>
          ) : null}
        </div>

        {id ? <div className="text-[11px] text-[#7f879f]">ID: {id}</div> : null}
      </div>

      <div className="mt-4 text-[13px] leading-6 text-white">
        {addressLinePretty(a)}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {a.cityOrMunicipality ? <Pill>{a.cityOrMunicipality}</Pill> : null}
        {a.district ? <Pill>{a.district}</Pill> : null}

        {a.provinceId ? (
          <Pill>
            {/^province/i.test(String(a.provinceId))
              ? String(a.provinceId)
              : `Province ${a.provinceId}`}
          </Pill>
        ) : null}

        {hasLatLng(a) ? <Pill>Map Saved</Pill> : null}
      </div>

      <div className="mt-4 rounded-[16px] border border-white/10 bg-[#0d0f17] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
          Map Location
        </div>

        <div
          className={`mt-2 text-[12px] ${
            hasLatLng(a) ? "text-white" : "text-[#7f879f]"
          }`}
        >
          {latLngText(a)}
        </div>

        {hasLatLng(a) ? (
          <a
            href={getGoogleMapsUrl(a)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${secondaryBtnClass} mt-4 inline-flex`}
          >
            View Map
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#7f879f]">
        <span>Created: {formatDateShort(a.createdAt)}</span>
        <span>Updated: {formatDateShort(a.updatedAt)}</span>
      </div>
    </div>
  );
}

export default function CustomerAddresses({
  tab,
  shipping,
  billing,
  addrLoading,
  addrError,
  onRefreshAddresses,
}: Props) {
  if (tab !== "addresses") return null;

  return (
    <TableShell
      title="Addresses"
      right={
        <button
          type="button"
          onClick={onRefreshAddresses}
          className={secondaryBtnClass}
          disabled={addrLoading}
        >
          {addrLoading ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      {addrError ? (
        <div className="px-5 py-4">
          <div className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4 text-[13px] text-red-200">
            {addrError}
          </div>
        </div>
      ) : null}

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {addrLoading ? (
          <div className="py-8 text-[13px] text-[#a7aec4]">
            Loading addresses...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <AddressColumn title="Shipping" addresses={shipping} />
            <AddressColumn title="Billing" addresses={billing} />
          </div>
        )}
      </div>
    </TableShell>
  );
}