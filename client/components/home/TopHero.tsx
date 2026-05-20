"use client";

import { API_URL } from "@/lib/api";

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
  position?:
    | "Home Top"
    | "Home Mid"
    | "Home Bottom"
    | "Category Top"
    | "Product Page";
};

const API_BASE =
  API_URL;

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90 sm:px-6 sm:py-3";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 sm:px-6 sm:py-3";

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
        position: x.position as HomeAd["position"],
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

export default function TopHero() {
  const router = useRouter();
  const [ad, setAd] = React.useState<HomeAd | null>(null);

  React.useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const ads = await fetchAds("Home Top");
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
            <motion.div
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <SmartImage
                src={ad.mediaUrl}
                alt={ad.title}
                fill
                sizes="(max-width: 768px) 100vw, 1240px"
                className="object-cover"
                priority
              />
            </motion.div>
          )
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),#11121a] px-6 text-center text-white/55">
            Homepage hero banner will appear here after admin uploads an active
            Home Top advertisement.
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
            <MotionButton
              onClick={() => openLink(router, ad?.clickUrl || "/collection")}
              className={primaryBtnClass}
            >
              Shop Now
            </MotionButton>

            <MotionButton
              onClick={() => {
                document
                  .getElementById("latest-collections")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={secondaryBtnClass}
            >
              Explore
            </MotionButton>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}