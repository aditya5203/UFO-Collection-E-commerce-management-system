"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import InfoHeader from "@/components/layout/InfoHeader";
import MainFooter from "@/components/layout/MainFooter";
import SubscribeOffer from "@/components/SubscribeOffer";

const shellClass =
  "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/40";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stats = [
  { label: "Fashion Categories", value: "10+" },
  { label: "Secure Checkout", value: "100%" },
  { label: "Nepal Focused", value: "NPR" },
];

const reasons = [
  {
    title: "Quality Assurance",
    desc: "Every product is selected with comfort, finish, and long-term usability in mind.",
  },
  {
    title: "Easy Shopping",
    desc: "Responsive pages, smart filters, clear details, and smooth checkout improve the customer journey.",
  },
  {
    title: "Reliable Support",
    desc: "Customers can get help for sizing, orders, delivery, reviews, and support tickets.",
  },
];

export default function AboutPage() {
  const [imageError, setImageError] = React.useState(false);

  return (
    <>
      <InfoHeader />

      <main className={shellClass}>
        <section className={containerClass}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45 }}
            className={`${panelClass} overflow-hidden`}
          >
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
              <div className="flex flex-col justify-center">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  About UFO Collection
                </div>

                <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[48px] lg:text-[60px]">
                  Fashion built for confidence.
                </h1>

                <p className="mt-4 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[15px]">
                  UFO Collection is a modern fashion e-commerce platform focused
                  on premium clothing, shoes, clean design, secure checkout, and
                  a smooth shopping experience for customers in Nepal.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/collection" className={primaryBtnClass}>
                    Explore Collection
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full border border-[#34384d] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    Contact Support
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {stats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[18px] border border-[#26293a] bg-[#161824] p-4"
                    >
                      <div className="text-[22px] font-semibold text-white">
                        {item.value}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#a7aec4]">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[280px] overflow-hidden rounded-[22px] border border-[#26293a] bg-[#161824] sm:min-h-[360px]">
                {!imageError ? (
                  <Image
                    src="/images/about-flatlay.jpg"
                    alt="Folded clothes, shoes and fashion accessories"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover opacity-80"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center bg-[radial-gradient(circle_at_top_left,#2d2447,transparent_35%),linear-gradient(135deg,#161824,#0d0f17)] p-8 text-center sm:min-h-[360px]">
                    <div>
                      <div className="text-[12px] uppercase tracking-[0.22em] text-[#d6c7ff]">
                        UFO Collection
                      </div>
                      <div className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-white">
                        Premium Streetwear
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur">
                  Premium streetwear • Nepal
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <motion.section
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4 }}
              className={`${panelClass} p-5 sm:p-6`}
            >
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Our Story
              </div>

              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white">
                Reimagining everyday style
              </h2>

              <div className="mt-5 space-y-4 text-[14px] leading-7 text-[#a7aec4]">
                <p>
                  UFO Collection was created to make fashion discovery easier,
                  faster, and more enjoyable. The platform brings clothing and
                  footwear products into one clean shopping experience with
                  search, filters, cart, checkout, and order tracking.
                </p>

                <p>
                  From everyday basics to standout pieces, the brand focuses on
                  comfort, confidence, and a premium digital experience for
                  modern customers.
                </p>
              </div>
            </motion.section>

            <motion.section
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45 }}
              className={`${panelClass} p-5 sm:p-6`}
            >
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Our Mission
              </div>

              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white">
                Choice, convenience, and confidence
              </h2>

              <p className="mt-5 text-[14px] leading-7 text-[#a7aec4]">
                Our mission is to provide a localized fashion shopping platform
                with secure checkout, NPR pricing, customer-friendly order
                management, and a responsive interface that works smoothly on
                mobile, tablet, and desktop.
              </p>
            </motion.section>
          </div>

          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45 }}
            className="mt-8"
          >
            <div className="mb-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Why Choose Us
              </div>

              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-white">
                Built for a better shopping experience
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {reasons.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[22px] border border-[#26293a] bg-[#161824] p-5 transition hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d6c7ff]">
                    {item.title}
                  </div>

                  <p className="mt-3 text-[13px] leading-7 text-[#a7aec4]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="mt-8 overflow-hidden rounded-[24px]"
          >
            <SubscribeOffer />
          </motion.section>
        </section>
      </main>

      <MainFooter />
    </>
  );
}