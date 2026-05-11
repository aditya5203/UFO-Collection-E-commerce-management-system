"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export default function EmptyCart({
  onGoToCollection,
}: {
  onGoToCollection: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className={`${panelClass} p-8 text-center sm:p-12`}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-[28px]">
        🛒
      </div>

      <h2 className="mt-5 text-[24px] font-semibold text-white">
        {t("cart.emptyTitle")}
      </h2>

      <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-7 text-[#a7aec4]">
        {t("cart.emptyDesc")}
      </p>

      <button
        type="button"
        onClick={onGoToCollection}
        className={`${primaryBtnClass} mt-6`}
      >
        {t("cart.goToCollection")}
      </button>
    </div>
  );
}