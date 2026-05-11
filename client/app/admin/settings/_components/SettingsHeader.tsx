"use client";

import Link from "next/link";
import * as React from "react";
import { shellCard } from "./settingsTypes";
import { Pill } from "./SettingsShared";

export default function SettingsHeader({
  currentRole,
}: {
  currentRole: "admin" | "superadmin";
}) {
  return (
    <section
      className={`${shellCard} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
            Admin / Settings
          </div>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            Settings
          </h1>

          <p className="mt-2 max-w-3xl text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            Manage your profile, store details, admin accounts, and role-based
            permissions from one secure premium control panel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Pill tone={currentRole === "superadmin" ? "blue" : "neutral"}>
            {currentRole}
          </Pill>

          <Link
            href="/admin/dashboard"
            className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/5 px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}