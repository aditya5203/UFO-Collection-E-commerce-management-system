"use client";

import Link from "next/link";

export default function ProductBreadcrumb({
  productName,
}: {
  productName: string;
}) {
  return (
    <div className="mb-6 text-[13px] text-[#a7aec4]">
      <Link href="/homepage" className="hover:text-white">
        Home
      </Link>

      <span className="mx-2">/</span>

      <Link href="/collection" className="hover:text-white">
        Collection
      </Link>

      <span className="mx-2">/</span>

      <span className="text-white">{productName}</span>
    </div>
  );
}