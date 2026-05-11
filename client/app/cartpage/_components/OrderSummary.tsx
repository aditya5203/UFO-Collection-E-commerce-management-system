"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

function formatNpr(value: number) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(Number(value || 0))))}`;
}

export default function OrderSummary({
  itemsLength,
  hasStockIssue,
  discount,
  setDiscount,
  applyManualCoupon,
  isApplyingCoupon,
  appliedCouponCode,
  appliedCouponLabel,
  clearAppliedCoupon,
  couponMessage,
  subtotal,
  shippingAmount,
  discountAmount,
  total,
  authChecked,
  proceedToCheckout,
}: {
  itemsLength: number;
  hasStockIssue: boolean;
  discount: string;
  setDiscount: (value: string) => void;
  applyManualCoupon: () => void;
  isApplyingCoupon: boolean;
  appliedCouponCode: string;
  appliedCouponLabel: string;
  clearAppliedCoupon: (silent?: boolean) => void;
  couponMessage: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  authChecked: boolean;
  proceedToCheckout: () => void;
}) {
  const { t } = useI18n();

  return (
    <aside className="xl:sticky xl:top-[104px]">
      <div className={`${panelClass} p-5 sm:p-6`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              {t("cart.summary")}
            </div>

            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
              {t("cart.orderSummary")}
            </h2>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-[#a7aec4]">
            {itemsLength} {itemsLength === 1 ? t("cart.item") : t("cart.items")}
          </span>
        </div>

        {hasStockIssue ? (
          <div className="mt-5 rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
            {t("cart.stockIssue")}
          </div>
        ) : null}

        <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
          <div className="flex flex-col gap-3">
            <label htmlFor="discount-code" className="sr-only">
              {t("cart.discountCode")}
            </label>

            <input
              id="discount-code"
              value={discount}
              onChange={(e) => setDiscount(e.target.value.toUpperCase())}
              placeholder={t("cart.discountCode")}
              className="h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-white outline-none placeholder:text-[#7c86b1] transition focus:border-[#d6c7ff]"
            />

            <button
              type="button"
              onClick={applyManualCoupon}
              disabled={isApplyingCoupon}
              className={secondaryBtnClass}
            >
              {isApplyingCoupon ? t("cart.applying") : t("cart.applyCoupon")}
            </button>
          </div>

          <div className="mt-3 text-[12px] leading-5 text-[#a7aec4]">
            {t("cart.collectCouponsFrom")}{" "}
            <Link href="/discounts" className="text-white underline">
              {t("cart.discounts")}
            </Link>{" "}
            {t("cart.autoApplyHint")}
          </div>

          {appliedCouponCode ? (
            <div className="mt-4 rounded-[16px] border border-green-500/20 bg-green-500/10 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.14em] text-green-300">
                {t("cart.appliedCoupon")}
              </div>

              <div className="mt-1 text-sm font-semibold text-white">
                {appliedCouponCode}
              </div>

              {appliedCouponLabel ? (
                <div className="mt-1 text-xs text-green-200">
                  {appliedCouponLabel}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => clearAppliedCoupon(false)}
                className="mt-3 rounded-full border border-green-300/20 px-3 py-1 text-xs font-semibold text-green-100 transition hover:bg-green-500/10"
              >
                {t("cart.removeCoupon")}
              </button>
            </div>
          ) : null}

          {couponMessage ? (
            <div className="mt-4 text-[12px] text-[#a7aec4]">
              {couponMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-4 text-sm text-[#a7aec4] sm:text-[15px]">
          <div className="flex items-center justify-between gap-4">
            <span>{t("cart.subtotal")}</span>
            <span className="text-right text-white">{formatNpr(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span>{t("cart.shipping")}</span>
            <span className="text-right text-white">
              {formatNpr(shippingAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span>{t("cart.discount")}</span>
            <span className="text-right text-green-400">
              - {formatNpr(discountAmount)}
            </span>
          </div>

          <div className="h-px bg-[#26293a]" />

          <div className="flex items-center justify-between gap-4 text-[18px] font-semibold">
            <span className="text-white">{t("cart.total")}</span>
            <span className="text-right text-white">{formatNpr(total)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={proceedToCheckout}
          disabled={hasStockIssue || !authChecked}
          className={`${primaryBtnClass} mt-8 w-full justify-center`}
        >
          {hasStockIssue
            ? t("cart.fixStockIssues")
            : !authChecked
              ? t("cart.checking")
              : t("cart.proceedToCheckout")}
        </button>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ["/images/payment.png", t("cart.secure"), t("cart.payment")],
            ["/images/return.png", t("cart.easy"), t("cart.return")],
            ["/images/cod.png", t("cart.cod"), t("cart.available")],
          ].map(([icon, a, b]) => (
            <div
              key={`${a}-${b}`}
              className="rounded-[16px] border border-[#26293a] bg-[#161824] p-3 text-center"
            >
              <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                <Image
                  src={icon}
                  alt={`${a} ${b}`}
                  width={18}
                  height={18}
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="text-[12px] font-semibold text-white">{a}</div>

              <div className="text-[11px] text-[#a7aec4]">{b}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}