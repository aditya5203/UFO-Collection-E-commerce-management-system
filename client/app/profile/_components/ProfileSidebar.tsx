"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getInitials,
  panelClass,
  ProfileFormState,
  SidebarItem,
} from "./profileTypes";

type Props = {
  form: ProfileFormState;
  sidebarItems: SidebarItem[];
  loggingOut: boolean;
  deleting: boolean;
  logoutLabel: string;
  loggingOutLabel: string;
  onLogout: () => void;
};

function SidebarLink({ item }: { item: SidebarItem }) {
  return (
    <Link
      href={item.href}
      className="group flex items-center justify-between rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3.5 text-sm text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#d6c7ff]/40 hover:bg-white/[0.07] hover:shadow-[0_14px_40px_rgba(0,0,0,0.28)]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition group-hover:border-[#d6c7ff]/40 group-hover:bg-[#d6c7ff]/10">
          <Image
            src={item.icon}
            alt={`${item.label} icon`}
            width={18}
            height={18}
            className="h-[18px] w-[18px] object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </span>

        <span className="truncate font-semibold">{item.label}</span>
      </span>

      <span className="ml-3 shrink-0 text-[#a7aec4] transition group-hover:translate-x-1 group-hover:text-[#d6c7ff]">
        →
      </span>
    </Link>
  );
}

export default function ProfileSidebar({
  form,
  sidebarItems,
  loggingOut,
  deleting,
  logoutLabel,
  loggingOutLabel,
  onLogout,
}: Props) {
  return (
    <aside className={`${panelClass} overflow-hidden lg:sticky lg:top-[104px]`}>
      <div className="relative min-h-[170px] border-b border-[#26293a] bg-[radial-gradient(circle_at_top,#30214f,transparent_55%),linear-gradient(135deg,#161824,#0d0f17)] p-6">
        <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#d6c7ff]">
          Customer
        </div>

        <div className="mt-10 flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white text-[28px] font-bold tracking-[-0.04em] text-[#090a12] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            {getInitials(form.name || form.email)}
          </div>

          <div className="min-w-0">
            <div className="truncate text-[22px] font-semibold tracking-[-0.03em] text-white">
              {form.name || "UFO User"}
            </div>

            <div className="mt-1 truncate text-[13px] text-[#a7aec4]">
              {form.email}
            </div>

            {form.phone ? (
              <div className="mt-1 truncate text-[12px] text-[#d6c7ff]">
                {form.phone}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a7aec4]">
          Quick Menu
        </div>

        <div className="grid gap-3">
          {sidebarItems.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut || deleting}
          className="mt-5 flex w-full items-center justify-between rounded-[18px] border border-red-400/30 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-100 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-300/20 bg-red-500/10">
              <Image
                src="/images/logout.png"
                alt="Logout icon"
                width={18}
                height={18}
                className="h-[18px] w-[18px] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </span>

            <span>{loggingOut ? loggingOutLabel : logoutLabel}</span>
          </span>

          <span className="text-red-200">→</span>
        </button>
      </div>
    </aside>
  );
}