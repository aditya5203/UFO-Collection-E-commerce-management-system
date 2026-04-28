"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import ProductHeader from "@/components/layout/ProductHeader";
import MainFooter from "@/components/layout/MainFooter";
import AITryOnModal from "./AITryOnModal";

type Size = "S" | "M" | "L" | "XL" | "XXL";
type ReviewSort = "latest" | "highest" | "lowest";

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
  stock?: number;
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
  stock?: number;
};

type Toast = {
  id: number;
  type: "success" | "error";
  message: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const DEFAULT_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];
const PRODUCT_PLACEHOLDER = "/images/products/placeholder.png";

const FIXED_DESCRIPTION =
  "UFO Collection is an e-commerce website that allows customers to browse and purchase products online with ease. It functions as a digital marketplace where products are organized into well-defined collections, such as clothing and accessories, enabling users to explore items efficiently. Each collection displays product images, names, prices, and brief details to help customers compare options quickly. When a product is selected from a collection, the user is taken to a dedicated product page that provides complete information, including descriptions, available sizes, colors, and pricing. UFO Collection offers a convenient, accessible, and user-friendly shopping experience, allowing customers to shop anytime and from anywhere with global reach.";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 pb-20 pt-7 sm:px-5 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const softPanelClass =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

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

function formatNPR(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
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
    return value
      .split(/,|\||\n/)
      .map((x) => x.trim())
      .filter(Boolean);
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
  return rawImages.map((img) => getProductImageSrc(img)).filter(Boolean);
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
  return readCart().reduce((sum, it) => sum + (Number(it?.qty) || 0), 0);
}

function readRecentlyViewed(): RelatedProduct[] {
  try {
    const raw = localStorage.getItem("ufo_recently_viewed");
    const list = raw ? JSON.parse(raw) : [];

    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function mapProductCard(raw: any): RelatedProduct {
  return {
    id: String(raw?.id || raw?._id || ""),
    name: toStr(raw?.name, "Unnamed Product"),
    price: toNumber(raw?.price, 0),
    image: getProductImageSrc(raw?.image),
  };
}

function ColorDot({ color }: { color: string }) {
  const ref = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.style.backgroundColor = color;
  }, [color]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="h-5 w-5 rounded-full border border-white/30"
    />
  );
}

