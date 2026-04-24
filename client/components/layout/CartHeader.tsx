"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-[#1b1e2b] bg-[rgba(10,10,15,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1280px] items-center px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => router.push("/collection")}
            className="group flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#090a12]"
            aria-label="Back to collection"
            title="Back to collection"
          >
            <Image
              src="/images/backarrow.png"
              width={18}
              height={18}
              alt="Back icon"
              className="brightness-0 invert group-hover:invert-0"
            />
            <span className="hidden sm:inline">Back</span>
          </button>

          <Link
            href="/homepage"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
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

        <nav className="mx-auto hidden items-center gap-6 lg:flex xl:gap-10">
          <Link
            href="/homepage"
            className="text-[14px] uppercase tracking-[0.16em] text-[#d6c7ff]"
          >
            Home
          </Link>
          <Link
            href="/collection"
            className="text-[14px] uppercase tracking-[0.16em] text-[#a7aec4] transition hover:text-[#d6c7ff]"
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

        <div className="hidden w-[180px] lg:block" />
      </div>

      <div className="border-t border-[#1b1e2b] bg-[rgba(10,10,15,0.98)] lg:hidden">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-3">
          <Link
            href="/homepage"
            className="text-[13px] uppercase tracking-[0.16em] text-[#d6c7ff]"
          >
            Home
          </Link>
          <Link
            href="/collection"
            className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4] hover:text-[#d6c7ff]"
          >
            Collection
          </Link>
          <Link
            href="/about"
            className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4] hover:text-[#d6c7ff]"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-[13px] uppercase tracking-[0.16em] text-[#a7aec4] hover:text-[#d6c7ff]"
          >
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}