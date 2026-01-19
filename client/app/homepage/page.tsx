"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
  position?: "Home Top" | "Home Mid" | "Home Bottom" | "Category Top" | "Product Page";
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
        className={className}
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : undefined}
      />
    );
  }

  return (
    <Image src={src} alt={alt} fill={fill} width={width} height={height} priority={priority} className={className} />
  );
}

function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "U";

  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
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

async function fetchAds(API_BASE: string, position: string) {
  const res = await fetch(`${API_BASE}/ads?position=${encodeURIComponent(position)}&status=Active`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch ads for ${position}`);
  const json = await safeJson(res);

  const items: HomeAd[] =
    (Array.isArray(json) && json) ||
    (Array.isArray(json?.items) && json.items) ||
    (Array.isArray(json?.data) && json.data) ||
    (Array.isArray(json?.data?.items) && json.data.items) ||
    [];

  const normalized = items
    .filter((x) => isSafeSrc(x?.mediaUrl) || (Array.isArray(x?.mediaUrls) && x.mediaUrls.length > 0))
    .map((x) => {
      const urls = Array.isArray(x.mediaUrls) ? x.mediaUrls.map(resolveMediaSrc).filter(Boolean) : [];
      const single = resolveMediaSrc(x.mediaUrl);

      return {
        ...x,
        type: (x as any).type,
        mediaKind: x.mediaKind === "video" ? "video" : "image",
        title: x.title || "Advertisement",
        mediaUrl: single,
        mediaUrls: urls,
        priority: x.priority ?? 999,
      };
    })
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  return normalized;
}

function AdminTopHero({ API_BASE }: { API_BASE: string }) {
  const router = useRouter();
  const [ad, setAd] = React.useState<HomeAd | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        const ads = await fetchAds(API_BASE, "Home Top");
        setAd(ads[0] || null);
      } catch {
        setAd(null);
      }
    };
    run();
  }, [API_BASE]);

  if (!ad) {
    return (
      <div className="overflow-hidden rounded-[18px] border border-[#1f2136] bg-[#0b0d1a]">
        <div className="flex h-[520px] items-center justify-center text-white/50 max-[900px]:h-[360px]">
          No Top Advertisement
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#1f2136] bg-[#0b0d1a]">
      <div className="relative h-[520px] max-[900px]:h-[360px]">
        {ad.mediaKind === "video" ? (
          <video className="h-full w-full object-cover" src={ad.mediaUrl} autoPlay muted loop playsInline />
        ) : (
          <SmartImage src={ad.mediaUrl} alt={ad.title} fill className="object-cover" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />

        <div className="absolute left-7 top-7 max-w-[560px] max-sm:left-4 max-sm:top-4">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/70">ADVERTISEMENT</div>
          <div className="mt-2 text-[38px] font-semibold text-white max-sm:text-[26px]">{ad.title}</div>
          <div className="mt-2 text-[13px] text-white/70">Powered by Admin Ads (Cloudinary).</div>

          <div className="mt-4 flex flex-wrap gap-3">
            {ad.clickUrl ? (
              <button
                onClick={() => router.push(ad.clickUrl!)}
                className="rounded-full bg-white px-6 py-[12px] text-[13px] font-medium uppercase tracking-[0.16em] text-[#050611] hover:bg-white/90"
              >
                Shop Now
              </button>
            ) : null}

            <button
              onClick={() => {
                const el = document.getElementById("latest-collections");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-[12px] text-[13px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white/10"
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
        setAd(ads[0] || null);
      } catch {
        setAd(null);
      }
    };
    run();
  }, [API_BASE]);

  const fallbackSrc = "/images/home/hero-banner.jpg";
  const mediaKind = ad?.mediaKind;
  const mediaUrl = ad?.mediaUrl ? resolveMediaSrc(ad.mediaUrl) : fallbackSrc;
  const title = ad?.title || "Hero Banner";

  return (
    <div className="relative h-full min-h-[460px] bg-[#0f1120] max-[900px]:min-h-[360px]">
      {mediaKind === "video" ? (
        <video className="h-full w-full object-cover" src={mediaUrl} autoPlay muted loop playsInline />
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
    if (ad.type === "Carousel" && ad.mediaKind === "image" && urls.length > 1) return urls;
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
    const t = setInterval(() => next(), 4000);
    return () => clearInterval(t);
  }, [ads.length, next]);

  if (loading) return null;
  if (!ads.length) return null;
  if (!currentAd) return null;

  const mediaKind: "image" | "video" = currentAd.mediaKind;
  const mediaUrl =
    currentAd.type === "Carousel" && currentAd.mediaKind === "image" && totalSlides > 0
      ? slides[slideIdx]
      : currentAd.mediaUrl;

  const isCarouselDots = currentAd.type === "Carousel" && currentAd.mediaKind === "image" && totalSlides > 1;
  const dotsCount = isCarouselDots ? totalSlides : ads.length;
  const activeDot = isCarouselDots ? slideIdx : adIdx;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#1f2136] bg-[#0b0d1a]">
      <div className="relative h-[380px] max-[900px]:h-[280px]">
        {mediaKind === "video" ? (
          <video className="h-full w-full object-cover" src={mediaUrl} autoPlay muted loop playsInline />
        ) : (
          <SmartImage src={mediaUrl} alt={currentAd.title} fill className="object-cover" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

        <div className="absolute left-6 top-6 max-w-[560px] max-sm:left-4 max-sm:top-4">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/70">Advertisement</div>
          <div className="mt-2 text-[28px] font-semibold text-white max-sm:text-[22px]">
            {currentAd.title}
          </div>

          {currentAd.clickUrl && (
            <button
              onClick={() => router.push(currentAd.clickUrl!)}
              className="mt-4 rounded-full bg-white px-5 py-[10px] text-[13px] font-medium uppercase tracking-[0.16em] text-[#050611] hover:bg-white/90"
            >
              Shop Now
            </button>
          )}
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
                  className={`h-[8px] w-[8px] rounded-full border border-white/30 ${active ? "bg-white" : "bg-white/20"}`}
                  aria-label={`Go to ${isCarouselDots ? "slide" : "ad"} ${i + 1}`}
                />
              );
            })}
          </div>
        ) : null}

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-white hover:bg-black/60"
          aria-label="Previous"
        >
          ‹
        </button>

        <button
          onClick={next}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-white hover:bg-black/60"
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
  return `FREE SHIPPING`;
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
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = React.useState<User | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  const [latestProducts, setLatestProducts] = React.useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = React.useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);

  // ✅ coupons
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = React.useState(true);
  const [collectingCode, setCollectingCode] = React.useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8080/api";

  // ---------- Fetch /auth/me ----------
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

  // ---------- Fetch products ----------
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const res = await fetch(`${API_BASE}/products`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load products");

        const json = await res.json();
        const all: Product[] =
          (Array.isArray(json) && json) ||
          (Array.isArray(json?.data) && json.data) ||
          (Array.isArray(json?.data?.products) && json.data.products) ||
          [];

        const limited = all.slice(0, 50);
        setLatestProducts(limited.slice(0, 25));
        setBestSellerProducts(limited.slice(25, 50));
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

  // ✅ Fetch available coupons for homepage
  React.useEffect(() => {
    const run = async () => {
      try {
        setLoadingCoupons(true);
        const res = await fetch(`${API_BASE}/discounts/available`, { cache: "no-store" });
        const json = await safeJson(res);

        const items: Coupon[] =
          (Array.isArray(json) && json) ||
          (Array.isArray(json?.data) && json.data) ||
          (Array.isArray(json?.items) && json.items) ||
          [];

        // show newest first, keep few on home
        setCoupons(items.slice(0, 6));
      } catch (e) {
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

    // if not logged in -> go signup
    if (!user && !loadingUser) {
      router.push("/signup");
      return;
    }

    try {
      setCollectingCode(c);

      const res = await fetch(`${API_BASE}/discounts/collect/${encodeURIComponent(c)}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const j = await safeJson(res);
        alert(j?.message || "Failed to collect coupon");
        return;
      }

      // after collect -> open /discounts page so they can see all collected
      router.push("/discounts");
    } catch (e) {
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
          font-family: Poppins, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 h-[80px] border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-full w-full max-w-[1160px] items-center justify-between px-4">
          {/* Brand */}
          <div className="flex items-center gap-[10px]">
            <div className="h-[44px] w-[44px] overflow-hidden rounded-full border-2 border-white">
              <Image src="/images/logo.png" alt="UFO Collection logo" width={44} height={44} className="h-full w-full object-cover" />
            </div>
            <div className="text-[28px] font-bold uppercase tracking-[0.18em] text-white max-sm:text-[22px]">
              UFO Collection
            </div>
          </div>

          {/* Nav */}
          <nav className="flex gap-[42px] max-sm:flex-wrap max-sm:gap-5">
            <Link href="/homepage" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              HOME
            </Link>
            <Link href="/collection" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              COLLECTION
            </Link>
            <Link href="/about" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              ABOUT
            </Link>
            <Link href="/contact" className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              CONTACT
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-5 max-sm:mt-1">
            <Link href="/collection" aria-label="Search">
              <Image src="/images/search.png" width={26} height={26} alt="Search" className="brightness-0 invert contrast-[2.8] saturate-[2.6]" />
            </Link>

            {loadingUser ? (
              <div className="h-[32px] w-[32px] animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <button
                type="button"
                aria-label="Open user profile"
                title={user.name || "Profile"}
                onClick={() => router.push("/profile")}
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-white bg-white text-[12px] font-semibold text-[#050611]"
              >
                {getInitials(user.name || user.email)}
              </button>
            ) : (
              <Link href="/signup" aria-label="Signup">
                <Image src="/images/profile.png" width={26} height={26} alt="Profile" className="brightness-0 invert contrast-[2.8] saturate-[2.6]" />
              </Link>
            )}

            <Link href="/wishlist" aria-label="Wishlist">
              <Image src="/images/wishlist.png" width={26} height={26} alt="Wishlist" className="brightness-0 invert contrast-[2.8] saturate-[2.6]" />
            </Link>

            <button
              type="button"
              onClick={() => router.push("/admin/adminlogin")}
              className="rounded-full border border-white bg-transparent px-[18px] py-[6px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
            >
              ADMIN
            </button>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main className="bg-[#050611] text-[#f5f5f7]">
        {/* TOP HERO */}
        <section className="py-8">
          <div className="mx-auto max-w-[1160px] px-4">
            <AdminTopHero API_BASE={API_BASE} />
          </div>
        </section>

        {/* HERO SECTION */}
        <section className="pb-6">
          <div className="mx-auto max-w-[1160px] px-4">
            <div className="min-h-[460px] overflow-hidden rounded-[18px] border border-[#1f2136] bg-[#0b0d1a] max-[900px]:min-h-[360px]">
              <div className="grid h-full grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] max-[900px]:grid-cols-1">
                <div className="flex flex-col justify-center gap-[18px] p-[48px_44px] max-sm:p-[32px_22px]">
                  <div className="text-[12px] uppercase tracking-[0.18em] text-[#8b90ad]">OUR BESTSELLERS</div>
                  <h1 className="text-[40px] font-semibold leading-tight max-sm:text-[30px]">Latest Arrivals</h1>
                  <p className="max-w-[360px] text-[14px] leading-[1.8] text-[#8b90ad]">
                    Discover new-season pieces designed for everyday comfort and statement looks. Curated drops from UFO Collection, just landed.
                  </p>
                  <button
                    onClick={() => router.push("/collection")}
                    className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-[12px] text-[13px] font-medium uppercase tracking-[0.16em] text-[#050611] hover:bg-white/90"
                  >
                    SHOP NOW
                  </button>
                </div>

                <HeroRightMedia API_BASE={API_BASE} />
              </div>
            </div>
          </div>
        </section>

        {/* Slider */}
        <section className="pb-2">
          <div className="mx-auto max-w-[1160px] px-4">
            <HeroAdSlider API_BASE={API_BASE} />
          </div>
        </section>

        {/* ✅ DISCOUNTS SHOW ON HOMEPAGE (REAL FROM BACKEND) */}
        <section className="py-6">
          <div className="mx-auto max-w-[1160px] px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[12px] uppercase tracking-[0.18em] text-[#8b90ad]">DISCOUNTS</div>
                <div className="mt-2 text-[22px] font-semibold text-white">Available Coupons</div>
                <div className="mt-1 text-[13px] text-[#8b90ad]">
                  Collect coupons and they will auto-apply in your cart.
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/discounts"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[12px] uppercase tracking-[0.16em] text-white hover:bg-white/10"
                >
                  View all
                </Link>
                <Link
                  href="/discounts"
                  className="rounded-full bg-white px-5 py-2 text-[12px] uppercase tracking-[0.16em] text-[#050611] hover:bg-white/90"
                >
                  Collect Coupons
                </Link>
              </div>
            </div>

            <div className="mt-5 rounded-[18px] border border-[#1f2136] bg-[#0b0d1a] p-6">
              {loadingCoupons ? (
                <div className="text-white/60">Loading coupons…</div>
              ) : coupons.length === 0 ? (
                <div className="text-[#8b90ad]">No active coupons right now.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coupons.map((c) => (
                    <div key={c.id} className="rounded-[16px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[16px] font-semibold text-white">{c.title || "Coupon"}</div>
                          <div className="mt-1 text-[13px] text-[#9aa3cc]">
                            Code: <span className="font-semibold text-white">{c.code}</span>
                          </div>
                        </div>

                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white">
                          {couponTypeChip(c)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
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
                        <div className="mt-3 text-[12px] leading-[1.7] text-[#9aa3cc]">{c.description}</div>
                      ) : null}

                      <div className="mt-3 grid gap-1 text-[12px] text-[#8b90ad]">
                        {c.minOrder != null ? <div>Min order: Rs. {c.minOrder}</div> : null}
                        {c.type === "PERCENT" && c.maxDiscountCap != null ? (
                          <div>Max cap: Rs. {c.maxDiscountCap}</div>
                        ) : null}
                        {c.endAt ? <div>Valid till: {formatDateShort(c.endAt)}</div> : null}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => collectCoupon(c.code)}
                          disabled={collectingCode === c.code}
                          className={`rounded-[12px] px-4 py-2 text-[12px] font-semibold ${
                            collectingCode === c.code
                              ? "bg-white/10 text-white/60"
                              : "bg-white text-[#050611] hover:bg-white/90"
                          }`}
                        >
                          {collectingCode === c.code ? "Collecting..." : "Collect"}
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(c.code);
                          }}
                          className="rounded-[12px] border border-white/15 bg-white/5 px-4 py-2 text-[12px] hover:bg-white/10"
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

        {/* LATEST COLLECTIONS */}
        <section id="latest-collections" className="py-6">
          <div className="mx-auto max-w-[1160px] px-4">
            <div className="mb-[22px] text-center">
              <div className="text-[18px] uppercase tracking-[0.24em]">LATEST COLLECTIONS</div>
              <div className="mx-auto mt-2 h-px w-20 bg-[#3c3f59]" />
              <p className="mx-auto mt-[10px] max-w-[520px] text-[13px] text-[#8b90ad]">
                Handpicked styles fresh from our latest drops. Explore minimalist silhouettes, soft fabrics and everyday essentials for every wardrobe.
              </p>
            </div>

            {loadingProducts ? (
              <div className="text-white/60">Loading products…</div>
            ) : latestProducts.length === 0 ? (
              <div className="text-white/60">No products available.</div>
            ) : (
              <div className="grid grid-cols-4 gap-5 max-[1024px]:grid-cols-3 max-sm:grid-cols-2">
                {latestProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => router.push(`/product/${p.id}`)}
                    className="flex flex-col gap-[6px] text-left text-[12px]"
                    aria-label={`Open ${p.name}`}
                    title={p.name}
                  >
                    <div className="relative w-full overflow-hidden rounded-[10px] border border-[#252842] bg-[#151726] pb-[130%]">
                      <Image src={resolveMediaSrc(p.image)} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="mt-1 text-[#f1f2ff]">{p.name}</div>
                    <div className="text-[#8b90ad]">Rs. {Number(p.price || 0).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* BEST SELLER */}
        <section className="py-6">
          <div className="mx-auto max-w-[1160px] px-4">
            <div className="mb-[22px] text-center">
              <div className="text-[18px] uppercase tracking-[0.24em]">
                BEST <span className="font-normal">SELLER</span>
              </div>
              <div className="mx-auto mt-2 h-px w-20 bg-[#3c3f59]" />
              <p className="mx-auto mt-[10px] max-w-[520px] text-[13px] text-[#8b90ad]">
                Customer favorites you can&apos;t go wrong with. These pieces are tried, tested and loved.
              </p>
            </div>

            {loadingProducts ? (
              <div className="text-white/60">Loading products…</div>
            ) : bestSellerProducts.length === 0 ? (
              <div className="text-white/60">No products available.</div>
            ) : (
              <div className="grid grid-cols-4 gap-5 max-[1024px]:grid-cols-3 max-sm:grid-cols-2">
                {bestSellerProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => router.push(`/product/${p.id}`)}
                    className="flex flex-col gap-[6px] text-left text-[12px]"
                    aria-label={`Open ${p.name}`}
                    title={p.name}
                  >
                    <div className="relative w-full overflow-hidden rounded-[10px] border border-[#252842] bg-[#151726] pb-[130%]">
                      <Image src={resolveMediaSrc(p.image)} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="mt-1 text-[#f1f2ff]">{p.name}</div>
                    <div className="text-[#8b90ad]">Rs. {Number(p.price || 0).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* POLICIES */}
        <section className="py-3 pb-10">
          <div className="mx-auto max-w-[1160px] px-4">
            <div className="grid grid-cols-3 gap-8 text-center max-[900px]:grid-cols-2 max-sm:grid-cols-1">
              {[
                { icon: "🔁", title: "Easy Exchange Policy", text: "Hassle-free exchanges on eligible items for a smooth experience." },
                { icon: "📅", title: "7 Days Return Policy", text: "Not the right fit? Enjoy a simple 7-day return window." },
                { icon: "🎧", title: "Best Customer Support", text: "Our team is here to help you with sizing, orders and more." },
              ].map((p) => (
                <div key={p.title} className="flex flex-col items-center gap-[10px]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#3a3d5a] text-[20px]">
                    {p.icon}
                  </div>
                  <div className="text-[13px] font-semibold">{p.title}</div>
                  <div className="max-w-[220px] text-[12px] text-[#8b90ad]">{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUBSCRIBE */}
        <section className="border-y border-[#171a32] bg-[#0a1020] py-[46px] text-center">
          <div className="mx-auto max-w-[1160px] px-4">
            <h3 className="m-0 text-[20px] font-semibold">Subscribe now &amp; get 20% off</h3>
            <p className="mt-[6px] text-[13px] text-[#8b90ad]">
              Join our mailing list for early access to drops, exclusive deals, and styling tips.
            </p>

            <form
              className="mt-[18px] flex flex-wrap justify-center gap-[10px]"
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
                placeholder="Enter your email id"
                className="w-[420px] min-w-[260px] max-w-[80vw] rounded-full border border-[#23253a] bg-[#090c1a] px-[14px] py-[10px] text-[13px] text-[#f5f5f7] placeholder:text-[#787e99]"
              />
              <button type="submit" className="rounded-full bg-white px-5 py-[10px] text-[13px] font-medium text-[#050616]">
                SUBSCRIBE
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#050611] py-10 pb-[18px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-[1.4fr_0.8fr_0.8fr] gap-10 border-b border-[#191b2e] px-4 pb-6 max-[900px]:grid-cols-2 max-sm:grid-cols-1">
          <div>
            <div className="mb-2 text-[16px] font-semibold tracking-[0.11em]">UFO Collection</div>
            <p className="max-w-[420px] text-[12px] leading-[1.9] text-[#8b90ad]">
              UFO Collection brings minimal, premium streetwear to your wardrobe.
            </p>
          </div>

          <div>
            <div className="mb-[10px] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              COMPANY
            </div>
            <ul className="grid list-none gap-2 p-0 text-[12px] text-[#d4d6ea]">
              <li><Link href="/homepage">Home</Link></li>
              <li><Link href="/about">About us</Link></li>
              <li><a href="#">Delivery</a></li>
              <li><a href="#">Privacy policy</a></li>
            </ul>
          </div>

          <div>
            <div className="mb-[10px] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              GET IN TOUCH
            </div>
            <ul className="grid list-none gap-2 p-0 text-[12px] text-[#d4d6ea]">
              <li>+977 9804880758</li>
              <li>ufocollection@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="pt-[14px] text-center text-[11px] text-[#6d7192]">
          Copyright 2025 © UFO Collection — All Rights Reserved.
        </div>
      </footer>
    </>
  );
}
