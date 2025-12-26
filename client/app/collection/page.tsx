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
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function CollectionPage() {
  const [sortValue, setSortValue] = React.useState("low-high");

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedCustomers, setSelectedCustomers] = React.useState<
    CustomerType[]
  >([]);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);

  // ---------- Fetch products from backend ----------
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/products`, { cache: "no-store" });
        if (!res.ok)
          throw new Error(`Failed to load products (status ${res.status})`);

        const raw = await res.json();

        const mapped: Product[] = (raw || []).map((p: any) => ({
          id: String(p.id || p._id),
          name: p.name,
          price:
            typeof p.price === "string" ? Number(p.price) || 0 : p.price ?? 0,
          image: p.image || "/images/collection/1.jpg",
          customer: p.customer as CustomerType | undefined,
          subCategory: p.subCategory || p.category,
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

  // ---------- Apply filters + sort ----------
  const filteredAndSortedProducts = React.useMemo(() => {
    let list = [...products];

    // Filter by customer
    if (selectedCustomers.length > 0) {
      list = list.filter((p) =>
        p.customer ? selectedCustomers.includes(p.customer) : true
      );
    }

    // Filter by type / subCategory
    if (selectedTypes.length > 0) {
      const lowerTypes = selectedTypes.map((t) => t.toLowerCase());
      list = list.filter((p) => {
        const typeSource =
          ((p.subCategory || "").toLowerCase() || (p.name || "").toLowerCase());
        return lowerTypes.some((t) => typeSource.includes(t));
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortValue === "low-high") return a.price - b.price;
      if (sortValue === "high-low") return b.price - a.price;
      return 0;
    });

    return list;
  }, [products, selectedCustomers, selectedTypes, sortValue]);

  return (
    <>
      {/* Font same as homepage */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
        html,
        body {
          font-family: Poppins, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }
      `}</style>

      {/* HEADER (same design as homepage) */}
      <header className="sticky top-0 z-40 h-[80px] border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-full w-full max-w-[1160px] items-center justify-between px-4">
          {/* Brand */}
          <div className="flex items-center gap-[10px]">
            <div className="h-[44px] w-[44px] overflow-hidden rounded-full border-2 border-white">
              <Image
                src="/images/logo.png"
                alt="UFO Collection logo"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-[28px] font-bold uppercase tracking-[0.18em] text-white max-sm:text-[22px]">
              UFO Collection
            </div>
          </div>

          {/* Nav */}
          <nav className="flex gap-[42px] max-sm:flex-wrap max-sm:gap-5">
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

          {/* Icons */}
          <div className="flex items-center gap-5 max-sm:mt-1">
            <Link href="/collection" aria-label="Search">
              <Image
                src="/images/search.png"
                width={26}
                height={26}
                alt="Search"
                className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>

            <Link href="/profile" aria-label="Profile">
              <Image
                src="/images/profile.png"
                width={26}
                height={26}
                alt="Profile"
                className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>

            <Link href="/wishlist" aria-label="Wishlist">
              <Image
                src="/images/wishlist.png"
                width={26}
                height={26}
                alt="Wishlist"
                className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[#050611] pb-14 text-[#f5f5f7]">
        <section className="mx-auto w-full max-w-[1160px] px-4 py-8">
          {/* Title + Sort */}
          <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
            <div className="text-[22px] uppercase tracking-[0.18em]">
              ALL COLLECTIONS
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#8b90ad]">Sort by</span>
              <select
                className="min-w-[180px] rounded-md border border-[#23253a] bg-[#090b18] px-3 py-2 text-[12px] text-[#f5f5f7] outline-none"
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value)}
                aria-label="Sort collections"
              >
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          <div className="mt-4 h-px w-full bg-[#2a2c3f]" />

          {/* Layout */}
          <div className="mt-6 grid grid-cols-[240px_minmax(0,1fr)] gap-8 max-[900px]:grid-cols-1">
            {/* Filters */}
            <aside className="h-fit rounded-[10px] border border-[#23253a] bg-[#0d0f1e] p-4">
              <div className="text-[12px] uppercase tracking-[0.18em]">
                FILTERS
              </div>

              {/* Categories */}
              <div className="mt-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b90ad]">
                  CATEGORIES
                </div>

                <div className="grid gap-2 text-[12px] text-[#d4d7f3]">
                  {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map(
                    (c) => (
                      <label key={c} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-white"
                          checked={selectedCustomers.includes(c)}
                          onChange={() => toggleCustomer(c)}
                        />
                        <span>{c}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Types */}
              <div className="mt-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b90ad]">
                  TYPES
                </div>

                <div className="grid gap-2 text-[12px] text-[#d4d7f3]">
                  {[
                    "T-Shirt",
                    "Jean",
                    "Jacket",
                    "Formal Shirt",
                    "Frock",
                    "Wide-leg",
                    "Shorts",
                  ].map((t) => (
                    <label key={t} className="flex items-center gap-2">
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

            {/* Products */}
            <section className="grid grid-cols-4 gap-6 max-[1024px]:grid-cols-3 max-sm:grid-cols-2">
              {loading ? (
                <div className="col-span-full text-[#8b90ad]">
                  Loading products…
                </div>
              ) : error ? (
                <div className="col-span-full text-[#fca5a5]">{`Error: ${error}`}</div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="col-span-full text-[#8b90ad]">
                  No products match your filters.
                </div>
              ) : (
                filteredAndSortedProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="group block"
                  >
                    <div className="flex flex-col gap-[6px] rounded-[14px] border border-[#252842] bg-[#151726] p-3 text-[12px] transition-all duration-300 ease-out hover:-translate-y-[6px] hover:border-[#c9b9ff] hover:shadow-[0_25px_60px_rgba(201,185,255,0.18)]">
                      <div className="relative w-full overflow-hidden rounded-[10px] border border-[#252842] bg-[#151726] pb-[130%]">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                        />
                      </div>

                      <div className="mt-1 text-[#f1f2ff] transition-colors group-hover:text-white">
                        {p.name}
                      </div>

                      <div className="text-[#8b90ad] transition-colors group-hover:text-[#c9b9ff]">
                        Rs. {p.price.toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </section>
          </div>
        </section>
      </main>

      {/* FOOTER (same as homepage) */}
      <footer className="bg-[#050611] py-10 pb-[18px]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-[1.4fr_0.8fr_0.8fr] gap-10 border-b border-[#191b2e] px-4 pb-6 max-[900px]:grid-cols-2 max-sm:grid-cols-1">
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
