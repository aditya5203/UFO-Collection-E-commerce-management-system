"use client";

import { API_URL } from "@/lib/api";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";

type CustomerType = "Men" | "Women" | "Boys" | "Girls";

type Product = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  discountPercent: number;
  image: string;
  customer?: CustomerType;
  subCategory?: string;
  createdAt?: string;
  gender?: "Male" | "Female";
  colors?: string[];
  categoryId?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 sm:px-6 sm:py-3";

const productGridMotion = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const productCardMotion = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
};

function resolveMediaSrc(src: unknown) {
  const s = typeof src === "string" ? src.trim() : "";

  if (!s) return "/images/placeholder.png";

  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }

  if (s.startsWith("/")) {
    return s;
  }

  const API_BASE =
    API_URL;

  const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

  return `${API_ORIGIN}/${s.replace(/^\/+/, "")}`;
}

function formatPrice(value: number | undefined) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ProductCard({
  product,
  onOutOfStockClick,
  onInvalidProductClick,
}: {
  product: Product;
  onOutOfStockClick: () => void;
  onInvalidProductClick: () => void;
}) {
  const { t } = useI18n();

  const stockCount = Number(product.stock || 0);
  const isOutOfStock = stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;
  const hasValidId = Boolean(product.id);

  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;

  const card = (
    <motion.div
      variants={productCardMotion}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={
        isOutOfStock
          ? undefined
          : {
              y: -8,
              scale: 1.015,
              transition: { type: "spring", stiffness: 260, damping: 20 },
            }
      }
      className={`overflow-hidden rounded-[22px] border bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)] ${
        isOutOfStock
          ? "border-red-400/25"
          : "border-[#26293a] hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
      }`}
    >
      <div className="relative aspect-[3.6/5] w-full overflow-hidden bg-[#0d0f17]">
        <Image
          src={resolveMediaSrc(product.image)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition duration-500 group-hover:scale-[1.06] ${
            isOutOfStock ? "opacity-45 grayscale" : ""
          }`}
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.customer ? (
            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
              {product.customer}
            </span>
          ) : null}
        </div>

        {hasDiscount ? (
          <div className="absolute right-3 top-3 rounded-full border border-orange-300/25 bg-orange-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_30px_rgba(249,115,22,0.3)] backdrop-blur">
            -{product.discountPercent}%
          </div>
        ) : null}

        {isOutOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full border border-red-300/40 bg-red-500/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-red-100 backdrop-blur">
              {t("collection.outOfStock")}
            </span>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 right-3 translate-y-2 rounded-full bg-white px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#090a12] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {t("collection.viewProduct")}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c8cde0]">
            {product.subCategory || t("collection.fashion")}
          </span>
        </div>

        <div className="line-clamp-2 min-h-[46px] text-[15px] font-medium leading-6 text-[#f5f7fb] sm:text-[16px]">
          {product.name}
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-[#d6c7ff] sm:text-[15px]">
              {formatPrice(product.price)}
            </div>

            {hasDiscount ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px]">
                <span className="text-[#7f879f] line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>

                <span className="font-semibold text-orange-300">
                  -{product.discountPercent}%
                </span>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 text-[12px] text-[#a7aec4]">
            ★ {Number(product.rating || 0).toFixed(1)}
            <span className="ml-1">({Number(product.reviews || 0)})</span>
          </div>
        </div>

        <div
          className={`mt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            isOutOfStock
              ? "text-red-300"
              : isLowStock
                ? "text-yellow-300"
                : "text-emerald-300"
          }`}
        >
          {isOutOfStock
            ? t("collection.outOfStock")
            : isLowStock
              ? `${t("collection.onlyLeft")} ${stockCount} ${t(
                  "collection.left"
                )}`
              : `${stockCount} ${t("collection.inStock")}`}
        </div>
      </div>
    </motion.div>
  );

  if (isOutOfStock) {
    return (
      <button
        type="button"
        onClick={onOutOfStockClick}
        className="group block w-full text-left"
        aria-label={`${product.name} is out of stock`}
      >
        {card}
      </button>
    );
  }

  if (!hasValidId) {
    return (
      <button
        type="button"
        onClick={onInvalidProductClick}
        className="group block w-full text-left"
        aria-label={`${product.name} is unavailable`}
      >
        {card}
      </button>
    );
  }

  return (
    <Link href={`/product/${product.id}`} className="group block">
      {card}
    </Link>
  );
}

export default function ProductGrid({
  loading,
  error,
  products,
  onRetry,
  onResetFilters,
  onOutOfStockClick,
  onInvalidProductClick,
}: {
  loading: boolean;
  error: string | null;
  products: Product[];
  onRetry: () => void;
  onResetFilters: () => void;
  onOutOfStockClick: () => void;
  onInvalidProductClick: () => void;
}) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[22px] border border-[#26293a] bg-[#161824]"
          >
            <div className="aspect-[3.6/5] animate-pulse bg-white/5" />

            <div className="p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-5 text-[14px] text-red-200">
        <div>{`${t("collection.error")}: ${error}`}</div>

        <button
          type="button"
          onClick={onRetry}
          className={`${primaryBtnClass} mt-4`}
        >
          {t("collection.retry")}
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`${panelClass} p-8 text-center`}>
        <div className="text-[22px] font-semibold text-white">
          {t("collection.noProductsFound")}
        </div>

        <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-7 text-[#a7aec4]">
          {t("collection.noProductsDesc")}
        </p>

        <button
          type="button"
          onClick={onResetFilters}
          className={`${primaryBtnClass} mt-5`}
        >
          {t("collection.resetFilters")}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={productGridMotion}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6"
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id || `${product.name}-${index}`}
          product={product}
          onOutOfStockClick={onOutOfStockClick}
          onInvalidProductClick={onInvalidProductClick}
        />
      ))}
    </motion.div>
  );
}