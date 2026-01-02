"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export default function ContactPage() {
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
        {/* CONTACT BLOCK */}
        <section className="py-10">
          <div className="mx-auto w-full max-w-[1160px] px-4">
            <div className="mb-[22px]">
              <div className="text-[18px] uppercase tracking-[0.24em]">
                CONTACT <span className="font-bold">US</span>
              </div>
              <div className="mt-2 h-px w-20 bg-[#3c3f59]" />
            </div>

            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 items-stretch max-[900px]:grid-cols-1">
              {/* LEFT IMAGE */}
              <div className="relative w-full overflow-hidden rounded-[18px] border border-[#20233a] bg-[#111324] pb-[75%]">
                <Image
                  src="/images/contact-desk.jpg"
                  alt="Laptop, phone and coffee on desk"
                  fill
                  className="object-cover"
                />
              </div>

              {/* RIGHT INFO CARD */}
              <div className="rounded-[18px] border border-[#23253a] bg-[#101223] p-[26px] text-[13px] leading-[1.8] text-[#8b90ad] shadow-[0_18px_36px_rgba(0,0,0,0.6)]">
                <div className="mb-[14px]">
                  <h3 className="m-0 mb-[6px] text-[14px] font-semibold text-[#f5f5ff]">
                    Our Store
                  </h3>
                  <p className="m-0 text-[12px] text-[#8b90ad]">
                    Bhanu Chowk – 04, JanakpurDham,
                    <br />
                    Madhesh Pradesh, Dhanusha, Nepal
                  </p>

                  <p className="mt-2 m-0 text-[12px] text-[#8b90ad]">
                    Tel: +977 9804880758
                    <br />
                    Email: ufocollection@gmail.com
                  </p>
                </div>

                <div className="mb-[14px]">
                  <h3 className="m-0 mb-[6px] text-[14px] font-semibold text-[#f5f5ff]">
                    Careers at UFO
                  </h3>
                  <p className="m-0 text-[12px] text-[#8b90ad]">
                    Learn more about our teams, culture and current job
                    openings.
                  </p>

                  <button
                    type="button"
                    className="mt-[10px] inline-flex cursor-pointer items-center justify-center rounded-full border border-[#23253a] bg-transparent px-[18px] py-2 text-[12px] text-[#f5f5f7] transition hover:border-[#2f3250] hover:bg-[#181a2c]"
                  >
                    Explore Jobs
                  </button>
                </div>
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
              Be the first to hear about new drops, limited releases and special
              offers from UFO Collection.
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
          {/* LEFT */}
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

          {/* MIDDLE */}
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

          {/* RIGHT */}
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
