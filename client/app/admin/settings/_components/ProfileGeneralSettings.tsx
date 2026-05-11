"use client";

import * as React from "react";
import { shellCard } from "./settingsTypes";
import { Button, Field, Input, Pill } from "./SettingsShared";

type Props = {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;

  storeName: string;
  setStoreName: (value: string) => void;
  supportEmail: string;
  setSupportEmail: (value: string) => void;
  supportPhone: string;
  setSupportPhone: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;

  onSaveProfile: () => void;
  onSaveGeneral: () => void;
  onOpenPassword: () => void;
};

export default function ProfileGeneralSettings({
  name,
  setName,
  email,
  setEmail,
  storeName,
  setStoreName,
  supportEmail,
  setSupportEmail,
  supportPhone,
  setSupportPhone,
  currency,
  setCurrency,
  onSaveProfile,
  onSaveGeneral,
  onOpenPassword,
}: Props) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className={`${shellCard} p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
              Account
            </div>

            <h2 className="mt-1 text-[20px] font-semibold text-white">
              Profile
            </h2>

            <p className="mt-1 text-[13px] text-[#a7aec4]">
              Update your admin account information.
            </p>
          </div>

          <Pill tone="green">Account</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Name" htmlFor="profileName">
            <Input
              id="profileName"
              name="profileName"
              title="Profile name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </Field>

          <Field label="Email" htmlFor="profileEmail">
            <Input
              id="profileEmail"
              name="profileEmail"
              title="Profile email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-[#26293a] pt-5">
          <Button type="button" onClick={onSaveProfile}>
            Save Profile
          </Button>

          <Button type="button" variant="ghost" onClick={onOpenPassword}>
            Change Password
          </Button>
        </div>
      </div>

      <div className={`${shellCard} p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
              Store
            </div>

            <h2 className="mt-1 text-[20px] font-semibold text-white">
              General
            </h2>

            <p className="mt-1 text-[13px] text-[#a7aec4]">
              Configure store information used across the admin system.
            </p>
          </div>

          <Pill tone="blue">Store</Pill>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Store Name" htmlFor="storeName">
            <Input
              id="storeName"
              name="storeName"
              title="Store name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="UFO Collection"
            />
          </Field>

          <Field label="Currency" htmlFor="currency">
            <Input
              id="currency"
              name="currency"
              title="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="NPR"
            />
          </Field>

          <Field label="Support Email" htmlFor="supportEmail">
            <Input
              id="supportEmail"
              name="supportEmail"
              title="Support email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@ufo.com"
            />
          </Field>

          <Field label="Support Phone" htmlFor="supportPhone">
            <Input
              id="supportPhone"
              name="supportPhone"
              title="Support phone"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
            />
          </Field>
        </div>

        <div className="mt-6 border-t border-[#26293a] pt-5">
          <Button type="button" onClick={onSaveGeneral}>
            Save General
          </Button>
        </div>
      </div>
    </section>
  );
}