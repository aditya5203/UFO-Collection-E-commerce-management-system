"use client";

import { API_URL } from "@/lib/api";

import * as React from "react";
import Image from "next/image";
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
  API_URL;

const fadeRight = {
  hidden: { opacity: 0, x: 36 },
  show: { opacity: 1, x: 0 },
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

export default function HeroRightMedia() {
  const [ad, setAd] = React.useState<HomeAd | null>(null);
  const [slideIdx, setSlideIdx] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const ads = await fetchAds("Home Mid");
        if (active) setAd(ads?.[0] ?? null);
      } catch {
        if (active) setAd(null);
      }
    };

    run();

    return () => {
      active = false;
    };
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
        <motion.div
          key={mediaUrl}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <SmartImage
            src={mediaUrl}
            alt={ad?.title || "Hero Banner"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition duration-500"
          />
        </motion.div>
      )}

      <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent" />

      {slides.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <motion.button
              key={`hero-mid-dot-${i}`}
              type="button"
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
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