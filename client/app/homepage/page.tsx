"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useI18n } from "@/lib/i18n/I18nProvider";

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image: string;
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

type NotificationItem = {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: string;
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

function SmartImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  if (isRemote) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
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
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}

function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "U";

  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last =
    parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return (first + last).toUpperCase();
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function fetchAds(API_BASE: string, position: string): Promise<HomeAd[]> {
  const res = await fetch(
    `${API_BASE}/ads?position=${encodeURIComponent(position)}&status=Active`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`Failed to fetch ads for ${position}`);
  const json = await safeJson(res);

  const items: any[] =
    (Array.isArray(json) && json) ||
    (Array.isArray((json as any)?.items) && (json as any).items) ||
    (Array.isArray((json as any)?.data) && (json as any).data) ||
    (Array.isArray((json as any)?.data?.items) && (json as any).data.items) ||
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

      const single = resolveMediaSrc(x.mediaUrl);

      return {
        id: String(x.id ?? x._id ?? `ad-${Math.random().toString(36).slice(2)}`),
        title: x.title || "Advertisement",
        type: x.type as HomeAd["type"],
        mediaKind: x.mediaKind === "video" ? "video" : "image",
        mediaUrl: single,
        mediaUrls: urls,
        clickUrl: typeof x.clickUrl === "string" ? x.clickUrl : undefined,
        priority: typeof x.priority === "number" ? x.priority : 999,
        position: x.position as HomeAd["position"],
      };
    })
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

