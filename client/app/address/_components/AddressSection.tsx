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

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

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

function formatUpdatedAt(value?: string) {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AddressCard({
  address,
  deletingId,
  defaultingId,
  onEdit,
  onDelete,
  onSetDefault,
  onCopy,
}: {
  address: Address;
  deletingId: string | null;
  defaultingId: string | null;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (id: string) => void;
  onCopy: (text: string, successMessage: string) => void;
}) {
  const hasCoords =
    typeof address.lat === "number" &&
    Number.isFinite(address.lat) &&
    typeof address.lng === "number" &&
    Number.isFinite(address.lng);

  return (
    <div className="group rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[18px] font-semibold text-white">
              {fullName(address)}
            </h3>

            {address.isDefault ? (
              <span className="rounded-full border border-[#d6c7ff]/30 bg-[#d6c7ff]/10 px-3 py-1 text-[11px] font-semibold text-[#d6c7ff]">
                Default
              </span>
            ) : null}

            {address.label ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#a7aec4]">
                {address.label}
              </span>
            ) : null}

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
              {address.type}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                  Delivery Address
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onCopy(line2(address), "Address copied successfully.")
                  }
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white transition hover:bg-white/10"
                >
                  Copy
                </button>
              </div>

              <p className="mt-2 text-[14px] leading-6 text-[#d6dbeb]">
                {line2(address) || "-"}
              </p>

              <p className="mt-1 text-[13px] text-[#a7aec4]">
                {address.country || "Nepal"}
              </p>
            </div>

            <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                  Contact
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onCopy(address.phone || "", "Phone number copied.")
                  }
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white transition hover:bg-white/10"
                >
                  Copy
                </button>
              </div>

              <p className="mt-2 text-[14px] text-white">
                {address.phone || "-"}
              </p>

              <p className="mt-1 truncate text-[13px] text-[#a7aec4]">
                {address.email || "No email added"}
              </p>

              {address.updatedAt ? (
                <p className="mt-2 text-[12px] text-[#7f879f]">
                  Updated {formatUpdatedAt(address.updatedAt)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-[#a7aec4]">
            {hasCoords ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {address.lat?.toFixed(5)}, {address.lng?.toFixed(5)}
              </span>
            ) : (
              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-yellow-200">
                No map pin saved
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-2 lg:w-[176px] lg:flex-col">
          {!address.isDefault ? (
            <button
              type="button"
              onClick={() => onSetDefault(address.id)}
              disabled={defaultingId === address.id}
              className="inline-flex h-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {defaultingId === address.id ? "Setting..." : "Set Default"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onEdit(address)}
            className="inline-flex h-[44px] items-center justify-center rounded-full border border-[#d6c7ff]/25 bg-[#d6c7ff]/10 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff] transition hover:bg-[#d6c7ff]/15"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(address)}
            disabled={deletingId === address.id}
            className="inline-flex h-[44px] items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingId === address.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddressSection({
  title,
  description,
  type,
  addresses,
  search,
  deletingId,
  defaultingId,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
  onCopy,
}: {
  title: string;
  description: string;
  type: AddressType;
  addresses: Address[];
  search: string;
  deletingId: string | null;
  defaultingId: string | null;
  onAdd: () => void;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (id: string) => void;
  onCopy: (text: string, successMessage: string) => void;
}) {
  const isShipping = type === "Shipping";

  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold text-white">{title}</h2>

          <p className="mt-1 text-[14px] text-[#a7aec4]">{description}</p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className={isShipping ? primaryBtnClass : secondaryBtnClass}
        >
          {isShipping ? "Add Shipping" : "Add Billing"}
        </button>
      </div>

      {addresses.length ? (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              deletingId={deletingId}
              defaultingId={defaultingId}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetDefault={onSetDefault}
              onCopy={onCopy}
            />
          ))}
        </div>
      ) : isShipping ? (
        <div className="rounded-[24px] border border-dashed border-[#26293a] bg-[#161824] px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 text-2xl">
            📍
          </div>

          <h3 className="mt-4 text-[18px] font-semibold text-white">
            {search.trim()
              ? "No matching shipping address"
              : "No shipping addresses yet"}
          </h3>

          <p className="mx-auto mt-2 max-w-[480px] text-[14px] leading-6 text-[#a7aec4]">
            {search.trim()
              ? "Try changing your search keyword."
              : "Add your delivery address with province, district, and an exact map pin for smoother checkout."}
          </p>

          {!search.trim() ? (
            <button
              type="button"
              onClick={onAdd}
              className={`${primaryBtnClass} mt-5`}
            >
              Add First Address
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#26293a] bg-[#161824] px-6 py-10 text-center text-[14px] text-[#a7aec4]">
          {search.trim()
            ? "No matching billing address."
            : "No billing addresses yet."}
        </div>
      )}
    </section>
  );
}