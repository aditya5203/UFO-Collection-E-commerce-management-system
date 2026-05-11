"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export default function CartHero() {
  const { t } = useI18n();

  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
          {t("cart.yourBag")}
        </div>

        <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
          {t("cart.shoppingCart")}
        </h1>

        <p className="mt-2 text-[13px] text-[#a7aec4]">
          {t("cart.heroDesc")}
        </p>
      </div>

      <Link href="/collection" className={secondaryBtnClass}>
        {t("cart.continueShopping")}
      </Link>
    </div>
  );
}