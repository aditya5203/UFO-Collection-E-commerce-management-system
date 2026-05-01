"use client";

import * as React from "react";
import { motion } from "framer-motion";

const containerClass = "mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const services = [
  {
    icon: "🔁",
    title: "Easy Exchange Policy",
    text: "Enjoy a smooth exchange process for eligible products with clear and simple steps.",
  },
  {
    icon: "📦",
    title: "7 Days Return Policy",
    text: "Need a different fit? Return eligible items within 7 days with confidence.",
  },
  {
    icon: "🎧",
    title: "Best Customer Support",
    text: "Our support team is ready to help with orders, sizing, and product questions.",
  },
];

export default function ServiceCards() {
  return (
    <section className="py-8 sm:py-10">
      <div className={containerClass}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
        >
          {services.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className={`${panelClass} p-5 text-center transition duration-300 sm:p-6`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#3a3f58] bg-white/5 text-[20px]">
                {item.icon}
              </div>

              <div className="mt-4 text-[15px] font-semibold text-white">
                {item.title}
              </div>

              <div className="mx-auto mt-2 max-w-[280px] text-[13px] leading-7 text-[#a7aec4]">
                {item.text}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}