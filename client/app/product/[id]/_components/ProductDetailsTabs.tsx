"use client";

import * as React from "react";
import { ColorDot } from "./ProductColorSelector";

type Size = "S" | "M" | "L" | "XL" | "XXL";
type ReviewSort = "latest" | "highest" | "lowest";

type ProductVariant = {
  id: string;
  color: string;
  size: Size;
  stock: number;
  sku?: string;
  isActive: boolean;
};

type Review = {
  id?: string;
  _id?: string;
  orderCode: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt?: string;
};

type ColorItem = {
  value: string;
  label: string;
};

const FIXED_DESCRIPTION =
  "UFO Collection is an e-commerce website that allows customers to browse and purchase products online with ease. It functions as a digital marketplace where products are organized into well-defined collections, such as clothing and accessories, enabling users to explore items efficiently. Each collection displays product images, names, prices, and brief details to help customers compare options quickly. When a product is selected from a collection, the user is taken to a dedicated product page that provides complete information, including descriptions, available sizes, colors, and pricing. UFO Collection offers a convenient, accessible, and user-friendly shopping experience, allowing customers to shop anytime and from anywhere with global reach.";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

function RatingBarFill({ percent }: { percent: number }) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
    ref.current.style.width = `${safePercent}%`;
  }, [percent]);

  return (
    <div
      ref={ref}
      className="h-full rounded-full bg-[#d6c7ff] transition-all duration-500"
    />
  );
}

export default function ProductDetailsTabs({
  activeTab,
  setActiveTab,
  displayReviewCount,
  displayRating,
  sizes,
  colors,
  stockText,
  selectedVariant,
  ratingBreakdown,
  reviewSort,
  setReviewSort,
  reviewsLoading,
  reviewsError,
  sortedReviews,
}: {
  activeTab: "description" | "reviews";
  setActiveTab: (tab: "description" | "reviews") => void;
  displayReviewCount: number;
  displayRating: number;
  sizes: Size[];
  colors: ColorItem[];
  stockText: string;
  selectedVariant: ProductVariant | null;
  ratingBreakdown: {
    star: number;
    count: number;
    percent: number;
  }[];
  reviewSort: ReviewSort;
  setReviewSort: (sort: ReviewSort) => void;
  reviewsLoading: boolean;
  reviewsError: string | null;
  sortedReviews: Review[];
}) {
  return (
    <section className={`${panelClass} mt-8 p-5 sm:p-7`}>
      <div className="flex gap-7 border-b border-[#26293a] text-[14px]">
        <button
          type="button"
          onClick={() => setActiveTab("description")}
          className={`pb-3 ${
            activeTab === "description"
              ? "border-b-2 border-white text-white"
              : "text-[#a7aec4]"
          }`}
        >
          Description
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 ${
            activeTab === "reviews"
              ? "border-b-2 border-white text-white"
              : "text-[#a7aec4]"
          }`}
        >
          Reviews ({displayReviewCount})
        </button>
      </div>

      <div className="mt-5 text-[14px] leading-7 text-[#a7aec4]">
        {activeTab === "description" ? (
          <div className="space-y-5">
            <div className={`${softPanelClass} p-5`}>
              <h3 className="text-[18px] font-semibold text-white">
                About UFO Collection
              </h3>

              <p className="mt-4 text-[14px] leading-7 text-[#a7aec4]">
                {FIXED_DESCRIPTION}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className={`${softPanelClass} p-4`}>
                <div className="text-[13px] font-semibold text-white">
                  Available Sizes
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`${softPanelClass} p-4`}>
                <div className="text-[13px] font-semibold text-white">
                  Available Colors
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {colors.length > 0 ? (
                    colors.map((color) => (
                      <span
                        key={`${color.value}-${color.label}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]"
                      >
                        <ColorDot color={color.value} />
                        {color.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#7f879f]">
                      Default
                    </span>
                  )}
                </div>
              </div>

              <div className={`${softPanelClass} p-4`}>
                <div className="text-[13px] font-semibold text-white">
                  Stock Status
                </div>

                <div className="mt-2 text-[12px] font-semibold text-[#d6c7ff]">
                  {stockText}
                </div>

                {selectedVariant?.sku ? (
                  <div className="mt-1 text-[11px] text-[#7f879f]">
                    SKU: {selectedVariant.sku}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className={`${softPanelClass} p-5`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-[32px] font-bold text-white">
                    {displayRating.toFixed(1)}
                    <span className="ml-2 text-base text-[#a7aec4]">/ 5</span>
                  </div>

                  <div className="mt-1 text-sm text-[#a7aec4]">
                    Based on {displayReviewCount} reviews
                  </div>
                </div>

                <div className="w-full max-w-[520px] space-y-2">
                  {ratingBreakdown.map((row) => (
                    <div key={row.star} className="flex items-center gap-3 text-xs">
                      <span className="w-10 text-white">{row.star}★</span>

                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <RatingBarFill percent={row.percent} />
                      </div>

                      <span className="w-8 text-right text-[#a7aec4]">
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>

                <select
                  value={reviewSort}
                  title="Sort reviews"
                  aria-label="Sort reviews"
                  onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                  className="rounded-full border border-white/15 bg-[#0d0f17] px-4 py-2 text-sm font-semibold text-white outline-none"
                >
                  <option value="latest">Latest</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>
            </div>

            {reviewsLoading ? (
              <div className={`${softPanelClass} p-4`}>Loading reviews...</div>
            ) : reviewsError ? (
              <div className="rounded-[18px] border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                {reviewsError}
              </div>
            ) : sortedReviews.length === 0 ? (
              <div className={`${softPanelClass} p-4`}>No reviews yet.</div>
            ) : (
              sortedReviews.map((r, index) => (
                <div
                  key={r.id || r._id || `${r.orderCode}-${index}`}
                  className={`${softPanelClass} p-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">
                        {r.title?.trim() ? r.title : "Review"}
                      </div>

                      {r.createdAt ? (
                        <div className="mt-1 text-xs text-[#a7aec4]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      ) : null}
                    </div>

                    <div className="font-semibold text-[#d6c7ff]">
                      {Number(r.rating || 0).toFixed(1)} / 5
                    </div>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-[#a7aec4]">
                    {r.comment?.trim() ? r.comment : "No comment provided."}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}