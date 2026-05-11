"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";

type SortValue = "low-high" | "high-low" | "newest";
type ToastType = "success" | "error" | "info";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:px-6 sm:py-3";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

export default function CollectionControls({
  search,
  setSearch,
  searchRef,
  sortValue,
  setSortValue,
  activeFiltersCount,
  voiceSupported,
  listening,
  lastHeard,
  onStartListening,
  onOpenFilters,
  onClearFilters,
  onClearWeather,
  hasWeatherContext,
  showToast,
}: {
  search: string;
  setSearch: (value: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  sortValue: SortValue;
  setSortValue: (value: SortValue) => void;
  activeFiltersCount: number;
  voiceSupported: boolean;
  listening: boolean;
  lastHeard: string;
  onStartListening: () => void;
  onOpenFilters: () => void;
  onClearFilters: () => void;
  onClearWeather: () => void;
  hasWeatherContext: boolean;
  showToast: (message: string, type?: ToastType) => void;
}) {
  const { t } = useI18n();

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ duration: 0.45, delay: 0.08 }}
      className={`mt-6 ${panelClass} p-4 sm:mt-8 sm:p-5`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[20px] font-semibold tracking-[-0.02em] text-white sm:text-[24px]">
            {t("collection.controlsTitle")}
          </div>

          <div className="mt-1 text-[12px] text-[#a7aec4] sm:text-[13px]">
            {t("collection.controlsDesc")}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenFilters}
            className={`${secondaryBtnClass} lg:hidden`}
          >
            {t("collection.filters")}{" "}
            {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
          </button>

          <button
            type="button"
            onClick={onStartListening}
            disabled={!voiceSupported}
            className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 ${
              !voiceSupported ? "cursor-not-allowed opacity-50" : ""
            }`}
            title={
              voiceSupported
                ? `Say: "black hoodie", "women jacket", "t-shirt men", "clear"`
                : t("collection.voiceNotSupportedShort")
            }
          >
            <Image
              src="/images/voice.png"
              alt="Voice search"
              width={16}
              height={16}
              className={`h-4 w-4 object-contain brightness-0 invert ${
                listening ? "animate-pulse" : ""
              }`}
            />

            {listening ? t("collection.listening") : t("collection.voice")}
          </button>

          <label htmlFor="sort" className="sr-only">
            {t("collection.sortProducts")}
          </label>

          <select
            id="sort"
            aria-label={t("collection.sortProducts")}
            className="h-[42px] min-w-[190px] rounded-full border border-white/15 bg-[#0d0f17] px-4 text-[12px] text-[#f5f7fb] outline-none focus:border-[#d6c7ff]"
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value as SortValue)}
          >
            <option value="low-high">{t("collection.priceLowHigh")}</option>
            <option value="high-low">{t("collection.priceHighLow")}</option>
            <option value="newest">{t("collection.newestFirst")}</option>
          </select>

          {activeFiltersCount > 0 || hasWeatherContext ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-500/15"
            >
              {t("collection.clear")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            {t("nav.search")}
          </label>

          <input
            id="search"
            ref={searchRef}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim()) onClearWeather();
            }}
            placeholder={t("collection.searchPlaceholder")}
            className="h-[50px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
          />
        </div>

        {search.trim() ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              showToast(t("collection.searchCleared"), "info");
            }}
            className={secondaryBtnClass}
          >
            {t("collection.clearSearch")}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-[#a7aec4]">
        {voiceSupported ? (
          <>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {t("collection.try")}:{" "}
              <span className="text-[#f5f7fb]">black hoodie</span>,{" "}
              <span className="text-[#f5f7fb]">women jacket</span>,{" "}
              <span className="text-[#f5f7fb]">boys shorts</span>,{" "}
              <span className="text-[#f5f7fb]">clear</span>
            </span>

            {lastHeard ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {t("collection.heard")}:{" "}
                <span className="text-[#f5f7fb]">{lastHeard}</span>
              </span>
            ) : null}
          </>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            {t("collection.voiceNotSupportedShort")}
          </span>
        )}
      </div>
    </motion.div>
  );
}