"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";

type CartItem = {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  size: string;
  color: string;
  colorLabel: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  qty: number;
  image: string;
  stock?: number;
  totalProductStock?: number;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const fallbackProductImage = "/images/product-placeholder.png";

function formatNpr(value: number) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(Number(value || 0))))}`;
}

function normalizeColorKey(color: string) {
  return String(color || "").trim().toLowerCase();
}

function hasRealStockValue(stock: unknown) {
  return typeof stock === "number" && Number.isFinite(stock);
}

function getCartItemKey(
  item: Pick<CartItem, "id" | "variantId" | "size" | "color">
) {
  if (item.variantId) return `variant:${item.variantId}`;

  return `product:${item.id}|size:${item.size}|color:${normalizeColorKey(
    item.color
  )}`;
}

function ColorSwatch({ color }: { color: string }) {
  const ref = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.style.backgroundColor = color || "#16191f";
  }, [color]);

  return (
    <span
      ref={ref}
      className="h-4 w-4 shrink-0 rounded-full border border-[#3a3f58]"
      aria-hidden="true"
    />
  );
}

export default function CartItems({
  items,
  updateQty,
  removeItem,
}: {
  items: CartItem[];
  updateQty: (itemKey: string, qty: number) => void;
  removeItem: (itemKey: string) => void;
}) {
  const { t } = useI18n();

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="hidden grid-cols-[1.5fr_0.65fr_0.85fr_0.9fr_0.9fr_0.35fr] gap-4 border-b border-[#26293a] px-6 py-4 text-[12px] uppercase tracking-[0.14em] text-[#a7aec4] md:grid">
        <div>{t("cart.product")}</div>
        <div>{t("cart.size")}</div>
        <div>{t("cart.color")}</div>
        <div className="text-center">{t("cart.quantity")}</div>
        <div>{t("cart.total")}</div>
        <div />
      </div>

      {items.map((it) => {
        const itemKey = getCartItemKey(it);
        const productId = it.productId || it.id;
        const hasKnownStock = hasRealStockValue(it.stock);
        const stock = Number(it.stock || 0);
        const qty = Number(it.qty || 0);
        const itemTotal = Number(it.price || 0) * qty;
        const compareAtPrice = Number(it.compareAtPrice || 0);
        const compareAtTotal = compareAtPrice * qty;
        const hasDiscount = compareAtPrice > Number(it.price || 0);
        const imageSrc = it.image || fallbackProductImage;

        const itemHasStockIssue = hasKnownStock && (stock <= 0 || qty > stock);

        const lowStockText =
          hasKnownStock && stock > 0 && stock <= 5
            ? `${t("cart.onlyLeft")} ${stock} ${t("cart.left")} 🔥`
            : "";

        const stockText =
          stock <= 0
            ? t("cart.outOfStock")
            : lowStockText || `${stock} ${t("cart.inStock")}`;

        return (
          <div
            key={itemKey}
            className={`border-b px-4 py-5 last:border-0 sm:px-5 md:px-6 md:py-6 ${
              itemHasStockIssue
                ? "border-red-400/20 bg-red-500/5"
                : "border-[#1b2034]"
            }`}
          >
            <div className="hidden grid-cols-[1.5fr_0.65fr_0.85fr_0.9fr_0.9fr_0.35fr] items-center gap-4 md:grid">
              <div className="flex min-w-0 items-center gap-4">
                <Link
                  href={`/product/${productId}`}
                  className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[18px] border border-[#2b2f45] bg-[#0d0f17]"
                >
                  <Image
                    src={imageSrc}
                    alt={it.name}
                    fill
                    className={`object-cover ${
                      itemHasStockIssue ? "opacity-50 grayscale" : ""
                    }`}
                    sizes="72px"
                  />
                </Link>

                <div className="min-w-0">
                  <Link
                    href={`/product/${productId}`}
                    className="block truncate font-medium text-white transition hover:text-[#d6c7ff]"
                  >
                    {it.name}
                  </Link>

                  <div className="mt-1 text-[12px] text-[#a7aec4]">
                    {formatNpr(it.price)} × {it.qty} = {formatNpr(itemTotal)}
                  </div>

                  {hasDiscount ? (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-[#7f879f] line-through">
                        {formatNpr(compareAtPrice)}
                      </span>

                      <span className="font-semibold text-orange-300">
                        -{Number(it.discountPercent || 0)}%
                      </span>
                    </div>
                  ) : null}

                  {it.sku ? (
                    <div className="mt-1 text-[11px] text-[#7f879f]">
                      {t("cart.sku")}: {it.sku}
                    </div>
                  ) : null}

                  {hasKnownStock ? (
                    <div
                      className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        itemHasStockIssue
                          ? "text-red-300"
                          : lowStockText
                            ? "text-orange-300"
                            : "text-emerald-300"
                      }`}
                    >
                      {stockText}
                    </div>
                  ) : null}
                </div>
              </div>

              <span className="text-[#d6dbeb]">{it.size || "-"}</span>

              <div className="flex items-center gap-2">
                <ColorSwatch color={it.color} />

                <span className="truncate text-[#d6dbeb]">
                  {it.colorLabel || t("cart.color")}
                </span>
              </div>

              <div className="flex justify-center">
                <div className="flex items-center rounded-full border border-[#3a3f58] bg-[#0d0f17] p-1">
                  <button
                    type="button"
                    onClick={() => updateQty(itemKey, Number(it.qty || 1) - 1)}
                    disabled={hasKnownStock && stock <= 0}
                    className="h-8 w-8 rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Decrease quantity for ${it.name}`}
                  >
                    -
                  </button>

                  <span className="min-w-[38px] text-center text-sm font-semibold text-white">
                    {it.qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQty(itemKey, Number(it.qty || 1) + 1)}
                    disabled={hasKnownStock && stock <= 0}
                    className="h-8 w-8 rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Increase quantity for ${it.name}`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div className="font-semibold text-[#d6c7ff]">
                  {formatNpr(itemTotal)}
                </div>

                {hasDiscount ? (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[#7f879f] line-through">
                      {formatNpr(compareAtTotal)}
                    </span>

                    <span className="font-semibold text-orange-300">
                      -{Number(it.discountPercent || 0)}%
                    </span>
                  </div>
                ) : null}

                <div className="mt-1 text-[11px] text-[#a7aec4]">
                  {formatNpr(it.price)} × {it.qty}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeItem(itemKey)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-red-500/15"
                aria-label={`Remove ${it.name} from cart`}
              >
                <Image
                  src="/images/delete.png"
                  width={18}
                  height={18}
                  alt="Remove icon"
                  className="brightness-0 invert"
                />
              </button>
            </div>

            <div className="flex gap-4 md:hidden">
              <Link
                href={`/product/${productId}`}
                className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[18px] border border-[#2b2f45] bg-[#0d0f17]"
              >
                <Image
                  src={imageSrc}
                  alt={it.name}
                  fill
                  className={`object-cover ${
                    itemHasStockIssue ? "opacity-50 grayscale" : ""
                  }`}
                  sizes="88px"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${productId}`}
                  className="block truncate text-[15px] font-semibold text-white transition hover:text-[#d6c7ff]"
                >
                  {it.name}
                </Link>

                {hasKnownStock ? (
                  <div
                    className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      itemHasStockIssue
                        ? "text-red-300"
                        : lowStockText
                          ? "text-orange-300"
                          : "text-emerald-300"
                    }`}
                  >
                    {stockText}
                  </div>
                ) : null}

                <div className="mt-2 grid gap-1 text-sm text-[#a7aec4]">
                  <div>
                    {t("cart.size")}: {it.size || "-"}
                  </div>

                  <div className="flex items-center gap-2">
                    <span>{t("cart.color")}:</span>

                    <ColorSwatch color={it.color} />

                    <span className="truncate">
                      {it.colorLabel || t("cart.color")}
                    </span>
                  </div>

                  {it.sku ? (
                    <div className="text-[12px] text-[#7f879f]">
                      {t("cart.sku")}: {it.sku}
                    </div>
                  ) : null}

                  <div>
                    <div className="font-semibold text-[#d6c7ff]">
                      {formatNpr(it.price)} × {it.qty} = {formatNpr(itemTotal)}
                    </div>

                    {hasDiscount ? (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-[#7f879f] line-through">
                          {formatNpr(compareAtTotal)}
                        </span>

                        <span className="font-semibold text-orange-300">
                          -{Number(it.discountPercent || 0)}%
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-full border border-[#3a3f58] bg-[#0d0f17] p-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateQty(itemKey, Number(it.qty || 1) - 1)
                      }
                      disabled={hasKnownStock && stock <= 0}
                      className="h-8 w-8 rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Decrease quantity for ${it.name}`}
                    >
                      -
                    </button>

                    <span className="min-w-[38px] text-center text-sm font-semibold text-white">
                      {it.qty}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQty(itemKey, Number(it.qty || 1) + 1)
                      }
                      disabled={hasKnownStock && stock <= 0}
                      className="h-8 w-8 rounded-full text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Increase quantity for ${it.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(itemKey)}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-red-500/15"
                  >
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}