"use client";

import { API_URL } from "@/lib/api";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CollectionHeader from "@/components/layout/CollectionHeader";
import MainFooter from "@/components/layout/MainFooter";
import CollectionHero from "./_components/CollectionHero";
import CollectionControls from "./_components/CollectionControls";
import CollectionFilters from "./_components/CollectionFilters";
import WeatherBanner from "./_components/WeatherBanner";
import ProductGrid from "./_components/ProductGrid";

type CustomerType = "Men" | "Women" | "Boys" | "Girls";
type ToastType = "success" | "error" | "info";
type WeatherMood = "cold" | "mild" | "hot" | "rainy";

type WeatherCollectionContext = {
  mood: WeatherMood;
  city: string;
  titleKey: string;
  messageKey: string;
  types: string[];
};

type Product = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  discountPercent: number;
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
  compareAtPrice?: number | string | null;
  discountPercent?: number | string | null;
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
  API_URL;

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] pb-14 text-[#f5f7fb]";

const containerClass =
  "mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-5 sm:py-8 lg:px-8";

const weatherCollectionMap: Record<
  WeatherMood,
  {
    titleKey: string;
    messageKey: string;
    types: string[];
  }
> = {
  cold: {
    titleKey: "collection.weather.coldTitle",
    messageKey: "collection.weather.coldMessage",
    types: ["Hoodie", "Jacket", "Sweater", "Sneakers"],
  },
  mild: {
    titleKey: "collection.weather.mildTitle",
    messageKey: "collection.weather.mildMessage",
    types: ["Hoodie", "Formal Shirt", "Joggers", "Sneakers"],
  },
  hot: {
    titleKey: "collection.weather.hotTitle",
    messageKey: "collection.weather.hotMessage",
    types: ["T-Shirt", "Shorts", "Cap", "Light Shoes"],
  },
  rainy: {
    titleKey: "collection.weather.rainyTitle",
    messageKey: "collection.weather.rainyMessage",
    types: ["Jacket", "Hoodie", "Dark Pants", "Waterproof Shoes"],
  },
};

const filterTypes = [
  "T-Shirt",
  "Jean",
  "Jacket",
  "Hoodie",
  "Sweater",
  "Sneakers",
  "Shoes",
  "Light Shoes",
  "Waterproof Shoes",
  "Joggers",
  "Dark Pants",
  "Formal Shirt",
  "Frock",
  "Wide-leg",
  "Shorts",
  "Cap",
];

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

function normalizePrice(value: unknown) {
  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
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
  const price = normalizePrice(p.price);

  const compareAtPrice =
    p.compareAtPrice == null || p.compareAtPrice === ""
      ? undefined
      : normalizePrice(p.compareAtPrice);

  const fallbackDiscount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.min(
          Math.max(
            Math.round(normalizePrice(p.discountPercent || fallbackDiscount)),
            0
          ),
          100
        )
      : 0;

  return {
    id,
    name: String(p.name || p.title || "Product"),
    price,
    compareAtPrice,
    discountPercent,
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
      product.compareAtPrice ? `mrp ${product.compareAtPrice}` : "",
      product.discountPercent ? `discount ${product.discountPercent}` : "",
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

export default function CollectionPage() {
  const { t } = useI18n();

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
  const [weatherContext, setWeatherContext] =
    React.useState<WeatherCollectionContext | null>(null);

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
    setWeatherContext(null);
  }, []);

  const clearFiltersWithToast = React.useCallback(() => {
    clearFilters();
    showToast(t("collection.filtersCleared"), "info");
  }, [clearFilters, showToast, t]);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const weatherParam = norm(params.get("weather"));
    const cityParam = String(params.get("city") || "").trim();

    if (!weatherParam) return;

    if (
      weatherParam !== "cold" &&
      weatherParam !== "mild" &&
      weatherParam !== "hot" &&
      weatherParam !== "rainy"
    ) {
      return;
    }

    const weatherMood = weatherParam as WeatherMood;
    const config = weatherCollectionMap[weatherMood];
    const city = cityParam || t("collection.weather.yourCity");

    setWeatherContext({
      mood: weatherMood,
      city,
      titleKey: config.titleKey,
      messageKey: config.messageKey,
      types: config.types,
    });

    setSelectedTypes((prev) => [...new Set([...prev, ...config.types])]);
    setSortValue("newest");

    showToast(`${t("collection.weatherLoaded")} ${city}.`, "success");
  }, [showToast, t]);

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
        .filter(
          (product: Product) => product.name && product.name !== "Product"
        );

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
      showToast(t("collection.voiceStarted"), "info");
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onerror = () => {
      setListening(false);
      showToast(t("collection.voiceFailed"), "error");
    };

    rec.onresult = (e: any) => {
      const spoken = String(e.results?.[0]?.[0]?.transcript || "").trim();
      const cmd = norm(spoken);

      setLastHeard(spoken);

      if (!cmd) {
        showToast(t("collection.noVoiceDetected"), "info");
        return;
      }

      if (cmd === "clear" || cmd === "reset" || cmd === "clear filters") {
        clearFilters();
        showToast(t("collection.voiceFiltersCleared"), "info");
        return;
      }

      const nextCustomers: CustomerType[] = [];
      const nextTypes: string[] = [];

      if (cmd.includes("men")) nextCustomers.push("Men");
      if (cmd.includes("women")) nextCustomers.push("Women");
      if (cmd.includes("boys") || cmd.includes("boy"))
        nextCustomers.push("Boys");
      if (cmd.includes("girls") || cmd.includes("girl"))
        nextCustomers.push("Girls");

      if (
        cmd.includes("t-shirt") ||
        cmd.includes("t shirt") ||
        cmd.includes("tshirt")
      ) {
        nextTypes.push("T-Shirt");
      }

      if (cmd.includes("hoodie")) nextTypes.push("Hoodie");
      if (cmd.includes("sweater")) nextTypes.push("Sweater");

      if (cmd.includes("sneaker") || cmd.includes("sneakers")) {
        nextTypes.push("Sneakers");
      }

      if (cmd.includes("shoe") || cmd.includes("shoes")) {
        nextTypes.push("Shoes");
      }

      if (cmd.includes("jogger") || cmd.includes("joggers")) {
        nextTypes.push("Joggers");
      }

      if (cmd.includes("cap")) nextTypes.push("Cap");

      if (cmd.includes("windcheater") || cmd.includes("wind cheater")) {
        nextTypes.push("Jacket");
      }

      if (cmd.includes("jeans") || cmd.includes("jean")) {
        nextTypes.push("Jean");
      }

      if (cmd.includes("jacket")) nextTypes.push("Jacket");

      if (cmd.includes("formal shirt")) {
        nextTypes.push("Formal Shirt");
      } else if (cmd.includes("shirt")) {
        nextTypes.push("Formal Shirt");
      }

      if (cmd.includes("frock")) nextTypes.push("Frock");
      if (cmd.includes("shorts")) nextTypes.push("Shorts");

      if (cmd.includes("wide leg") || cmd.includes("wide-leg")) {
        nextTypes.push("Wide-leg");
      }

      setWeatherContext(null);
      setSelectedCustomers([...new Set(nextCustomers)]);
      setSelectedTypes([...new Set(nextTypes)]);
      setSearch(spoken);

      showToast(`${t("collection.voiceSearch")}: ${spoken}`, "success");
      setMobileFiltersOpen(true);
    };

    recognitionRef.current = rec;
  }, [clearFilters, showToast, t]);

  const startListening = () => {
    if (!voiceSupported) {
      showToast(t("collection.voiceNotSupported"), "error");
      return;
    }

    try {
      recognitionRef.current?.start?.();
    } catch {
      showToast(t("collection.voiceAlreadyRunning"), "info");
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
    setWeatherContext(null);

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

  return (
    <>
      <CollectionHeader onSearchClick={focusSearch} />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <section className={containerClass}>
          <CollectionHero
            onSearchClick={focusSearch}
            onOpenFilters={() => setMobileFiltersOpen(true)}
          />

          <CollectionControls
            search={search}
            setSearch={setSearch}
            searchRef={searchRef}
            sortValue={sortValue}
            setSortValue={setSortValue}
            activeFiltersCount={activeFiltersCount}
            voiceSupported={voiceSupported}
            listening={listening}
            lastHeard={lastHeard}
            onStartListening={startListening}
            onOpenFilters={() => setMobileFiltersOpen(true)}
            onClearFilters={clearFiltersWithToast}
            onClearWeather={() => setWeatherContext(null)}
            hasWeatherContext={Boolean(weatherContext)}
            showToast={showToast}
          />

          <WeatherBanner
            weatherContext={weatherContext}
            onClear={clearFiltersWithToast}
          />

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
            <CollectionFilters
              mobileFiltersOpen={mobileFiltersOpen}
              setMobileFiltersOpen={setMobileFiltersOpen}
              activeFiltersCount={activeFiltersCount}
              hasWeatherContext={Boolean(weatherContext)}
              selectedCustomers={selectedCustomers}
              selectedTypes={selectedTypes}
              filterTypes={filterTypes}
              toggleCustomer={toggleCustomer}
              toggleType={toggleType}
              clearFiltersWithToast={clearFiltersWithToast}
              showToast={showToast}
            />

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[13px] text-[#a7aec4]">
                  {loading
                    ? t("collection.loadingProducts")
                    : error
                      ? t("collection.unableToLoad")
                      : `${filteredAndSortedProducts.length} ${
                          filteredAndSortedProducts.length === 1
                            ? t("collection.productFound")
                            : t("collection.productsFound")
                        }`}
                </div>
              </div>

              <ProductGrid
                loading={loading}
                error={error}
                products={filteredAndSortedProducts}
                onRetry={fetchAllProducts}
                onResetFilters={clearFiltersWithToast}
                onOutOfStockClick={() =>
                  showToast(t("collection.productOutOfStock"), "error")
                }
                onInvalidProductClick={() =>
                  showToast(t("collection.invalidProduct"), "error")
                }
              />
            </section>
          </div>
        </section>
      </main>

      <MainFooter />
    </>
  );
}