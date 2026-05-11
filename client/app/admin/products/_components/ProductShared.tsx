"use client";

import * as React from "react";
import Image from "next/image";
import {
  ProductStatus,
  ProductVariantForm,
  SIZE_OPTIONS,
  Size,
  ToastState,
  getImageSrc,
  getTotalVariantStock,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./productTypes";

export function ColorSwatch({ color }: { color: string }) {
  const ref = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.style.backgroundColor = color;
  }, [color]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="h-3 w-3 rounded-full border border-white/20"
    />
  );
}

export function MetricCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

export function UploadBox({
  title,
  description,
  onClick,
  children,
}: {
  title: string;
  description: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="cursor-pointer rounded-[20px] border border-dashed border-[#3a3f58] bg-[#0d0f17] p-5 transition hover:border-[#d6c7ff]/50 hover:bg-white/[0.03]"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={title}
      title={title}
    >
      <div className="text-[13px] font-semibold text-white">{title}</div>

      <div className="mt-1 text-[12px] leading-6 text-[#a7aec4]">
        {description}
      </div>

      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        status === "Active"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
          : "border-slate-400/20 bg-slate-500/15 text-slate-300",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const out = stock <= 0;
  const low = stock > 0 && stock <= 5;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        out
          ? "border-red-400/20 bg-red-500/15 text-red-300"
          : low
            ? "border-amber-400/20 bg-amber-500/15 text-amber-300"
            : "border-white/10 bg-white/5 text-[#a7aec4]",
      ].join(" ")}
    >
      {stock} left
    </span>
  );
}

export function ProductSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  canCreate,
  onCreate,
}: {
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/product.png"
          alt="Products"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No products found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Add your first product or adjust your search and status filters.
      </p>

      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className={`${primaryBtnClass} mt-5`}
        >
          Add Product
        </button>
      ) : null}
    </div>
  );
}

export function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px]">
        🔎
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No matching products
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Try changing the search keyword or status filter.
      </p>

      <button
        type="button"
        onClick={onClear}
        className={`${secondaryBtnClass} mt-5`}
      >
        Clear Filter
      </button>
    </div>
  );
}

export function Toast({ toast }: { toast: Exclude<ToastState, null> }) {
  return (
    <div
      className={[
        "fixed bottom-5 right-5 z-[1200] max-w-[360px] rounded-[18px] border px-5 py-4 text-[13px] font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur",
        toast.type === "success"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
          : toast.type === "error"
            ? "border-red-400/20 bg-red-500/15 text-red-200"
            : "border-[#8b5cf6]/30 bg-[#8b5cf6]/15 text-[#e9ddff]",
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}

export function VariantInventoryEditor({
  variants,
  name,
  onAdd,
  onRemove,
  onChange,
  onGenerateSku,
}: {
  variants: ProductVariantForm[];
  name: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<ProductVariantForm>) => void;
  onGenerateSku: (index: number) => void;
}) {
  const totalStock = getTotalVariantStock(variants);

  const lowStockCount = variants.filter(
    (variant) =>
      variant.isActive &&
      Number(variant.stock || 0) > 0 &&
      Number(variant.stock || 0) <= 5
  ).length;

  const outOfStockCount = variants.filter(
    (variant) => variant.isActive && Number(variant.stock || 0) <= 0
  ).length;

  return (
    <section className="rounded-[22px] border border-[#26293a] bg-[#0d0f17] p-4 sm:p-5">
      <div className="flex flex-col gap-4 border-b border-[#26293a] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
            Product Variants & Stock
          </div>

          <div className="mt-1 text-[13px] leading-6 text-[#7f879f]">
            Manage stock separately for every color and size combination.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white">
            Total: {totalStock}
          </span>

          <span className="rounded-full border border-amber-400/20 bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold text-amber-300">
            Low: {lowStockCount}
          </span>

          <span className="rounded-full border border-red-400/20 bg-red-500/15 px-3 py-1.5 text-[11px] font-semibold text-red-300">
            Out: {outOfStockCount}
          </span>

          <button type="button" onClick={onAdd} className={secondaryBtnClass}>
            Add Variant
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-[#a7aec4]">
              <th className="px-3 py-3 font-medium">Color</th>
              <th className="px-3 py-3 font-medium">Size</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium">SKU</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {variants.map((variant, index) => (
              <tr
                key={`${variant.id || "variant"}-${index}`}
                className="border-t border-[#26293a]"
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      title={`Variant color ${index + 1}`}
                      aria-label={`Variant color ${index + 1}`}
                      type="color"
                      value={
                        /^#([0-9a-fA-F]{6})$/.test(variant.color)
                          ? variant.color
                          : "#000000"
                      }
                      onChange={(e) =>
                        onChange(index, {
                          color: e.target.value.toLowerCase(),
                        })
                      }
                      className="h-10 w-12 cursor-pointer rounded-[12px] border border-white/10 bg-transparent"
                    />

                    <input
                      title={`Variant color code ${index + 1}`}
                      aria-label={`Variant color code ${index + 1}`}
                      className={`${inputClass} h-10 min-w-[120px]`}
                      value={variant.color}
                      placeholder="#000000"
                      onChange={(e) =>
                        onChange(index, {
                          color: e.target.value.toLowerCase(),
                        })
                      }
                    />
                  </div>
                </td>

                <td className="px-3 py-3">
                  <select
                    title={`Variant size ${index + 1}`}
                    aria-label={`Variant size ${index + 1}`}
                    className={`${inputClass} h-10 min-w-[96px]`}
                    value={variant.size}
                    onChange={(e) =>
                      onChange(index, {
                        size: e.target.value as Size,
                      })
                    }
                  >
                    {SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-3 py-3">
                  <input
                    title={`Variant stock ${index + 1}`}
                    aria-label={`Variant stock ${index + 1}`}
                    type="number"
                    min={0}
                    className={`${inputClass} h-10 min-w-[110px]`}
                    value={variant.stock}
                    onChange={(e) =>
                      onChange(index, {
                        stock:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      title={`Variant SKU ${index + 1}`}
                      aria-label={`Variant SKU ${index + 1}`}
                      className={`${inputClass} h-10 min-w-[210px]`}
                      value={variant.sku}
                      placeholder="UFO-HOOD-BLK-M"
                      onChange={(e) =>
                        onChange(index, {
                          sku: e.target.value.toUpperCase(),
                        })
                      }
                    />

                    <button
                      type="button"
                      onClick={() => onGenerateSku(index)}
                      disabled={!name.trim()}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Auto
                    </button>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      onChange(index, {
                        isActive: !variant.isActive,
                      })
                    }
                    className={[
                      "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                      variant.isActive
                        ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                        : "border-slate-400/20 bg-slate-500/15 text-slate-300",
                    ].join(" ")}
                  >
                    {variant.isActive ? "Active" : "Inactive"}
                  </button>
                </td>

                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={variants.length <= 1}
                    className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 rounded-[16px] border border-[#26293a] bg-white/[0.03] px-4 py-3 text-[12px] leading-6 text-[#a7aec4]">
        Example: Black + M can have 10 stock, Black + L can have 5 stock, and
        White + M can have 8 stock. The product total stock is calculated
        automatically from active variants.
      </p>
    </section>
  );
}