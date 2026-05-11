"use client";

import Link from "next/link";

export default function OrderBreadcrumb() {
  return (
    <div className="mb-8 text-[13px] text-[#a7aec4]">
      <Link href="/homepage" className="hover:text-white">
        Home
      </Link>

      <span className="mx-2">/</span>

      <Link href="/order-history" className="hover:text-white">
        Orders
      </Link>

      <span className="mx-2">/</span>

      <span className="text-white">Order Details</span>
    </div>
  );
}