function AdminTopHero({ API_BASE }: { API_BASE: string }) {
  const router = useRouter();
  const [ad, setAd] = React.useState<HomeAd | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        const ads = await fetchAds(API_BASE, "Home Top");
        setAd(ads?.[0] ?? null);
      } catch {
        setAd(null);
      }
    };
    run();
  }, [API_BASE]);

  if (!ad) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a]">
        <div className="flex h-[320px] items-center justify-center px-6 text-center text-white/45 sm:h-[380px] lg:h-[480px]">
          No Top Advertisement
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a]">
      <div className="relative h-[300px] sm:h-[380px] lg:h-[500px]">
        {ad.mediaKind === "video" ? (
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
            className="object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 max-w-[92%] sm:left-7 sm:top-7 sm:max-w-[560px]">
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/70 sm:text-[12px]">
            FEATURED CAMPAIGN
          </div>

          <h2 className="mt-3 text-[22px] font-semibold leading-tight text-white sm:text-[30px] lg:text-[42px]">
            {ad.title}
          </h2>

          <p className="mt-3 max-w-[460px] text-[12px] leading-6 text-white/72 sm:text-[14px]">
            Discover curated fashion drops, standout essentials, and premium
            everyday styles from UFO Collection.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {ad.clickUrl ? (
              <button
                onClick={() => {
                  if (ad.clickUrl) router.push(ad.clickUrl);
                }}
                className="rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90 sm:px-6 sm:py-3"
              >
                Shop Now
              </button>
            ) : null}

            <button
              onClick={() => {
                const el = document.getElementById("latest-collections");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/15 sm:px-6 sm:py-3"
            >
              Explore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroRightMedia({ API_BASE }: { API_BASE: string }) {
  const [ad, setAd] = React.useState<HomeAd | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        const ads = await fetchAds(API_BASE, "Home Mid");
        setAd(ads?.[0] ?? null);
      } catch {
        setAd(null);
      }
    };
    run();
  }, [API_BASE]);

  const fallbackSrc = "/images/placeholder.png";
  const mediaKind = ad?.mediaKind;
  const mediaUrl = ad?.mediaUrl ? resolveMediaSrc(ad.mediaUrl) : fallbackSrc;
  const title = ad?.title || "Hero Banner";

  return (
    <div className="relative min-h-[240px] bg-[#11121a] sm:min-h-[320px] md:min-h-[100%]">
      {mediaKind === "video" ? (
        <video
          className="h-full w-full object-cover"
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : mediaUrl.startsWith("http") ? (
        <SmartImage src={mediaUrl} alt={title} fill className="object-cover" />
      ) : (
        <Image src={mediaUrl} alt={title} fill priority className="object-cover" />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/10 to-transparent" />
    </div>
  );
}

function HeroAdSlider({ API_BASE }: { API_BASE: string }) {
  const router = useRouter();

  const [ads, setAds] = React.useState<HomeAd[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adIdx, setAdIdx] = React.useState(0);
  const [slideIdx, setSlideIdx] = React.useState(0);

  const currentAd = ads[adIdx];

  const getSlides = React.useCallback((ad?: HomeAd) => {
    if (!ad) return [];
    const urls = Array.isArray(ad.mediaUrls) ? ad.mediaUrls.filter(Boolean) : [];
    if (ad.type === "Carousel" && ad.mediaKind === "image" && urls.length > 1) {
      return urls;
    }
    return [ad.mediaUrl].filter(Boolean);
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
    const run = async () => {
      try {
        setLoading(true);
        const normalized = await fetchAds(API_BASE, "Home Bottom");
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
  }, [API_BASE]);

  React.useEffect(() => {
    if (!ads.length) return;
    const timer = setInterval(() => next(), 4000);
    return () => clearInterval(timer);
  }, [ads.length, next]);

  if (loading || !ads.length || !currentAd) return null;

  const mediaKind: "image" | "video" = currentAd.mediaKind;
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
    <div className="relative overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a]">
      <div className="relative h-[220px] sm:h-[280px] lg:h-[360px]">
        {mediaKind === "video" ? (
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
            className="object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

        <div className="absolute left-4 top-4 max-w-[88%] sm:left-6 sm:top-6 sm:max-w-[560px]">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/65 sm:text-[12px]">
            Spotlight
          </div>
          <div className="mt-2 text-[18px] font-semibold leading-tight text-white sm:text-[24px] lg:text-[30px]">
            {currentAd.title}
          </div>

          {currentAd.clickUrl ? (
            <button
              onClick={() => {
                if (currentAd.clickUrl) router.push(currentAd.clickUrl);
              }}
              className="mt-4 rounded-full bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] hover:bg-white/90 sm:px-5 sm:py-2.5"
            >
              Shop Now
            </button>
          ) : null}
        </div>

        {dotsCount > 1 ? (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {Array.from({ length: dotsCount }).map((_, i) => {
              const active = i === activeDot;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (isCarouselDots) setSlideIdx(i);
                    else setAdIdx(i);
                  }}
                  className={`h-2 w-2 rounded-full border border-white/30 transition ${
                    active ? "bg-white" : "bg-white/20"
                  }`}
                  aria-label={`Go to ${isCarouselDots ? "slide" : "ad"} ${i + 1}`}
                />
              );
            })}
          </div>
        ) : null}

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white transition hover:bg-black/65"
          aria-label="Previous"
        >
          ‹
        </button>

        <button
          onClick={next}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-white transition hover:bg-black/65"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
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
    <div
      className={`mb-6 flex flex-col gap-4 sm:mb-8 ${
        centered ? "items-center text-center" : "items-start text-left"
      } ${action ? "lg:flex-row lg:items-end lg:justify-between" : ""}`}
    >
      <div className={centered ? "max-w-[720px]" : "max-w-[620px]"}>
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
          {eyebrow}
        </div>
        <h2 className="mt-2 text-[22px] font-semibold text-white sm:text-[28px]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
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
      title={product.name}
    >
      <div className="overflow-hidden rounded-[18px] border border-[#26293a] bg-[#161824] transition duration-300 hover:-translate-y-1 hover:border-[#3a3f58]">
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Image
            src={resolveMediaSrc(product.image)}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        </div>

        <div className="p-3 sm:p-4">
          <div className="mb-2 w-fit rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c8cde0]">
            {product.category || "Fashion"}
          </div>

          <div className="line-clamp-1 text-[14px] font-medium text-[#f5f7fb] sm:text-[15px]">
            {product.name}
          </div>

          <div className="mt-2 text-[13px] font-semibold text-[#d6c7ff] sm:text-[14px]">
            Rs. {Number(product.price || 0).toFixed(2)}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();

  const [user, setUser] = React.useState<User | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  const [latestProducts, setLatestProducts] = React.useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = React.useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);

  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = React.useState(true);
  const [collectingCode, setCollectingCode] = React.useState<string | null>(null);

  const [unreadCount, setUnreadCount] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const socketRef = React.useRef<Socket | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api";

  const SOCKET_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080";

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.preload = "auto";
  }, []);

  const playNotificationSound = React.useCallback(() => {
    try {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } catch {
      // ignore autoplay block
    }
  }, []);

  const syncUnreadCount = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setUnreadCount(0);
        return;
      }

      const json = await safeJson(res);
      const count =
        Number((json as any)?.count) ||
        Number((json as any)?.data?.count) ||
        Number((json as any)?.data) ||
        0;

      setUnreadCount(count);
    } catch {
      // keep current count if temporary failure happens
    }
  }, [API_BASE]);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = await res.json();
        const me = data?.user || data?.data?.user || data?.data || null;
        setUser(me);
      } catch (err) {
        console.error("Failed to fetch /auth/me", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, [API_BASE]);

  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    syncUnreadCount();
  }, [user, syncUnreadCount]);

  React.useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      syncUnreadCount();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncUnreadCount();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, syncUnreadCount]);

  React.useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Customer socket connected");
      syncUnreadCount();
    });

    socket.on("notification:new", async (payload: { notification?: NotificationItem }) => {
      const next = payload?.notification;
      if (!next) return;

      playNotificationSound();

      setUnreadCount((prev) => prev + 1);

      await syncUnreadCount();
    });

    socket.on("disconnect", () => {
      console.log("Customer socket disconnected");
    });

    socket.on("reconnect", () => {
      syncUnreadCount();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_BASE, user, playNotificationSound, syncUnreadCount]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const res = await fetch(`${API_BASE}/products`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load products");

        const json = await res.json();
        const all: Product[] =
          (Array.isArray(json) && json) ||
          (Array.isArray((json as any)?.data) && (json as any).data) ||
          (Array.isArray((json as any)?.data?.products) &&
            (json as any).data.products) ||
          [];

        const limited = all.slice(0, 50);
        setLatestProducts(limited.slice(0, 8));
        setBestSellerProducts(limited.slice(8, 16));
      } catch (err) {
        console.error("Error loading homepage products:", err);
        setLatestProducts([]);
        setBestSellerProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [API_BASE]);

  React.useEffect(() => {
    const run = async () => {
      try {
        setLoadingCoupons(true);
        const res = await fetch(`${API_BASE}/discounts/available`, {
          cache: "no-store",
        });
        const json = await safeJson(res);

        const items: Coupon[] =
          (Array.isArray(json) && (json as any)) ||
          (Array.isArray((json as any)?.data) && (json as any).data) ||
          (Array.isArray((json as any)?.items) && (json as any).items) ||
          [];

        setCoupons(items.slice(0, 6));
      } catch {
        setCoupons([]);
      } finally {
        setLoadingCoupons(false);
      }
    };
    run();
  }, [API_BASE]);

  const collectCoupon = async (code: string) => {
    const c = String(code || "").trim();
    if (!c) return;

    if (!user && !loadingUser) {
      router.push("/signup");
      return;
    }

    try {
      setCollectingCode(c);

      const res = await fetch(
        `${API_BASE}/discounts/collect/${encodeURIComponent(c)}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const j = await safeJson(res);
        alert((j as any)?.message || "Failed to collect coupon");
        return;
      }

      router.push("/discounts");
    } catch {
      alert("Failed to collect coupon");
    } finally {
      setCollectingCode(null);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
        html,
        body {
          font-family: Poppins, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          background: #0a0a0f;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-[#1b1e2b] bg-[rgba(10,10,15,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] w-full max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-5 md:h-[76px] lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/15 bg-white/5 sm:h-11 sm:w-11">
              <Image
                src="/images/logo.png"
                alt="UFO Collection logo"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold uppercase tracking-[0.12em] text-white sm:text-[18px] md:text-[22px] lg:text-[26px]">
                UFO Collection
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex lg:gap-10">
            <Link
              href="/homepage"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/collection"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
            >
              {t("nav.collection")}
            </Link>
            <Link
              href="/about"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
            >
              {t("nav.about")}
            </Link>
            <Link
              href="/contact"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
            >
              {t("nav.contact")}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10 md:hidden"
              aria-label={t("nav.openMenu")}
            >
              ☰
            </button>

            <Link
              href="/collection"
              aria-label="Search"
              className="hidden rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 sm:flex"
            >
              <Image
                src="/images/search.png"
                width={18}
                height={18}
                alt="Search"
                className="brightness-0 invert"
              />
            </Link>

            {loadingUser ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
            ) : (
              <button
                type="button"
                onClick={() => router.push(user ? "/notifications" : "/signup")}
                aria-label="Notifications"
                className="relative rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
                title={user ? t("nav.notifications") : "Login to view notifications"}
              >
                <Image
                  src="/images/notification.png"
                  width={18}
                  height={18}
                  alt="Notifications"
                  className="brightness-0 invert"
                />
                {user && unreadCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
            )}

            {loadingUser ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <button
                type="button"
                aria-label="Open user profile"
                title={user.name || t("nav.profile")}
                onClick={() => router.push("/profile")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white text-[12px] font-semibold text-[#090a12]"
              >
                {getInitials(user.name || user.email)}
              </button>
            ) : (
              <Link
                href="/signup"
                aria-label="Signup"
                className="hidden rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 sm:flex"
              >
                <Image
                  src="/images/profile.png"
                  width={18}
                  height={18}
                  alt="Profile"
                  className="brightness-0 invert"
                />
              </Link>
            )}

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 sm:flex"
            >
              <Image
                src="/images/wishlist.png"
                width={18}
                height={18}
                alt="Wishlist"
                className="brightness-0 invert"
              />
            </Link>

            <button
              type="button"
              onClick={() => router.push("/admin/adminlogin")}
              className="hidden rounded-full border border-white/20 bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#090a12] lg:block"
            >
              {t("nav.admin")}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-[#1b1e2b] bg-[rgba(10,10,15,0.98)] md:hidden">
            <div className="mx-auto grid max-w-[1240px] gap-3 px-4 py-4 sm:px-5">
              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/homepage"
                className="text-[13px] uppercase tracking-[0.16em] text-[#d6c7ff]"
              >
                {t("nav.home")}
              </Link>

              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/collection"
                className="text-[13px] uppercase tracking-[0.16em] text-[#d6c7ff]"
              >
                {t("nav.collection")}
              </Link>

              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/about"
                className="text-[13px] uppercase tracking-[0.16em] text-[#d6c7ff]"
              >
                {t("nav.about")}
              </Link>

              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/contact"
                className="text-[13px] uppercase tracking-[0.16em] text-[#d6c7ff]"
              >
                {t("nav.contact")}
              </Link>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/collection"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                >
                  {t("nav.search")}
                </Link>

                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href={user ? "/profile" : "/signup"}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                >
                  {user ? t("nav.profile") : t("nav.signup")}
                </Link>

                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/wishlist"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                >
                  {t("nav.wishlist")}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/admin/adminlogin");
                  }}
                  className="rounded-full bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] hover:bg-white/90"
                >
                  {t("nav.admin")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="bg-[#0a0a0f] text-[#f5f7fb]">
        <section className="py-5 sm:py-7 lg:py-8">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
            <AdminTopHero API_BASE={API_BASE} />
          </div>
        </section>

        <section className="pb-5 sm:pb-7">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
            <div className="overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a]">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="flex flex-col justify-center gap-4 p-5 sm:p-7 md:p-10 lg:p-12">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                    NEW SEASON DROP
                  </div>

                  <h1 className="max-w-[520px] text-[26px] font-semibold leading-[1.15] text-white sm:text-[34px] md:text-[40px] lg:text-[48px]">
                    Refined Style for Everyday Wear
                  </h1>

                  <p className="max-w-[460px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                    Discover clothing and footwear designed for comfort,
                    confidence, and effortless everyday style. Explore premium
                    essentials and fresh arrivals from UFO Collection.
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push("/collection")}
                      className="rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90 sm:px-6 sm:py-3"
                    >
                      Shop Collection
                    </button>

                    <button
                      onClick={() => {
                        const el = document.getElementById("latest-collections");
                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 sm:px-6 sm:py-3"
                    >
                      Explore New Arrivals
                    </button>
                  </div>
                </div>

                <HeroRightMedia API_BASE={API_BASE} />
              </div>
            </div>
          </div>
        </section>

        <section className="pb-4 sm:pb-6">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
            <HeroAdSlider API_BASE={API_BASE} />
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
            <SectionHeading
              eyebrow="DISCOUNTS"
              title="Available Coupons"
              description="Collect coupons now and they will auto-apply in your cart when eligible."
              align="left"
              action={
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/discounts"
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                  >
                    View All
                  </Link>
                  <Link
                    href="/discounts"
                    className="rounded-full bg-white px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90"
                  >
                    Collect Coupons
                  </Link>
                </div>
              }
            />

            <div className="rounded-[24px] border border-[#26293a] bg-[#11121a] p-4 sm:p-6">
              {loadingCoupons ? (
                <div className="text-white/60">Loading coupons…</div>
              ) : coupons.length === 0 ? (
                <div className="text-[#a7aec4]">No active coupons right now.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {coupons.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-[20px] border border-[#2f3347] bg-[#161824] p-4 transition hover:border-[#424862] sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[16px] font-semibold text-white">
                            {c.title || "Coupon"}
                          </div>
                          <div className="mt-1 text-[13px] text-[#a7aec4]">
                            Code:{" "}
                            <span className="font-semibold text-white">{c.code}</span>
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

                        {c.scope ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/80">
                            Scope: {c.scope}
                          </span>
                        ) : null}
                      </div>

                      {c.description ? (
                        <div className="mt-4 text-[12px] leading-7 text-[#a7aec4]">
                          {c.description}
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-2 text-[12px] text-[#a7aec4]">
                        {c.minOrder != null ? <div>Min order: Rs. {c.minOrder}</div> : null}
                        {c.type === "PERCENT" && c.maxDiscountCap != null ? (
                          <div>Max cap: Rs. {c.maxDiscountCap}</div>
                        ) : null}
                        {c.endAt ? <div>Valid till: {formatDateShort(c.endAt)}</div> : null}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => collectCoupon(c.code)}
                          disabled={collectingCode === c.code}
                          className={`rounded-[14px] px-4 py-2.5 text-[12px] font-semibold transition ${
                            collectingCode === c.code
                              ? "bg-white/10 text-white/60"
                              : "bg-white text-[#090a12] hover:bg-white/90"
                          }`}
                        >
                          {collectingCode === c.code ? "Collecting..." : "Collect"}
                        </button>

                        <button
                          onClick={() => navigator.clipboard.writeText(c.code)}
                          className="rounded-[14px] border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/10"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="latest-collections" className="py-8 sm:py-10">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
            <SectionHeading
              eyebrow="LATEST COLLECTIONS"
              title="New Arrivals"
              description="Fresh drops handpicked for everyday confidence, clean silhouettes, and standout streetwear styling."
            />

            {loadingProducts ? (
              <div className="text-white/60">Loading products…</div>
            ) : latestProducts.length === 0 ? (
              <div className="text-white/60">No products available.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {latestProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => router.push(`/product/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
            <SectionHeading
              eyebrow="BEST SELLERS"
              title="Most Loved Pieces"
              description="Customer favorites that blend comfort, quality, and standout style for daily wear."
            />

            {loadingProducts ? (
              <div className="text-white/60">Loading products…</div>
            ) : bestSellerProducts.length === 0 ? (
              <div className="text-white/60">No products available.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {bestSellerProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => router.push(`/product/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
                <div
                  key={item.title}
                  className="rounded-[20px] border border-[#26293a] bg-[#11121a] p-5 text-center sm:p-6"
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
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#1b1e2b] bg-[#11121a] py-10 text-center sm:py-12">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6">
            <h3 className="text-[22px] font-semibold text-white sm:text-[28px]">
              Subscribe now &amp; get 20% off
            </h3>
            <p className="mx-auto mt-3 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
              Join our mailing list for early access to new drops, exclusive
              discounts, product updates, and styling inspiration from UFO Collection.
            </p>

            <form
              className="mx-auto mt-6 flex max-w-[760px] flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                const inp = e.currentTarget.querySelector("input") as HTMLInputElement | null;
                if (inp?.value) alert(`Subscribed: ${inp.value}`);
                if (inp) inp.value = "";
              }}
            >
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className="h-[48px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
              />
              <button
                type="submit"
                className="h-[48px] rounded-full bg-white px-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#090a12] transition hover:bg-white/90 sm:px-8"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#0a0a0f] py-10 pb-5">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 border-b border-[#1b1e2b] px-4 pb-8 sm:px-5 md:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.9fr_1fr] lg:px-6">
          <div>
            <div className="text-[18px] font-semibold uppercase tracking-[0.12em] text-white">
              UFO Collection
            </div>
            <p className="mt-3 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
              UFO Collection brings modern, minimal, and premium fashion to your
              everyday wardrobe with a shopping experience designed for Nepal.
            </p>
          </div>

          <div>
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
              Company
            </div>
            <ul className="grid gap-2 text-[13px] text-[#d6dbeb]">
              <li>
                <Link href="/homepage" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/collection" className="hover:text-white">
                  Collection
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
              Support
            </div>
            <ul className="grid gap-2 text-[13px] text-[#d6dbeb]">
              <li>Delivery Information</li>
              <li>Return Policy</li>
              <li>Privacy Policy</li>
              <li>Help Center</li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
              Get In Touch
            </div>
            <ul className="grid gap-2 text-[13px] text-[#d6dbeb]">
              <li>+977 9804880758</li>
              <li>ufocollection@gmail.com</li>
              <li>Kathmandu, Nepal</li>
            </ul>
          </div>
        </div>

        <div className="px-4 pt-5 text-center text-[11px] text-[#6f768e] sm:px-5 lg:px-6">
          Copyright 2025 © UFO Collection — All Rights Reserved.
        </div>
      </footer>
    </>
  );
}