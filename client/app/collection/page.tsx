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
  createdAt?: string; // ✅ for "Newest" sort (optional)
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

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
    "low-high"
  );

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedCustomers, setSelectedCustomers] = React.useState<CustomerType[]>([]);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);

  // ✅ Search
  const [search, setSearch] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  // ✅ Voice
  const recognitionRef = React.useRef<any>(null);
  const [listening, setListening] = React.useState(false);
  const [voiceSupported, setVoiceSupported] = React.useState(true);
  const [lastHeard, setLastHeard] = React.useState("");

  // ✅ Mobile UI states
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // ---------- Fetch products from backend ----------
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
          raw?.data ||
          raw?.items ||
          raw?.products ||
          [];

        const mapped: Product[] = (arr || []).map((p: any) => ({
          id: String(p.id || p._id),
          name: String(p.name || "Product"),
          price:
            typeof p.price === "string" ? Number(p.price) || 0 : Number(p.price ?? 0),
          image: resolveMediaSrc(p.image || "/images/collection/1.jpg"),
          customer: p.customer as CustomerType | undefined,
          subCategory: p.subCategory || p.category,
          createdAt: p.createdAt || p.created_at || p.updatedAt || p.updated_at, // ✅ optional
        }));

        setProducts(mapped);
      } catch (err: any) {
        console.error("Error fetching collection products:", err);
        setError(err.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ---------- Voice init ----------
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

      // ----- TYPE (order matters: "t-shirt" contains "shirt") -----
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
      }

      // ----- CATEGORY -----
      if (cmd.includes("men")) setSelectedCustomers(["Men"]);
      else if (cmd.includes("women")) setSelectedCustomers(["Women"]);
      else if (cmd.includes("boys")) setSelectedCustomers(["Boys"]);
      else if (cmd.includes("girls")) setSelectedCustomers(["Girls"]);

      // open filters on mobile so user sees changes
      setMobileFiltersOpen(true);
    };

    recognitionRef.current = rec;
  }, []);

  const startListening = () => {
    if (!voiceSupported) return;
    try {
      recognitionRef.current?.start?.();
    } catch {
      // ignore double-start errors
    }
  };

  const focusSearch = () => {
    setMobileMenuOpen(false);
    setMobileFiltersOpen(true); // ✅ open drawer on mobile too
    setTimeout(() => {
      searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      searchRef.current?.focus();
    }, 50);
  };

  // ---------- Filter helpers ----------
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

  // ---------- Apply filters + sort ----------
  const filteredAndSortedProducts = React.useMemo(() => {
    let list = [...products];

    // ✅ Search by name
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
    }

    // Filter by customer
    if (selectedCustomers.length > 0) {
      list = list.filter((p) => (p.customer ? selectedCustomers.includes(p.customer) : true));
    }

    // Filter by type / subCategory
    if (selectedTypes.length > 0) {
      const lowerTypes = selectedTypes.map((t) => t.toLowerCase());
      list = list.filter((p) => {
        const typeSource = ((p.subCategory || "").toLowerCase() || (p.name || "").toLowerCase());
        return lowerTypes.some((t) => typeSource.includes(t));
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortValue === "low-high") return a.price - b.price;
      if (sortValue === "high-low") return b.price - a.price;

      // ✅ Newest First
      const ta = parseDateSafe(a.createdAt);
      const tb = parseDateSafe(b.createdAt);
      return tb - ta;
    });

    return list;
  }, [products, selectedCustomers, selectedTypes, sortValue, search]);

  const activeFiltersCount =
    selectedCustomers.length + selectedTypes.length + (search.trim() ? 1 : 0);

  return (
    <>
      {/* Font same as homepage */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
        html,
        body {
          font-family: Poppins, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[72px] w-full max-w-[1160px] items-center justify-between px-4 sm:h-[80px]">
          {/* Brand */}
          <div className="flex items-center gap-[10px]">
            <div className="h-[42px] w-[42px] overflow-hidden rounded-full border-2 border-white sm:h-[44px] sm:w-[44px]">
              <Image
                src="/images/logo.png"
                alt="UFO Collection logo"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="max-w-[180px] truncate text-[18px] font-bold uppercase tracking-[0.18em] text-white sm:max-w-none sm:text-[28px]">
              UFO COLLECTION
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden gap-[42px] sm:flex">
            <Link
              href="/homepage"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#c9b9ff]"
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

          {/* Right icons */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search focuses input */}
            <button
              type="button"
              onClick={focusSearch}
              aria-label="Search"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10 sm:border-none sm:bg-transparent sm:px-0 sm:py-0"
            >
              <Image
                src="/images/search.png"
                width={26}
                height={26}
                alt="Search"
                className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </button>

            <Link href="/profile" aria-label="Profile" className="hidden sm:block">
              <Image
                src="/images/profile.png"
                width={26}
                height={26}
                alt="Profile"
                className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>

            <Link href="/wishlist" aria-label="Wishlist" className="hidden sm:block">
              <Image
                src="/images/wishlist.png"
                width={26}
                height={26}
                alt="Wishlist"
                className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="sm:hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white"
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen ? (
          <div className="sm:hidden border-t border-[#191b2d] bg-[rgba(5,6,17,0.98)]">
            <div className="mx-auto w-full max-w-[1160px] px-4 py-4">
              <div className="grid gap-3 text-[14px] uppercase tracking-[0.16em] text-[#c9b9ff]">
                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/homepage"
                  className="text-[#8b90ad] hover:text-[#c9b9ff]"
                >
                  HOME
                </Link>
                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/collection"
                  className="text-[#c9b9ff]"
                >
                  COLLECTION
                </Link>
                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/about"
                  className="text-[#8b90ad] hover:text-[#c9b9ff]"
                >
                  ABOUT
                </Link>
                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/contact"
                  className="text-[#8b90ad] hover:text-[#c9b9ff]"
                >
                  CONTACT
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={focusSearch}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[12px] uppercase tracking-[0.16em] text-white"
                >
                  Search
                </button>

                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/profile"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[12px] uppercase tracking-[0.16em] text-white"
                >
                  Profile
                </Link>

                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/wishlist"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[12px] uppercase tracking-[0.16em] text-white"
                >
                  Wishlist
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* PAGE */}
      <main className="min-h-[calc(100vh-72px)] bg-[#050611] pb-14 text-[#f5f5f7] sm:min-h-[calc(100vh-80px)]">
        <section className="mx-auto w-full max-w-[1160px] px-4 py-6 sm:py-8">
          {/* Title + controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[18px] uppercase tracking-[0.18em] sm:text-[22px]">
                ALL COLLECTIONS
              </div>
              <div className="mt-2 text-[12px] text-[#8b90ad]">
                Search, filter by category/type, and use voice commands.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Mobile Filters button */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white hover:bg-white/10"
              >
                Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
              </button>

              {/* Voice */}
              <button
                type="button"
                onClick={startListening}
                disabled={!voiceSupported}
                className={`rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white hover:bg-white/10 ${
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

              {/* ✅ Sort (accessibility fixed) */}
              <div className="flex items-center">
                <label htmlFor="sort" className="sr-only">
                  Sort products
                </label>
                <select
                  id="sort"
                  aria-label="Sort products"
                  className="min-w-[190px] rounded-full border border-white/15 bg-[#090b18] px-4 py-2 text-[12px] text-[#f5f5f7] outline-none"
                  value={sortValue}
                  onChange={(e) => setSortValue(e.target.value as any)}
                >
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {/* Clear */}
              {activeFiltersCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-red-200 hover:bg-red-500/15"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4">
            <div className="rounded-[16px] border border-[#23253a] bg-[#0b0d1a] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex-1">
                  <label htmlFor="search" className="sr-only">
                    Search products
                  </label>
                  <input
                    id="search"
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products (e.g. tshirt, jacket, winter)..."
                    className="w-full rounded-full border border-white/15 bg-[#090b18] px-4 py-3 text-[13px] text-white placeholder:text-white/40 outline-none focus:border-[#c9b9ff]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[12px] uppercase tracking-[0.16em] text-white hover:bg-white/10"
                >
                  Clear Search
                </button>
              </div>
            </div>
          </div>

          {/* Voice hint */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#8b90ad]">
            {voiceSupported ? (
              <>
                <span className="rounded-md border border-[#23253a] bg-[#090b18] px-3 py-1">
                  Try: <span className="text-[#d4d7f3]">t-shirt men</span>,{" "}
                  <span className="text-[#d4d7f3]">shirt women</span>,{" "}
                  <span className="text-[#d4d7f3]">jacket</span>,{" "}
                  <span className="text-[#d4d7f3]">clear</span>
                </span>
                {lastHeard ? (
                  <span className="rounded-md border border-[#23253a] bg-[#090b18] px-3 py-1">
                    Heard: <span className="text-[#d4d7f3]">{lastHeard}</span>
                  </span>
                ) : null}
              </>
            ) : (
              <span className="rounded-md border border-[#23253a] bg-[#090b18] px-3 py-1">
                Voice not supported. Use Chrome.
              </span>
            )}
          </div>

          <div className="mt-5 h-px w-full bg-[#2a2c3f]" />

          {/* Desktop layout: sidebar + grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
            {/* Desktop filters */}
            <aside className="hidden h-fit rounded-[14px] border border-[#23253a] bg-[#0d0f1e] p-5 lg:block">
              <div className="flex items-center justify-between">
                <div className="text-[12px] uppercase tracking-[0.18em]">FILTERS</div>
                {activeFiltersCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[12px] text-[#c9b9ff] hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="mt-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b90ad]">
                  CATEGORIES
                </div>
                <div className="grid gap-2 text-[12px] text-[#d4d7f3]">
                  {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map((c) => (
                    <label key={c} className="flex items-center gap-2">
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

              <div className="mt-6">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b90ad]">
                  TYPES
                </div>
                <div className="grid gap-2 text-[12px] text-[#d4d7f3]">
                  {["T-Shirt", "Jean", "Jacket", "Formal Shirt", "Frock", "Wide-leg", "Shorts"].map(
                    (t) => (
                      <label key={t} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-white"
                          checked={selectedTypes.includes(t)}
                          onChange={() => toggleType(t)}
                        />
                        <span>{t}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </aside>

            {/* Products grid */}
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {loading ? (
                <div className="col-span-full text-[#8b90ad]">Loading products…</div>
              ) : error ? (
                <div className="col-span-full text-[#fca5a5]">{`Error: ${error}`}</div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="col-span-full text-[#8b90ad]">
                  No products match your filters/search.
                </div>
              ) : (
                filteredAndSortedProducts.map((p) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="group block">
                    <div className="flex flex-col gap-[8px] rounded-[16px] border border-[#252842] bg-[#151726] p-3 text-[12px] transition-all duration-300 ease-out hover:-translate-y-[6px] hover:border-[#c9b9ff] hover:shadow-[0_25px_60px_rgba(201,185,255,0.18)]">
                      <div className="relative w-full overflow-hidden rounded-[12px] border border-[#252842] bg-[#151726] pb-[130%]">
                        <Image
                          src={resolveMediaSrc(p.image)}
                          alt={p.name}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                        />
                      </div>

                      <div className="mt-1 line-clamp-2 text-[#f1f2ff] transition-colors group-hover:text-white">
                        {p.name}
                      </div>

                      <div className="text-[#8b90ad] transition-colors group-hover:text-[#c9b9ff]">
                        Rs. {Number(p.price || 0).toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </section>
          </div>
        </section>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen ? (
          <div
            className="fixed inset-0 z-[60] bg-black/60 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-[88%] max-w-[360px] overflow-y-auto border-l border-[#23253a] bg-[#0d0f1e] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-[12px] uppercase tracking-[0.18em]">Filters</div>
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
                  className="mt-4 w-full rounded-[12px] border border-red-400/30 bg-red-500/10 px-4 py-2 text-[12px] font-semibold text-red-200"
                >
                  Clear All
                </button>
              ) : null}

              <div className="mt-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b90ad]">
                  CATEGORIES
                </div>
                <div className="grid gap-2 text-[12px] text-[#d4d7f3]">
                  {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map((c) => (
                    <label key={c} className="flex items-center gap-2">
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

              <div className="mt-6">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b90ad]">
                  TYPES
                </div>
                <div className="grid gap-2 text-[12px] text-[#d4d7f3]">
                  {["T-Shirt", "Jean", "Jacket", "Formal Shirt", "Frock", "Wide-leg", "Shorts"].map(
                    (t) => (
                      <label key={t} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-white"
                          checked={selectedTypes.includes(t)}
                          onChange={() => toggleType(t)}
                        />
                        <span>{t}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-6 w-full rounded-[12px] bg-white px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#050611]"
              >
                Apply
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#050611] py-10 pb-[18px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-8 border-b border-[#191b2e] px-4 pb-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:gap-10">
          <div>
            <div className="mb-2 text-[16px] font-semibold tracking-[0.11em]">
              UFO Collection
            </div>
            <p className="max-w-[420px] text-[12px] leading-[1.9] text-[#8b90ad]">
              UFO Collection brings minimal, premium streetwear to your wardrobe.
              Discover curated looks, everyday essentials and pieces made to last.
            </p>
          </div>

          <div>
            <div className="mb-[10px] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              COMPANY
            </div>
            <ul className="grid list-none gap-2 p-0 text-[12px] text-[#d4d6ea]">
              <li>
                <Link href="/homepage">Home</Link>
              </li>
              <li>
                <Link href="/about">About us</Link>
              </li>
              <li>
                <a href="#">Delivery</a>
              </li>
              <li>
                <a href="#">Privacy policy</a>
              </li>
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