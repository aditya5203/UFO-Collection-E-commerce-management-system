"use client";

import Image from "next/image";
import CartHeader from "@/components/layout/InfoHeader";
import MainFooter from "@/components/layout/MainFooter";
import SubscribeOffer from "@/components/SubscribeOffer";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90";

export default function AboutPage() {
  return (
    <>
      <CartHeader />

      <main className={shellClass}>
        <section className={containerClass}>
          <div className={`${panelClass} overflow-hidden`}>
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
              <div className="flex flex-col justify-center">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  About UFO Collection
                </div>

                <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[48px] lg:text-[60px]">
                  Fashion built for confidence.
                </h1>

                <p className="mt-4 max-w-[600px] text-[13px] leading-7 text-[#a7aec4] sm:text-[15px]">
                  UFO Collection is a modern fashion e-commerce brand focused on
                  premium streetwear, everyday essentials, clean design, and a
                  smooth shopping experience for customers in Nepal.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="/collection" className={primaryBtnClass}>
                    Explore Collection
                  </a>
                </div>
              </div>

              <div className="relative min-h-[260px] overflow-hidden rounded-[22px] border border-[#26293a] bg-[#161824] sm:min-h-[340px]">
                <Image
                  src="/images/about-flatlay.jpg"
                  alt="Folded clothes, shoes and accessories"
                  fill
                  className="object-cover opacity-80"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur">
                  Premium streetwear • Nepal
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <section className={`${panelClass} p-5 sm:p-6`}>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Our Story
              </div>

              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white">
                Reimagining everyday style
              </h2>

              <div className="mt-5 space-y-4 text-[14px] leading-7 text-[#a7aec4]">
                <p>
                  UFO Collection was born from a passion for innovation and a
                  desire to reimagine the way people experience everyday style.
                  What started as a simple idea to make curated, premium
                  streetwear accessible from home has grown into a brand focused
                  on comfort, confidence, and clean design.
                </p>

                <p>
                  From laid-back basics to standout silhouettes, every product is
                  selected with fabric, fit, and long-term usability in mind. Our
                  goal is to make fashion discovery easier, faster, and more
                  enjoyable.
                </p>
              </div>
            </section>

            <section className={`${panelClass} p-5 sm:p-6`}>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Our Mission
              </div>

              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-white">
                Choice, convenience, and confidence
              </h2>

              <p className="mt-5 text-[14px] leading-7 text-[#a7aec4]">
                Our mission is to offer a seamless shopping journey from product
                discovery and sizing to checkout and delivery. We want every
                customer to feel confident about what they buy and excited about
                what they wear.
              </p>
            </section>
          </div>

          <section className="mt-8">
            <div className="mb-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Why Choose Us
              </div>

              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-white">
                Built for a better shopping experience
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "Quality Assurance",
                  desc: "We carefully select every piece to meet standards for comfort, durability, and finish.",
                },
                {
                  title: "Convenience",
                  desc: "Shop easily with a responsive interface, smart filters, and simple product discovery.",
                },
                {
                  title: "Customer Support",
                  desc: "Our support flow helps customers with sizing, orders, delivery, and returns.",
                },
              ].map((item) => (
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
          </section>

          <section className="mt-8 overflow-hidden rounded-[24px]">
            <SubscribeOffer />
          </section>
        </section>
      </main>

      <MainFooter />
    </>
  );
}