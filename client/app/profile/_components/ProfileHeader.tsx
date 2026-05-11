"use client";

import * as React from "react";
import { secondaryBtnClass } from "./profileTypes";

type Props = {
  title: string;
  backLabel: string;
  onBack: () => void;
};

export default function ProfileHeader({ title, backLabel, onBack }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
          Account Center
        </div>

        <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
          {title}
        </h1>

        <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-[#a7aec4]">
          Manage your personal information, mobile number, fit preferences,
          support tickets, and account security.
        </p>
      </div>

      <button type="button" onClick={onBack} className={secondaryBtnClass}>
        {backLabel}
      </button>
    </div>
  );
}