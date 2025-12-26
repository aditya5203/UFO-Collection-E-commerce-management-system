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

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = React.useState<User | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  const [latestProducts, setLatestProducts] = React.useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = React.useState<Product[]>(
    []
  );
  const [loadingProducts, setLoadingProducts] = React.useState(true);

  // ---------- Fetch /auth/me ----------
  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const res = await fetch(`${apiBase}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        const me = data.user || data.data?.user || null;
        setUser(me);
      } catch (err) {
        console.error("Failed to fetch /auth/me", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
  }, []);

  // ---------- Fetch products for homepage ----------
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const res = await fetch(`${apiBase}/products`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load products");

        const all: Product[] = await res.json();

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
  }, []);

  return (
    <>
      {/* Google Font (same as before) */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
        html,
        body {
          font-family: Poppins, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }
      `}</style>

      {/* HEADER */}
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
              className="text-[15px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
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
            {/* Search */}
            <Link href="/collection" aria-label="Search">
              <Image
                src="/images/search.png"
                width={26}
                height={26}
                alt="Search"
                className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>

            {/* Profile */}
            {user ? (
              <button
                type="button"
                aria-label="Open user profile"
                title="Profile"
                onClick={() => router.push("/profile")}
                className="cursor-pointer bg-transparent p-0"
              >
                <Image
                  src={user.avatarUrl || "/images/profile.png"}
                  width={32}
                  height={32}
                  alt={user.name || "Profile picture"}
                  className="rounded-full brightness-0 invert contrast-[2.8] saturate-[2.6]"
                />
              </button>
            ) : (
              <Link href="/signup" aria-label="Signup">
                <Image
                  src="/images/profile.png"
                  width={26}
                  height={26}
                  alt="Profile"
                  className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
                />
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/wishlist" aria-label="Wishlist">
              <Image
                src="/images/wishlist.png"
                width={26}
                height={26}
                alt="Wishlist"
                className="brightness-0 invert contrast-[2.8] saturate-[2.6]"
              />
            </Link>

            {/* Admin Button */}
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
        {/* HERO */}
        <section className="py-8">
          <div className="mx-auto max-w-[1160px] px-4">
            <div className="min-h-[320px] overflow-hidden rounded-[18px] border border-[#1f2136] bg-[#0b0d1a] max-[900px]:grid-cols-1 max-[900px]:min-h-0">
              <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] max-[900px]:grid-cols-1">
                <div className="flex flex-col justify-center gap-[18px] p-[38px_40px] max-sm:p-[28px_20px]">
                  <div className="text-[12px] uppercase tracking-[0.18em] text-[#8b90ad]">
                    OUR BESTSELLERS
                  </div>
                  <h1 className="text-[38px] font-semibold max-sm:text-[30px]">
                    Latest Arrivals
                  </h1>
                  <p className="max-w-[320px] text-[13px] text-[#8b90ad]">
                    Discover new-season pieces designed for everyday comfort and
                    statement looks. Curated drops from UFO Collection, just
                    landed.
                  </p>
                  <button
                    onClick={() => router.push("/collection")}
                    className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-[10px] text-[13px] font-medium uppercase tracking-[0.16em] text-[#050611]"
                  >
                    SHOP NOW
                  </button>
                </div>

                <div className="relative bg-[#0f1120] max-[900px]:min-h-[260px]">
                  <Image
                    src="/images/home/hero-banner.jpg"
                    alt="Jeans and t-shirt flatlay"
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LATEST COLLECTIONS */}
        <section className="py-6">
          <div className="mx-auto max-w-[1160px] px-4">
            <div className="mb-[22px] text-center">
              <div className="text-[18px] uppercase tracking-[0.24em]">
                LATEST COLLECTIONS
              </div>
              <div className="mx-auto mt-2 h-px w-20 bg-[#3c3f59]" />
              <p className="mx-auto mt-[10px] max-w-[520px] text-[13px] text-[#8b90ad]">
                Handpicked styles fresh from our latest drops. Explore minimalist
                silhouettes, soft fabrics and everyday essentials for every
                wardrobe.
              </p>
            </div>

            {loadingProducts ? (
              <div>Loading products…</div>
            ) : latestProducts.length === 0 ? (
              <div>No products available.</div>
            ) : (
              <div className="grid grid-cols-4 gap-5 max-[1024px]:grid-cols-3 max-sm:grid-cols-2">
                {latestProducts.map((p) => (
                  <div key={p.id} className="flex flex-col gap-[6px] text-[12px]">
                    <div className="relative w-full overflow-hidden rounded-[10px] border border-[#252842] bg-[#151726] pb-[130%]">
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="mt-1 text-[#f1f2ff]">{p.name}</div>
                    <div className="text-[#8b90ad]">Rs. {p.price.toFixed(2)}</div>
                  </div>
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
                Customer favorites you can&apos;t go wrong with. These pieces are
                tried, tested and loved by the UFO community.
              </p>
            </div>

            {loadingProducts ? (
              <div>Loading products…</div>
            ) : bestSellerProducts.length === 0 ? (
              <div>No products available.</div>
            ) : (
              <div className="grid grid-cols-4 gap-5 max-[1024px]:grid-cols-3 max-sm:grid-cols-2">
                {bestSellerProducts.map((p) => (
                  <div key={p.id} className="flex flex-col gap-[6px] text-[12px]">
                    <div className="relative w-full overflow-hidden rounded-[10px] border border-[#252842] bg-[#151726] pb-[130%]">
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="mt-1 text-[#f1f2ff]">{p.name}</div>
                    <div className="text-[#8b90ad]">Rs. {p.price.toFixed(2)}</div>
                  </div>
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
                {
                  icon: "🔁",
                  title: "Easy Exchange Policy",
                  text: "Hassle-free exchanges on eligible items for a smooth experience.",
                },
                {
                  icon: "📅",
                  title: "7 Days Return Policy",
                  text: "Not the right fit? Enjoy a simple 7-day return window.",
                },
                {
                  icon: "🎧",
                  title: "Best Customer Support",
                  text: "Our team is here to help you with sizing, orders and more.",
                },
              ].map((p) => (
                <div key={p.title} className="flex flex-col items-center gap-[10px]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#3a3d5a] text-[20px]">
                    {p.icon}
                  </div>
                  <div className="text-[13px] font-semibold">{p.title}</div>
                  <div className="max-w-[220px] text-[12px] text-[#8b90ad]">
                    {p.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUBSCRIBE */}
        <section className="border-y border-[#171a32] bg-[#0a1020] py-[46px] text-center">
          <div className="mx-auto max-w-[1160px] px-4">
            <h3 className="m-0 text-[20px] font-semibold">
              Subscribe now &amp; get 20% off
            </h3>
            <p className="mt-[6px] text-[13px] text-[#8b90ad]">
              Join our mailing list for early access to drops, exclusive deals,
              and styling tips curated by UFO Collection.
            </p>

            <form
              className="mt-[18px] flex flex-wrap justify-center gap-[10px]"
              onSubmit={(e) => {
                e.preventDefault();
                const inp = e.currentTarget.querySelector(
                  "input"
                ) as HTMLInputElement;
                if (inp.value) alert(`Subscribed: ${inp.value}`);
                inp.value = "";
              }}
            >
              <input
                type="email"
                required
                placeholder="Enter your email id"
                className="w-[420px] min-w-[260px] max-w-[80vw] rounded-full border border-[#23253a] bg-[#090c1a] px-[14px] py-[10px] text-[13px] text-[#f5f5f7] placeholder:text-[#787e99]"
              />
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-[10px] text-[13px] font-medium text-[#050616]"
              >
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
                <Link href="/">Home</Link>
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
