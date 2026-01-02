"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050611] text-[#f5f5f7] font-[Poppins]">
      {/* Global font import (same as your CSS) */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 h-20 border-b border-[#191b2d] bg-[#050611]/95 backdrop-blur-[12px]">
        <div className="mx-auto flex h-full w-full max-w-[1160px] items-center justify-between px-4 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-[10px] max-[640px]:py-3">
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
            <div className="text-[28px] font-bold uppercase tracking-[0.18em] text-white max-[640px]:text-[22px]">
              UFO Collection
            </div>
          </div>

          {/* Nav */}
          <nav className="flex gap-[42px] max-[640px]:flex-wrap max-[640px]:gap-5">
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
          <div className="mt-0 flex items-center gap-5 max-[640px]:mt-1">
            <Link href="/collection">
              <Image
                src="/images/search.png"
                width={26}
                height={26}
                alt="Search"
                className="opacity-100 [filter:brightness(0)_invert(1)_contrast(280%)_saturate(260%)]"
              />
            </Link>

            <Image
              src="/images/profile.png"
              width={26}
              height={26}
              alt="Profile"
              className="opacity-100 [filter:brightness(0)_invert(1)_contrast(280%)_saturate(260%)]"
            />

            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt="Wishlist"
              className="opacity-100 [filter:brightness(0)_invert(1)_contrast(280%)_saturate(260%)]"
            />
          </div>
        </div>
      </header>

      {/* PAGE */}
      <main
        className="min-h-[60vh]"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(102, 76, 255, 0.16), transparent 55%), #050611",
        }}
      >
        {/* ABOUT HERO */}
        <section className="py-10">
          <div className="mx-auto w-full max-w-[1160px] px-4">
            <div className="mb-[22px] text-left">
              <div className="text-[18px] uppercase tracking-[0.24em]">
                ABOUT <span className="font-bold">US</span>
              </div>
              <div className="mt-2 h-px w-20 bg-[#3c3f59]" />
            </div>

            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 items-stretch max-[900px]:grid-cols-1">
              {/* Image */}
              <div className="relative w-full overflow-hidden rounded-[18px] border border-[#20233a] bg-[#111324] pb-[75%]">
                <Image
                  src="/images/about-flatlay.jpg"
                  alt="Folded clothes, shoes and accessories"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Text Card */}
              <div className="rounded-[18px] border border-[#23253a] bg-[#101223] p-[26px] text-[13px] leading-[1.8] text-[#8b90ad] shadow-[0_18px_36px_rgba(0,0,0,0.6)]">
                <p className="mb-3">
                  UFO Collection was born from a passion for innovation and a
                  desire to reimagine the way people experience everyday style.
                  What started as a simple idea—to make curated, premium
                  streetwear accessible from the comfort of your home—has grown
                  into a brand focused on comfort, confidence and clean design.
                </p>
                <p className="mb-3">
                  Since our first drop, we&apos;ve worked to craft a diverse
                  selection of high–quality pieces that cater to every taste and
                  occasion. From laid–back basics to standout silhouettes, every
                  item is chosen with fabric, fit and longevity in mind.
                </p>

                <h3 className="mb-2 mt-[10px] text-[14px] font-semibold text-[#f5f5ff]">
                  Our Mission
                </h3>
                <p className="mb-0">
                  Our mission at UFO Collection is to empower customers with
                  choice, convenience and confidence. We&apos;re dedicated to
                  offering a seamless shopping journey—from discovery and
                  sizing, to checkout and delivery—so you can focus on wearing
                  what you love.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="pb-10 pt-[18px]">
          <div className="mx-auto w-full max-w-[1160px] px-4">
            <div className="mb-[22px]">
              <div className="text-[16px] uppercase tracking-[0.22em]">
                WHY <span className="font-bold">CHOOSE US</span>
              </div>
              <div className="mt-[6px] h-px w-20 bg-[#3c3f59]" />
            </div>

            <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
              <div className="rounded-[14px] border border-[#23253a] bg-[#0b0d1a] p-[18px] text-[12px] text-[#8b90ad]">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#e4e5ff]">
                  QUALITY ASSURANCE
                </div>
                <p className="m-0">
                  We carefully select and test every piece to ensure it meets
                  our standards for comfort, durability and finish.
                </p>
              </div>

              <div className="rounded-[14px] border border-[#23253a] bg-[#0b0d1a] p-[18px] text-[12px] text-[#8b90ad]">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#e4e5ff]">
                  CONVENIENCE
                </div>
                <p className="m-0">
                  Shop on your time with an easy–to–use interface, smart
                  filters, and size–friendly designs for everyday wear.
                </p>
              </div>

              <div className="rounded-[14px] border border-[#23253a] bg-[#0b0d1a] p-[18px] text-[12px] text-[#8b90ad]">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#e4e5ff]">
                  EXCEPTIONAL CUSTOMER SERVICE
                </div>
                <p className="m-0">
                  Our support team is here to help with sizing, orders and
                  returns—so your experience stays smooth from cart to closet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIBE STRIP */}
        <section className="mt-[10px] border-y border-[#171a32] bg-[#0a1020] py-[46px] text-center">
          <div className="mx-auto w-full max-w-[1160px] px-4">
            <h3 className="m-0 text-[20px] font-semibold">
              Subscribe now &amp; get 20% off
            </h3>
            <p className="mb-[18px] mt-[6px] text-[13px] text-[#8b90ad]">
              Join the UFO list for exclusive drops, styling ideas and early
              access to limited collections.
            </p>

            <form
              className="flex flex-wrap justify-center gap-[10px]"
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
                className="w-[420px] min-w-[260px] max-w-[80vw] rounded-full border border-[#23253a] bg-[#090c1a] px-[14px] py-[10px] text-[13px] text-[#f5f5f7] placeholder:text-[#787e99]"
                type="email"
                required
                placeholder="Enter your email id"
              />
              <button
                className="cursor-pointer rounded-full bg-white px-5 py-[10px] text-[13px] font-medium text-[#050616] border-0"
                type="submit"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#050611] pb-[18px] pt-10">
        <div className="mx-auto grid max-w-[1160px] grid-cols-[1.4fr_0.8fr_0.8fr] gap-10 border-b border-[#191b2e] px-4 pb-6 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
          {/* Left */}
          <div>
            <div className="mb-2 text-[16px] font-semibold tracking-[0.11em]">
              UFO Collection
            </div>
            <p className="max-w-[420px] text-[12px] leading-[1.9] text-[#8b90ad]">
              UFO Collection brings minimal, premium streetwear to your
              wardrobe. Discover curated looks, everyday essentials and pieces
              made to last.
            </p>
          </div>

          {/* Middle */}
          <div>
            <div className="mb-[10px] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              COMPANY
            </div>
            <ul className="m-0 grid list-none gap-2 p-0 text-[12px] text-[#d4d6ea]">
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

          {/* Right */}
          <div>
            <div className="mb-[10px] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b90ad]">
              GET IN TOUCH
            </div>
            <ul className="m-0 grid list-none gap-2 p-0 text-[12px] text-[#d4d6ea]">
              <li>+977 9804880758</li>
              <li>ufocollection@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="pt-[14px] text-center text-[11px] text-[#6d7192]">
          Copyright 2025 © UFO Collection — All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
