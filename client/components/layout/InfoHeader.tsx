"use client";

import Link from "next/link";
import Image from "next/image";

type InfoHeaderProps = {
  active?: "home" | "collection" | "about" | "contact";
};

export default function InfoHeader({
  active = "contact",
}: InfoHeaderProps) {
  const navClass = (key: InfoHeaderProps["active"]) =>
    `text-[14px] uppercase tracking-[0.16em] transition ${
      active === key
        ? "text-[#d6c7ff]"
        : "text-[#a7aec4] hover:text-[#d6c7ff]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#1b1e2b] bg-[rgba(10,10,15,0.92)] backdrop-blur-xl">
      
      <div className="mx-auto flex h-[76px] w-full max-w-[1280px] items-center px-4 sm:px-6 lg:px-8">
        
        {/* LEFT - LOGO */}
        <div className="flex items-center gap-3">
          <Link href="/homepage" className="flex items-center gap-3">
            <div className="h-[48px] w-[48px] overflow-hidden rounded-full border border-white/15 bg-white/5">
              <Image
                src="/images/logo.png"
                alt="logo"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>

            <span className="text-[22px] font-bold uppercase tracking-[0.14em] text-white lg:text-[26px]">
              UFO Collection
            </span>
          </Link>
        </div>

        {/* CENTER - NAV (PERFECT CENTER) */}
        <nav className="mx-auto hidden items-center gap-10 lg:flex">
          <Link href="/homepage" className={navClass("home")}>
            HOME
          </Link>
          <Link href="/collection" className={navClass("collection")}>
            COLLECTION
          </Link>
          <Link href="/about" className={navClass("about")}>
            ABOUT
          </Link>
          <Link href="/contact" className={navClass("contact")}>
            CONTACT
          </Link>
        </nav>

        {/* RIGHT - EMPTY (keeps alignment same as HomeHeader) */}
        <div className="hidden w-[140px] lg:block" />
      </div>

      {/* MOBILE NAV */}
      <div className="border-t border-[#1b1e2b] bg-[rgba(10,10,15,0.98)] lg:hidden">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-3">
          <Link href="/homepage" className={navClass("home")}>
            HOME
          </Link>
          <Link href="/collection" className={navClass("collection")}>
            COLLECTION
          </Link>
          <Link href="/about" className={navClass("about")}>
            ABOUT
          </Link>
          <Link href="/contact" className={navClass("contact")}>
            CONTACT
          </Link>
        </div>
      </div>

    </header>
  );
}