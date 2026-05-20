"use client";

import * as React from "react";

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

type ColorItem = {
  value: string;
  label: string;
};

function ColorDot({ color }: { color: string }) {
  const ref = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.style.backgroundColor = color;
  }, [color]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="h-5 w-5 shrink-0 rounded-full border border-white/30"
    />
  );
}

export default function ProductColorSelector({
  colors,
  selectedColor,
  hasVariantInventory,
  activeVariants,
  totalProductStock,
  handleColorSelect,
}: {
  colors: ColorItem[];
  selectedColor: string;
  hasVariantInventory: boolean;
  activeVariants: ProductVariant[];
  totalProductStock: number;
  handleColorSelect: (color: string) => void;
}) {
  if (colors.length === 0) return null;

  return (
    <div className="mt-7">
      <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
        Color
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {colors.map((color) => {
          const active = selectedColor === color.value;

          const colorStock = hasVariantInventory
            ? activeVariants
                .filter((variant) => variant.color === color.value)
                .reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
            : totalProductStock;

          const disabled = colorStock <= 0;

          return (
            <button
              key={`${color.value}-${color.label}`}
              type="button"
              onClick={() => handleColorSelect(color.value)}
              disabled={disabled}
              title={color.label}
              aria-label={`Color ${color.label}`}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 transition ${
                disabled
                  ? "cursor-not-allowed border-[#374151] bg-[#111827] opacity-60"
                  : active
                    ? "border-white bg-white/10"
                    : "border-white/15 bg-white/5 hover:bg-white/10"
              }`}
            >
              <ColorDot color={color.value} />

              <span className="text-[13px] font-semibold text-white">
                {color.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { ColorDot };