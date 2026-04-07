"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

type CustomerType = "Men" | "Women" | "Boys" | "Girls";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  customer?: CustomerType;
  subCategory?: string;
  createdAt?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

function norm(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveMediaSrc(src: unknown) {
  const s = typeof src === "string" ? src.trim() : "";
  if (!s) return "/images/placeholder.png";
  if (s.startsWith("/")) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return "/images/placeholder.png";
}

function parseDateSafe(d?: string) {
  if (!d) return 0;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

export default function CollectionPage() {
  const [sortValue, setSortValue] = React.useState<"low-high" | "high-low" | "newest">(
    "newest"
  );

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedCustomers, setSelectedCustomers] = React.useState<CustomerType[]>([]);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);

  const [search, setSearch] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  const recognitionRef = React.useRef<any>(null);
  const [listening, setListening] = React.useState(false);
  const [voiceSupported, setVoiceSupported] = React.useState(true);
  const [lastHeard, setLastHeard] = React.useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setMobileMenuOpen(false);
      if (window.innerWidth >= 1024) setMobileFiltersOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/products`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load products (status ${res.status})`);

        const raw = await res.json();
        const arr =
          (Array.isArray(raw) && raw) ||
          (Array.isArray(raw?.data) && raw.data) ||
          (Array.isArray(raw?.items) && raw.items) ||
          (Array.isArray(raw?.products) && raw.products) ||
          (Array.isArray(raw?.data?.products) && raw.data.products) ||
          [];

        const mapped: Product[] = (arr || []).map((p: any) => ({
          id: String(p.id || p._id || ""),
          name: String(p.name || "Product"),
          price:
            typeof p.price === "string" ? Number(p.price) || 0 : Number(p.price ?? 0),
          image: resolveMediaSrc(p.image || "/images/placeholder.png"),
          customer: p.customer as CustomerType | undefined,
          subCategory: String(p.subCategory || p.category || ""),
          createdAt: p.createdAt || p.created_at || p.updatedAt || p.updated_at,
        }));

        setProducts(mapped);
      } catch (err: any) {
        console.error("Error fetching collection products:", err);
        setError(err?.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.onresult = (e: any) => {
      const spoken = String(e.results?.[0]?.[0]?.transcript || "");
      const cmd = norm(spoken);
      setLastHeard(spoken.trim());

      if (cmd === "clear" || cmd === "reset") {
        setSelectedCustomers([]);
        setSelectedTypes([]);
        setSearch("");
        return;
      }

      setSelectedCustomers([]);
      setSelectedTypes([]);

      if (cmd.includes("t-shirt") || cmd.includes("t shirt") || cmd === "tshirt") {
        setSelectedTypes(["T-Shirt"]);
      } else if (cmd.includes("windcheater") || cmd.includes("wind cheater")) {
        setSelectedTypes(["Jacket"]);
      } else if (cmd.includes("jeans") || cmd.includes("jean")) {
        setSelectedTypes(["Jean"]);
      } else if (cmd.includes("jacket")) {
        setSelectedTypes(["Jacket"]);
      } else if (cmd.includes("shirt")) {
        setSelectedTypes(["Formal Shirt"]);
      } else if (cmd.includes("frock")) {
        setSelectedTypes(["Frock"]);
      } else if (cmd.includes("shorts")) {
        setSelectedTypes(["Shorts"]);
      }

      if (cmd.includes("men")) setSelectedCustomers(["Men"]);
      else if (cmd.includes("women")) setSelectedCustomers(["Women"]);
      else if (cmd.includes("boys")) setSelectedCustomers(["Boys"]);
      else if (cmd.includes("girls")) setSelectedCustomers(["Girls"]);

      setMobileFiltersOpen(true);
    };

    recognitionRef.current = rec;
  }, []);

  const startListening = () => {
    if (!voiceSupported) return;
    try {
      recognitionRef.current?.start?.();
    } catch {
      // ignore
    }
  };

  const focusSearch = () => {
    setMobileMenuOpen(false);
    setMobileFiltersOpen(true);
    setTimeout(() => {
      searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const clearFilters = () => {
    setSelectedCustomers([]);
    setSelectedTypes([]);
    setSearch("");
  };

  const filteredAndSortedProducts = React.useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
    }

    if (selectedCustomers.length > 0) {
      list = list.filter((p) =>
        p.customer ? selectedCustomers.includes(p.customer) : true
      );
    }

    if (selectedTypes.length > 0) {
      const lowerTypes = selectedTypes.map((t) => t.toLowerCase());
      list = list.filter((p) => {
        const typeSource = `${p.subCategory || ""} ${p.name || ""}`.toLowerCase();
        return lowerTypes.some((t) => typeSource.includes(t));
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
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
        html,
        body {
          font-family: Poppins, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          background: #0a0a0f;
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-[#1b1e2b] bg-[rgba(10,10,15,0.92)] backdrop-blur-xl">
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

            <div className="truncate text-[15px] font-bold uppercase tracking-[0.12em] text-white sm:text-[18px] md:text-[22px] lg:text-[26px]">
              UFO Collection
            </div>
          </div>

          <nav className="hidden items-center gap-6 sm:flex lg:gap-10">
            <Link
              href="/homepage"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
            >
              Home
            </Link>
            <Link
              href="/collection"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#d6c7ff]"
            >
              Collection
            </Link>
            <Link
              href="/about"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-[14px] font-medium uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={focusSearch}
              aria-label="Search"
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
            >
              <Image
                src="/images/search.png"
                width={18}
                height={18}
                alt="Search"
                className="brightness-0 invert"
              />
            </button>

            <Link
              href="/profile"
              aria-label="Profile"
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
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white sm:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-[#1b1e2b] bg-[rgba(10,10,15,0.98)] sm:hidden">
            <div className="mx-auto grid max-w-[1240px] gap-3 px-4 py-4 sm:px-5">
              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/homepage"
                className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]"
              >
                Home
              </Link>
              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/collection"
                className="text-[13px] uppercase tracking-[0.16em] text-[#d6c7ff]"
              >
                Collection
              </Link>
              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/about"
                className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]"
              >
                About
              </Link>
              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/contact"
                className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]"
              >
                Contact
              </Link>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={focusSearch}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white"
                >
                  Search
                </button>

                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/profile"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white"
                >
                  Profile
                </Link>

                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/wishlist"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white"
                >
                  Wishlist
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="min-h-[calc(100vh-64px)] bg-[#0a0a0f] pb-14 text-[#f5f7fb] md:min-h-[calc(100vh-76px)]">
        <section className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-5 sm:py-8 lg:px-6">
          <div className="overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a]">
            <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div className="flex flex-col justify-center">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Explore the Range
                </div>
                <h1 className="mt-3 text-[28px] font-semibold leading-[1.15] text-white sm:text-[38px] lg:text-[48px]">
                  All Collections
                </h1>
                <p className="mt-3 max-w-[560px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Browse clothing and footwear across categories, use filters,
                  search by product name, and sort by newest or price to find
                  the exact style you want.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={focusSearch}
                    className="rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90 sm:px-6 sm:py-3"
                  >
                    Search Collection
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 lg:hidden"
                  >
                    Open Filters
                  </button>
                </div>
              </div>

              <div className="relative min-h-[220px] overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824] sm:min-h-[280px]">
                <Image
                  src="/images/placeholder.png"
                  alt="Collection banner"
                  fill
                  className="object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur">
                  Premium streetwear & essentials
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-[20px] border border-[#26293a] bg-[#11121a] p-4 sm:mt-8 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[18px] font-semibold text-white sm:text-[22px]">
                  Filter & Discover
                </div>
                <div className="mt-1 text-[12px] text-[#a7aec4] sm:text-[13px]">
                  Search, filter by category or type, and use voice commands.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 lg:hidden"
                >
                  Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
                </button>

                <button
                  type="button"
                  onClick={startListening}
                  disabled={!voiceSupported}
                  className={`rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 ${
                    !voiceSupported ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  title={
                    voiceSupported
                      ? `Say: "t-shirt men", "shirt women", "jeans", "jacket boys", "clear"`
                      : "Voice not supported (use Chrome)"
                  }
                >
                  <span className={listening ? "animate-pulse" : ""}>🎤</span>{" "}
                  {listening ? "Listening..." : "Voice"}
                </button>

                <label htmlFor="sort" className="sr-only">
                  Sort products
                </label>
                <select
                  id="sort"
                  aria-label="Sort products"
                  className="min-w-[190px] rounded-full border border-white/15 bg-[#0d0f17] px-4 py-2 text-[12px] text-[#f5f7fb] outline-none"
                  value={sortValue}
                  onChange={(e) =>
                    setSortValue(e.target.value as "low-high" | "high-low" | "newest")
                  }
                >
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>

                {activeFiltersCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-500/15"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">
                  Search products
                </label>
                <input
                  id="search"
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, categories, or styles..."
                  className="h-[48px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                />
              </div>

              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Clear Search
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#a7aec4]">
              {voiceSupported ? (
                <>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Try: <span className="text-[#f5f7fb]">t-shirt men</span>,{" "}
                    <span className="text-[#f5f7fb]">shirt women</span>,{" "}
                    <span className="text-[#f5f7fb]">jacket</span>,{" "}
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
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
            <aside className="hidden h-fit rounded-[20px] border border-[#26293a] bg-[#11121a] p-5 lg:block">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
                  Filters
                </div>
                {activeFiltersCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[12px] text-[#d6c7ff] hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="mt-6">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                  Categories
                </div>
                <div className="grid gap-3 text-[13px] text-[#d6dbeb]">
                  {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map((c) => (
                    <label key={c} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="accent-white"
                        checked={selectedCustomers.includes(c)}
                        onChange={() => toggleCustomer(c)}
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                  Types
                </div>
                <div className="grid gap-3 text-[13px] text-[#d6dbeb]">
                  {filterTypes.map((t) => (
                    <label key={t} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="accent-white"
                        checked={selectedTypes.includes(t)}
                        onChange={() => toggleType(t)}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

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
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-[18px] border border-[#26293a] bg-[#161824]"
                    >
                      <div className="aspect-[4/5] animate-pulse bg-white/5" />
                      <div className="p-3 sm:p-4">
                        <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
                        <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
                        <div className="mt-2 h-4 w-24 animate-pulse rounded bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-5 text-[14px] text-red-200">
                  {`Error: ${error}`}
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="rounded-[18px] border border-[#26293a] bg-[#11121a] p-6 text-center text-[#a7aec4]">
                  No products match your filters or search.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                  {filteredAndSortedProducts.map((p) => (
                    <Link key={p.id} href={`/product/${p.id}`} className="group block">
                      <div className="overflow-hidden rounded-[18px] border border-[#26293a] bg-[#161824] transition duration-300 hover:-translate-y-1 hover:border-[#3a3f58]">
                        <div className="relative aspect-[4/5] w-full overflow-hidden">
                          <Image
                            src={resolveMediaSrc(p.image)}
                            alt={p.name}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-[1.05]"
                          />
                        </div>

                        <div className="p-3 sm:p-4">
                          <div className="mb-2 flex flex-wrap gap-2">
                            {p.customer ? (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c8cde0]">
                                {p.customer}
                              </span>
                            ) : null}

                            {p.subCategory ? (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c8cde0]">
                                {p.subCategory}
                              </span>
                            ) : null}
                          </div>

                          <div className="line-clamp-2 text-[14px] font-medium text-[#f5f7fb] sm:text-[15px]">
                            {p.name}
                          </div>

                          <div className="mt-2 text-[13px] font-semibold text-[#d6c7ff] sm:text-[14px]">
                            Rs. {Number(p.price || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>

        {mobileFiltersOpen ? (
          <div
            className="fixed inset-0 z-[60] bg-black/60 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-[88%] max-w-[360px] overflow-y-auto border-l border-[#26293a] bg-[#11121a] p-5"
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
                  onClick={clearFilters}
                  className="mt-4 w-full rounded-[12px] border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-[12px] font-semibold text-red-200"
                >
                  Clear All
                </button>
              ) : null}

              <div className="mt-6">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                  Categories
                </div>
                <div className="grid gap-3 text-[13px] text-[#d6dbeb]">
                  {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map((c) => (
                    <label key={c} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="accent-white"
                        checked={selectedCustomers.includes(c)}
                        onChange={() => toggleCustomer(c)}
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
                  Types
                </div>
                <div className="grid gap-3 text-[13px] text-[#d6dbeb]">
                  {filterTypes.map((t) => (
                    <label key={t} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="accent-white"
                        checked={selectedTypes.includes(t)}
                        onChange={() => toggleType(t)}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-7 w-full rounded-[12px] bg-white px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12]"
              >
                Apply
              </button>
            </div>
          </div>
        ) : null}
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