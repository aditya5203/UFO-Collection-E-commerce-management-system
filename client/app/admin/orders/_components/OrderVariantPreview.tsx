"use client";

import * as React from "react";
import Image from "next/image";
import { OrderItem } from "./orderTypes";

export default function OrderVariantPreview({ items }: { items: OrderItem[] }) {
  if (!items.length) {
    return <span className="text-[12px] text-[#7f879f]">No items</span>;
  }

  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const first = items[0];

  return (
    <div className="max-w-[260px]">
      <div className="flex items-center gap-3">
        {first.image ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-white/5">
            <Image
              src={first.image}
              alt={first.name || "Product"}
              fill
              className="object-cover"
              sizes="44px"
            />
          </div>
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-white/10 bg-white/5 text-[18px]">
            📦
          </div>
        )}

        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">
            {first.name || "Product"}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#a7aec4]">
            <span>{first.colorLabel || first.color || "Color"}</span>
            <span>•</span>
            <span>{first.size || "Size"}</span>
            <span>•</span>
            <span>Qty {first.qty || 0}</span>
          </div>

          {first.sku ? (
            <div className="mt-1 max-w-[220px] truncate text-[10px] uppercase tracking-[0.12em] text-[#7f879f]">
              SKU: {first.sku}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a7aec4]">
          {items.length} product{items.length === 1 ? "" : "s"}
        </span>

        <span className="rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff]">
          {totalQty} item{totalQty === 1 ? "" : "s"}
        </span>

        {items.length > 1 ? (
          <span className="text-[10px] text-[#7f879f]">
            +{items.length - 1} more
          </span>
        ) : null}
      </div>
    </div>
  );
}