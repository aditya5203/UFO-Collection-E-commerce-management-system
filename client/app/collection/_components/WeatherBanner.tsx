"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";

type WeatherMood = "cold" | "mild" | "hot" | "rainy";

type WeatherCollectionContext = {
  mood: WeatherMood;
  city: string;
  titleKey: string;
  messageKey: string;
  types: string[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

export default function WeatherBanner({
  weatherContext,
  onClear,
}: {
  weatherContext: WeatherCollectionContext | null;
  onClear: () => void;
}) {
  const { t } = useI18n();

  if (!weatherContext) return null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="mt-6 overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-5 sm:p-6">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
              {t("collection.weatherBasedPicks")}
            </div>

            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white sm:text-[28px]">
              {t(weatherContext.titleKey)}
            </h2>

            <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
              {weatherContext.city !== t("collection.weather.yourCity")
                ? `${t("collection.todayIn")} ${weatherContext.city}: `
                : ""}
              {t(weatherContext.messageKey)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {weatherContext.types.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/85"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="w-fit rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            {t("collection.removeWeatherFilter")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}