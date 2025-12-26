"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

type Size = "S" | "M" | "L" | "XL" | "XXL";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;

  rating?: number;
  reviews?: number;
  shortDesc?: string;
  longDesc?: string;
  sizes?: Size[];
};

type CartItem = {
  id: string;
  name: string;
  size: string;
  price: number;
  qty: number;
  image: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const DEFAULT_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

// ✅ This fixed description will be shown for ALL products in Description tab
const FIXED_DESCRIPTION =
  "UFO Collection is an e-commerce website that allows customers to browse and purchase products online with ease. It functions as a digital marketplace where products are organized into well-defined collections, such as clothing and accessories, enabling users to explore items efficiently. Each collection displays product images, names, prices, and brief details to help customers compare options quickly. When a product is selected from a collection, the user is taken to a dedicated product page that provides complete information, including descriptions, available sizes, colors, and pricing. UFO Collection offers a convenient, accessible, and user-friendly shopping experience, allowing customers to shop anytime and from anywhere with global reach..";

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

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedSize, setSelectedSize] = React.useState<Size>("M");
  const [activeTab, setActiveTab] = React.useState<"description" | "reviews">(
    "description"
  );

  // -------- Fetch product by id --------
  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) throw new Error("Missing product id in route.");

        const res = await fetch(`${API_BASE}/products/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load product (status ${res.status})`);
        }

        const raw = await res.json();

        const mapped: Product = {
          id: String(raw.id || raw._id || id),
          name: toStr(raw.name, "Unnamed Product"),
          price: toNumber(raw.price, 0),
          image: toStr(raw.image, "/product-boy-main.png"),

          rating: toNumber(raw.rating, 4.8),
          reviews: toNumber(raw.reviews, 0),
          // ✅ keep your short text under price as it is
          shortDesc: toStr(raw.shortDesc, toStr(raw.description, "")),
          longDesc: toStr(raw.longDesc, toStr(raw.description, "")),
          sizes: normalizeSizes(raw.sizes),
        };

        setProduct(mapped);

        const sizes = mapped.sizes?.length ? mapped.sizes : DEFAULT_SIZES;
        setSelectedSize(sizes.includes("M") ? "M" : sizes[0]);
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

  // -------- Add to cart (localStorage) --------
  const addToCart = () => {
    if (!product) return;

    const item: CartItem = {
      id: product.id,
      name: product.name,
      size: selectedSize,
      price: product.price,
      qty: 1,
      image: product.image,
    };

    let cart: CartItem[] = [];
    try {
      const raw = localStorage.getItem("ufo_cart");
      cart = raw ? (JSON.parse(raw) as CartItem[]) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }

    const idx = cart.findIndex((it) => it.id === item.id && it.size === item.size);
    if (idx !== -1) {
      cart[idx].qty = Math.min(99, (cart[idx].qty || 1) + 1);
    } else {
      cart.push(item);
    }

    localStorage.setItem("ufo_cart", JSON.stringify(cart));
    router.push("/cartpage");
  };

  // -------- UI states --------
  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        Loading product…
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-red-300 text-center">
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

  const sizes = product.sizes?.length ? product.sizes : DEFAULT_SIZES;

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          {/* Left: Back + Brand */}
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

          {/* Nav desktop */}
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

          {/* Right: Go to cart */}
          <button
            type="button"
            onClick={() => router.push("/cartpage")}
            aria-label="Go to cart"
            title="Go to cart"
            className="cursor-pointer"
          >
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt="Cart icon"
              className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
            />
          </button>
        </div>

        {/* Mobile Nav */}
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

      {/* ================= PAGE ================= */}
      <main className="min-h-[calc(100vh-80px)] bg-[#050816] text-[#e5e7eb]">
        <div className="mx-auto max-w-[1120px] px-4 pb-20 pt-8 md:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 text-[13px] text-[#9ca3af]">
            <Link href="/homepage" className="hover:text-white">
              Home
            </Link>{" "}
            / <span className="text-[#e5e7eb]">{product.name}</span>
          </div>

          {/* Top grid */}
          <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.05fr_1.4fr]">
            {/* Image card */}
            <div className="flex justify-center rounded-[14px] border border-[#111827] bg-[#050816] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
              <div className="relative w-full max-w-[360px] pb-[100%]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Info */}
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
                {product.reviews ?? 0} reviews
              </div>

              <div className="mt-3 text-[22px] font-semibold text-[#7dd3fc]">
                Rs. {product.price}
              </div>

              {/* ✅ keep this short line under price exactly as it is */}
              {product.shortDesc ? (
                <p className="mt-3 max-w-[460px] text-[14px] leading-[1.7] text-[#d1d5db]">
                  {product.shortDesc}
                </p>
              ) : null}

              {/* Sizes */}
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

              {/* Add to cart */}
              <button
                type="button"
                onClick={addToCart}
                aria-label="Add to cart"
                title="Add to cart"
                className="mt-5 rounded-[4px] bg-[#1d9bf0] px-6 py-[10px] text-[14px] font-semibold text-white hover:bg-[#1580c5]"
              >
                ADD TO CART
              </button>

              <ul className="mt-4 space-y-1 text-[13px] text-[#cbd5e1]">
                <li>100% Original Products</li>
                <li>Cash on delivery Available</li>
                <li>Easy 7 days return available</li>
              </ul>
            </div>
          </section>

          {/* Tabs */}
          <section className="mt-10">
            <div className="flex gap-7 border-b border-[#111827] text-[14px]">
              <button
                type="button"
                onClick={() => setActiveTab("description")}
                aria-label="Show description"
                title="Show description"
                className={`pb-3 ${
                  activeTab === "description"
                    ? "border-b-2 border-white text-white"
                    : "text-[#9ca3af]"
                }`}
              >
                Description
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                aria-label="Show reviews"
                title="Show reviews"
                className={`pb-3 ${
                  activeTab === "reviews"
                    ? "border-b-2 border-white text-white"
                    : "text-[#9ca3af]"
                }`}
              >
                Reviews{" "}
                <span className="text-[13px]">({product.reviews ?? 0})</span>
              </button>
            </div>

            <div className="mt-4 text-[14px] leading-[1.7] text-[#d1d5db]">
              {activeTab === "description" ? (
                // ✅ ALWAYS show same description for ALL products here
                <p>{FIXED_DESCRIPTION}</p>
              ) : (
                <p>Reviews coming soon.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
