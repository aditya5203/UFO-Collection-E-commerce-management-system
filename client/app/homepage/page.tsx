"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import HomeHeader from "@/components/layout/HomeHeader";
import MainFooter from "@/components/layout/MainFooter";
import SubscribeOffer from "@/components/SubscribeOffer";

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

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
};

type CouponType = "PERCENT" | "FLAT" | "FREESHIP";
type CouponScope = "ALL" | "CATEGORY" | "PRODUCT";

type Coupon = {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  scope: CouponScope;
  value: number;
  minOrder?: number | null;
  maxDiscountCap?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  status?: string;
};

type HomeAd = {
  id: string;
  title: string;
  type?: "Banner" | "Carousel" | "Pop-up" | "Video";
  mediaKind: "image" | "video";
  mediaUrl: string;
  mediaUrls?: string[];
  clickUrl?: string;
  priority?: number;
  position?:
    | "Home Top"
    | "Home Mid"
    | "Home Bottom"
    | "Category Top"
    | "Product Page";
};

type ToastType = "success" | "error" | "info";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

const shellClass = "bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass = "mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 sm:px-6 sm:py-3";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:px-6 sm:py-3";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -36 },
  show: { opacity: 1, x: 0 },
};

const fadeRight = {
  hidden: { opacity: 0, x: 36 },
  show: { opacity: 1, x: 0 },
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
  if (src.startsWith("/")) return src;
  if (src.startsWith("https://")) return src;
  if (src.startsWith("http://")) return src;
  return "/images/placeholder.png";
}

function mapProduct(raw: any): Product {
  return {
    id: String(raw?.id || raw?._id || ""),
    sku: String(raw?.sku || ""),
    name: String(raw?.name || "Product"),
    category: String(raw?.category || raw?.subCategory || "Fashion"),
    subCategory: String(raw?.subCategory || raw?.category || ""),
    price: Number(raw?.price || 0),
    image: resolveMediaSrc(raw?.image),
    rating: Number(raw?.rating || raw?.displayRating || 0),
    reviews: Number(raw?.reviews || raw?.reviewCount || 0),
  };
}

function SmartImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}) {
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  if (isRemote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${
          className ?? ""
        }`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      priority={priority}
      sizes={fill ? sizes ?? "100vw" : undefined}
      className={className}
    />
  );
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function fetchAds(position: string): Promise<HomeAd[]> {
  const res = await fetch(
    `${API_BASE}/ads?position=${encodeURIComponent(position)}&status=Active`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error(`Failed to fetch ads for ${position}`);

  const json = await safeJson(res);

  const items: any[] =
    (Array.isArray(json) && json) ||
    (Array.isArray(json?.items) && json.items) ||
    (Array.isArray(json?.data) && json.data) ||
    (Array.isArray(json?.data?.items) && json.data.items) ||
    [];

  return items
    .filter(
      (x) =>
        isSafeSrc(x?.mediaUrl) ||
        (Array.isArray(x?.mediaUrls) && x.mediaUrls.length > 0)
    )
    .map((x): HomeAd => {
      const urls = Array.isArray(x.mediaUrls)
        ? x.mediaUrls.map(resolveMediaSrc).filter(Boolean)
        : [];

      return {
        id: String(x.id ?? x._id ?? `ad-${Math.random().toString(36).slice(2)}`),
        title: x.title || "Advertisement",
        type: x.type as HomeAd["type"],
        mediaKind: x.mediaKind === "video" ? "video" : "image",
        mediaUrl: resolveMediaSrc(x.mediaUrl),
        mediaUrls: urls,
        clickUrl: typeof x.clickUrl === "string" ? x.clickUrl : undefined,
        priority: typeof x.priority === "number" ? x.priority : 999,
        position: x.position as HomeAd["position"],
      };
    })
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <motion.div
        initial={{ opacity: 0, y: -18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />

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
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
}) {
  const centered = align === "center";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className={`mb-6 flex flex-col gap-4 sm:mb-8 ${
        centered ? "items-center text-center" : "items-start text-left"
      } ${action ? "lg:flex-row lg:items-end lg:justify-between" : ""}`}
    >
      <div className={centered ? "max-w-[720px]" : "max-w-[660px]"}>
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

      {action ? <div>{action}</div> : null}
    </motion.div>
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
      <div className="overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0d0f17]">
          <Image
            src={resolveMediaSrc(product.image)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.06]"
          />

          <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
            New
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
              Rs. {Number(product.price || 0).toFixed(2)}
            </div>

            <div className="text-[12px] text-[#a7aec4]">
              ★ {Number(product.rating || 0).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function TopHero() {
  const router = useRouter();
  const [ad, setAd] = React.useState<HomeAd | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        const ads = await fetchAds("Home Top");
        setAd(ads?.[0] ?? null);
      } catch {
        setAd(null);
      }
    };

    run();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`${panelClass} overflow-hidden`}
    >
      <div className="relative h-[320px] sm:h-[420px] lg:h-[540px]">
        {ad ? (
          ad.mediaKind === "video" ? (
            <video
              className="h-full w-full object-cover"
              src={ad.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <SmartImage
              src={ad.mediaUrl}
              alt={ad.title}
              fill
              sizes="(max-width: 768px) 100vw, 1240px"
              className="object-cover"
              priority
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center bg-[#11121a] text-white/45">
            No Top Advertisement
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        <motion.div
          initial={{ opacity: 0, x: -34 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="absolute left-5 top-5 max-w-[92%] sm:left-8 sm:top-8 sm:max-w-[620px] lg:left-10 lg:top-10"
        >
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/70 sm:text-[12px]">
            Featured Campaign
          </div>

          <h1 className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[58px]">
            {ad?.title || "UFO Collection"}
          </h1>

          <p className="mt-4 max-w-[500px] text-[13px] leading-7 text-white/75 sm:text-[15px]">
            Discover curated fashion drops, standout essentials, and premium
            everyday styles designed for comfort and confidence.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(ad?.clickUrl || "/collection")}
              className={primaryBtnClass}
            >
              Shop Now
            </button>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("latest-collections")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={secondaryBtnClass}
            >
              Explore
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function HeroRightMedia() {
  const [ad, setAd] = React.useState<HomeAd | null>(null);
  const [slideIdx, setSlideIdx] = React.useState(0);

  React.useEffect(() => {
    const run = async () => {
      try {
        const ads = await fetchAds("Home Mid");
        setAd(ads?.[0] ?? null);
      } catch {
        setAd(null);
      }
    };

    run();
  }, []);

  const slides = React.useMemo(() => {
    if (!ad) return ["/images/placeholder.png"];

    if (
      ad.type === "Carousel" &&
      ad.mediaKind === "image" &&
      Array.isArray(ad.mediaUrls) &&
      ad.mediaUrls.length > 0
    ) {
      return ad.mediaUrls.map(resolveMediaSrc);
    }

    return [resolveMediaSrc(ad.mediaUrl)];
  }, [ad]);

  React.useEffect(() => {
    setSlideIdx(0);
  }, [ad?.id]);

  React.useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const mediaUrl = slides[slideIdx] || "/images/placeholder.png";

  return (
    <motion.div
      variants={fadeRight}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
      className="relative min-h-[260px] overflow-hidden bg-[#11121a] sm:min-h-[340px] md:min-h-full"
    >
      {ad?.mediaKind === "video" ? (
        <video
          className="h-full w-full object-cover"
          src={resolveMediaSrc(ad.mediaUrl)}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <SmartImage
          src={mediaUrl}
          alt={ad?.title || "Hero Banner"}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition duration-500"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent" />

      {slides.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlideIdx(i)}
              className={`h-2 w-2 rounded-full border border-white/30 transition ${
                i === slideIdx ? "bg-white" : "bg-white/30"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

function HeroAdSlider() {
  const router = useRouter();

  const [ads, setAds] = React.useState<HomeAd[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adIdx, setAdIdx] = React.useState(0);
  const [slideIdx, setSlideIdx] = React.useState(0);

  const currentAd = ads[adIdx];

  const getSlides = React.useCallback((ad?: HomeAd) => {
    if (!ad) return [];

    const urls = Array.isArray(ad.mediaUrls)
      ? ad.mediaUrls.filter(Boolean)
      : [];

    if (ad.type === "Carousel" && ad.mediaKind === "image" && urls.length > 1) {
      return urls;
    }

    return [ad.mediaUrl].filter(Boolean);
  }, []);

  const slides = getSlides(currentAd);
  const totalSlides = slides.length;

  React.useEffect(() => setSlideIdx(0), [adIdx]);

  const next = React.useCallback(() => {
    if (!ads.length) return;

    if (totalSlides > 1 && slideIdx < totalSlides - 1) {
      setSlideIdx((p) => p + 1);
      return;
    }

    setAdIdx((p) => (p + 1) % ads.length);
  }, [ads.length, slideIdx, totalSlides]);

  const prev = React.useCallback(() => {
    if (!ads.length) return;

    if (totalSlides > 1 && slideIdx > 0) {
      setSlideIdx((p) => p - 1);
      return;
    }

    setAdIdx((p) => (p - 1 + ads.length) % ads.length);
  }, [ads.length, slideIdx, totalSlides]);

  React.useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const normalized = await fetchAds("Home Bottom");

        setAds(normalized);
        setAdIdx(0);
        setSlideIdx(0);
      } catch {
        setAds([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  React.useEffect(() => {
    if (!ads.length) return;

    const timer = window.setInterval(() => next(), 4000);

    return () => window.clearInterval(timer);
  }, [ads.length, next]);

  if (loading || !ads.length || !currentAd) return null;

  const mediaUrl =
    currentAd.type === "Carousel" &&
    currentAd.mediaKind === "image" &&
    totalSlides > 0
      ? slides[slideIdx]
      : currentAd.mediaUrl;

  const isCarouselDots =
    currentAd.type === "Carousel" &&
    currentAd.mediaKind === "image" &&
    totalSlides > 1;

  const dotsCount = isCarouselDots ? totalSlides : ads.length;
  const activeDot = isCarouselDots ? slideIdx : adIdx;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
      className={`${panelClass} relative overflow-hidden`}
    >
      <div className="relative h-[230px] sm:h-[300px] lg:h-[380px]">
        {currentAd.mediaKind === "video" ? (
          <video
            className="h-full w-full object-cover"
            src={mediaUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <SmartImage
            src={mediaUrl}
            alt={currentAd.title}
            fill
            sizes="(max-width: 768px) 100vw, 1240px"
            className="object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

        <div className="absolute left-5 top-5 max-w-[88%] sm:left-7 sm:top-7 sm:max-w-[560px]">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/65 sm:text-[12px]">
            Spotlight
          </div>

          <div className="mt-2 text-[22px] font-semibold leading-tight text-white sm:text-[28px] lg:text-[34px]">
            {currentAd.title}
          </div>

          {currentAd.clickUrl ? (
            <button
              type="button"
              onClick={() => router.push(currentAd.clickUrl || "/collection")}
              className={`${primaryBtnClass} mt-5`}
            >
              Shop Now
            </button>
          ) : null}
        </div>

        {dotsCount > 1 ? (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {Array.from({ length: dotsCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (isCarouselDots) setSlideIdx(i);
                  else setAdIdx(i);
                }}
                className={`h-2 w-2 rounded-full border border-white/30 transition ${
                  i === activeDot ? "bg-white" : "bg-white/20"
                }`}
                aria-label={`Go to ${isCarouselDots ? "slide" : "ad"} ${i + 1}`}
              />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={prev}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white transition hover:bg-black/65"
          aria-label="Previous"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={next}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white transition hover:bg-black/65"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </motion.div>
  );
}

function couponBadgeText(c: Coupon) {
  if (c.type === "PERCENT") return `${c.value}% OFF`;
  if (c.type === "FLAT") return `Rs. ${c.value} OFF`;
  return "FREE SHIPPING";
}

function couponTypeChip(c: Coupon) {
  if (c.type === "PERCENT") return "PERCENT";
  if (c.type === "FLAT") return "FLAT";
  return "FREESHIP";
}

function formatDateShort(iso?: string | null) {
  if (!iso) return "";

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = React.useState<User | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  const [latestProducts, setLatestProducts] = React.useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = React.useState<Product[]>(
    []
  );
  const [loadingProducts, setLoadingProducts] = React.useState(true);

  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = React.useState(true);

  const [collectingCode, setCollectingCode] = React.useState<string | null>(
    null
  );

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
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        const me = data?.user || data?.data?.user || data?.data || null;

        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, []);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const res = await fetch(`${API_BASE}/products`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load products");

        const json = await res.json();

        const all: any[] =
          (Array.isArray(json) && json) ||
          (Array.isArray(json?.data) && json.data) ||
          (Array.isArray(json?.data?.products) && json.data.products) ||
          [];

        const mapped = all.map(mapProduct).filter((p) => p.id);
        const limited = mapped.slice(0, 50);

        setLatestProducts(limited.slice(0, 8));
        setBestSellerProducts(limited.slice(8, 16));
      } catch {
        setLatestProducts([]);
        setBestSellerProducts([]);
        showToast("Failed to load products.", "error");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [showToast]);

  React.useEffect(() => {
    const run = async () => {
      try {
        setLoadingCoupons(true);

        const res = await fetch(`${API_BASE}/discounts/available`, {
          cache: "no-store",
        });

        const json = await safeJson(res);

        const items: Coupon[] =
          (Array.isArray(json) && json) ||
          (Array.isArray(json?.data) && json.data) ||
          (Array.isArray(json?.items) && json.items) ||
          [];

        setCoupons(items.slice(0, 6));
      } catch {
        setCoupons([]);
        showToast("Failed to load coupons.", "error");
      } finally {
        setLoadingCoupons(false);
      }
    };

    run();
  }, [showToast]);

  const collectCoupon = async (code: string) => {
    const c = String(code || "").trim();

    if (!c) return;

    if (!user && !loadingUser) {
      showToast("Please sign up or login to collect coupons.", "info");

      window.setTimeout(() => {
        router.push("/signup");
      }, 700);

      return;
    }

    try {
      setCollectingCode(c);

      const res = await fetch(
  `${API_BASE}/discounts/collect/${encodeURIComponent(c)}`,
  {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  }
);

const data = await safeJson(res);

if (!res.ok) {
  console.log("Collect coupon error:", data);

  showToast(
    data?.message || data?.error || "Failed to collect coupon.",
    "error"
  );
  return;
}

      showToast("Coupon collected successfully.", "success");

      window.setTimeout(() => {
        router.push("/discounts");
      }, 800);
    } catch {
      showToast("Something went wrong while collecting coupon.", "error");
    } finally {
      setCollectingCode(null);
    }
  };

  const copyCouponCode = async (code: string) => {
    const cleanCode = String(code || "").trim();

    if (!cleanCode) return;

    try {
      await navigator.clipboard.writeText(cleanCode);
      showToast(`Coupon code ${cleanCode} copied.`, "success");
    } catch {
      showToast("Unable to copy coupon code.", "error");
    }
  };

  return (
    <>
      <HomeHeader
        onSearchClick={() => {
          document
            .getElementById("latest-collections")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <section className="py-5 sm:py-7 lg:py-8">
          <div className={containerClass}>
            <TopHero />
          </div>
        </section>

        <section className="pb-5 sm:pb-7">
          <div className={containerClass}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55 }}
              className={`${panelClass} overflow-hidden`}
            >
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <motion.div
                  variants={fadeLeft}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55 }}
                  className="flex flex-col justify-center gap-4 p-5 sm:p-7 md:p-10 lg:p-12"
                >
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                    New Season Drop
                  </div>

                  <h1 className="max-w-[560px] text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[42px] lg:text-[52px]">
                    Refined Style for Everyday Wear
                  </h1>

                  <p className="max-w-[500px] text-[13px] leading-7 text-[#a7aec4] sm:text-[15px]">
                    Discover clothing and footwear designed for comfort,
                    confidence, and effortless everyday style.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/collection")}
                      className={primaryBtnClass}
                    >
                      Shop Collection
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById("latest-collections")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                      className={secondaryBtnClass}
                    >
                      Explore New Arrivals
                    </button>
                  </div>
                </motion.div>

                <HeroRightMedia />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pb-4 sm:pb-6">
          <div className={containerClass}>
            <HeroAdSlider />
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className={containerClass}>
            <SectionHeading
              eyebrow="Discounts"
              title="Available Coupons"
              description="Collect coupons now and they will auto-apply in your cart when eligible."
              align="left"
              action={
                <div className="flex flex-wrap gap-3">
                  <Link href="/discounts" className={secondaryBtnClass}>
                    View All
                  </Link>

                  <Link href="/discounts" className={primaryBtnClass}>
                    Collect Coupons
                  </Link>
                </div>
              }
            />

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className={`${panelClass} p-4 sm:p-6`}
            >
              {loadingCoupons ? (
                <div className="text-white/60">Loading coupons…</div>
              ) : coupons.length === 0 ? (
                <div className="text-[#a7aec4]">
                  No active coupons right now.
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.15 }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                  {coupons.map((c) => (
                    <motion.div
                      key={c.id}
                      variants={fadeUp}
                      transition={{ duration: 0.45 }}
                      className="rounded-[20px] border border-[#2f3347] bg-[#161824] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[16px] font-semibold text-white">
                            {c.title || "Coupon"}
                          </div>

                          <div className="mt-1 text-[13px] text-[#a7aec4]">
                            Code:{" "}
                            <span className="font-semibold text-white">
                              {c.code}
                            </span>
                          </div>
                        </div>

                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          {couponTypeChip(c)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-green-500/15 px-3 py-1 text-[12px] font-semibold text-green-300">
                          {couponBadgeText(c)}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/80">
                          Scope: {c.scope}
                        </span>
                      </div>

                      {c.description ? (
                        <div className="mt-4 text-[12px] leading-7 text-[#a7aec4]">
                          {c.description}
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-2 text-[12px] text-[#a7aec4]">
                        {c.minOrder != null ? (
                          <div>Min order: Rs. {c.minOrder}</div>
                        ) : null}

                        {c.type === "PERCENT" && c.maxDiscountCap != null ? (
                          <div>Max cap: Rs. {c.maxDiscountCap}</div>
                        ) : null}

                        {c.endAt ? (
                          <div>Valid till: {formatDateShort(c.endAt)}</div>
                        ) : null}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => collectCoupon(c.code)}
                          disabled={collectingCode === c.code}
                          className={`rounded-full px-4 py-2.5 text-[12px] font-semibold transition ${
                            collectingCode === c.code
                              ? "cursor-not-allowed bg-white/10 text-white/60"
                              : "bg-white text-[#090a12] hover:bg-white/90"
                          }`}
                        >
                          {collectingCode === c.code
                            ? "Collecting..."
                            : "Collect"}
                        </button>

                        <button
                          type="button"
                          onClick={() => copyCouponCode(c.code)}
                          className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/10"
                        >
                          Copy
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        <section id="latest-collections" className="py-8 sm:py-10">
          <div className={containerClass}>
            <SectionHeading
              eyebrow="Latest Collections"
              title="New Arrivals"
              description="Fresh drops handpicked for everyday confidence, clean silhouettes, and standout streetwear styling."
            />

            {loadingProducts ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
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
            ) : latestProducts.length === 0 ? (
              <div className={`${panelClass} p-6 text-center text-[#a7aec4]`}>
                No products available.
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.12 }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5"
              >
                {latestProducts.map((p) => (
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

        <section className="py-8 sm:py-10">
          <div className={containerClass}>
            <SectionHeading
              eyebrow="Best Sellers"
              title="Most Loved Pieces"
              description="Customer favorites that blend comfort, quality, and standout style for daily wear."
            />

            {loadingProducts ? (
              <div className="text-white/60">Loading products…</div>
            ) : bestSellerProducts.length === 0 ? (
              <div className={`${panelClass} p-6 text-center text-[#a7aec4]`}>
                No products available.
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.12 }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5"
              >
                {bestSellerProducts.map((p) => (
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

        <section className="py-8 sm:py-10">
          <div className={containerClass}>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.18 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
            >
              {[
                {
                  icon: "🔁",
                  title: "Easy Exchange Policy",
                  text: "Enjoy a smooth exchange process for eligible products with clear and simple steps.",
                },
                {
                  icon: "📦",
                  title: "7 Days Return Policy",
                  text: "Need a different fit? Return eligible items within 7 days with confidence.",
                },
                {
                  icon: "🎧",
                  title: "Best Customer Support",
                  text: "Our support team is ready to help with orders, sizing, and product questions.",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  transition={{ duration: 0.45 }}
                  className={`${panelClass} p-5 text-center transition duration-300 hover:-translate-y-2 hover:scale-[1.02] sm:p-6`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#3a3f58] bg-white/5 text-[20px]">
                    {item.icon}
                  </div>

                  <div className="mt-4 text-[15px] font-semibold text-white">
                    {item.title}
                  </div>

                  <div className="mx-auto mt-2 max-w-[280px] text-[13px] leading-7 text-[#a7aec4]">
                    {item.text}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className={containerClass}>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.18 }}
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