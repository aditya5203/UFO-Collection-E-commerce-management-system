// client/app/collection/page.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import CollectionHeader from "@/components/layout/CollectionHeader";
import MainFooter from "@/components/layout/MainFooter";

type CustomerType = "Men" | "Women" | "Boys" | "Girls";
type ToastType = "success" | "error" | "info";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  customer?: CustomerType;
  subCategory?: string;
  createdAt?: string;
  gender?: "Male" | "Female";
  colors?: string[];
  categoryId?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
};

type BackendProduct = {
  id?: string;
  _id?: string;
  slug?: string;
  name?: string;
  title?: string;
  price?: number | string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  avgRating?: number;
  averageRating?: number;
  rating?: number;
  displayRating?: number;
  ratingsAverage?: number;
  reviewCount?: number;
  reviews?: number;
  totalReviews?: number;
  reviewsCount?: number;
  numReviews?: number;
  stock?: number;
  quantity?: number;
  inventory?: number;
  gender?: "Male" | "Female" | string;
  customer?: string;
  customerType?: string;
  audience?: string;
  targetAudience?: string;
  subCategory?: string;
  category?: string;
  categoryName?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  colors?: string[];
  categoryId?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] pb-14 text-[#f5f7fb]";

const containerClass =
  "mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-5 sm:py-8 lg:px-8";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 sm:px-6 sm:py-3";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:px-6 sm:py-3";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -26 },
  show: { opacity: 1, x: 0 },
};

const productGridMotion = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const productCardMotion = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
};

function norm(s: unknown) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveMediaSrc(src: unknown) {
  const s = typeof src === "string" ? src.trim() : "";

  if (!s) return "/images/placeholder.png";

  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }

  if (s.startsWith("/")) {
    return s;
  }

  return `${API_ORIGIN}/${s.replace(/^\/+/, "")}`;
}

function parseDateSafe(d?: string) {
  if (!d) return 0;

  const t = Date.parse(d);

  return Number.isFinite(t) ? t : 0;
}

function normalizeCustomer(p: BackendProduct): CustomerType | undefined {
  const raw = norm(
    `${p.customer || ""} ${p.customerType || ""} ${p.audience || ""} ${
      p.targetAudience || ""
    } ${p.category || ""} ${p.categoryName || ""} ${p.subCategory || ""} ${
      p.name || ""
    }`
  );

  if (raw.includes("girls") || raw.includes("girl")) return "Girls";
  if (raw.includes("boys") || raw.includes("boy")) return "Boys";

  if (
    raw.includes("women") ||
    raw.includes("female") ||
    raw.includes("ladies")
  ) {
    return "Women";
  }

  if (raw.includes("men") || raw.includes("male") || raw.includes("gents")) {
    return "Men";
  }

  if (p.gender === "Male") return "Men";
  if (p.gender === "Female") return "Women";

  return undefined;
}

function mapBackendProduct(p: BackendProduct): Product {
  const rating =
    p.avgRating ??
    p.averageRating ??
    p.rating ??
    p.displayRating ??
    p.ratingsAverage ??
    0;

  const reviews =
    p.reviewCount ??
    p.reviews ??
    p.totalReviews ??
    p.reviewsCount ??
    p.numReviews ??
    0;

  const id = String(p.id || p._id || p.slug || "");

  return {
    id,
    name: String(p.name || p.title || "Product"),
    price:
      typeof p.price === "string" ? Number(p.price) || 0 : Number(p.price ?? 0),
    image: resolveMediaSrc(p.image || p.imageUrl || p.thumbnail),
    customer: normalizeCustomer(p),
    subCategory: String(p.subCategory || p.categoryName || p.category || ""),
    createdAt: p.createdAt || p.created_at || p.updatedAt || p.updated_at,
    gender: p.gender === "Male" || p.gender === "Female" ? p.gender : undefined,
    colors: Array.isArray(p.colors) ? p.colors : [],
    categoryId: p.categoryId || undefined,
    rating: Number(rating || 0),
    reviews: Number(reviews || 0),
    stock: Number(p.stock ?? p.quantity ?? p.inventory ?? 0),
  };
}

