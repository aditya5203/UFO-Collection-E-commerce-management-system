"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  panelClass,
  primaryBtnClass,
  ProfileFormState,
} from "./profileTypes";

type Props = {
  form: ProfileFormState;
  saving: boolean;
  deleting: boolean;
  loggingOut: boolean;
  labels: {
    personalInfo: string;
    name: string;
    email: string;
    save: string;
    saving: string;
    fitPreferences: string;
    height: string;
    weight: string;
    sizeRec: string;
    menSize: string;
    womenSize: string;
    ticketsTitle: string;
    ticketsDesc: string;
    raiseTitle: string;
    raiseDesc: string;
    dangerZone: string;
    dangerDesc: string;
    deleteBtn: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onOpenDelete: () => void;
};

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfileContent({
  form,
  saving,
  deleting,
  loggingOut,
  labels,
  onChange,
  onSubmit,
  onOpenDelete,
}: Props) {
  return (
    <section className="grid gap-8">
      <form onSubmit={onSubmit} className={`${panelClass} p-5 sm:p-6`}>
        <div className="flex flex-col gap-3 border-b border-[#26293a] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Profile Details
            </div>

            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
              {labels.personalInfo}
            </h2>
          </div>

          <button
            type="submit"
            disabled={saving || deleting || loggingOut}
            className={primaryBtnClass}
          >
            {saving ? labels.saving : labels.save}
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label={labels.name} htmlFor="name">
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder={labels.name}
              aria-label="Name"
              autoComplete="name"
              className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
            />
          </Field>

          <Field label={labels.email} htmlFor="email">
            <input
              id="email"
              name="email"
              value={form.email}
              readOnly
              placeholder={labels.email}
              aria-label="Email"
              title="Email cannot be changed"
              autoComplete="email"
              className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#a7aec4] outline-none opacity-80"
            />
          </Field>

          <Field label="Mobile Number" htmlFor="phone">
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="e.g. 9842690683"
              aria-label="Mobile Number"
              autoComplete="tel"
              inputMode="tel"
              className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
            />
          </Field>
        </div>

        <div className="mt-8 border-t border-[#26293a] pt-6">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
            {labels.fitPreferences}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label={labels.height} htmlFor="height">
              <input
                id="height"
                name="height"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={form.height}
                onChange={onChange}
                placeholder="e.g. 5.6"
                aria-label="Height"
                className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
              />
            </Field>

            <Field label={labels.weight} htmlFor="weight">
              <input
                id="weight"
                name="weight"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={form.weight}
                onChange={onChange}
                placeholder="e.g. 60"
                aria-label="Weight"
                className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
              />
            </Field>
          </div>
        </div>

        <div className="mt-8 rounded-[20px] border border-[#26293a] bg-[#161824] p-4 sm:p-5">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
            {labels.sizeRec}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                {labels.menSize}
              </div>

              <div className="mt-2 text-[30px] font-semibold text-[#d6c7ff]">
                {form.menSize || "-"}
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                {labels.womenSize}
              </div>

              <div className="mt-2 text-[30px] font-semibold text-[#d6c7ff]">
                {form.womenSize || "-"}
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className={`${panelClass} p-5 sm:p-6`}>
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
          Support
        </div>

        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
          Help & Tickets
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link
            href="/profile/tickets"
            className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 transition hover:-translate-y-1 hover:border-[#4a506b]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Image
                src="/images/ticket.png"
                alt="Ticket icon"
                width={22}
                height={22}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="text-[16px] font-semibold text-white">
              {labels.ticketsTitle}
            </div>

            <div className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
              {labels.ticketsDesc}
            </div>
          </Link>

          <Link
            href="/support-ticket"
            className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 transition hover:-translate-y-1 hover:border-[#4a506b]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Image
                src="/images/support.png"
                alt="Support icon"
                width={22}
                height={22}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="text-[16px] font-semibold text-white">
              {labels.raiseTitle}
            </div>

            <div className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
              {labels.raiseDesc}
            </div>
          </Link>
        </div>
      </div>

      <div className="rounded-[24px] border border-red-400/25 bg-red-500/10 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-6">
        <div className="text-[11px] uppercase tracking-[0.24em] text-red-200">
          {labels.dangerZone}
        </div>

        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
          Delete Account
        </h2>

        <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-red-100/75">
          {labels.dangerDesc}
        </p>

        <button
          type="button"
          onClick={onOpenDelete}
          disabled={deleting || loggingOut}
          className="mt-5 rounded-full border border-red-300/30 bg-red-500/20 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-100 transition hover:-translate-y-0.5 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {deleting ? "Deleting..." : labels.deleteBtn}
        </button>
      </div>
    </section>
  );
}