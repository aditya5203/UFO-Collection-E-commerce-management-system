"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 sm:px-6 sm:py-3";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:px-6 sm:py-3";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

export default function CollectionHero({
  onSearchClick,
  onOpenFilters,
}: {
  onSearchClick: () => void;
  onOpenFilters: () => void;
}) {
  const { t } = useI18n();

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ duration: 0.45 }}
      className={`${panelClass} overflow-hidden`}
    >
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div className="flex flex-col justify-center">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
            {t("collection.heroEyebrow")}
          </div>

          <h1 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[58px]">
            {t("collection.heroTitle")}
          </h1>

          <p className="mt-4 max-w-[580px] text-[13px] leading-7 text-[#a7aec4] sm:text-[15px]">
            {t("collection.heroDesc")}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSearchClick}
              className={primaryBtnClass}
            >
              {t("collection.searchCollection")}
            </button>

            <button
              type="button"
              onClick={onOpenFilters}
              className={`${secondaryBtnClass} lg:hidden`}
            >
              {t("collection.openFilters")}
            </button>
          </div>
        </div>

        <div className="relative min-h-[240px] overflow-hidden rounded-[22px] border border-[#26293a] bg-[#161824] sm:min-h-[300px]">
          <Image
            src="/images/placeholder.png"
            alt="Collection banner"
            fill
            className="object-cover opacity-70"
            priority
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

          <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur">
            {t("collection.heroBadge")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}