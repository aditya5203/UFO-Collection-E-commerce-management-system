"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();

  // demo values (replace later with real order data)
  const orderNumber = "#1234567";
  const estimatedDelivery = "June 15, 2025";
  const total = 150;

  return (
    <>
      {/* ================= HEADER (SAME AS CARTPAGE) ================= */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          {/* Left: Back + Brand */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] bg-transparent px-3 py-[7px] text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt=""
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

          {/* Center: Nav (desktop only) */}
          <nav className="hidden items-center gap-[42px] md:flex">
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

          {/* Right: Wishlist (go to cartpage like you wanted) */}
          <button
            type="button"
            onClick={() => router.push("/cartpage")}
            aria-label="Wishlist"
            title="Wishlist"
          >
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt=""
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
              className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
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
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1160px] px-4 pb-20 pt-14">
          {/* top divider line like screenshot */}
          <div className="h-px w-full bg-[#2b2f45]" />

          <div className="mx-auto mt-12 max-w-[920px] text-center">
            <h1 className="text-[34px] font-semibold max-sm:text-[28px]">
              Thank You for Your Order!
            </h1>
            <p className="mx-auto mt-3 max-w-[720px] text-[14px] text-[#9aa3cc]">
              Your order has been successfully placed. You will receive an email
              confirmation shortly with your order details.
            </p>
          </div>

          {/* Order Details block */}
          <div className="mx-auto mt-12 max-w-[920px] text-left">
            <h2 className="text-[18px] font-semibold">Order Details</h2>
            <div className="mt-5 h-px w-full bg-[#2b2f45]" />

            <div className="divide-y divide-[#2b2f45]">
              <div className="grid grid-cols-[220px_1fr] py-6 max-sm:grid-cols-1 max-sm:gap-2">
                <div className="text-[14px] text-[#9aa3cc]">Order Number</div>
                <div className="text-[14px] text-white">{orderNumber}</div>
              </div>

              <div className="grid grid-cols-[220px_1fr] py-6 max-sm:grid-cols-1 max-sm:gap-2">
                <div className="text-[14px] text-[#9aa3cc]">
                  Estimated Delivery
                </div>
                <div className="text-[14px] text-white">{estimatedDelivery}</div>
              </div>

              <div className="grid grid-cols-[220px_1fr] py-6 max-sm:grid-cols-1 max-sm:gap-2">
                <div className="text-[14px] text-[#9aa3cc]">Total</div>
                <div className="text-[14px] text-white">${total.toFixed(0)}</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mx-auto mt-14 flex max-w-[920px] items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => router.push("/customerorderdetails/[orderId]")}
              className="h-[46px] w-[190px] rounded-[10px] bg-[#243245] text-[14px] font-semibold text-white hover:bg-[#2b3b52]"
            >
              View Order
            </button>

            <button
              type="button"
              onClick={() => router.push("/collection")}
              className="h-[46px] w-[240px] rounded-[10px] bg-[#1f7cff] text-[14px] font-semibold text-white hover:bg-[#2a86ff]"
            >
              Continue Shopping
            </button>
          </div>

          {/* ================= FOOTER (SAME AS CARTPAGE) ================= */}
          <div className="mt-28 flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-6 opacity-90">
              <a href="#" aria-label="Instagram" className="hover:opacity-100">
                <Image
                  src="/images/instagram.png"
                  width={18}
                  height={18}
                  alt=""
                  className="brightness-0 invert"
                />
              </a>
              <a href="#" aria-label="Facebook" className="hover:opacity-100">
                <Image
                  src="/images/facebook.png"
                  width={18}
                  height={18}
                  alt=""
                  className="brightness-0 invert"
                />
              </a>
            </div>

            <div className="text-[14px] text-[#93a0c8]">
              © 2025 UFO Collection — All Rights Reserved
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
