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

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const contactCards = [
  {
    label: "Phone",
    value: "+977 9804880758",
    href: "tel:+9779804880758",
  },
  {
    label: "Email",
    value: "ufocollection@gmail075.com",
    href: "mailto:ufocollection@gmail.com",
  },
];

export default function ContactPage() {
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
                  Contact UFO Collection
                </div>

                <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[48px] lg:text-[60px]">
                  We’re here to help.
                </h1>

                <p className="mt-4 max-w-[580px] text-[13px] leading-7 text-[#a7aec4] sm:text-[15px]">
                  Reach out for product questions, order support, delivery
                  information, returns, or business inquiries.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="mailto:ufocollection@gmail.com"
                    className={primaryBtnClass}
                  >
                    Email Us
                  </a>

                  <a href="tel:+9779804880758" className={secondaryBtnClass}>
                    Call Store
                  </a>
                </div>
              </div>

              <div className="relative min-h-[280px] overflow-hidden rounded-[22px] border border-[#26293a] bg-[#161824] sm:min-h-[360px]">
                {!imageError ? (
                  <Image
                    src="/images/contact-desk.jpg"
                    alt="UFO Collection customer support desk"
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
                        Customer Support
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />

                <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur">
                  Support • Store • Careers
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
                Store Information
              </div>

              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white">
                Our Store
              </h2>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d6c7ff]">
                    Address
                  </div>

                  <p className="mt-2 text-[14px] leading-7 text-[#a7aec4]">
                    Bhanu Chowk – 04, JanakpurDham,
                    <br />
                    Madhesh Pradesh, Dhanusha, Nepal
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {contactCards.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 transition hover:-translate-y-1 hover:border-[#4a506b] focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d6c7ff]">
                        {item.label}
                      </div>

                      <div className="mt-2 break-all text-[14px] text-white">
                        {item.value}
                      </div>
                    </a>
                  ))}
                </div>
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
                Careers
              </div>

              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white">
                Careers at UFO
              </h2>

              <p className="mt-4 text-[14px] leading-7 text-[#a7aec4]">
                Learn more about our team, culture, and future job openings.
                We’re building a modern fashion commerce experience for Nepal.
              </p>

              <Link href="/careers" className={`${secondaryBtnClass} mt-6`}>
                Explore Jobs
              </Link>
            </motion.section>
          </div>

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