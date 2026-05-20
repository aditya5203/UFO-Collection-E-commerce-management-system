"use client";

import * as React from "react";
import Image from "next/image";
import {
  Product,
  ProductStatus,
  formatPriceNPR,
  getImageSrc,
  getVariantStats,
  panelClass,
  secondaryBtnClass,
} from "./productTypes";
import {
  ColorSwatch,
  EmptyState,
  NoResults,
  ProductSkeleton,
  StatusBadge,
  StockBadge,
} from "./ProductShared";

type Props = {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: ProductStatus | "All";
  setStatusFilter: React.Dispatch<React.SetStateAction<ProductStatus | "All">>;
  inactiveCount: number;
  statuses: (ProductStatus | "All")[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  openCreateModal: () => void;
  openEditModal: (product: Product) => void;
  requestDelete: (id: string) => void;
  clearFilters: () => void;
};

export default function ProductsTable({
  products,
  filteredProducts,
  loading,
  error,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  inactiveCount,
  statuses,
  canCreate,
  canEdit,
  canDelete,
  openCreateModal,
  openEditModal,
  requestDelete,
  clearFilters,
}: Props) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex flex-col gap-4 border-b border-[#26293a] px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Product List
          </div>

          <div className="mt-1 text-[20px] font-semibold text-white">
            All Products
          </div>

          <div className="mt-1 text-[12px] text-[#7f879f]">
            Inactive products: {inactiveCount}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-[46px] w-full items-center rounded-full border border-white/10 bg-white/5 px-4 sm:min-w-[300px]">
            <input
              id="product-search"
              name="product-search"
              title="Search products"
              aria-label="Search products"
              className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
              type="text"
              placeholder="Search by name or slug"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={secondaryBtnClass}
            onClick={() =>
              setStatusFilter((prev) => {
                const idx = statuses.indexOf(prev);
                return statuses[(idx + 1) % statuses.length];
              })
            }
          >
            {statusFilter === "All" ? "Status: All" : `Status: ${statusFilter}`}
          </button>

          {(search || statusFilter !== "All") && (
            <button
              type="button"
              className={secondaryBtnClass}
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="border-b border-[#26293a] px-5 py-4 text-[13px] text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <ProductSkeleton />
      ) : products.length === 0 ? (
        <EmptyState canCreate={canCreate} onCreate={openCreateModal} />
      ) : filteredProducts.length === 0 ? (
        <NoResults onClear={clearFilters} />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                  <th className="px-5 py-4 font-medium">Product</th>
                  <th className="px-5 py-4 font-medium">Details</th>
                  <th className="px-5 py-4 font-medium">Pricing</th>
                  <th className="px-5 py-4 font-medium">Inventory</th>
                  <th className="px-5 py-4 font-medium">Status</th>

                  {canEdit || canDelete ? (
                    <th className="px-5 py-4 font-medium">Actions</th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const stats = getVariantStats(product);
                  const hasDiscount =
                    typeof product.compareAtPrice === "number" &&
                    product.compareAtPrice > product.price;

                  return (
                    <tr
                      key={product.id}
                      className="border-t border-[#26293a] transition hover:bg-white/[0.035]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-[#0d0f17] shadow-[0_10px_28px_rgba(0,0,0,0.32)]">
                            <Image
                              src={getImageSrc(product.image)}
                              alt={product.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="line-clamp-1 text-[14px] font-semibold text-white">
                              {product.name}
                            </div>

                            <div className="mt-1 line-clamp-1 text-[12px] text-[#7f879f]">
                              {product.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-full border border-[#d6c7ff]/20 bg-[#d6c7ff]/10 px-2.5 py-1 text-[11px] font-semibold text-[#d6c7ff]">
                              {product.gender}
                            </span>

                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white">
                              {stats.variantCount || product.sizes.length} variants
                            </span>

                            {stats.lowStockVariants > 0 ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                                {stats.lowStockVariants} low
                              </span>
                            ) : null}

                            {stats.outOfStockVariants > 0 ? (
                              <span className="rounded-full border border-red-400/20 bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-300">
                                {stats.outOfStockVariants} out
                              </span>
                            ) : null}
                          </div>

                          <div className="flex max-w-[280px] flex-wrap gap-1.5">
                            {product.sizes?.slice(0, 6).map((s) => (
                              <span
                                key={`${product.id}-${s}`}
                                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]"
                              >
                                {s}
                              </span>
                            ))}

                            {product.sizes.length > 6 ? (
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]">
                                +{product.sizes.length - 6}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex max-w-[280px] flex-wrap gap-1.5">
                            {product.colors?.slice(0, 4).map((c, idx) => (
                              <span
                                key={`${product.id}-${c}-${idx}`}
                                title={c}
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]"
                              >
                                <ColorSwatch color={c} />
                                {c}
                              </span>
                            ))}

                            {product.colors.length > 4 ? (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]">
                                +{product.colors.length - 4}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="space-y-1">
                          <div className="text-[14px] font-semibold text-[#d6c7ff]">
                            {formatPriceNPR(product.price)}
                          </div>

                          {hasDiscount ? (
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="text-[#7f879f] line-through">
                                {formatPriceNPR(product.compareAtPrice || 0)}
                              </span>

                              <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 font-semibold text-orange-300">
                                -{product.discountPercent}%
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#7f879f]">
                              No discount
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <StockBadge stock={product.stock} />
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={product.status} />
                      </td>

                      {canEdit || canDelete ? (
                        <td className="px-5 py-5">
                          <div className="flex flex-wrap gap-2">
                            {canEdit ? (
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className={secondaryBtnClass}
                              >
                                Edit
                              </button>
                            ) : null}

                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() => requestDelete(product.id)}
                                className="rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-4 md:hidden">
            {filteredProducts.map((product) => {
              const stats = getVariantStats(product);
              const hasDiscount =
                typeof product.compareAtPrice === "number" &&
                product.compareAtPrice > product.price;

              return (
                <article
                  key={product.id}
                  className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-[#0d0f17]">
                      <Image
                        src={getImageSrc(product.image)}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[15px] font-semibold text-white">
                        {product.name}
                      </div>

                      <div className="mt-1 line-clamp-1 text-[12px] text-[#7f879f]">
                        {product.slug}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge status={product.status} />
                        <StockBadge stock={product.stock} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-[18px] border border-white/10 bg-black/10 p-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#7f879f]">
                        Pricing
                      </div>

                      <div className="mt-1 font-semibold text-[#d6c7ff]">
                        {formatPriceNPR(product.price)}
                      </div>

                      {hasDiscount ? (
                        <div className="mt-1 flex items-center gap-2 text-[11px]">
                          <span className="text-[#7f879f] line-through">
                            {formatPriceNPR(product.compareAtPrice || 0)}
                          </span>

                          <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 font-semibold text-orange-300">
                            -{product.discountPercent}%
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#7f879f]">
                        Details
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-[#d6c7ff]/20 bg-[#d6c7ff]/10 px-2.5 py-1 text-[11px] font-semibold text-[#d6c7ff]">
                          {product.gender}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white">
                          {stats.variantCount || product.sizes.length} variants
                        </span>

                        {stats.lowStockVariants > 0 ? (
                          <span className="rounded-full border border-amber-400/20 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                            {stats.lowStockVariants} low
                          </span>
                        ) : null}

                        {stats.outOfStockVariants > 0 ? (
                          <span className="rounded-full border border-red-400/20 bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-300">
                            {stats.outOfStockVariants} out
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {product.sizes?.slice(0, 6).map((s) => (
                          <span
                            key={`${product.id}-mobile-${s}`}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {product.colors?.slice(0, 4).map((c, idx) => (
                          <span
                            key={`${product.id}-mobile-${c}-${idx}`}
                            title={c}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#a7aec4]"
                          >
                            <ColorSwatch color={c} />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {canEdit || canDelete ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className={secondaryBtnClass}
                        >
                          Edit
                        </button>
                      ) : null}

                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => requestDelete(product.id)}
                          className="rounded-full border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}