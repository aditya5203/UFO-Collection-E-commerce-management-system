"use client";

import { API_URL } from "@/lib/api";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import ProductHeader from "@/components/layout/ProductHeader";
import MainFooter from "@/components/layout/MainFooter";
import AITryOnModal from "./AITryOnModal";
import ProductToast from "./_components/ProductToast";
import ProductBreadcrumb from "./_components/ProductBreadcrumb";
import ProductPreviewGallery from "./_components/ProductPreviewGallery";
import ProductInfoPanel from "./_components/ProductInfoPanel";
import ProductDetailsTabs from "./_components/ProductDetailsTabs";
import ProductRecommendations from "./_components/ProductRecommendations";

type Size =
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44"
  | "45";

type ReviewSort = "latest" | "highest" | "lowest";

type ProductVariant = {
  id: string;
  color: string;
  size: Size;
  stock: number;
  sku?: string;
  isActive: boolean;
};

type Product = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  discountPercent: number;
  image: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  shortDesc?: string;
  longDesc?: string;
  sizes?: Size[];
  colors?: string[];
  stock?: number;
  variants?: ProductVariant[];
};

type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  discountPercent: number;
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
  productId?: string;
  variantId?: string;
  name: string;
  size: string;
  color: string;
  colorLabel: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
 discountPercent?: number;
  qty: number;
  image: string;
  stock?: number;
  totalProductStock?: number;
};

type Toast = {
  id: number;
  type: "success" | "error";
  message: string;
};

const API_BASE = API_URL;

const DEFAULT_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

const ALL_SIZE_OPTIONS: Size[] = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
];

const PRODUCT_PLACEHOLDER = "/images/products/placeholder.png";
const LAST_PRODUCT_ID_KEY = "last_product_id";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 pb-20 pt-7 sm:px-5 lg:px-6";

const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200 disabled:hover:translate-y-0";

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

function getDiscountData(raw: any) {
  const price = toNumber(raw?.price, 0);

  const compareAtPrice =
    raw?.compareAtPrice == null || raw?.compareAtPrice === ""
      ? undefined
      : toNumber(raw?.compareAtPrice, 0);

  const fallbackDiscount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.min(
          Math.max(Math.round(toNumber(raw?.discountPercent, fallbackDiscount)), 0),
          100
        )
      : 0;

  return {
    price,
    compareAtPrice,
    discountPercent,
  };
}

function normalizeSizes(sizes: any): Size[] {
  if (!Array.isArray(sizes)) return DEFAULT_SIZES;

  const clean = sizes
    .map((x) => String(x || "").trim().toUpperCase())
    .filter((x): x is Size => ALL_SIZE_OPTIONS.includes(x as Size));

  return clean.length ? clean : DEFAULT_SIZES;
}

function isHexColor(v: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
}

const COLOR_NAME_TO_HEX: Record<string, string> = {
  black: "#000000",
  charcoal: "#111111",
  "charcoal black": "#111111",

  white: "#ffffff",
  "off white": "#f5f5f5",
  cream: "#f8f4ec",
  "cream white": "#f8f4ec",
  ivory: "#fffaf0",
  beige: "#b89b72",
  linen: "#faf0e6",

  red: "#ef4444",
  "dark red": "#dc2626",
  "rust red": "#9e3d35",
  burgundy: "#7b1e2b",
  "dark maroon": "#410606",
  rose: "#be123c",

  blue: "#4287f5",
  "light blue": "#8fb6d6",
  "sky blue": "#89b7e3",
  "navy blue": "#243b6b",
  navy: "#243b6b",
  "blue denim": "#2f5d8c",

  green: "#22c55e",
  "dark green": "#16a34a",
  olive: "#6b785e",
  "olive green": "#6b785e",
  "dark olive": "#383428",

  yellow: "#eab308",
  "light yellow": "#facc15",

  grey: "#808080",
  gray: "#808080",
  "ash grey": "#7d7d7d",
  "ash gray": "#7d7d7d",
  "washed grey": "#8a8178",
  "washed gray": "#8a8178",
  "dark grey": "#2b2d30",
  "dark gray": "#2b2d30",

  pink: "#ec4899",
  "light pink": "#f9a8d4",

  purple: "#9510e8",
  orange: "#f97316",

  brown: "#7b5a46",
  "dark brown": "#78350f",
  "chocolate brown": "#4b2e24",
};

