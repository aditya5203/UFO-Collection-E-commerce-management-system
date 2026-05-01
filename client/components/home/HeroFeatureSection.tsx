"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import HeroRightMedia from "./HeroRightMedia";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90 sm:px-6 sm:py-3";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 sm:px-6 sm:py-3";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -36 },
  show: { opacity: 1, x: 0 },
};

function MotionButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

export default function HeroFeatureSection() {
  const router = useRouter();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
      className={`${panelClass} overflow-hidden`}
    >
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <motion.div
          variants={fadeLeft}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className="flex flex-col justify-center gap-4 p-5 sm:p-7 md:p-10 lg:p-12"
        >
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
            New Season Drop
          </div>

          <h1 className="max-w-[560px] text-[30px] font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[42px] lg:text-[52px]">
            Refined Style for Everyday Wear
          </h1>

          <p className="max-w-[500px] text-[13px] leading-7 text-[#a7aec4] sm:text-[15px]">
            Discover clothing and footwear designed for comfort, confidence, and
            effortless everyday style.
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <MotionButton
              onClick={() => router.push("/collection")}
              className={primaryBtnClass}
            >
              Shop Collection
            </MotionButton>

            <MotionButton
              onClick={() => {
                document
                  .getElementById("latest-collections")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={secondaryBtnClass}
            >
              Explore New Arrivals
            </MotionButton>
          </div>
        </motion.div>

        <HeroRightMedia />
      </div>
    </motion.div>
  );
}