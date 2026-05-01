"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type HomeAd = {
  id: string;
  title: string;
  type?: "Banner" | "Carousel" | "Pop-up" | "Video";
  mediaKind: "image" | "video";
  mediaUrl: string;
  mediaUrls?: string[];
  clickUrl?: string;
  priority?: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90 sm:px-6 sm:py-3";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
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
    .map((x, index): HomeAd => {
      const urls = Array.isArray(x.mediaUrls)
        ? x.mediaUrls.map(resolveMediaSrc).filter(Boolean)
        : [];

      const firstMedia = resolveMediaSrc(x.mediaUrl || urls[0]);

      return {
        id: String(
          x.id ??
            x._id ??
            `${position}-${x.title || "ad"}-${firstMedia || index}`
        ),
        title: String(x.title || "Advertisement"),
        type: x.type as HomeAd["type"],
        mediaKind: x.mediaKind === "video" ? "video" : "image",
        mediaUrl: firstMedia,
        mediaUrls: urls,
        clickUrl: typeof x.clickUrl === "string" ? x.clickUrl : undefined,
        priority: typeof x.priority === "number" ? x.priority : 999,
      };
    })
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

function openLink(router: ReturnType<typeof useRouter>, url?: string) {
  const href = String(url || "").trim();

  if (!href) {
    router.push("/collection");
    return;
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }

  router.push(href.startsWith("/") ? href : `/${href}`);
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

function MotionButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

export default function HeroAdSlider() {
  const router = useRouter();

  const [ads, setAds] = React.useState<HomeAd[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adIdx, setAdIdx] = React.useState(0);
  const [slideIdx, setSlideIdx] = React.useState(0);

  const currentAd = ads[adIdx];

  const getSlides = React.useCallback((ad?: HomeAd) => {
    if (!ad) return [];

    const urls = Array.isArray(ad.mediaUrls)
      ? ad.mediaUrls.map(resolveMediaSrc).filter(Boolean)
      : [];

    if (ad.type === "Carousel" && ad.mediaKind === "image" && urls.length > 1) {
      return urls;
    }

    return [resolveMediaSrc(ad.mediaUrl)].filter(Boolean);
  }, []);

  const slides = getSlides(currentAd);
  const totalSlides = slides.length;

  React.useEffect(() => {
    setSlideIdx(0);
  }, [adIdx]);

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
    let active = true;

    const run = async () => {
      try {
        setLoading(true);

        const normalized = await fetchAds("Home Bottom");

        if (!active) return;

        setAds(normalized);
        setAdIdx(0);
        setSlideIdx(0);
      } catch {
        if (active) setAds([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
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
          <motion.div
            key={`${currentAd.id}-${mediaUrl}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <SmartImage
              src={mediaUrl}
              alt={currentAd.title}
              fill
              sizes="(max-width: 768px) 100vw, 1240px"
              className="object-cover"
            />
          </motion.div>
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
            <MotionButton
              onClick={() => openLink(router, currentAd.clickUrl)}
              className={`${primaryBtnClass} mt-5`}
            >
              Shop Now
            </MotionButton>
          ) : null}
        </div>

        {dotsCount > 1 ? (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {Array.from({ length: dotsCount }).map((_, i) => (
              <motion.button
                key={`home-bottom-dot-${i}`}
                type="button"
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
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

        <motion.button
          type="button"
          whileHover={{ scale: 1.08, x: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={prev}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white transition hover:bg-black/65"
          aria-label="Previous"
        >
          ‹
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08, x: 2 }}
          whileTap={{ scale: 0.94 }}
          onClick={next}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white transition hover:bg-black/65"
          aria-label="Next"
        >
          ›
        </motion.button>
      </div>
    </motion.div>
  );
}