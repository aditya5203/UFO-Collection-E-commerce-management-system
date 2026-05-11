"use client";

import Link from "next/link";

export default function AddressBreadcrumb() {
  return (
    <div className="mb-6 text-[13px] text-[#a7aec4]">
      <Link href="/profile" className="transition hover:text-white">
        Profile
      </Link>

      <span className="mx-2">/</span>

      <span className="text-white">Address Book</span>
    </div>
  );
}