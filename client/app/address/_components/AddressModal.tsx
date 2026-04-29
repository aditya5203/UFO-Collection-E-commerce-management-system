"use client";

import * as React from "react";
import AddressFormFields from "./AddressFormFields";
import AddressMapPicker from "./AddressMapPicker";
import AddressPreview from "./AddressPreview";

type AddressType = "Shipping" | "Billing";
type AddressLabel = "Home" | "Work" | "Other";
type ToastType = "success" | "error" | "info";

type LatLng = {
  lat: number;
  lng: number;
};

type Address = {
  id: string;
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
};

export type FormState = {
  type: AddressType;
  label: AddressLabel;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  provinceId: string;
  district: string;
  cityOrMunicipality: string;
  addressLine: string;
  street: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
  lat: number;
  lng: number;
};

export type FormErrors = Partial<Record<keyof FormState, string>> & {
  general?: string;
};

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export default function AddressModal({
  editing,
  form,
  formErrors,
  saving,
  mapCenter,
  markerPosition,
  mapLoaded,
  isLoaded,
  loadError,
  onClose,
  onSubmit,
  onChange,
  onUseCurrentLocation,
  onMarkerDragEnd,
  onMapLoad,
}: {
  editing: Address | null;
  form: FormState;
  formErrors: FormErrors;
  saving: boolean;
  mapCenter: LatLng;
  markerPosition: LatLng;
  mapLoaded: boolean;
  isLoaded: boolean;
  loadError: unknown;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onUseCurrentLocation: () => void;
  onMarkerDragEnd: (e: google.maps.MapMouseEvent) => void;
  onMapLoad: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-[4px]">
      <div className="flex h-full items-start justify-center overflow-y-auto p-4 sm:p-6">
        <div className="my-6 w-full max-w-[1120px] overflow-hidden rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#26293a] px-5 py-4 sm:px-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                {editing ? "Update saved address" : "Create new address"}
              </div>

              <div className="mt-1 text-[22px] font-semibold text-white">
                {editing ? "Edit Address" : "Add Address"}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div className="border-b border-[#26293a] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                {formErrors.general ? (
                  <div className="mb-5 rounded-[18px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {formErrors.general}
                  </div>
                ) : null}

                {!GOOGLE_MAPS_API_KEY ? (
                  <div className="mb-5 rounded-[18px] border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                    Google Maps API key is missing. Add
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.
                  </div>
                ) : null}

                {loadError ? (
                  <div className="mb-5 rounded-[18px] border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                    Google Maps failed to load. Check your API key.
                  </div>
                ) : null}

                <AddressFormFields
                  form={form}
                  formErrors={formErrors}
                  onChange={onChange}
                />
              </div>

              <div className="p-5 sm:p-6">
                <AddressMapPicker
                  form={form}
                  mapCenter={mapCenter}
                  markerPosition={markerPosition}
                  mapLoaded={mapLoaded}
                  isLoaded={isLoaded}
                  googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                  onUseCurrentLocation={onUseCurrentLocation}
                  onMarkerDragEnd={onMarkerDragEnd}
                  onMapLoad={onMapLoad}
                />

                <AddressPreview form={form} />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <button type="button" onClick={onClose} className={secondaryBtnClass}>
                Cancel
              </button>

              <button type="submit" disabled={saving} className={primaryBtnClass}>
                {saving
                  ? editing
                    ? "Updating..."
                    : "Saving..."
                  : editing
                    ? "Update Address"
                    : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}