function buildProductSearchText(product: Product) {
  return norm(
    [
      product.name,
      product.customer,
      product.subCategory,
      product.gender,
      product.categoryId,
      ...(product.colors || []),
      product.price ? `rs ${product.price}` : "",
      product.stock ? `stock ${product.stock}` : "",
    ].join(" ")
  );
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  const tone =
    toast?.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast?.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast?.type === "error"
      ? "bg-red-300"
      : toast?.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6"
        >
          <div
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
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProductCard({
  product,
  onOutOfStockClick,
  onInvalidProductClick,
}: {
  product: Product;
  onOutOfStockClick: () => void;
  onInvalidProductClick: () => void;
}) {
  const stockCount = Number(product.stock || 0);
  const isOutOfStock = stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;
  const hasValidId = Boolean(product.id);

  if (isOutOfStock) {
    return (
      <button
        type="button"
        onClick={onOutOfStockClick}
        className="group block w-full text-left"
        aria-label={`${product.name} is out of stock`}
      >
        <ProductCardInner
          product={product}
          isOutOfStock={isOutOfStock}
          isLowStock={isLowStock}
          stockCount={stockCount}
        />
      </button>
    );
  }

  if (!hasValidId) {
    return (
      <button
        type="button"
        onClick={onInvalidProductClick}
        className="group block w-full text-left"
        aria-label={`${product.name} is unavailable`}
      >
        <ProductCardInner
          product={product}
          isOutOfStock={false}
          isLowStock={isLowStock}
          stockCount={stockCount}
        />
      </button>
    );
  }

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <ProductCardInner
        product={product}
        isOutOfStock={isOutOfStock}
        isLowStock={isLowStock}
        stockCount={stockCount}
      />
    </Link>
  );
}

