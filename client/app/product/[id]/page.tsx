"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import AITryOnModal from "./AITryOnModal";

type Size = "S" | "M" | "L" | "XL" | "XXL";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  shortDesc?: string;
  longDesc?: string;
  sizes?: Size[];
  colors?: string[];
};

type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type Review = {
  id?: string;
  _id?: string;
  product?:
    | string
    | {
        id?: string;
        _id?: string;
        name?: string;
        image?: string;
      };
  customer?:
    | string
    | {
        id?: string;
        _id?: string;
        name?: string;
        email?: string;
      };
  orderCode: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt?: string;
};

type CartItem = {
  id: string;
  name: string;
  size: string;
  color: string;
  colorLabel: string;
  price: number;
  qty: number;
  image: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const DEFAULT_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];
const PRODUCT_PLACEHOLDER = "/images/products/placeholder.png";

const FIXED_DESCRIPTION =
  "UFO Collection is an e-commerce website that allows customers to browse and purchase products online with ease. It functions as a digital marketplace where products are organized into well-defined collections, such as clothing and accessories, enabling users to explore items efficiently. Each collection displays product images, names, prices, and brief details to help customers compare options quickly. When a product is selected from a collection, the user is taken to a dedicated product page that provides complete information, including descriptions, available sizes, colors, and pricing. UFO Collection offers a convenient, accessible, and user-friendly shopping experience, allowing customers to shop anytime and from anywhere with global reach.";

function toNumber(v: any, fallback = 0) {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toStr(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeSizes(sizes: any): Size[] {
  if (!Array.isArray(sizes)) return DEFAULT_SIZES;
  const clean = sizes.filter((x) => DEFAULT_SIZES.includes(x));
  return clean.length ? clean : DEFAULT_SIZES;
}

function isHexColor(v: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
}

const COLOR_NAME_TO_HEX: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ef4444",
  blue: "#3b82f6",
  "navy blue": "#000080",
  navy: "#000080",
  green: "#22c55e",
  yellow: "#eab308",
  gray: "#808080",
  grey: "#808080",
  pink: "#ec4899",
  purple: "#a855f7",
  orange: "#f97316",
};

const HEX_TO_COLOR_NAME: Record<string, string> = {
  "#000000": "Black",
  "#000080": "Navy Blue",
  "#808080": "Grey",
  "#ffffff": "White",
  "#ef4444": "Red",
  "#3b82f6": "Blue",
  "#22c55e": "Green",
  "#eab308": "Yellow",
  "#9ca3af": "Gray",
  "#ec4899": "Pink",
  "#a855f7": "Purple",
  "#f97316": "Orange",
  "#16191f": "Black",
};

function toHex(color: string) {
  const c = (color || "").trim();
  if (!c) return "#16191f";
  if (isHexColor(c)) return c.toLowerCase();
  return COLOR_NAME_TO_HEX[c.toLowerCase()] || "#16191f";
}

function toColorLabel(color: string) {
  const hex = toHex(color).toLowerCase();
  return HEX_TO_COLOR_NAME[hex] || color;
}

function normalizeColors(raw: any): string[] {
  const value = raw?.colors ?? raw?.color ?? raw?.variants?.colors ?? [];

  if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
    return value.map((x) => x.trim()).filter(Boolean);
  }

  if (Array.isArray(value) && value.length && typeof value[0] === "object") {
    return value
      .map((x) => x?.hex || x?.value || x?.color || x?.code || x?.name)
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const delim = value.includes(",")
      ? ","
      : value.includes("|")
      ? "|"
      : value.includes("\n")
      ? "\n"
      : null;

    if (delim) {
      return value
        .split(delim)
        .map((x) => x.trim())
        .filter(Boolean);
    }

    return [value.trim()].filter(Boolean);
  }

  return [];
}

