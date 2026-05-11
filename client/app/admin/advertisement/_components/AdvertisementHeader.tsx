"use client";

import * as React from "react";
import Link from "next/link";
import {
  AdStatus,
  AdType,
  Audience,
  optionClass,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./advertisementTypes";
import { Select } from "./AdvertisementShared";

type Props = {
  q: string;
  setQ: (value: string) => void;
  type: AdType | "All";
  setType: (value: AdType | "All") => void;
  status: AdStatus | "All";
  setStatus: (value: AdStatus | "All") => void;
  audience: Audience | "All";
  setAudience: (value: Audience | "All") => void;
  canCreate: boolean;
  openCreate: () => void;
};

export default function AdvertisementHeader({
  q,
  setQ,
  type,
  setType,
  status,
  setStatus,
  audience,
  setAudience,
  canCreate,
  openCreate,
}: Props) {
  return (
    <section
      className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
            Admin / Advertisement
          </div>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            Advertisement
          </h1>

          <p className="mt-2 max-w-[760px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            Manage homepage banners, carousel ads, pop-ups, videos, placement
            priority, audience targeting, and Cloudinary media uploads.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canCreate ? (
            <button type="button" onClick={openCreate} className={primaryBtnClass}>
              Create Ad
            </button>
          ) : null}

          <Link href="/admin/advertisement/history" className={secondaryBtnClass}>
            View History
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(3,180px)]">
        <div className="flex h-[48px] items-center rounded-full border border-white/10 bg-white/5 px-4">
          <label htmlFor="ad-search" className="sr-only">
            Search advertisements
          </label>

          <input
            id="ad-search"
            name="adSearch"
            title="Search advertisements"
            aria-label="Search advertisements"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ad name..."
            className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
          />

          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="ml-2 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-[12px] font-bold text-white transition hover:bg-white/10"
              aria-label="Clear search"
              title="Clear search"
            >
              ✕
            </button>
          ) : null}
        </div>

        <Select
          label="Filter by advertisement type"
          value={type}
          onChange={(v) => setType(v as AdType | "All")}
        >
          <option value="All" className={optionClass()}>
            All Types
          </option>
          <option value="Banner" className={optionClass()}>
            Banner
          </option>
          <option value="Carousel" className={optionClass()}>
            Carousel
          </option>
          <option value="Pop-up" className={optionClass()}>
            Pop-up
          </option>
          <option value="Video" className={optionClass()}>
            Video
          </option>
        </Select>

        <Select
          label="Filter by advertisement status"
          value={status}
          onChange={(v) => setStatus(v as AdStatus | "All")}
        >
          <option value="All" className={optionClass()}>
            All Status
          </option>
          <option value="Active" className={optionClass()}>
            Active
          </option>
          <option value="Inactive" className={optionClass()}>
            Inactive
          </option>
          <option value="Scheduled" className={optionClass()}>
            Scheduled
          </option>
          <option value="Expired" className={optionClass()}>
            Expired
          </option>
        </Select>

        <Select
          label="Filter by advertisement audience"
          value={audience}
          onChange={(v) => setAudience(v as Audience | "All")}
        >
          <option value="All" className={optionClass()}>
            All Audience
          </option>
          <option value="All Customers" className={optionClass()}>
            All Customers
          </option>
          <option value="New Customers" className={optionClass()}>
            New Customers
          </option>
          <option value="Returning Customers" className={optionClass()}>
            Returning Customers
          </option>
        </Select>
      </div>
    </section>
  );
}