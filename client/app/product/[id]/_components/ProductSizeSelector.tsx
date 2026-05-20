"use client";

type Size =
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44"
  | "45";

type ProductVariant = {
  id: string;
  color: string;
  size: Size;
  stock: number;
  sku?: string;
  isActive: boolean;
};

export default function ProductSizeSelector({
  sizes,
  selectedSize,
  setSelectedSize,
  hasVariantInventory,
  activeVariants,
  selectedColor,
  totalProductStock,
}: {
  sizes: Size[];
  selectedSize: Size;
  setSelectedSize: (size: Size) => void;
  hasVariantInventory: boolean;
  activeVariants: ProductVariant[];
  selectedColor: string;
  totalProductStock: number;
}) {
  return (
    <div className="mt-7">
      <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
        Size
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {sizes.map((s) => {
          const active = selectedSize === s;

          const variantForSize = hasVariantInventory
            ? activeVariants.find(
                (variant) =>
                  variant.color === selectedColor && variant.size === s
              )
            : null;

          const disabled = hasVariantInventory
            ? !variantForSize || Number(variantForSize.stock || 0) <= 0
            : totalProductStock <= 0;

          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSize(s)}
              disabled={disabled}
              title={
                disabled
                  ? "This size is not available for selected color"
                  : `${s} available`
              }
              className={`min-w-[48px] rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
                disabled
                  ? "cursor-not-allowed border-[#374151] bg-[#111827] text-[#6b7280]"
                  : active
                    ? "border-white bg-white text-[#090a12]"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}