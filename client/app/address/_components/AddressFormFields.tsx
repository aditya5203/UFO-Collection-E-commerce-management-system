"use client";

import * as React from "react";
import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  type Province,
  type District,
} from "../../data/nepalLocations";
import type { FormErrors, FormState } from "./AddressModal";

const inputClass =
  "h-12 w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

function Field({
  label,
  errorText,
  required,
  htmlFor,
  children,
}: {
  label: string;
  errorText?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[13px] font-medium text-[#d6dbeb]"
      >
        {label} {required ? <span className="text-red-300">*</span> : null}
      </label>

      {children}

      {errorText ? (
        <p className="mt-2 text-[12px] text-red-300">{errorText}</p>
      ) : null}
    </div>
  );
}

export default function AddressFormFields({
  form,
  formErrors,
  onChange,
}: {
  form: FormState;
  formErrors: FormErrors;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}) {
  const districtsForProvince: District[] = React.useMemo(() => {
    return NEPAL_DISTRICTS.filter((d) => d.provinceId === form.provinceId);
  }, [form.provinceId]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Type" required htmlFor="type">
        <select
          id="type"
          name="type"
          aria-label="Type"
          title="Type"
          value={form.type}
          onChange={onChange}
          className={inputClass}
        >
          <option value="Shipping">Shipping</option>
          <option value="Billing">Billing</option>
        </select>
      </Field>

      <Field label="Label" required htmlFor="label">
        <select
          id="label"
          name="label"
          aria-label="Label"
          title="Label"
          value={form.label}
          onChange={onChange}
          className={inputClass}
        >
          <option value="Home">Home</option>
          <option value="Work">Work</option>
          <option value="Other">Other</option>
        </select>
      </Field>

      <div className="md:col-span-2">
        <Field label="Email" errorText={formErrors.email} htmlFor="email">
          <input
            id="email"
            type="email"
            name="email"
            aria-label="Email"
            title="Email"
            value={form.email}
            onChange={onChange}
            placeholder="email@example.com"
            className={inputClass}
            autoComplete="email"
          />
        </Field>
      </div>

      <Field
        label="First Name"
        required
        errorText={formErrors.firstName}
        htmlFor="firstName"
      >
        <input
          id="firstName"
          type="text"
          name="firstName"
          aria-label="First Name"
          title="First Name"
          value={form.firstName}
          onChange={onChange}
          placeholder="First name"
          className={inputClass}
          autoComplete="given-name"
        />
      </Field>

      <Field
        label="Last Name"
        required
        errorText={formErrors.lastName}
        htmlFor="lastName"
      >
        <input
          id="lastName"
          type="text"
          name="lastName"
          aria-label="Last Name"
          title="Last Name"
          value={form.lastName}
          onChange={onChange}
          placeholder="Last name"
          className={inputClass}
          autoComplete="family-name"
        />
      </Field>

      <Field label="Phone" required errorText={formErrors.phone} htmlFor="phone">
        <input
          id="phone"
          type="tel"
          name="phone"
          aria-label="Phone"
          title="Phone"
          value={form.phone}
          onChange={onChange}
          placeholder="98xxxxxxxx"
          className={inputClass}
          inputMode="numeric"
          autoComplete="tel"
        />
      </Field>

      <Field label="Country" htmlFor="country">
        <input
          id="country"
          type="text"
          name="country"
          aria-label="Country"
          title="Country"
          value={form.country}
          onChange={onChange}
          className={`${inputClass} opacity-80`}
          autoComplete="country-name"
        />
      </Field>

      <Field
        label="Province"
        required
        errorText={formErrors.provinceId}
        htmlFor="provinceId"
      >
        <select
          id="provinceId"
          name="provinceId"
          aria-label="Province"
          title="Province"
          value={form.provinceId}
          onChange={onChange}
          className={inputClass}
        >
          <option value="">Select Province</option>
          {NEPAL_PROVINCES.map((p: Province) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="District"
        required
        errorText={formErrors.district}
        htmlFor="district"
      >
        <select
          id="district"
          name="district"
          aria-label="District"
          title="District"
          value={form.district}
          onChange={onChange}
          disabled={!form.provinceId}
          className={inputClass}
        >
          <option value="">
            {form.provinceId ? "Select District" : "Select Province first"}
          </option>

          {districtsForProvince.map((d: District) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="City / Municipality"
        required
        errorText={formErrors.cityOrMunicipality}
        htmlFor="cityOrMunicipality"
      >
        <input
          id="cityOrMunicipality"
          type="text"
          name="cityOrMunicipality"
          aria-label="City or Municipality"
          title="City or Municipality"
          value={form.cityOrMunicipality}
          onChange={onChange}
          placeholder="City / Municipality"
          disabled={!form.district}
          className={inputClass}
          autoComplete="address-level2"
        />
      </Field>

      <div className="md:col-span-2">
        <Field
          label="Address Line"
          required
          errorText={formErrors.addressLine}
          htmlFor="addressLine"
        >
          <input
            id="addressLine"
            type="text"
            name="addressLine"
            aria-label="Address Line"
            title="Address Line"
            value={form.addressLine}
            onChange={onChange}
            placeholder="House no, ward, landmark, area"
            className={inputClass}
            autoComplete="address-line1"
          />
        </Field>
      </div>

      <Field label="Street" htmlFor="street">
        <input
          id="street"
          type="text"
          name="street"
          aria-label="Street"
          title="Street"
          value={form.street}
          onChange={onChange}
          placeholder="Street"
          className={inputClass}
          autoComplete="address-line2"
        />
      </Field>

      <Field label="Postal Code" htmlFor="postalCode">
        <input
          id="postalCode"
          type="text"
          name="postalCode"
          aria-label="Postal Code"
          title="Postal Code"
          value={form.postalCode}
          onChange={onChange}
          placeholder="44600"
          className={inputClass}
          autoComplete="postal-code"
        />
      </Field>

      <div className="md:col-span-2">
        <label
          htmlFor="isDefault"
          className="mt-1 flex items-start gap-3 rounded-[20px] border border-[#26293a] bg-[#161824] px-4 py-4 text-sm text-[#d6dbeb]"
        >
          <input
            id="isDefault"
            type="checkbox"
            name="isDefault"
            aria-label="Set as default address"
            title="Set as default address"
            checked={form.isDefault}
            onChange={onChange}
            className="mt-1 h-4 w-4 rounded border border-white/20 bg-transparent accent-white"
          />

          <span>
            <span className="block font-medium text-white">
              Set as default address
            </span>
            <span className="mt-1 block text-[13px] leading-6 text-[#a7aec4]">
              This address will be preferred during checkout.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}