const HEX_TO_COLOR_NAME: Record<string, string> = {
  "#000000": "Black",
  "#111111": "Black",
  "#16191f": "Black",
  "#0f0f0f": "Black",
  "#2b2b2b": "Charcoal Black",

  "#302b2b": "Dark Brown",
  "#4b2e2b": "Brown",
  "#4b2e24": "Chocolate Brown",

  "#ffffff": "White",
  "#f5f5f5": "Off White",
  "#f3f2f2": "White",
  "#f8f4ec": "Cream White",
  "#fffaf0": "Ivory",
  "#fdf6ec": "Beige",
  "#faf0e6": "Linen",

  "#808080": "Grey",
  "#9ca3af": "Grey",
  "#8a8f98": "Ash Grey",
  "#7d7d7d": "Ash Grey",
  "#8a8178": "Washed Grey",
  "#b7b7b7": "Grey",
  "#2b2d30": "Dark Grey",
  "#4a4f54": "Grey",

  "#ef4444": "Red",
  "#dc2626": "Dark Red",
  "#eb4034": "Red",
  "#9e3d35": "Rust Red",
  "#7b1e2b": "Burgundy",
  "#410606": "Dark Maroon",
  "#be123c": "Rose",

  "#3b82f6": "Blue",
  "#4287f5": "Blue",
  "#2f5d8c": "Blue Denim",
  "#60a5fa": "Light Blue",
  "#8fb6d6": "Light Blue",
  "#89b7e3": "Sky Blue",
  "#93c5fd": "Sky Blue",
  "#000080": "Navy Blue",
  "#243b6b": "Navy Blue",
  "#1e2f6f": "Navy Blue",
  "#1f2e5a": "Navy Blue",

  "#22c55e": "Green",
  "#16a34a": "Dark Green",
  "#6b7054": "Olive Green",
  "#6b785e": "Olive Green",
  "#383428": "Dark Olive",

  "#eab308": "Yellow",
  "#facc15": "Light Yellow",

  "#ec4899": "Pink",
  "#f9a8d4": "Light Pink",

  "#a855f7": "Purple",
  "#9510e8": "Purple",

  "#f97316": "Orange",

  "#92400e": "Brown",
  "#78350f": "Dark Brown",
  "#7b5a46": "Brown",
  "#8b4e3b": "Brown",

  "#c2b59b": "Beige",
  "#b89b72": "Beige",

  "#334155": "Slate",
};

function toHex(color: string) {
  const c = String(color || "").trim();

  if (!c) return "#16191f";
  if (isHexColor(c)) return c.toLowerCase();

  return COLOR_NAME_TO_HEX[c.toLowerCase()] || "#16191f";
}

