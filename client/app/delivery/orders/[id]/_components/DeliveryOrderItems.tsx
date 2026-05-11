"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  formatNPR,
  safeStr,
} from "@/app/lib/delivery";
import {
  getColorDotClass,
  panelClass,
} from "./deliveryOrderTypes";
import { MobileInfo } from "./DeliveryOrderShared";

type Props = {
  items: any[];
};

export default function DeliveryOrderItems({ items }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`${panelClass} min-w-0 max-w-full overflow-hidden`}
    >
      <div className="border-b border-[#26293a] px-5 py-4 sm:px-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          Products
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">
          Order Items
        </h2>

        <p className="mt-1 text-[13px] text-[#a7aec4]">
          Product variant, SKU, quantity, color, size, and pricing
        </p>
      </div>

      <div className="hidden max-w-full overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] border-collapse text-[13px] xl:min-w-[1120px]">
          <thead>
            <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
              <th className="px-4 py-4 font-medium xl:px-5">Product</th>
              <th className="px-4 py-4 font-medium xl:px-5">Variant / SKU</th>
              <th className="px-4 py-4 font-medium xl:px-5">Size</th>
              <th className="px-4 py-4 font-medium xl:px-5">Color</th>
              <th className="px-4 py-4 text-center font-medium xl:px-5">
                Qty
              </th>
              <th className="px-4 py-4 text-right font-medium xl:px-5">
                Price
              </th>
              <th className="px-4 py-4 text-right font-medium xl:px-5">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {items.length ? (
              items.map((it: any, i: number) => {
                const productId = safeStr(it?.productId);
                const variantId = safeStr(it?.variantId);
                const sku = safeStr(it?.sku);
                const colorValue = safeStr(it?.color);
                const colorLabel = safeStr(it?.colorLabel);
                const colorClass = getColorDotClass(colorValue || colorLabel);
                const qty = Number(it?.qty || 0);
                const pricePaisa = Number(it?.pricePaisa || 0);
                const lineTotalPaisa = qty * pricePaisa;

                return (
                  <motion.tr
                    key={`${productId}-${variantId || i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.035,
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-4 xl:px-5">
                      <div className="max-w-[240px] truncate font-semibold text-white">
                        {it?.name || "-"}
                      </div>

                      {productId ? (
                        <div className="mt-1 max-w-[240px] truncate text-xs text-[#7f879f]">
                          Product ID: {productId}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 xl:px-5">
                      <div className="space-y-1">
                        {sku ? (
                          <div className="inline-flex max-w-[220px] rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff]">
                            <span className="truncate">SKU: {sku}</span>
                          </div>
                        ) : (
                          <div className="text-[12px] text-[#7f879f]">
                            No SKU
                          </div>
                        )}

                        {variantId ? (
                          <div className="max-w-[220px] truncate text-[11px] text-[#7f879f]">
                            Variant ID: {variantId}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#7f879f]">
                            Legacy stock item
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 xl:px-5">
                      {safeStr(it?.size) ? (
                        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white">
                          {safeStr(it.size)}
                        </span>
                      ) : (
                        <span className="text-[#d1d5db]">-</span>
                      )}
                    </td>

                    <td className="px-4 py-4 xl:px-5">
                      {colorValue || colorLabel ? (
                        <div className="flex items-center gap-2 text-[#d1d5db]">
                          <span
                            className={`h-4 w-4 shrink-0 rounded-full border border-white/20 ${colorClass}`}
                            aria-hidden="true"
                          />

                          <span className="max-w-[120px] truncate">
                            {colorLabel || colorValue}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#d1d5db]">-</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center text-[#d1d5db] xl:px-5">
                      {qty || "-"}
                    </td>

                    <td className="px-4 py-4 text-right text-[#d1d5db] xl:px-5">
                      {formatNPR(pricePaisa)}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-[#d6c7ff] xl:px-5">
                      {formatNPR(lineTotalPaisa)}
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-[#a7aec4]">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 lg:hidden">
        {items.length ? (
          items.map((it: any, i: number) => {
            const productId = safeStr(it?.productId);
            const variantId = safeStr(it?.variantId);
            const sku = safeStr(it?.sku);
            const colorValue = safeStr(it?.color);
            const colorLabel = safeStr(it?.colorLabel);
            const colorClass = getColorDotClass(colorValue || colorLabel);
            const qty = Number(it?.qty || 0);
            const pricePaisa = Number(it?.pricePaisa || 0);
            const lineTotalPaisa = qty * pricePaisa;

            return (
              <motion.div
                key={`${productId}-${variantId || i}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.035,
                  duration: 0.35,
                  ease: "easeOut",
                }}
                className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="font-semibold text-white">{it?.name || "-"}</div>

                {productId ? (
                  <div className="mt-1 break-all text-xs text-[#7f879f]">
                    Product ID: {productId}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3">
                  <MobileInfo
                    label="SKU"
                    value={
                      sku ? (
                        <span className="break-all text-[#d6c7ff]">{sku}</span>
                      ) : (
                        "-"
                      )
                    }
                  />

                  <MobileInfo
                    label="Variant ID"
                    value={
                      variantId ? (
                        <span className="break-all">{variantId}</span>
                      ) : (
                        "Legacy stock item"
                      )
                    }
                  />

                  <MobileInfo label="Size" value={safeStr(it?.size) || "-"} />

                  <MobileInfo
                    label="Color"
                    value={
                      colorValue || colorLabel ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`h-4 w-4 shrink-0 rounded-full border border-white/20 ${colorClass}`}
                            aria-hidden="true"
                          />
                          {colorLabel || colorValue}
                        </span>
                      ) : (
                        "-"
                      )
                    }
                  />

                  <MobileInfo label="Qty" value={qty || "-"} />

                  <MobileInfo label="Price" value={formatNPR(pricePaisa)} />

                  <MobileInfo
                    label="Line Total"
                    value={formatNPR(lineTotalPaisa)}
                  />
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-8 text-center text-[13px] text-[#a7aec4]">
            No items found.
          </div>
        )}
      </div>
    </motion.section>
  );
}