function ProductCardInner({
  product,
  isOutOfStock,
  isLowStock,
  stockCount,
}: {
  product: Product;
  isOutOfStock: boolean;
  isLowStock: boolean;
  stockCount: number;
}) {
  return (
    <motion.div
      variants={productCardMotion}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={
        isOutOfStock
          ? undefined
          : {
              y: -8,
              scale: 1.015,
              transition: { type: "spring", stiffness: 260, damping: 20 },
            }
      }
      className={`overflow-hidden rounded-[22px] border bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)] ${
        isOutOfStock
          ? "border-red-400/25"
          : "border-[#26293a] hover:border-[#4a506b] hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
      }`}
    >
      <div className="relative aspect-[3.6/5] w-full overflow-hidden bg-[#0d0f17]">
        <Image
          src={resolveMediaSrc(product.image)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition duration-500 group-hover:scale-[1.06] ${
            isOutOfStock ? "opacity-45 grayscale" : ""
          }`}
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.customer ? (
            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
              {product.customer}
            </span>
          ) : null}
        </div>

        {isOutOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full border border-red-300/40 bg-red-500/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-red-100 backdrop-blur">
              Out of Stock
            </span>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 right-3 translate-y-2 rounded-full bg-white px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#090a12] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            View Product
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c8cde0]">
            {product.subCategory || "Fashion"}
          </span>
        </div>

        <div className="line-clamp-2 min-h-[46px] text-[15px] font-medium leading-6 text-[#f5f7fb] sm:text-[16px]">
          {product.name}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="text-[14px] font-semibold text-[#d6c7ff] sm:text-[15px]">
            Rs. {Number(product.price || 0).toFixed(2)}
          </div>

          <div className="text-[12px] text-[#a7aec4]">
            ★ {Number(product.rating || 0).toFixed(1)}
            <span className="ml-1">({Number(product.reviews || 0)})</span>
          </div>
        </div>

        <div
          className={`mt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            isOutOfStock
              ? "text-red-300"
              : isLowStock
                ? "text-yellow-300"
                : "text-emerald-300"
          }`}
        >
          {isOutOfStock
            ? "Out of Stock"
            : isLowStock
              ? `Only ${stockCount} left`
              : `${stockCount} in stock`}
        </div>
      </div>
    </motion.div>
  );
}

function FilterCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-[10px] px-1.5 py-1.5 transition hover:bg-white/5">
      <input
        type="checkbox"
        className="h-4 w-4 accent-white"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

export default function CollectionPage() {
  const [sortValue, setSortValue] = React.useState<
    "low-high" | "high-low" | "newest"
  >("newest");

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedCustomers, setSelectedCustomers] = React.useState<
    CustomerType[]
  >([]);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");

  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const toastTimerRef = React.useRef<number | null>(null);

  const [listening, setListening] = React.useState(false);
  const [voiceSupported, setVoiceSupported] = React.useState(true);
  const [lastHeard, setLastHeard] = React.useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

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

  const clearFilters = React.useCallback(() => {
    setSelectedCustomers([]);
    setSelectedTypes([]);
    setSearch("");
  }, []);

  const clearFiltersWithToast = React.useCallback(() => {
    clearFilters();
    showToast("Filters cleared.", "info");
  }, [clearFilters, showToast]);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const fetchAllProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/products`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to load products. Status: ${res.status}`);
      }

      const raw = await res.json();

      const arr =
        (Array.isArray(raw) && raw) ||
        (Array.isArray(raw?.data) && raw.data) ||
        (Array.isArray(raw?.items) && raw.items) ||
        (Array.isArray(raw?.products) && raw.products) ||
        (Array.isArray(raw?.data?.products) && raw.data.products) ||
        [];

      const mappedProducts = arr
        .map(mapBackendProduct)
        .filter((product: Product) => product.name && product.name !== "Product");

      setProducts(mappedProducts);
    } catch (err: unknown) {
      console.error("Error fetching collection products:", err);

      const message =
        err instanceof Error ? err.message : "Failed to load products.";

      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileFiltersOpen(false);
      }
    };

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const rec = new SpeechRecognition();

    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
      showToast("Voice search started.", "info");
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onerror = () => {
      setListening(false);
      showToast("Voice search failed. Please try again.", "error");
    };

    rec.onresult = (e: any) => {
      const spoken = String(e.results?.[0]?.[0]?.transcript || "").trim();
      const cmd = norm(spoken);

      setLastHeard(spoken);

      if (!cmd) {
        showToast("No voice command detected.", "info");
        return;
      }

      if (cmd === "clear" || cmd === "reset" || cmd === "clear filters") {
        clearFilters();
        showToast("Voice command detected: filters cleared.", "info");
        return;
      }

      const nextCustomers: CustomerType[] = [];
      const nextTypes: string[] = [];

      if (cmd.includes("men")) nextCustomers.push("Men");
      if (cmd.includes("women")) nextCustomers.push("Women");
      if (cmd.includes("boys") || cmd.includes("boy")) nextCustomers.push("Boys");
      if (cmd.includes("girls") || cmd.includes("girl")) nextCustomers.push("Girls");

      if (
        cmd.includes("t-shirt") ||
        cmd.includes("t shirt") ||
        cmd.includes("tshirt")
      ) {
        nextTypes.push("T-Shirt");
      }

      if (cmd.includes("windcheater") || cmd.includes("wind cheater")) {
        nextTypes.push("Jacket");
      }

      if (cmd.includes("jeans") || cmd.includes("jean")) {
        nextTypes.push("Jean");
      }

      if (cmd.includes("jacket")) {
        nextTypes.push("Jacket");
      }

      if (cmd.includes("formal shirt")) {
        nextTypes.push("Formal Shirt");
      } else if (cmd.includes("shirt")) {
        nextTypes.push("Formal Shirt");
      }

      if (cmd.includes("frock")) {
        nextTypes.push("Frock");
      }

      if (cmd.includes("shorts")) {
        nextTypes.push("Shorts");
      }

      if (cmd.includes("wide leg") || cmd.includes("wide-leg")) {
        nextTypes.push("Wide-leg");
      }

      setSelectedCustomers([...new Set(nextCustomers)]);
      setSelectedTypes([...new Set(nextTypes)]);
      setSearch(spoken);

      showToast(`Voice search: ${spoken}`, "success");
      setMobileFiltersOpen(true);
    };

    recognitionRef.current = rec;
  }, [clearFilters, showToast]);

  const startListening = () => {
    if (!voiceSupported) {
      showToast("Voice search is not supported in this browser.", "error");
      return;
    }

    try {
      recognitionRef.current?.start?.();
    } catch {
      showToast("Voice search is already running.", "info");
    }
  };

  const focusSearch = () => {
    setMobileFiltersOpen(true);

    setTimeout(() => {
      searchRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      searchRef.current?.focus();
    }, 50);
  };

  const toggleCustomer = (value: CustomerType) => {
    setSelectedCustomers((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const filteredAndSortedProducts = React.useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = norm(search);

      list = list.filter((product) => {
        const haystack = buildProductSearchText(product);

        return haystack.includes(q);
      });
    }

    if (selectedCustomers.length > 0) {
      list = list.filter((product) => {
        if (!product.customer) return false;

        return selectedCustomers.includes(product.customer);
      });
    }

    if (selectedTypes.length > 0) {
      const lowerTypes = selectedTypes.map((type) => norm(type));

      list = list.filter((product) => {
        const typeSource = norm(
          `${product.subCategory || ""} ${product.name || ""} ${
            product.customer || ""
          } ${(product.colors || []).join(" ")}`
        );

        return lowerTypes.some((type) => typeSource.includes(type));
      });
    }

    list.sort((a, b) => {
      if (sortValue === "low-high") return a.price - b.price;

      if (sortValue === "high-low") return b.price - a.price;

      return parseDateSafe(b.createdAt) - parseDateSafe(a.createdAt);
    });

    return list;
  }, [products, selectedCustomers, selectedTypes, sortValue, search]);

  const activeFiltersCount =
    selectedCustomers.length + selectedTypes.length + (search.trim() ? 1 : 0);

  const filterTypes = [
    "T-Shirt",
    "Jean",
    "Jacket",
    "Formal Shirt",
    "Frock",
    "Wide-leg",
    "Shorts",
  ];

  return (
    <>
      <CollectionHeader onSearchClick={focusSearch} />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <section className={containerClass}>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.45 }}
            className={`${panelClass} overflow-hidden`}
          >
            <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div className="flex flex-col justify-center">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Explore the Range
                </div>

                <h1 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[58px]">
                  All Collections
                </h1>

                <p className="mt-4 max-w-[580px] text-[13px] leading-7 text-[#a7aec4] sm:text-[15px]">
                  Browse clothing and footwear across categories, use filters,
                  search by product name, customer type, color, and sort by
                  newest or price to find your perfect style.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={focusSearch}
                    className={primaryBtnClass}
                  >
                    Search Collection
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className={`${secondaryBtnClass} lg:hidden`}
                  >
                    Open Filters
                  </button>
                </div>
              </div>

              <div className="relative min-h-[240px] overflow-hidden rounded-[22px] border border-[#26293a] bg-[#161824] sm:min-h-[300px]">
                <Image
                  src="/images/placeholder.png"
                  alt="Collection banner"
                  fill
                  className="object-cover opacity-70"
                  priority
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

                <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur">
                  Premium streetwear & essentials
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.45, delay: 0.08 }}
            className={`mt-6 ${panelClass} p-4 sm:mt-8 sm:p-5`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[20px] font-semibold tracking-[-0.02em] text-white sm:text-[24px]">
                  Filter & Discover
                </div>

                <div className="mt-1 text-[12px] text-[#a7aec4] sm:text-[13px]">
                  Search any product name, customer type, category, color, or use
                  voice commands.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className={`${secondaryBtnClass} lg:hidden`}
                >
                  Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
                </button>

                <button
                  type="button"
                  onClick={startListening}
                  disabled={!voiceSupported}
                  className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 ${
                    !voiceSupported ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  title={
                    voiceSupported
                      ? `Say: "black hoodie", "women jacket", "t-shirt men", "clear"`
                      : "Voice not supported. Use Chrome."
                  }
                >
                  <Image
                    src="/images/voice.png"
                    alt="Voice search"
                    width={16}
                    height={16}
                    className={`h-4 w-4 object-contain brightness-0 invert ${
                      listening ? "animate-pulse" : ""
                    }`}
                  />

                  {listening ? "Listening..." : "Voice"}
                </button>

                <label htmlFor="sort" className="sr-only">
                  Sort products
                </label>

                <select
                  id="sort"
                  aria-label="Sort products"
                  className="h-[42px] min-w-[190px] rounded-full border border-white/15 bg-[#0d0f17] px-4 text-[12px] text-[#f5f7fb] outline-none focus:border-[#d6c7ff]"
                  value={sortValue}
                  onChange={(e) =>
                    setSortValue(
                      e.target.value as "low-high" | "high-low" | "newest"
                    )
                  }
                >
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>

                {activeFiltersCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFiltersWithToast}
                    className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-500/15"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">
                  Search products
                </label>

                <input
                  id="search"
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product name, Men, Women, Boys, Girls, T-Shirt, Jacket..."
                  className="h-[50px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                />
              </div>

              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    showToast("Search cleared.", "info");
                  }}
                  className={secondaryBtnClass}
                >
                  Clear Search
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-[#a7aec4]">
              {voiceSupported ? (
                <>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Try: <span className="text-[#f5f7fb]">black hoodie</span>,{" "}
                    <span className="text-[#f5f7fb]">women jacket</span>,{" "}
                    <span className="text-[#f5f7fb]">boys shorts</span>,{" "}
                    <span className="text-[#f5f7fb]">clear</span>
                  </span>

                  {lastHeard ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                      Heard: <span className="text-[#f5f7fb]">{lastHeard}</span>
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Voice not supported. Use Chrome.
                </span>
              )}
            </div>
          </motion.div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
            <motion.aside
              initial="hidden"
              animate="show"
              variants={fadeLeft}
              transition={{ duration: 0.45, delay: 0.14 }}
              className={`hidden h-fit ${panelClass} p-4 lg:block`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
                  Filters
                </div>

                {activeFiltersCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFiltersWithToast}
                    className="text-[12px] text-[#d6c7ff] hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="mt-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                  Customers
                </div>

                <div className="grid gap-2 text-[13px] text-[#d6dbeb]">
                  {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map(
                    (customer) => (
                      <FilterCheckbox
                        key={customer}
                        label={customer}
                        checked={selectedCustomers.includes(customer)}
                        onChange={() => toggleCustomer(customer)}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                  Types
                </div>

                <div className="grid gap-2 text-[13px] text-[#d6dbeb]">
                  {filterTypes.map((type) => (
                    <FilterCheckbox
                      key={type}
                      label={type}
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                    />
                  ))}
                </div>
              </div>
            </motion.aside>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[13px] text-[#a7aec4]">
                  {loading
                    ? "Loading products..."
                    : error
                      ? "Unable to load products"
                      : `${filteredAndSortedProducts.length} product${
                          filteredAndSortedProducts.length === 1 ? "" : "s"
                        } found`}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-[22px] border border-[#26293a] bg-[#161824]"
                    >
                      <div className="aspect-[3.6/5] animate-pulse bg-white/5" />

                      <div className="p-4">
                        <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
                        <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
                        <div className="mt-2 h-4 w-24 animate-pulse rounded bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-5 text-[14px] text-red-200">
                  <div>{`Error: ${error}`}</div>

                  <button
                    type="button"
                    onClick={fetchAllProducts}
                    className={`${primaryBtnClass} mt-4`}
                  >
                    Retry
                  </button>
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className={`${panelClass} p-8 text-center`}>
                  <div className="text-[22px] font-semibold text-white">
                    No products found
                  </div>

                  <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-7 text-[#a7aec4]">
                    Try searching product name, “T-Shirt”, “Jacket”, “Men”,
                    “Women”, “Boys”, “Girls”, or remove filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearFiltersWithToast}
                    className={`${primaryBtnClass} mt-5`}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <motion.div
                  variants={productGridMotion}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6"
                >
                  {filteredAndSortedProducts.map((product, index) => (
                    <ProductCard
                      key={product.id || `${product.name}-${index}`}
                      product={product}
                      onOutOfStockClick={() =>
                        showToast(
                          "This product is currently out of stock.",
                          "error"
                        )
                      }
                      onInvalidProductClick={() =>
                        showToast(
                          "This product cannot be opened because product ID is missing.",
                          "error"
                        )
                      }
                    />
                  ))}
                </motion.div>
              )}
            </section>
          </div>
        </section>

        <AnimatePresence>
          {mobileFiltersOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            >
              <motion.div
                initial={{ x: 420 }}
                animate={{ x: 0 }}
                exit={{ x: 420 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="absolute right-0 top-0 h-full w-[88%] max-w-[380px] overflow-y-auto border-l border-[#26293a] bg-[#11121a] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
                    Filters
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white"
                  >
                    ✕
                  </button>
                </div>

                {activeFiltersCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFiltersWithToast}
                    className="mt-4 w-full rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-[12px] font-semibold text-red-200"
                  >
                    Clear All
                  </button>
                ) : null}

                <div className="mt-6">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                    Customers
                  </div>

                  <div className="grid gap-2 text-[13px] text-[#d6dbeb]">
                    {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map(
                      (customer) => (
                        <FilterCheckbox
                          key={customer}
                          label={customer}
                          checked={selectedCustomers.includes(customer)}
                          onChange={() => toggleCustomer(customer)}
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="mt-7">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                    Types
                  </div>

                  <div className="grid gap-2 text-[13px] text-[#d6dbeb]">
                    {filterTypes.map((type) => (
                      <FilterCheckbox
                        key={type}
                        label={type}
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleType(type)}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileFiltersOpen(false);

                    if (activeFiltersCount > 0) {
                      showToast("Filters applied.", "success");
                    }
                  }}
                  className={`${primaryBtnClass} mt-7 flex w-full justify-center`}
                >
                  Apply Filters
                </button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <MainFooter />
    </>
  );
}