"use client";

import Image from "next/image";
import * as React from "react";
import {
  AdminOrderDetail,
  OrderItem,
  TimelineStep,
  formatDate,
  formatDateTime,
  formatNPR,
  getImageSrc,
  panelClass,
  safeStr,
} from "./orderDetailsTypes";
import {
  ColorSwatch,
  SectionHeader,
  SummaryCard,
  TimelineDot,
} from "./OrderDetailsShared";

type Props = {
  order: AdminOrderDetail;
  items: OrderItem[];
  timeline: TimelineStep[];
  totalPaisa: number;
};

export default function OrderSummaryItemsTimeline({
  order,
  items,
  timeline,
  totalPaisa,
}: Props) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Customer"
          value={order.customer?.name || "-"}
          hint={order.customer?.email || "No email"}
          iconSrc="/images/admin/customer.png"
        />

        <SummaryCard
          label="Items"
          value={String(items.length)}
          hint="Products / variants in this order"
          iconSrc="/images/admin/product.png"
        />

        <SummaryCard
          label="Total"
          value={formatNPR(totalPaisa)}
          hint="Final charged amount"
          iconSrc="/images/admin/revenue.png"
        />

        <SummaryCard
          label="Order Date"
          value={formatDate(order.createdAt)}
          hint={formatDateTime(order.createdAt)}
          iconSrc="/images/admin/calendar.png"
        />
      </section>

      <section className={`${panelClass} overflow-hidden`}>
        <SectionHeader
          eyebrow="Order Items"
          title="Ordered Products"
          description="Product variant, SKU, quantity, color, size, and pricing"
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-[13px]">
            <thead>
              <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">Variant / SKU</th>
                <th className="px-5 py-4 font-medium">Size</th>
                <th className="px-5 py-4 font-medium">Color</th>
                <th className="px-5 py-4 text-center font-medium">Qty</th>
                <th className="px-5 py-4 text-right font-medium">Price</th>
                <th className="px-5 py-4 text-right font-medium">Total</th>
              </tr>
            </thead>

            <tbody>
              {items.length ? (
                items.map((it: OrderItem, i: number) => {
                  const productId = safeStr(it?.productId);
                  const variantId = safeStr(it?.variantId);
                  const sku = safeStr(it?.sku);
                  const colorValue = safeStr(it?.color);
                  const colorLabel = safeStr(it?.colorLabel);
                  const qty = Number(it?.qty || 0);
                  const pricePaisa = Number(it?.pricePaisa || 0);
                  const lineTotalPaisa = qty * pricePaisa;

                  return (
                    <tr
                      key={`${productId}-${variantId || i}`}
                      className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 overflow-hidden rounded-[18px] border border-white/10 bg-[#0d0f17]">
                            <Image
                              src={getImageSrc(it?.image)}
                              alt={it?.name || "Product"}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="line-clamp-1 font-semibold text-white">
                              {it?.name || "-"}
                            </div>

                            {productId ? (
                              <div className="mt-1 max-w-[260px] truncate text-[11px] text-[#7f879f]">
                                Product ID: {productId}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {sku ? (
                            <div className="inline-flex max-w-[260px] rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff]">
                              <span className="truncate">SKU: {sku}</span>
                            </div>
                          ) : (
                            <div className="text-[12px] text-[#7f879f]">
                              No SKU
                            </div>
                          )}

                          {variantId ? (
                            <div className="max-w-[260px] truncate text-[11px] text-[#7f879f]">
                              Variant ID: {variantId}
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#7f879f]">
                              Legacy stock item
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {safeStr(it?.size) ? (
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white">
                            {safeStr(it.size)}
                          </span>
                        ) : (
                          <span className="text-[#a7aec4]">-</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {colorValue || colorLabel ? (
                          <div className="flex items-center gap-2">
                            {colorValue ? <ColorSwatch color={colorValue} /> : null}

                            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
                              {colorLabel || colorValue}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#a7aec4]">-</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center text-[#a7aec4]">
                        {qty || "-"}
                      </td>

                      <td className="px-5 py-4 text-right text-[#a7aec4]">
                        {formatNPR(pricePaisa)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-[#d6c7ff]">
                        {formatNPR(lineTotalPaisa)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-t border-[#26293a]">
                  <td colSpan={7} className="px-5 py-10 text-center text-[#a7aec4]">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${panelClass} p-5 sm:p-6`}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Lifecycle
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">
            Order Timeline
          </h2>

          <p className="mt-1 text-[13px] text-[#a7aec4]">
            Current lifecycle status of this order
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {timeline.map((t, index) => (
            <div key={t.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <TimelineDot status={t.status} />

                {index !== timeline.length - 1 ? (
                  <div className="mt-2 h-10 w-px bg-[#26293a]" />
                ) : null}
              </div>

              <div className="pt-1">
                <div className="text-[14px] font-semibold text-white">
                  {t.label}
                </div>

                <div className="mt-1 text-[12px] text-[#a7aec4]">{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}