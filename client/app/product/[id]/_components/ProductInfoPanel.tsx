"use client";

import ProductSizeSelector from "./ProductSizeSelector";
import ProductColorSelector from "./ProductColorSelector";

type Size = "S" | "M" | "L" | "XL" | "XXL";

type ProductVariant = {
  id: string;
  color: string;
  size: Size;
  stock: number;
  sku?: string;
  isActive: boolean;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  shortDesc?: string;
  longDesc?: string;
  sizes?: Size[];
  colors?: string[];
  stock?: number;
  variants?: ProductVariant[];
};

type ColorItem = {
  value: string;
  label: string;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

export default function ProductInfoPanel({
  product,
  descriptionPoints,
  displayRating,
  displayReviewCount,
  hasVariantInventory,
  totalProductStock,
  selectedVariant,
  selectedVariantStock,
  isOutOfStock,
  stockText,
  sizes,
  selectedSize,
  setSelectedSize,
  colors,
  selectedColor,
  activeVariants,
  handleColorSelect,
  addToCart,
  handleBuyNow,
  openAi,
  shareProduct,
  copyProductLink,
}: {
  product: Product;
  descriptionPoints: string[];
  displayRating: number;
  displayReviewCount: number;
  hasVariantInventory: boolean;
  totalProductStock: number;
  selectedVariant: ProductVariant | null;
  selectedVariantStock: number;
  isOutOfStock: boolean;
  stockText: string;
  sizes: Size[];
  selectedSize: Size;
  setSelectedSize: (size: Size) => void;
  colors: ColorItem[];
  selectedColor: string;
  activeVariants: ProductVariant[];
  handleColorSelect: (color: string) => void;
  addToCart: () => boolean;
  handleBuyNow: () => void;
  openAi: () => void;
  shareProduct: () => void;
  copyProductLink: () => void;
}) {
  return (
    <div className={`${panelClass} p-5 sm:p-7 lg:p-8`}>
      <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
        Product Details
      </div>

      <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[42px]">
        {product.name}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-semibold text-white">
          ★ {displayRating.toFixed(1)}
        </span>

        <span className="text-[13px] text-[#a7aec4]">
          {displayReviewCount} reviews
        </span>

        {hasVariantInventory ? (
          <span className="rounded-full border border-[#d6c7ff]/30 bg-[#d6c7ff]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#d6c7ff]">
            Variant stock enabled
          </span>
        ) : null}
      </div>

      <div className="mt-5 text-[26px] font-semibold text-[#d6c7ff]">
        Rs. {Number(product.price || 0).toLocaleString("en-NP")}
      </div>

      <div
        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
          isOutOfStock
            ? "border-red-400/30 bg-red-500/10 text-red-200"
            : selectedVariantStock <= 5
              ? "border-orange-400/30 bg-orange-500/10 text-orange-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
        }`}
      >
        {stockText}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#a7aec4]">
        <span>Total product stock: {totalProductStock}</span>

        {selectedVariant?.sku ? (
          <>
            <span className="text-[#4a506b]">•</span>
            <span>SKU: {selectedVariant.sku}</span>
          </>
        ) : null}
      </div>

      <div className="mt-5 rounded-[20px] border border-[#26293a] bg-[#0d0f17]/70 p-4">
        {descriptionPoints.length > 0 ? (
          <ul className="space-y-2.5">
            {descriptionPoints.map((point, index) => (
              <li
                key={`${point}-${index}`}
                className="flex gap-3 text-[14px] leading-7 text-[#a7aec4]"
              >
                <span className="mt-[10px] h-2 w-2 shrink-0 rounded-full bg-[#d6c7ff]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] leading-7 text-[#7f879f]">
            No product description has been added for this product yet.
          </p>
        )}
      </div>

      <ProductSizeSelector
        sizes={sizes}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        hasVariantInventory={hasVariantInventory}
        activeVariants={activeVariants}
        selectedColor={selectedColor}
        totalProductStock={totalProductStock}
      />

      <ProductColorSelector
        colors={colors}
        selectedColor={selectedColor}
        hasVariantInventory={hasVariantInventory}
        activeVariants={activeVariants}
        totalProductStock={totalProductStock}
        handleColorSelect={handleColorSelect}
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={addToCart}
          disabled={isOutOfStock}
          className={primaryBtnClass}
        >
          {isOutOfStock ? "Out Of Stock" : "Add To Cart"}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="rounded-full bg-[#8b5cf6] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200 disabled:hover:translate-y-0"
        >
          Buy Now
        </button>

        <button type="button" onClick={openAi} className={secondaryBtnClass}>
          Try On With AI
        </button>

        <button type="button" onClick={shareProduct} className={secondaryBtnClass}>
          Share Product
        </button>
      </div>

      <button
        type="button"
        onClick={copyProductLink}
        className="mt-3 text-[13px] font-semibold text-[#a7aec4] transition hover:text-white"
      >
        Copy product link
      </button>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          ["Original", "100% original products"],
          ["COD", "Cash on delivery"],
          ["Return", "7 days easy return"],
        ].map(([title, text]) => (
          <div key={title} className={`${softPanelClass} p-4`}>
            <div className="text-[13px] font-semibold text-white">{title}</div>

            <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
              {text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}