function getProductImageSrc(image: any): string {
  const src = typeof image === "string" ? image.trim() : "";

  if (!src) return PRODUCT_PLACEHOLDER;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  if (src.startsWith("uploads/")) {
    return `${API_BASE.replace(/\/api$/, "")}/${src}`;
  }

  if (src.startsWith("/uploads/")) {
    return `${API_BASE.replace(/\/api$/, "")}${src}`;
  }

  if (src.startsWith("/images/")) {
    return src;
  }

  return PRODUCT_PLACEHOLDER;
}

function normalizeImageList(rawImages: any): string[] {
  if (!Array.isArray(rawImages)) return [];
  return rawImages
    .map((img) => getProductImageSrc(img))
    .filter((img) => Boolean(img));
}

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("ufo_cart");
    const cart = raw ? JSON.parse(raw) : [];
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function getCartCount(): number {
  const cart = readCart();
  return cart.reduce((sum, it) => sum + (Number(it?.qty) || 0), 0);
}

function mapProductCard(raw: any): RelatedProduct {
  return {
    id: String(raw?.id || raw?._id || ""),
    name: toStr(raw?.name, "Unnamed Product"),
    price: toNumber(raw?.price, 0),
    image: getProductImageSrc(raw?.image),
  };
}

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedSize, setSelectedSize] = React.useState<Size>("M");
  const [selectedImage, setSelectedImage] = React.useState<string>("");
  const [selectedColor, setSelectedColor] = React.useState<string>("");

  const [activeTab, setActiveTab] = React.useState<"description" | "reviews">(
    "description"
  );

  const [addedMsg, setAddedMsg] = React.useState<string | null>(null);
  const [cartCount, setCartCount] = React.useState<number>(0);
  const [aiOpen, setAiOpen] = React.useState(false);

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [reviewsError, setReviewsError] = React.useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = React.useState<{
    count: number;
    avgRating: number;
  }>({ count: 0, avgRating: 0 });

  const [relatedProducts, setRelatedProducts] = React.useState<RelatedProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = React.useState(false);
  const [relatedError, setRelatedError] = React.useState<string | null>(null);

  const [zoomLevel, setZoomLevel] = React.useState<number>(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);

  const dragStartRef = React.useRef({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  React.useEffect(() => {
    const update = () => setCartCount(getCartCount());
    update();

    window.addEventListener("ufo_cart_updated", update);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "ufo_cart") update();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("ufo_cart_updated", update);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) throw new Error("Missing product id in route.");

        const res = await fetch(`${API_BASE}/products/${id}`, {
          cache: "no-store",
        });

        const response = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          throw new Error(
            response?.message || `Failed to load product (status ${res.status})`
          );
        }

        const raw = response?.data ?? response;

        const mapped: Product = {
          id: String(raw.id || raw._id || id),
          name: toStr(raw.name, "Unnamed Product"),
          price: toNumber(raw.price, 0),
          image: getProductImageSrc(raw.image),
          images: normalizeImageList(raw.images),
          rating: toNumber(raw.rating, 4.8),
          reviews: toNumber(raw.reviews, 0),
          shortDesc: toStr(raw.shortDesc, toStr(raw.description, "")),
          longDesc: toStr(raw.longDesc, toStr(raw.description, "")),
          sizes: normalizeSizes(raw.sizes),
          colors: normalizeColors(raw),
        };

        setProduct(mapped);

        const sizes = mapped.sizes?.length ? mapped.sizes : DEFAULT_SIZES;
        setSelectedSize(sizes.includes("M") ? "M" : sizes[0]);

        const gallery = (mapped.images || []).filter(
          (img) => img && img !== mapped.image
        );
        const allImages = [mapped.image, ...gallery];
        setSelectedImage(allImages[0] || mapped.image);

        const normalizedColors = (mapped.colors || []).map((c) => toHex(c));
        setSelectedColor(normalizedColors[0] || "");
        setZoomLevel(1);
        setPan({ x: 0, y: 0 });
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load product.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  React.useEffect(() => {
    if (!product?.id) return;

    const fetchRelatedProducts = async () => {
      try {
        setRelatedLoading(true);
        setRelatedError(null);

        const res = await fetch(`${API_BASE}/products/${product.id}/related`, {
          cache: "no-store",
        });

        const response = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          throw new Error(
            response?.message ||
              `Failed to load related products (status ${res.status})`
          );
        }

        const rawItems = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        setRelatedProducts(rawItems.map(mapProductCard));
      } catch (e: any) {
        console.error(e);
        setRelatedError(e?.message || "Failed to load related products.");
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product?.id]);

  React.useEffect(() => {
    if (!product?.id) return;
    if (activeTab !== "reviews") return;

    (async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);

        const res = await fetch(`${API_BASE}/products/${product.id}/reviews`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(data?.message || "Failed to load reviews");

        const rawReviews = Array.isArray(data?.reviews) ? data.reviews : [];

        const mapped: Review[] = rawReviews.map((r: any) => ({
          id: r.id || r._id || "",
          _id: r._id || r.id || "",
          product: r.product ?? null,
          customer: r.customer ?? null,
          orderCode: r.orderCode || "",
          rating: Number(r.rating || 0),
          title: typeof r.title === "string" ? r.title : "",
          comment: typeof r.comment === "string" ? r.comment : "",
          createdAt: r.createdAt,
        }));

        setReviews(mapped);

        setReviewSummary(
          data?.summary && typeof data.summary === "object"
            ? {
                count: Number(data.summary.count || 0),
                avgRating: Number(data.summary.avgRating || 0),
              }
            : { count: 0, avgRating: 0 }
        );
      } catch (e: any) {
        setReviewsError(e?.message || "Failed to load reviews");
        setReviews([]);
        setReviewSummary({ count: 0, avgRating: 0 });
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [activeTab, product?.id]);

  const sizes = product?.sizes?.length ? product.sizes : DEFAULT_SIZES;

  const colors = (product?.colors ?? []).map((c) => ({
    value: toHex(c),
    label: toColorLabel(c),
  }));

  const galleryImages = product
    ? (product.images || []).filter((img) => img && img !== product.image)
    : [];

  const allImages = product ? [product.image, ...galleryImages] : [];

  const currentImage = selectedImage || product?.image || PRODUCT_PLACEHOLDER;
  const currentImageIndex = Math.max(
    0,
    allImages.findIndex((img) => img === currentImage)
  );

  const selectImage = (img: string) => {
    setSelectedImage(img);
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const goToPrevImage = () => {
    if (!allImages.length) return;
    const nextIndex =
      currentImageIndex <= 0 ? allImages.length - 1 : currentImageIndex - 1;
    selectImage(allImages[nextIndex]);
  };

  const goToNextImage = () => {
    if (!allImages.length) return;
    const nextIndex =
      currentImageIndex >= allImages.length - 1 ? 0 : currentImageIndex + 1;
    selectImage(allImages[nextIndex]);
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const resetPreview = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (zoomLevel > 1) {
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (zoomLevel === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        goToNextImage();
      } else {
        goToPrevImage();
      }
    }

    setDragging(false);
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(3, Number((prev + 0.15).toFixed(2))));
      return;
    }

    setZoomLevel((prev) => {
      const next = Math.max(1, Number((prev - 0.15).toFixed(2)));
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const addToCart = () => {
    if (!product) return;

    const currentColorLabel =
      product.colors?.find((c) => toHex(c) === selectedColor) ||
      toColorLabel(selectedColor);

    const item: CartItem = {
      id: product.id,
      name: product.name,
      size: selectedSize,
      color: selectedColor,
      colorLabel: toColorLabel(currentColorLabel),
      price: product.price,
      qty: 1,
      image: selectedImage || product.image,
    };

    const cart = readCart();
    const idx = cart.findIndex(
      (it) =>
        it.id === item.id &&
        it.size === item.size &&
        it.color === item.color
    );

    if (idx !== -1) {
      cart[idx].qty = Math.min(99, (cart[idx].qty || 1) + 1);
    } else {
      cart.push(item);
    }

    localStorage.setItem("ufo_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("ufo_cart_updated"));

    setAddedMsg("Added to cart!");
    window.setTimeout(() => setAddedMsg(null), 1200);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        Loading product…
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050816] px-4 text-white">
        <div className="text-center text-red-300">
          {error || "Product not found."}
        </div>
        <button
          type="button"
          onClick={() => router.push("/collection")}
          className="rounded bg-white px-4 py-2 text-[#050816]"
          aria-label="Back to collection"
          title="Back to collection"
        >
          Back to Collection
        </button>
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/collection")}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] bg-transparent px-3 py-[7px] text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back to collection"
              title="Back to collection"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:brightness-100 group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-[10px]">
              <div className="h-[44px] w-[44px] overflow-hidden rounded-full border-2 border-white sm:h-[48px] sm:w-[48px]">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div className="text-[22px] font-bold uppercase tracking-[0.18em] text-white sm:text-[26px]">
                UFO Collection
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-[42px] md:flex">
            <Link
              href="/homepage"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-white hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => router.push("/cartpage")}
            aria-label="Go to cart"
            title="Go to cart"
            className="relative cursor-pointer"
          >
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt="Cart icon"
              className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
            />
            {cartCount > 0 ? (
              <span className="absolute -bottom-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-[5px] text-[11px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="border-t border-[#14162a] bg-[rgba(5,6,17,0.92)] md:hidden">
          <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-3">
            <Link
              href="/homepage"
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-white hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-80px)] bg-[#050816] text-[#e5e7eb]">
        <div className="mx-auto max-w-[1120px] px-4 pb-20 pt-8 md:px-8">
          <div className="mb-6 text-[13px] text-[#9ca3af]">
            <Link href="/homepage" className="hover:text-white">
              Home
            </Link>{" "}
            / <span className="text-[#e5e7eb]">{product.name}</span>
          </div>

          <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.05fr_1.4fr]">
            <div className="rounded-[14px] border border-[#111827] bg-[#050816] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
                    Live Product Preview
                  </h3>
                  <p className="mt-1 text-xs text-[#94a3b8]">
                    Drag to explore • Scroll to zoom • Swipe left/right to change image
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={goToPrevImage}
                    className="rounded-lg border border-[#243041] bg-[#0b1020] px-3 py-2 text-xs font-semibold text-white hover:border-[#1d9bf0] hover:text-[#7dd3fc]"
                    aria-label="Previous image"
                    title="Previous image"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="rounded-lg border border-[#243041] bg-[#0b1020] px-3 py-2 text-xs font-semibold text-white hover:border-[#1d9bf0] hover:text-[#7dd3fc]"
                    aria-label="Next image"
                    title="Next image"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={zoomOut}
                    className="rounded-lg border border-[#243041] bg-[#0b1020] px-3 py-2 text-xs font-semibold text-white hover:border-[#1d9bf0] hover:text-[#7dd3fc]"
                    aria-label="Zoom out"
                    title="Zoom out"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={zoomIn}
                    className="rounded-lg border border-[#243041] bg-[#0b1020] px-3 py-2 text-xs font-semibold text-white hover:border-[#1d9bf0] hover:text-[#7dd3fc]"
                    aria-label="Zoom in"
                    title="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={resetPreview}
                    className="rounded-lg border border-[#243041] bg-[#0b1020] px-3 py-2 text-xs font-semibold text-white hover:border-[#1d9bf0] hover:text-[#7dd3fc]"
                    aria-label="Reset preview"
                    title="Reset preview"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div
                className={`relative h-[520px] w-full overflow-hidden rounded-[12px] border border-[#111827] bg-[#0b1020] ${
                  zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={() => setDragging(false)}
                onWheel={handleWheelZoom}
              >
                <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-[#233044] bg-[rgba(5,8,22,0.75)] px-3 py-1 text-xs font-semibold text-[#cbd5e1] backdrop-blur">
                  Zoom {Math.round(zoomLevel * 100)}%
                </div>

                <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-[#233044] bg-[rgba(5,8,22,0.75)] px-3 py-1 text-xs font-semibold text-[#cbd5e1] backdrop-blur">
                  {currentImageIndex + 1} / {allImages.length}
                </div>

                <div
                  className="relative h-full w-full transition-transform duration-200 ease-out"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                    transformOrigin: "center center",
                  }}
                >
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    className="object-cover object-center select-none"
                    priority
                    draggable={false}
                    unoptimized={currentImage.startsWith("http")}
                  />
                </div>
              </div>

              {allImages.length > 1 ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {allImages.map((img, index) => {
                    const active = currentImage === img;

                    return (
                      <button
                        key={`${img}-${index}`}
                        type="button"
                        onClick={() => selectImage(img)}
                        aria-label={`Select product image ${index + 1}`}
                        title={`Select product image ${index + 1}`}
                        className={`relative h-[76px] w-[76px] overflow-hidden rounded-[10px] border transition ${
                          active
                            ? "border-[#1d9bf0] ring-2 ring-[#1d9bf0]/30"
                            : "border-[#1f2937] hover:border-[#4b5563]"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized={img.startsWith("http")}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div>
              <h1 className="text-[26px] font-semibold">{product.name}</h1>

              <div className="mt-3 flex items-center gap-3">
                <span className="text-[22px] font-semibold">
                  {(product.rating ?? 0).toFixed(1)}
                </span>

                <div className="flex items-center gap-[2px]" aria-label="Rating stars">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < Math.round(product.rating ?? 0);
                    return (
                      <Image
                        key={i}
                        src={filled ? "/images/star.png" : "/star-empty.png"}
                        alt={filled ? "Full star" : "Empty star"}
                        width={16}
                        height={16}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mt-1 text-[13px] text-[#9ca3af]">
                {reviewSummary.count || product.reviews || 0} reviews
              </div>

              <div className="mt-3 text-[22px] font-semibold text-[#7dd3fc]">
                Rs. {product.price}
              </div>

              {product.shortDesc ? (
                <p className="mt-3 max-w-[460px] text-[14px] leading-[1.7] text-[#d1d5db]">
                  {product.shortDesc}
                </p>
              ) : null}

              <div className="mt-6 text-[13px] uppercase tracking-[0.1em] text-[#cbd5f5]">
                Size
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const active = selectedSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      aria-label={`Select size ${s}`}
                      title={`Select size ${s}`}
                      className={`min-w-[40px] rounded-[6px] border px-3 py-[6px] text-[13px] ${
                        active
                          ? "border-[#1d9bf0] bg-[#1d9bf0] text-white"
                          : "border-[#4b5563] bg-transparent text-[#e5e7eb]"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {colors.length > 0 ? (
                <>
                  <div className="mt-6 text-[13px] uppercase tracking-[0.1em] text-[#cbd5f5]">
                    Color
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {colors.map((color) => {
                      const active = selectedColor === color.value;

                      return (
                        <button
                          key={`${color.value}-${color.label}`}
                          type="button"
                          onClick={() => setSelectedColor(color.value)}
                          className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
                            active
                              ? "border-[#1d9bf0] bg-[#0f172a]"
                              : "border-[#2b2f45] bg-transparent"
                          }`}
                          title={color.label}
                          aria-label={`Color ${color.label}`}
                        >
                          <span
                            aria-hidden="true"
                            className="h-5 w-5 rounded-full border border-[#111827]"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-[13px] font-semibold text-white">
                            {color.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              <button
                type="button"
                onClick={addToCart}
                className="mt-5 rounded-[4px] bg-[#1d9bf0] px-6 py-[10px] text-[14px] font-semibold text-white hover:bg-[#1580c5]"
                aria-label="Add product to cart"
                title="Add product to cart"
              >
                ADD TO CART
              </button>

              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="mt-3 rounded-[4px] border border-[#2b2f45] bg-transparent px-6 py-[10px] text-[14px] font-semibold text-white hover:bg-white hover:text-[#050611]"
                aria-label="Try on with AI"
                title="Try on with AI"
              >
                TRY ON WITH AI
              </button>

              {addedMsg ? (
                <div className="mt-3 text-sm font-medium text-[#86efac]">
                  {addedMsg}
                </div>
              ) : null}

              <ul className="mt-4 space-y-1 text-[13px] text-[#cbd5e1]">
                <li>100% Original Products</li>
                <li>Cash on delivery Available</li>
                <li>Easy 7 days return available</li>
              </ul>
            </div>
          </section>

          <section className="mt-10">
            <div className="flex gap-7 border-b border-[#111827] text-[14px]">
              <button
                type="button"
                onClick={() => setActiveTab("description")}
                className={`pb-3 ${
                  activeTab === "description"
                    ? "border-b-2 border-white text-white"
                    : "text-[#9ca3af]"
                }`}
                aria-label="Show description tab"
                title="Show description tab"
              >
                Description
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`pb-3 ${
                  activeTab === "reviews"
                    ? "border-b-2 border-white text-white"
                    : "text-[#9ca3af]"
                }`}
                aria-label="Show reviews tab"
                title="Show reviews tab"
              >
                Reviews{" "}
                <span className="text-[13px]">
                  ({reviewSummary.count || product.reviews || 0})
                </span>
              </button>
            </div>

            <div className="mt-4 text-[14px] leading-[1.7] text-[#d1d5db]">
              {activeTab === "description" ? (
                <p>{FIXED_DESCRIPTION}</p>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-[#9ca3af]">
                    Avg:{" "}
                    <span className="font-semibold text-white">
                      {Number(reviewSummary.avgRating || 0).toFixed(1)}
                    </span>{" "}
                    •{" "}
                    <span className="font-semibold text-white">
                      {reviewSummary.count || 0}
                    </span>{" "}
                    reviews
                  </div>

                  {reviewsLoading ? (
                    <div className="rounded-xl border border-[#111827] bg-[#0b0f1a]/60 p-4 text-[#9aa3cc]">
                      Loading reviews...
                    </div>
                  ) : reviewsError ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                      {reviewsError}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="rounded-xl border border-[#111827] bg-[#0b0f1a]/60 p-4 text-[#9aa3cc]">
                      No reviews yet.
                    </div>
                  ) : (
                    reviews.map((r, index) => (
                      <div
                        key={r.id || r._id || `${r.orderCode}-${index}`}
                        className="rounded-xl border border-[#111827] bg-[#0b0f1a]/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-white">
                              {r.title?.trim() ? r.title : "Review"}
                            </div>

                            {r.createdAt ? (
                              <div className="mt-1 text-xs text-[#9ca3af]">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </div>
                            ) : null}
                          </div>

                          <div className="font-semibold text-[#7dd3fc]">
                            {Number(r.rating || 0).toFixed(1)} / 5
                          </div>
                        </div>

                        {r.comment?.trim() ? (
                          <p className="mt-2 text-sm leading-relaxed text-[#d1d5db]">
                            {r.comment}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-[#9ca3af]">
                            No comment provided.
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="mt-14">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[24px] font-semibold text-white">
                  Related Products
                </h2>
                <p className="mt-1 text-sm text-[#9ca3af]">
                  Products you may also like
                </p>
              </div>
            </div>

            {relatedLoading ? (
              <div className="rounded-2xl border border-[#111827] bg-[#0b0f1a]/60 p-5 text-[#9aa3cc]">
                Loading related products...
              </div>
            ) : relatedError ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-200">
                {relatedError}
              </div>
            ) : relatedProducts.length === 0 ? (
              <div className="rounded-2xl border border-[#111827] bg-[#0b0f1a]/60 p-5 text-[#9aa3cc]">
                No related products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="group overflow-hidden rounded-2xl border border-[#111827] bg-[#0b0f1a]/70 transition duration-300 hover:-translate-y-1 hover:border-[#1d9bf0] hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                  >
                    <div className="relative h-[260px] w-full overflow-hidden bg-[#0f172a]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        unoptimized={item.image.startsWith("http")}
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-[48px] text-[15px] font-semibold text-white">
                        {item.name}
                      </h3>
                      <div className="mt-2 text-[16px] font-semibold text-[#7dd3fc]">
                        Rs. {item.price}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <AITryOnModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        productId={product.id}
        productName={product.name}
      />
    </>
  );
}