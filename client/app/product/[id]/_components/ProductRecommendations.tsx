"use client";

import Image from "next/image";
import Link from "next/link";

type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

function formatNPR(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
}

function RelatedCard({ item }: { item: RelatedProduct }) {
  return (
    <Link href={`/product/${item.id}`} className="group block">
      <div className="overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0d0f17]">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.06]"
            unoptimized={item.image.startsWith("http")}
          />
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 min-h-[42px] text-[14px] font-medium leading-5 text-white">
            {item.name}
          </h3>

          <div className="mt-2 text-[14px] font-semibold text-[#d6c7ff]">
            {formatNPR(item.price)}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProductRecommendations({
  relatedLoading,
  relatedError,
  relatedProducts,
  recentlyViewed,
}: {
  relatedLoading: boolean;
  relatedError: string | null;
  relatedProducts: RelatedProduct[];
  recentlyViewed: RelatedProduct[];
}) {
  return (
    <>
      <section className="mt-12">
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
            You May Also Like
          </div>

          <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-white">
            Related Products
          </h2>
        </div>

        {relatedLoading ? (
          <div className={`${panelClass} p-5 text-[#a7aec4]`}>
            Loading related products...
          </div>
        ) : relatedError ? (
          <div className="rounded-[20px] border border-red-500/40 bg-red-500/10 p-5 text-red-200">
            {relatedError}
          </div>
        ) : relatedProducts.length === 0 ? (
          <div className={`${panelClass} p-5 text-[#a7aec4]`}>
            No related products found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {relatedProducts.map((item) => (
              <RelatedCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {recentlyViewed.length > 0 ? (
        <section className="mt-12">
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Continue Shopping
            </div>

            <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-white">
              Recently Viewed Products
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {recentlyViewed.slice(0, 4).map((item) => (
              <RelatedCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}