function PreviewTransformLayer({
  pan,
  zoomLevel,
  children,
}: {
  pan: { x: number; y: number };
  zoomLevel: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    ref.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`;
    ref.current.style.transformOrigin = "center center";
  }, [pan.x, pan.y, zoomLevel]);

  return (
    <div
      ref={ref}
      className="relative h-full w-full transition-transform duration-200 ease-out"
    >
      {children}
    </div>
  );
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

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedSize, setSelectedSize] = React.useState<Size>("M");
  const [selectedImage, setSelectedImage] = React.useState("");
  const [selectedColor, setSelectedColor] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"description" | "reviews">(
    "description"
  );

  const [toast, setToast] = React.useState<Toast | null>(null);
  const [cartCount, setCartCount] = React.useState(0);
  const [aiOpen, setAiOpen] = React.useState(false);

  const [recentlyViewed, setRecentlyViewed] = React.useState<RelatedProduct[]>(
    []
  );

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [reviewSort, setReviewSort] = React.useState<ReviewSort>("latest");
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [reviewsError, setReviewsError] = React.useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = React.useState({
    count: 0,
    avgRating: 0,
  });

  const [relatedProducts, setRelatedProducts] = React.useState<
    RelatedProduct[]
  >([]);
  const [relatedLoading, setRelatedLoading] = React.useState(false);
  const [relatedError, setRelatedError] = React.useState<string | null>(null);

  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);

  const dragStartRef = React.useRef({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  const showToast = React.useCallback(
    (type: "success" | "error", message: string) => {
      const nextToast = { id: Date.now(), type, message };
      setToast(nextToast);

      window.setTimeout(() => {
        setToast((current) =>
          current?.id === nextToast.id ? null : current
        );
      }, 1800);
    },
    []
  );

  const fetchReviews = React.useCallback(async (productId: string) => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);

      const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load reviews");
      }

      const rawReviews = Array.isArray(data?.reviews) ? data.reviews : [];

      const mapped: Review[] = rawReviews.map((r: any) => ({
        id: r.id || r._id || "",
        _id: r._id || r.id || "",
        orderCode: r.orderCode || "",
        rating: Number(r.rating || 0),
        title: typeof r.title === "string" ? r.title : "",
        comment: typeof r.comment === "string" ? r.comment : "",
        createdAt: r.createdAt,
      }));

      const summary =
        data?.summary && typeof data.summary === "object"
          ? {
              count: Number(data.summary.count || 0),
              avgRating: Number(data.summary.avgRating || 0),
            }
          : {
              count: mapped.length,
              avgRating: mapped.length
                ? Number(
                    (
                      mapped.reduce(
                        (sum, item) => sum + Number(item.rating || 0),
                        0
                      ) / mapped.length
                    ).toFixed(2)
                  )
                : 0,
            };

      setReviews(mapped);
      setReviewSummary(summary);

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              rating: summary.avgRating || 0,
              reviews: summary.count || 0,
            }
          : prev
      );
    } catch (e: any) {
      setReviewsError(e?.message || "Failed to load reviews");
      setReviews([]);
      setReviewSummary({ count: 0, avgRating: 0 });
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const updateCart = () => setCartCount(getCartCount());
    updateCart();

    window.addEventListener("ufo_cart_updated", updateCart);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "ufo_cart") updateCart();
    };

    window.addEventListener("storage", onStorage);

    setRecentlyViewed(readRecentlyViewed());

    return () => {
      window.removeEventListener("ufo_cart_updated", updateCart);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          throw new Error("Missing product id in route.");
        }

        const res = await fetch(`${API_BASE}/products/${id}`, {
          cache: "no-store",
        });

        const response = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            response?.message || `Failed to load product (status ${res.status})`
          );
        }

        const raw = response?.data ?? response;

        const mappedStock =
          raw.stock !== undefined ||
          raw.quantity !== undefined ||
          raw.inventory !== undefined
            ? toNumber(raw.stock ?? raw.quantity ?? raw.inventory, 0)
            : 99;

        const mapped: Product = {
          id: String(raw.id || raw._id || id),
          name: toStr(raw.name, "Unnamed Product"),
          price: toNumber(raw.price, 0),
          image: getProductImageSrc(raw.image),
          images: normalizeImageList(raw.images),
          rating: toNumber(raw.rating ?? raw.avgRating, 0),
          reviews: toNumber(raw.reviews ?? raw.reviewCount, 0),
          shortDesc: toStr(raw.shortDesc, toStr(raw.description, "")),
          longDesc: toStr(raw.longDesc, toStr(raw.description, "")),
          sizes: normalizeSizes(raw.sizes),
          colors: normalizeColors(raw),
          stock: mappedStock,
        };

        setProduct(mapped);

        const availableSizes = mapped.sizes?.length
          ? mapped.sizes
          : DEFAULT_SIZES;

        setSelectedSize(
          availableSizes.includes("M") ? "M" : availableSizes[0]
        );

        const gallery = (mapped.images || []).filter(
          (img) => img && img !== mapped.image
        );

        const allImages = [mapped.image, ...gallery];
        setSelectedImage(allImages[0] || mapped.image);

        const normalizedColors = (mapped.colors || []).map((c) => toHex(c));
        setSelectedColor(normalizedColors[0] || "");

        setZoomLevel(1);
        setPan({ x: 0, y: 0 });

        const viewedItem: RelatedProduct = {
          id: mapped.id,
          name: mapped.name,
          price: mapped.price,
          image: mapped.image,
        };

        const existing = readRecentlyViewed().filter(
          (item) => item.id !== mapped.id
        );

        const nextViewed = [viewedItem, ...existing].slice(0, 8);
        localStorage.setItem("ufo_recently_viewed", JSON.stringify(nextViewed));

        setRecentlyViewed(nextViewed.filter((item) => item.id !== mapped.id));
      } catch (e: any) {
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

        const response = await res.json().catch(() => ({}));

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

        const mappedItems: RelatedProduct[] = rawItems.map(mapProductCard);

       setRelatedProducts(mappedItems.filter((item: RelatedProduct) => item.id));
      } catch (e: any) {
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
    fetchReviews(product.id);
  }, [product?.id, fetchReviews]);

  React.useEffect(() => {
    if (!product?.id) return;

    const handleReviewRefresh = () => {
      fetchReviews(product.id);
    };

    window.addEventListener("ufo_review_updated", handleReviewRefresh);

    return () => {
      window.removeEventListener("ufo_review_updated", handleReviewRefresh);
    };
  }, [product?.id, fetchReviews]);

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

  const displayRating = Number(reviewSummary.avgRating || product?.rating || 0);
  const displayReviewCount = Number(
    reviewSummary.count || product?.reviews || 0
  );

  const stockCount = Number(product?.stock ?? 0);
  const isOutOfStock = stockCount <= 0;

  const stockText = isOutOfStock
    ? "Out of Stock"
    : stockCount <= 5
      ? `Only ${stockCount} left 🔥`
      : stockCount <= 15
        ? "Selling fast"
        : "In Stock";

  const sortedReviews = React.useMemo(() => {
    const copy = [...reviews];

    if (reviewSort === "highest") {
      return copy.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    if (reviewSort === "lowest") {
      return copy.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
    }

    return copy.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  }, [reviews, reviewSort]);

  const ratingBreakdown = React.useMemo(() => {
    const total = reviews.length || 0;

    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter(
        (review) => Math.round(Number(review.rating || 0)) === star
      ).length;

      return {
        star,
        count,
        percent: total ? Math.round((count / total) * 100) : 0,
      };
    });
  }, [reviews]);

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

  const handleDoubleClickZoom = () => {
    if (zoomLevel > 1) {
      resetPreview();
      return;
    }

    setZoomLevel(2);
    showToast("success", "Zoom enabled. Drag image to explore.");
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);

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

    e.currentTarget.releasePointerCapture?.(e.pointerId);

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (zoomLevel === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goToNextImage();
      else goToPrevImage();
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

  const buildCartItem = (): CartItem | null => {
    if (!product) return null;

    const currentColorLabel =
      product.colors?.find((c) => toHex(c) === selectedColor) ||
      toColorLabel(selectedColor);

    return {
      id: product.id,
      name: product.name,
      size: selectedSize,
      color: selectedColor || "default",
      colorLabel: selectedColor ? toColorLabel(currentColorLabel) : "Default",
      price: product.price,
      qty: 1,
      image: selectedImage || product.image,
      stock: product.stock,
    };
  };

  const addToCart = () => {
    if (!product) return false;

    if (isOutOfStock) {
      showToast("error", "This product is out of stock.");
      return false;
    }

    const item = buildCartItem();
    if (!item) return false;

    const cart = readCart();

    const idx = cart.findIndex(
      (it) =>
        it.id === item.id && it.size === item.size && it.color === item.color
    );

    if (idx !== -1) {
      const currentQty = Number(cart[idx].qty || 1);
      const maxStock = Number(product.stock || 99);

      if (currentQty >= maxStock) {
        showToast("error", `Only ${maxStock} item(s) available in stock.`);
        return false;
      }

      cart[idx].qty = Math.min(maxStock, currentQty + 1);
      cart[idx].stock = product.stock;
    } else {
      cart.push(item);
    }

    localStorage.setItem("ufo_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("ufo_cart_updated"));

    showToast("success", "Added to cart successfully.");
    return true;
  };

  const handleBuyNow = () => {
    const added = addToCart();
    if (!added) return;

    router.push("/cartpage");
  };

  const copyProductLink = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      showToast("success", "Product link copied.");
    } catch {
      showToast("error", "Could not copy link.");
    }
  };

  const shareProduct = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";

      if (navigator.share && product) {
        await navigator.share({
          title: product.name,
          text: `Check this product: ${product.name}`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      showToast("success", "Product link copied.");
    } catch {
      showToast("error", "Share cancelled or failed.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="rounded-[24px] border border-[#26293a] bg-[#11121a] px-6 py-4 text-sm font-semibold text-[#cbd5f5] shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          Loading product…
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0f] px-4 text-white">
        <div className="max-w-[520px] rounded-[24px] border border-red-500/30 bg-red-500/10 p-5 text-center text-red-200">
          {error || "Product not found."}
        </div>

        <button
          type="button"
          onClick={() => router.push("/collection")}
          className={primaryBtnClass}
        >
          Back to Collection
        </button>
      </main>
    );
  }

  return (
    <>
      <ProductHeader cartCount={cartCount} />

      {toast ? (
        <div className="fixed right-4 top-24 z-[9999]">
          <div
            className={`rounded-2xl border px-5 py-3 text-sm font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur ${
              toast.type === "error"
                ? "border-red-400/30 bg-red-500/20 text-red-100"
                : "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-6 text-[13px] text-[#a7aec4]">
            <Link href="/homepage" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/collection" className="hover:text-white">
              Collection
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{product.name}</span>
          </div>

          <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
            <div className={`${panelClass} h-fit p-4 sm:p-5`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a7aec4]">
                    Live Product Preview
                  </div>

                  <p className="mt-1 text-[12px] text-[#a7aec4]">
                    Double click to zoom • Drag to explore • Swipe left/right
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["Prev", goToPrevImage],
                    ["Next", goToNextImage],
                    ["-", zoomOut],
                    ["+", zoomIn],
                    ["Reset", resetPreview],
                  ].map(([label, action]) => (
                    <button
                      key={String(label)}
                      type="button"
                      onClick={action as () => void}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10"
                    >
                      {String(label)}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`relative aspect-[4/5] w-full overflow-hidden rounded-[20px] border border-[#26293a] bg-[#0d0f17] ${
                  zoomLevel > 1
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-zoom-in"
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => setDragging(false)}
                onPointerLeave={() => setDragging(false)}
                onWheel={handleWheelZoom}
                onDoubleClick={handleDoubleClickZoom}
              >
                <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  🔍 Zoom {Math.round(zoomLevel * 100)}%
                </div>

                <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {currentImageIndex + 1} / {allImages.length || 1}
                </div>

                {isOutOfStock ? (
                  <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full border border-red-400/30 bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-100 backdrop-blur">
                    Out of Stock
                  </div>
                ) : null}

                <PreviewTransformLayer pan={pan} zoomLevel={zoomLevel}>
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    className={`select-none object-cover object-top ${
                      isOutOfStock ? "opacity-60 grayscale" : ""
                    }`}
                    priority
                    draggable={false}
                    unoptimized={currentImage.startsWith("http")}
                  />
                </PreviewTransformLayer>
              </div>

              {allImages.length > 1 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {allImages.map((img, index) => {
                    const active = currentImage === img;

                    return (
                      <button
                        key={`${img}-${index}`}
                        type="button"
                        aria-label={`View product image ${index + 1}`}
                        title={`View product image ${index + 1}`}
                        onClick={() => selectImage(img)}
                        className={`relative h-[76px] w-[76px] overflow-hidden rounded-[14px] border transition ${
                          active
                            ? "border-[#d6c7ff] ring-2 ring-[#d6c7ff]/25"
                            : "border-[#26293a] hover:border-[#4a506b]"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className={`object-cover ${
                            isOutOfStock ? "opacity-60 grayscale" : ""
                          }`}
                          unoptimized={img.startsWith("http")}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className={`${panelClass} p-5 sm:p-7 lg:p-8`}>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Product Details
              </div>

              <h1 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[42px]">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-semibold text-white">
                  ★ {displayRating.toFixed(1)}
                </span>

                <span className="text-[13px] text-[#a7aec4]">
                  {displayReviewCount} reviews
                </span>
              </div>

              <div className="mt-5 text-[26px] font-semibold text-[#d6c7ff]">
                {formatNPR(product.price)}
              </div>

              <div
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                  isOutOfStock
                    ? "border-red-400/30 bg-red-500/10 text-red-200"
                    : stockCount <= 5
                      ? "border-orange-400/30 bg-orange-500/10 text-orange-200"
                      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {stockText}
              </div>

              {product.shortDesc ? (
                <p className="mt-4 max-w-[560px] text-[14px] leading-7 text-[#a7aec4]">
                  {product.shortDesc}
                </p>
              ) : null}

              <div className="mt-7">
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Size
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const active = selectedSize === s;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        disabled={isOutOfStock}
                        className={`min-w-[48px] rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
                          isOutOfStock
                            ? "cursor-not-allowed border-[#374151] bg-[#111827] text-[#6b7280]"
                            : active
                              ? "border-white bg-white text-[#090a12]"
                              : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {colors.length > 0 ? (
                <div className="mt-7">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                    Color
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {colors.map((color) => {
                      const active = selectedColor === color.value;

                      return (
                        <button
                          key={`${color.value}-${color.label}`}
                          type="button"
                          onClick={() => setSelectedColor(color.value)}
                          disabled={isOutOfStock}
                          title={color.label}
                          aria-label={`Color ${color.label}`}
                          className={`flex items-center gap-2 rounded-full border px-4 py-2 transition ${
                            isOutOfStock
                              ? "cursor-not-allowed border-[#374151] bg-[#111827] opacity-60"
                              : active
                                ? "border-white bg-white/10"
                                : "border-white/15 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <ColorDot color={color.value} />

                          <span className="text-[13px] font-semibold text-white">
                            {color.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={isOutOfStock}
                  className={primaryBtnClass}
                >
                  {isOutOfStock ? "Out Of Stock" : "Add To Cart"}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="rounded-full bg-[#8b5cf6] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200 disabled:hover:translate-y-0"
                >
                  Buy Now
                </button>

                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className={secondaryBtnClass}
                >
                  Try On With AI
                </button>

                <button
                  type="button"
                  onClick={shareProduct}
                  className={secondaryBtnClass}
                >
                  Share Product
                </button>
              </div>

              <button
                type="button"
                onClick={copyProductLink}
                className="mt-3 text-[13px] font-semibold text-[#a7aec4] transition hover:text-white"
              >
                Copy product link
              </button>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["Original", "100% original products"],
                  ["COD", "Cash on delivery"],
                  ["Return", "7 days easy return"],
                ].map(([title, text]) => (
                  <div key={title} className={`${softPanelClass} p-4`}>
                    <div className="text-[13px] font-semibold text-white">
                      {title}
                    </div>

                    <div className="mt-1 text-[12px] leading-5 text-[#a7aec4]">
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`${panelClass} mt-8 p-5 sm:p-7`}>
            <div className="flex gap-7 border-b border-[#26293a] text-[14px]">
              <button
                type="button"
                onClick={() => setActiveTab("description")}
                className={`pb-3 ${
                  activeTab === "description"
                    ? "border-b-2 border-white text-white"
                    : "text-[#a7aec4]"
                }`}
              >
                Description
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`pb-3 ${
                  activeTab === "reviews"
                    ? "border-b-2 border-white text-white"
                    : "text-[#a7aec4]"
                }`}
              >
                Reviews ({displayReviewCount})
              </button>
            </div>

            <div className="mt-5 text-[14px] leading-7 text-[#a7aec4]">
              {activeTab === "description" ? (
                <p>{FIXED_DESCRIPTION}</p>
              ) : (
                <div className="space-y-5">
                  <div className={`${softPanelClass} p-5`}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-[32px] font-bold text-white">
                          {displayRating.toFixed(1)}
                          <span className="ml-2 text-base text-[#a7aec4]">
                            / 5
                          </span>
                        </div>

                        <div className="mt-1 text-sm text-[#a7aec4]">
                          Based on {displayReviewCount} reviews
                        </div>
                      </div>

                      <div className="w-full max-w-[520px] space-y-2">
                        {ratingBreakdown.map((row) => (
                          <div
                            key={row.star}
                            className="flex items-center gap-3 text-xs"
                          >
                            <span className="w-10 text-white">
                              {row.star}★
                            </span>

                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                              <div
                              className="h-full rounded-full bg-[#d6c7ff] transition-all duration-500"
                              data-width={row.percent}
                              />
                            </div>

                            <span className="w-8 text-right text-[#a7aec4]">
                              {row.count}
                            </span>
                          </div>
                        ))}
                      </div>

                      <select
                        value={reviewSort}
                        title="Sort reviews"
                        aria-label="Sort reviews"
                        onChange={(e) =>
                          setReviewSort(e.target.value as ReviewSort)
                        }
                        className="rounded-full border border-white/15 bg-[#0d0f17] px-4 py-2 text-sm font-semibold text-white outline-none"
                      >
                        <option value="latest">Latest</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                      </select>
                    </div>
                  </div>

                  {reviewsLoading ? (
                    <div className={`${softPanelClass} p-4`}>
                      Loading reviews...
                    </div>
                  ) : reviewsError ? (
                    <div className="rounded-[18px] border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                      {reviewsError}
                    </div>
                  ) : sortedReviews.length === 0 ? (
                    <div className={`${softPanelClass} p-4`}>
                      No reviews yet.
                    </div>
                  ) : (
                    sortedReviews.map((r, index) => (
                      <div
                        key={r.id || r._id || `${r.orderCode}-${index}`}
                        className={`${softPanelClass} p-4`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-white">
                              {r.title?.trim() ? r.title : "Review"}
                            </div>

                            {r.createdAt ? (
                              <div className="mt-1 text-xs text-[#a7aec4]">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </div>
                            ) : null}
                          </div>

                          <div className="font-semibold text-[#d6c7ff]">
                            {Number(r.rating || 0).toFixed(1)} / 5
                          </div>
                        </div>

                        <p className="mt-2 text-sm leading-relaxed text-[#a7aec4]">
                          {r.comment?.trim()
                            ? r.comment
                            : "No comment provided."}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

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
        </div>
      </main>

      <MainFooter />

      <AITryOnModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        productId={product.id}
        productName={product.name}
      />
    </>
  );
}