function toColorLabel(color: string) {
  const clean = String(color || "").trim();

  if (!clean) return "Default";

  const hex = toHex(clean).toLowerCase();

  if (HEX_TO_COLOR_NAME[hex]) return HEX_TO_COLOR_NAME[hex];

  if (isHexColor(clean)) return clean.toLowerCase();

  return clean
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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

function normalizeVariant(raw: any): ProductVariant | null {
  const color = toHex(String(raw?.color || ""));
  const size = String(raw?.size || "").trim().toUpperCase() as Size;

  if (!ALL_SIZE_OPTIONS.includes(size)) return null;

  return {
    id: String(raw?.id || raw?._id || ""),
    color,
    size,
    stock: toNumber(raw?.stock, 0),
    sku: toStr(raw?.sku, ""),
    isActive: raw?.isActive !== false,
  };
}

function normalizeVariants(rawVariants: any): ProductVariant[] {
  if (!Array.isArray(rawVariants)) return [];

  return rawVariants
    .map(normalizeVariant)
    .filter((variant): variant is ProductVariant => Boolean(variant));
}

function descriptionToPoints(description: string) {
  const clean = String(description || "").replace(/\s+/g, " ").trim();

  if (!clean) return [];

  const lineBasedPoints = String(description || "")
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .trim()
    )
    .filter(Boolean);

  if (lineBasedPoints.length > 1) return lineBasedPoints;

  const sentencePoints = clean
    .split(/\.|;|\|/)
    .map((point) => point.trim())
    .filter((point) => point.length > 8);

  if (sentencePoints.length > 1) return sentencePoints;

  const capitalSplitPoints = clean
    .split(/(?<=[a-z0-9])\s+(?=[A-Z][a-z])/g)
    .map((point) => point.trim())
    .filter((point) => point.length > 8);

  if (capitalSplitPoints.length > 1) return capitalSplitPoints;

  return [clean];
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
  const discount = getDiscountData(raw);

  return {
    id: String(raw?.id || raw?._id || ""),
    name: toStr(raw?.name, "Unnamed Product"),
    price: discount.price,
    compareAtPrice: discount.compareAtPrice,
    discountPercent: discount.discountPercent,
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
        setToast((current) => (current?.id === nextToast.id ? null : current));
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

        if (!id) throw new Error("Missing product id in route.");

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
        const variants = normalizeVariants(raw?.variants);
        const discount = getDiscountData(raw);

        const mappedStock =
          raw.stock !== undefined ||
          raw.quantity !== undefined ||
          raw.inventory !== undefined
            ? toNumber(raw.stock ?? raw.quantity ?? raw.inventory, 0)
            : variants.length
              ? variants
                  .filter((variant) => variant.isActive)
                  .reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
              : 99;

        const variantColors = Array.from(
          new Set(
            variants
              .filter((variant) => variant.isActive)
              .map((variant) => variant.color)
          )
        );

        const variantSizes = Array.from(
          new Set(
            variants
              .filter((variant) => variant.isActive)
              .map((variant) => variant.size)
          )
        );

        const mapped: Product = {
          id: String(raw.id || raw._id || id),
          name: toStr(raw.name, "Unnamed Product"),
          price: discount.price,
          compareAtPrice: discount.compareAtPrice,
          discountPercent: discount.discountPercent,
          image: getProductImageSrc(raw.image),
          images: normalizeImageList(raw.images),
          rating: toNumber(raw.rating ?? raw.avgRating, 0),
          reviews: toNumber(raw.reviews ?? raw.reviewCount, 0),
          shortDesc: toStr(raw.shortDesc, toStr(raw.description, "")),
          longDesc: toStr(raw.longDesc, toStr(raw.description, "")),
          sizes: variants.length ? variantSizes : normalizeSizes(raw.sizes),
          colors: variants.length ? variantColors : normalizeColors(raw),
          stock: mappedStock,
          variants,
        };

        setProduct(mapped);

        const activeVariants = variants.filter(
          (variant) => variant.isActive && variant.stock > 0
        );

        const firstAvailableVariant =
          activeVariants.find((variant) => variant.size === "M") ||
          activeVariants[0] ||
          variants.find((variant) => variant.isActive) ||
          variants[0];

        const availableSizes = mapped.sizes?.length
          ? mapped.sizes
          : DEFAULT_SIZES;

        if (firstAvailableVariant) {
          setSelectedColor(firstAvailableVariant.color);
          setSelectedSize(firstAvailableVariant.size);
        } else {
          setSelectedSize(
            availableSizes.includes("M") ? "M" : availableSizes[0]
          );

          const normalizedColors = (mapped.colors || []).map((c) => toHex(c));
          setSelectedColor(normalizedColors[0] || "");
        }

        const gallery = (mapped.images || []).filter(
          (img) => img && img !== mapped.image
        );

        const allImages = [mapped.image, ...gallery];
        setSelectedImage(allImages[0] || mapped.image);

        setZoomLevel(1);
        setPan({ x: 0, y: 0 });

        const viewedItem: RelatedProduct = {
          id: mapped.id,
          name: mapped.name,
          price: mapped.price,
          compareAtPrice: mapped.compareAtPrice,
          discountPercent: mapped.discountPercent,
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

        setRelatedProducts(
          mappedItems.filter((item: RelatedProduct) => item.id)
        );
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
    localStorage.setItem(LAST_PRODUCT_ID_KEY, product.id);
  }, [product?.id]);

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

  const activeVariants = React.useMemo(
    () => (product?.variants || []).filter((variant) => variant.isActive),
    [product?.variants]
  );

  const hasVariantInventory = activeVariants.length > 0;

  const colors = React.useMemo(() => {
    const sourceColors = hasVariantInventory
      ? Array.from(new Set(activeVariants.map((variant) => variant.color)))
      : product?.colors || [];

    return sourceColors.map((c) => ({
      value: toHex(c),
      label: toColorLabel(c),
    }));
  }, [activeVariants, hasVariantInventory, product?.colors]);

  const sizes = React.useMemo(() => {
    if (!hasVariantInventory) {
      return product?.sizes?.length ? product.sizes : DEFAULT_SIZES;
    }

    const selectedColorVariants = activeVariants.filter(
      (variant) => variant.color === selectedColor
    );

    const source =
      selectedColorVariants.length > 0 ? selectedColorVariants : activeVariants;

    return Array.from(new Set(source.map((variant) => variant.size)));
  }, [activeVariants, hasVariantInventory, product?.sizes, selectedColor]);

  const selectedVariant = React.useMemo(() => {
    if (!hasVariantInventory) return null;

    return (
      activeVariants.find(
        (variant) =>
          variant.color === selectedColor && variant.size === selectedSize
      ) || null
    );
  }, [activeVariants, hasVariantInventory, selectedColor, selectedSize]);

  React.useEffect(() => {
    if (!hasVariantInventory) return;
    if (!selectedColor) return;

    const colorSizes = activeVariants
      .filter((variant) => variant.color === selectedColor)
      .map((variant) => variant.size);

    if (colorSizes.length > 0 && !colorSizes.includes(selectedSize)) {
      const firstInStock =
        activeVariants.find(
          (variant) =>
            variant.color === selectedColor &&
            variant.stock > 0 &&
            variant.isActive
        ) ||
        activeVariants.find(
          (variant) => variant.color === selectedColor && variant.isActive
        );

      if (firstInStock) {
        setSelectedSize(firstInStock.size);
      }
    }
  }, [activeVariants, hasVariantInventory, selectedColor, selectedSize]);

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

  const totalProductStock = Number(product?.stock ?? 0);

  const selectedVariantStock = hasVariantInventory
    ? Number(selectedVariant?.stock ?? 0)
    : totalProductStock;

  const isVariantMissing = hasVariantInventory && !selectedVariant;
  const isOutOfStock = isVariantMissing || selectedVariantStock <= 0;

  const stockText = isVariantMissing
    ? "This size/color is not available"
    : isOutOfStock
      ? "Out of Stock"
      : selectedVariantStock <= 5
        ? `Only ${selectedVariantStock} left 🔥`
        : selectedVariantStock <= 15
          ? "Selling fast"
          : "In Stock";

  const descriptionPoints = descriptionToPoints(
    product?.longDesc || product?.shortDesc || ""
  );

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

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);

    if (!hasVariantInventory) return;

    const colorVariants = activeVariants.filter(
      (variant) => variant.color === color
    );

    const preferredVariant =
      colorVariants.find(
        (variant) => variant.size === selectedSize && variant.stock > 0
      ) ||
      colorVariants.find((variant) => variant.stock > 0) ||
      colorVariants[0];

    if (preferredVariant) {
      setSelectedSize(preferredVariant.size);
    }
  };

  const buildCartItem = (): CartItem | null => {
    if (!product) return null;

    const currentColorLabel =
      colors.find((color) => color.value === selectedColor)?.label ||
      toColorLabel(selectedColor);

    return {
      id: product.id,
      productId: product.id,
      variantId: selectedVariant?.id || undefined,
      name: product.name,
      size: selectedSize,
      color: selectedColor || "default",
      colorLabel: selectedColor ? currentColorLabel : "Default",
      sku: selectedVariant?.sku || undefined,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      discountPercent: product.discountPercent,
      qty: 1,
      image: selectedImage || product.image,
      stock: selectedVariantStock,
      totalProductStock,
    };
  };

  const addToCart = () => {
    if (!product) return false;

    if (isVariantMissing) {
      showToast("error", "This color and size combination is not available.");
      return false;
    }

    if (isOutOfStock) {
      showToast("error", "This selected variant is out of stock.");
      return false;
    }

    const item = buildCartItem();
    if (!item) return false;

    const cart = readCart();

    const idx = cart.findIndex((it) => {
      if (item.variantId) {
        return it.variantId === item.variantId;
      }

      return (
        it.id === item.id && it.size === item.size && it.color === item.color
      );
    });

    if (idx !== -1) {
      const currentQty = Number(cart[idx].qty || 1);
      const maxStock = Number(selectedVariantStock || 0);

      if (currentQty >= maxStock) {
        showToast("error", `Only ${maxStock} item(s) available in stock.`);
        return false;
      }

      cart[idx].qty = Math.min(maxStock, currentQty + 1);
      cart[idx].stock = selectedVariantStock;
      cart[idx].variantId = item.variantId;
      cart[idx].sku = item.sku;
      cart[idx].productId = product.id;
      cart[idx].totalProductStock = totalProductStock;
    } else {
      cart.push(item);
    }

    localStorage.setItem(LAST_PRODUCT_ID_KEY, product.id);
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

      <ProductToast toast={toast} />

      <main className={shellClass}>
        <div className={containerClass}>
          <ProductBreadcrumb productName={product.name} />

          <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
            <ProductPreviewGallery
              productName={product.name}
              currentImage={currentImage}
              allImages={allImages}
              currentImageIndex={currentImageIndex}
              isOutOfStock={isOutOfStock}
              zoomLevel={zoomLevel}
              pan={pan}
              dragging={dragging}
              onPrev={goToPrevImage}
              onNext={goToNextImage}
              onZoomOut={zoomOut}
              onZoomIn={zoomIn}
              onReset={resetPreview}
              onSelectImage={selectImage}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => setDragging(false)}
              onPointerLeave={() => setDragging(false)}
              onWheel={handleWheelZoom}
              onDoubleClick={handleDoubleClickZoom}
            />

            <ProductInfoPanel
              product={product}
              descriptionPoints={descriptionPoints}
              displayRating={displayRating}
              displayReviewCount={displayReviewCount}
              hasVariantInventory={hasVariantInventory}
              totalProductStock={totalProductStock}
              selectedVariant={selectedVariant}
              selectedVariantStock={selectedVariantStock}
              isOutOfStock={isOutOfStock}
              stockText={stockText}
              sizes={sizes}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              colors={colors}
              selectedColor={selectedColor}
              activeVariants={activeVariants}
              handleColorSelect={handleColorSelect}
              addToCart={addToCart}
              handleBuyNow={handleBuyNow}
              openAi={() => setAiOpen(true)}
              shareProduct={shareProduct}
              copyProductLink={copyProductLink}
            />
          </section>

          <ProductDetailsTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            displayReviewCount={displayReviewCount}
            displayRating={displayRating}
            sizes={sizes}
            colors={colors}
            stockText={stockText}
            selectedVariant={selectedVariant}
            ratingBreakdown={ratingBreakdown}
            reviewSort={reviewSort}
            setReviewSort={setReviewSort}
            reviewsLoading={reviewsLoading}
            reviewsError={reviewsError}
            sortedReviews={sortedReviews}
          />

          <ProductRecommendations
            relatedLoading={relatedLoading}
            relatedError={relatedError}
            relatedProducts={relatedProducts}
            recentlyViewed={recentlyViewed}
          />
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