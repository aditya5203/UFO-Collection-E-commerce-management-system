"use client";

import {
  NEPAL_PROVINCES,
} from "../../data/nepalLocations";
import type { FormState } from "./AddressModal";

function provinceName(id?: string) {
  return NEPAL_PROVINCES.find((p) => p.id === id)?.name || id || "";
}

export default function AddressPreview({ form }: { form: FormState }) {
  return (
    <div className="mt-5 rounded-[24px] border border-[#26293a] bg-[#161824] p-4">
      <div className="text-[12px] uppercase tracking-[0.16em] text-[#a7aec4]">
        Preview
      </div>

      <div className="mt-3 space-y-2 text-[14px] text-[#d6dbeb]">
        <p className="font-semibold text-white">
          {`${form.firstName} ${form.lastName}`.trim() || "Full name"}
        </p>

        <p>{form.addressLine || "Address line"}</p>

        <p>
          {[form.cityOrMunicipality, form.district, provinceName(form.provinceId)]
            .filter(Boolean)
            .join(", ") || "City, District, Province"}
        </p>

        <p>{form.phone || "Phone number"}</p>
      </div>
    </div>
  );
}