"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type UserLite = {
  id?: string;
  name?: string;
  email?: string;
};

function getInitials(name: string) {
  const clean = String(name || "").trim();
  if (!clean) return "U";
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last =
    parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return (first + last).toUpperCase();
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function CollectionHeader({
  onSearchClick,
}: {
  onSearchClick?: () => void;
}) {
  const router = useRouter();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080/api";

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<UserLite | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);
  const [cartCount, setCartCount] = React.useState(0);

  const syncCartCount = React.useCallback(() => {
    try {
      const raw = localStorage.getItem("ufo_cart");
      const cart = raw ? JSON.parse(raw) : [];
      const count = Array.isArray(cart)
        ? cart.reduce((sum: number, item: any) => sum + (Number(item?.qty) || 0), 0)
        : 0;
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, []);

  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const json = await safeJson(res);
        const me = json?.user || json?.data?.user || json?.data || null;
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchMe();
    syncCartCount();
  }, [API_BASE, syncCartCount]);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    const update = () => syncCartCount();

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
  }, [syncCartCount]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1b1e2b] bg-[rgba(10,10,15,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/homepage" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="h-[42px] w-[42px] overflow-hidden rounded-full border border-white/15 bg-white/5 sm:h-[48px] sm:w-[48px]">
              <Image
                src="/images/logo.png"
                alt="UFO Collection logo"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="truncate text-[16px] font-bold uppercase tracking-[0.14em] text-white sm:text-[22px] lg:text-[26px]">
              UFO Collection
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-10">
          <Link
            href="/homepage"
            className="text-[14px] uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
          >
            Home
          </Link>
          <Link
            href="/collection"
            className="text-[14px] uppercase tracking-[0.16em] text-[#d6c7ff]"
          >
            Collection
          </Link>
          <Link
            href="/about"
            className="text-[14px] uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-[14px] uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10 md:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>

          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Search"
            className="rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
          >
            <Image
              src="/images/search.png"
              width={18}
              height={18}
              alt="Search"
              className="brightness-0 invert"
            />
          </button>

          {loadingUser ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <button
              type="button"
              aria-label="Open user profile"
              title={user.name || "Profile"}
              onClick={() => router.push("/profile")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white text-[12px] font-semibold text-[#090a12]"
            >
              {getInitials(user.name || user.email || "User")}
            </button>
          ) : (
            <Link
              href="/signup"
              aria-label="Signup"
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
          )}

          <Link
            href="/cartpage"
            aria-label="Cart"
            title="Cart"
            className="relative rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
          >
            <Image
              src="/images/wishlist.png"
              width={18}
              height={18}
              alt="Cart"
              className="brightness-0 invert"
            />
            {cartCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-[#1b1e2b] bg-[rgba(10,10,15,0.98)] md:hidden">
          <div className="mx-auto grid max-w-[1240px] gap-3 px-4 py-4 sm:px-5">
            <Link onClick={() => setMobileMenuOpen(false)} href="/homepage" className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]">
              Home
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/collection" className="text-[13px] uppercase tracking-[0.16em] text-[#d6c7ff]">
              Collection
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/about" className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]">
              About
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/contact" className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4]">
              Contact
            </Link>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSearchClick?.();
                }}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Search
              </button>

              <Link
                onClick={() => setMobileMenuOpen(false)}
                href={user ? "/profile" : "/signup"}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                {user ? "Profile" : "Signup"}
              </Link>

              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/cartpage"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Cart {cartCount > 0 ? `(${cartCount})` : ""}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}