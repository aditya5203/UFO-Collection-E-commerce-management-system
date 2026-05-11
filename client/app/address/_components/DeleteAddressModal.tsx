"use client";

import {
  NEPAL_PROVINCES,
} from "../../data/nepalLocations";

type AddressType = "Shipping" | "Billing";
type AddressLabel = "Home" | "Work" | "Other";

type Address = {
  id: string;
  userId?: string;
  type: AddressType;
  label?: AddressLabel;
  email?: string;
  firstName: string;
  lastName: string;
  country?: string;
  provinceId: string;
  district: string;
  cityOrMunicipality: string;
  addressLine: string;
  street?: string;
  postalCode?: string;
  phone: string;
  isDefault?: boolean;
  lat?: number;
  lng?: number;
  createdAt?: string;
  updatedAt?: string;
};

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

function provinceName(id?: string) {
  return NEPAL_PROVINCES.find((p) => p.id === id)?.name || id || "";
}

function fullName(a: Address) {
  return `${a.firstName || ""} ${a.lastName || ""}`.trim() || "-";
}

function line2(a: Address) {
  const parts = [
    a.addressLine,
    a.street,
    a.cityOrMunicipality,
    a.district,
    provinceName(a.provinceId),
  ].filter(Boolean);

  return parts.join(", ");
}

export default function DeleteAddressModal({
  deleteTarget,
  deletingId,
  onClose,
  onConfirm,
}: {
  deleteTarget: Address | null;
  deletingId: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!deleteTarget) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[4px]">
      <div className="w-full max-w-[440px] rounded-[26px] border border-[#26293a] bg-[#11121a] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
        <div className="text-[11px] uppercase tracking-[0.2em] text-red-300">
          Delete address
        </div>

        <h3 className="mt-2 text-[24px] font-semibold text-white">
          Are you sure?
        </h3>

        <p className="mt-3 text-[14px] leading-7 text-[#a7aec4]">
          This will permanently delete the address for{" "}
          <span className="font-semibold text-white">
            {fullName(deleteTarget)}
          </span>
          . This action cannot be undone.
        </p>

        <div className="mt-5 rounded-[18px] border border-[#26293a] bg-[#161824] p-4 text-[13px] leading-6 text-[#d6dbeb]">
          {line2(deleteTarget)}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deletingId === deleteTarget.id}
            className={secondaryBtnClass}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deletingId === deleteTarget.id}
            className="inline-flex items-center justify-center rounded-full border border-red-500/25 bg-red-500/15 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingId === deleteTarget.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}