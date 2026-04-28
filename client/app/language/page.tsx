"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[720px] px-4 py-10 sm:px-6 lg:px-8";

const panelClass =
  "rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur";

export default function LanguagePage() {
  const router = useRouter();
  const { locale, setLocale } = useI18n();

  return (
    <>
      <CartHeader />

      <main className={shellClass}>
        <div className={containerClass}>
          {/* HEADER */}
          <div className="mb-8 text-center">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Preferences
            </div>

            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.04em] text-white sm:text-[40px]">
              Language / भाषा
            </h1>

            <p className="mt-2 text-[13px] text-[#a7aec4]">
              Choose your preferred language for the interface
            </p>
          </div>

          {/* CARD */}
          <div className={`${panelClass} p-6 sm:p-8`}>
            <div className="grid gap-4">
              {/* ENGLISH */}
              <button
                onClick={() => setLocale("en")}
                className={`group relative overflow-hidden rounded-[20px] border px-5 py-5 text-left transition-all duration-300 ${
                  locale === "en"
                    ? "border-[#d6c7ff] bg-gradient-to-br from-[#1c1f33] to-[#11121a] shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
                    : "border-[#26293a] bg-[#161824] hover:border-[#4a506b] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-semibold text-white">
                      English
                    </div>
                    <div className="mt-1 text-[12px] text-[#a7aec4]">
                      Default language
                    </div>
                  </div>

                  {locale === "en" && (
                    <span className="text-[#d6c7ff] text-sm font-semibold">
                      ✓
                    </span>
                  )}
                </div>
              </button>

              {/* NEPALI */}
              <button
                onClick={() => setLocale("np")}
                className={`group relative overflow-hidden rounded-[20px] border px-5 py-5 text-left transition-all duration-300 ${
                  locale === "np"
                    ? "border-[#d6c7ff] bg-gradient-to-br from-[#1c1f33] to-[#11121a] shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
                    : "border-[#26293a] bg-[#161824] hover:border-[#4a506b] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-semibold text-white">
                      नेपाली
                    </div>
                    <div className="mt-1 text-[12px] text-[#a7aec4]">
                      Nepali interface
                    </div>
                  </div>

                  {locale === "np" && (
                    <span className="text-[#d6c7ff] text-sm font-semibold">
                      ✓
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* BACK BUTTON */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => router.back()}
                className="rounded-full border border-white/15 bg-white/5 px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </main>

      <MainFooter />
    </>
  );
}