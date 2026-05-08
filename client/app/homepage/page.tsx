"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import HomeHeader from "@/components/layout/HomeHeader";
import MainFooter from "@/components/layout/MainFooter";
import SubscribeOffer from "@/components/SubscribeOffer";

import TopHero from "@/components/home/TopHero";
import HeroFeatureSection from "@/components/home/HeroFeatureSection";
import HeroAdSlider from "@/components/home/HeroAdSlider";
import CouponSection from "@/components/home/CouponSection";
import ServiceCards from "@/components/home/ServiceCards";
import WeatherOutfitSuggestion from "@/components/home/WeatherOutfitSuggestion";

type ToastType = "success" | "error" | "info";

type Product = {
  id: string;
  sku?: string;
  name: string;
  category?: string;
  subCategory?: string;
  price: number;
  image: string;
  rating?: number;
  reviews?: number;
  soldCount?: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

const shellClass = "bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass = "mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function isSafeSrc(src: unknown): src is string {
  return typeof src === "string" && src.trim().length > 0;
}

function resolveMediaSrc(src: unknown) {
  if (!isSafeSrc(src)) return "/images/placeholder.png";

  const clean = src.trim();

  if (clean.startsWith("/")) return clean;
  if (clean.startsWith("https://")) return clean;
  if (clean.startsWith("http://")) return clean;

  return "/images/placeholder.png";
}

function normalizeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatMoney(value: unknown) {
  const amount = normalizeNumber(value, 0);

  return `Rs. ${amount.toLocaleString("en-NP", {
    maximumFractionDigits: 2,
  })}`;
}

function mapProduct(raw: any): Product {
  return {
    id: String(raw?.id || raw?._id || ""),
    sku: String(raw?.sku || ""),
    name: String(raw?.name || "Product"),
    category: String(raw?.category || raw?.subCategory || "Fashion"),
    subCategory: String(raw?.subCategory || raw?.category || ""),
    price: normalizeNumber(raw?.price, 0),
    image: resolveMediaSrc(raw?.image),
    rating: normalizeNumber(raw?.rating || raw?.displayRating, 0),
    reviews: normalizeNumber(raw?.reviews || raw?.reviewCount, 0),
    soldCount: normalizeNumber(raw?.soldCount, 0),
  };
}

function SmartImage({
  src,
  alt,
  className,
  fill,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const safeSrc = resolveMediaSrc(src);
  const isRemote =
    safeSrc.startsWith("http://") || safeSrc.startsWith("https://");

  if (isRemote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={safeSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${
          className ?? ""
        }`}
      />
    );
  }

  return (
    <Image
      src={safeSrc}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={fill ? sizes ?? "100vw" : undefined}
      className={className}
    />
  );
}

function HomeToast({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {toast ? (
        <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
              toast.type === "error"
                ? "border-red-400/30 bg-red-500/15 text-red-100"
                : toast.type === "info"
                  ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
                  : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
            }`}
          >
            <span
              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                toast.type === "error"
                  ? "bg-red-300"
                  : toast.type === "info"
                    ? "bg-blue-300"
                    : "bg-emerald-300"
              }`}
            />

            <div className="flex-1 text-[13px] font-medium leading-6">
              {toast.message}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
              aria-label="Close notification"
            >
              ×
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="mb-6 flex flex-col items-center gap-4 text-center sm:mb-8"
    >
      <div className="max-w-[720px]">
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
          {eyebrow}
        </div>

        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white sm:text-[30px]">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            {description}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`product-skeleton-${i}`}
          className="overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824]"
        >
          <div className="aspect-[4/5] animate-pulse bg-white/5" />

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

function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left"
      aria-label={`Open ${product.name}`}
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.015 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0d0f17]">
          <SmartImage
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.06]"
          />

          <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
            {product.soldCount && product.soldCount > 0
              ? `${product.soldCount} Sold`
              : "New"}
          </div>

          <div className="absolute bottom-3 left-3 right-3 translate-y-2 rounded-full bg-white px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#090a12] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Quick View
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <div className="mb-2 w-fit rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c8cde0]">
            {product.category || product.subCategory || "Fashion"}
          </div>

          <div className="line-clamp-1 text-[14px] font-medium text-[#f5f7fb] sm:text-[15px]">
            {product.name}
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-[13px] font-semibold text-[#d6c7ff] sm:text-[14px]">
              {formatMoney(product.price)}
            </div>

            <div className="text-[12px] text-[#a7aec4]">
              ★ {normalizeNumber(product.rating, 0).toFixed(1)}
            </div>
          </div>
        </div>
      </motion.div>
    </button>
  );
}

function ProductSection({
  id,
  eyebrow,
  title,
  description,
  products,
  loading,
  emptyTitle,
  emptyDescription,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const router = useRouter();

  return (
    <section id={id} className="py-8 sm:py-10">
      <div className={containerClass}>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        {loading ? (
          <ProductSkeletonGrid />
        ) : products.length === 0 ? (
          <div className={`${panelClass} p-8 text-center`}>
            <div className="text-[16px] font-semibold text-white">
              {emptyTitle}
            </div>
            <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-7 text-[#a7aec4]">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.12 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5"
          >
            {products.map((p) => (
              <motion.div
                key={p.id}
                variants={fadeUp}
                transition={{ duration: 0.45 }}
              >
                <ProductCard
                  product={p}
                  onClick={() => router.push(`/product/${p.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [latestProducts, setLatestProducts] = React.useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = React.useState<Product[]>(
    []
  );
  const [loadingProducts, setLoadingProducts] = React.useState(true);

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const [latestRes, bestSellerRes] = await Promise.all([
          fetch(`${API_BASE}/products`, {
            cache: "no-store",
          }),
          fetch(`${API_BASE}/products/best-sellers?limit=8`, {
            cache: "no-store",
          }),
        ]);

        if (!latestRes.ok) throw new Error("Failed to load products");

        const latestJson = await latestRes.json();

        const latestRaw: any[] =
          (Array.isArray(latestJson) && latestJson) ||
          (Array.isArray(latestJson?.data) && latestJson.data) ||
          (Array.isArray(latestJson?.data?.products) &&
            latestJson.data.products) ||
          [];

        let bestSellerRaw: any[] = [];

        if (bestSellerRes.ok) {
          const bestSellerJson = await bestSellerRes.json();

          bestSellerRaw =
            (Array.isArray(bestSellerJson) && bestSellerJson) ||
            (Array.isArray(bestSellerJson?.data) && bestSellerJson.data) ||
            (Array.isArray(bestSellerJson?.data?.products) &&
              bestSellerJson.data.products) ||
            [];
        }

        const latestMapped = latestRaw.map(mapProduct).filter((p) => p.id);

        const bestSellerMapped = bestSellerRaw
          .map(mapProduct)
          .filter((p) => p.id);

        if (!active) return;

        setLatestProducts(latestMapped.slice(0, 8));
        setBestSellerProducts(bestSellerMapped.slice(0, 8));
      } catch {
        if (!active) return;

        setLatestProducts([]);
        setBestSellerProducts([]);
        showToast("Failed to load products.", "error");
      } finally {
        if (active) setLoadingProducts(false);
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, [showToast]);

  return (
    <>
      <HomeHeader
        onSearchClick={() => {
          document
            .getElementById("latest-collections")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <HomeToast toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <section className="py-5 sm:py-7 lg:py-8">
          <div className={containerClass}>
            <TopHero />
          </div>
        </section>

        <section className="pb-5 sm:pb-7">
          <div className={containerClass}>
            <HeroFeatureSection />
          </div>
        </section>

        <section className="pb-4 sm:pb-6">
          <div className={containerClass}>
            <HeroAdSlider />
          </div>
        </section>

        <WeatherOutfitSuggestion />

        <CouponSection showToast={showToast} />

        <ProductSection
          id="latest-collections"
          eyebrow="Latest Collections"
          title="New Arrivals"
          description="Fresh drops handpicked for everyday confidence, clean silhouettes, and standout streetwear styling."
          products={latestProducts}
          loading={loadingProducts}
          emptyTitle="No products available"
          emptyDescription="Products will appear here after they are added and published from the admin panel."
        />

        <ProductSection
          eyebrow="Best Sellers"
          title="Most Loved Pieces"
          description="Real customer favorites based on delivered orders and total sold quantity."
          products={bestSellerProducts}
          loading={loadingProducts}
          emptyTitle="No best seller products yet"
          emptyDescription="Best sellers will appear here after customers place orders and those orders are marked as Delivered."
        />

        <ServiceCards />

        <section className="py-8 sm:py-10">
          <div className={containerClass}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.18 }}
              whileHover={{ scale: 1.005 }}
              transition={{ duration: 0.55 }}
              className="overflow-hidden rounded-[24px]"
            >
              <SubscribeOffer />
            </motion.div>
          </div>
        </section>
      </main>

      <MainFooter />
    </>
  );
}