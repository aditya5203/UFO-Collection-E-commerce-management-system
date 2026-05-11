"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type AppLocale = "en" | "np";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

const containerClass =
  "mx-auto w-full max-w-[760px] px-4 py-10 sm:px-6 lg:px-8";

const panelClass =
  "relative overflow-hidden rounded-[30px] border border-[#26293a] bg-[#11121a]/95 shadow-[0_25px_90px_rgba(0,0,0,0.5)] backdrop-blur";

const languages: Array<{
  locale: AppLocale;
  label: string;
  nativeLabel: string;
  description: string;
  flag: string;
}> = [
  {
    locale: "en",
    label: "English",
    nativeLabel: "English",
    description: "Use UFO Collection in English.",
    flag: "🇬🇧",
  },
  {
    locale: "np",
    label: "Nepali",
    nativeLabel: "नेपाली",
    description: "UFO Collection लाई नेपाली भाषामा प्रयोग गर्नुहोस्।",
    flag: "🇳🇵",
  },
];

export default function LanguagePage() {
  const router = useRouter();
  const { locale, setLocale } = useI18n();

  const [selected, setSelected] = React.useState<AppLocale>(
    locale === "np" ? "np" : "en"
  );

  const [toast, setToast] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setSelected(locale === "np" ? "np" : "en");
  }, [locale]);

  const handleLanguageChange = (nextLocale: AppLocale) => {
    if (saving) return;

    setSaving(true);
    setSelected(nextLocale);
    setLocale(nextLocale);

    setToast(
      nextLocale === "np"
        ? "भाषा नेपालीमा परिवर्तन भयो।"
        : "Language changed to English."
    );

    window.setTimeout(() => {
      router.push("/homepage");
      router.refresh();
    }, 850);
  };

  return (
    <>
      <CartHeader backHref="/profile" />

      <main className={shellClass}>
        <div className={containerClass}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8 text-center"
          >
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Preferences
            </div>

            <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.045em] text-white sm:text-[44px]">
              Language / भाषा
            </h1>

            <p className="mx-auto mt-3 max-w-[520px] text-[13px] leading-6 text-[#a7aec4]">
              Choose your preferred interface language. Your choice will be
              saved for future visits.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className={`${panelClass} p-5 sm:p-8`}
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#d6c7ff]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#8b5cf6]/10 blur-3xl" />

            <div className="relative grid gap-4">
              {languages.map((item, index) => {
                const active = selected === item.locale;

                return (
                  <motion.button
                    key={item.locale}
                    type="button"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: 0.12 + index * 0.08,
                    }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageChange(item.locale)}
                    disabled={saving}
                    className={`group relative overflow-hidden rounded-[24px] border px-5 py-5 text-left transition-all duration-300 sm:px-6 ${
                      active
                        ? "border-[#d6c7ff] bg-gradient-to-br from-[#222640] via-[#171928] to-[#11121a] shadow-[0_18px_55px_rgba(0,0,0,0.45)]"
                        : "border-[#26293a] bg-[#161824] hover:border-[#4a506b] hover:bg-white/[0.055]"
                    } ${saving ? "cursor-not-allowed opacity-90" : ""}`}
                  >
                    {active ? (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,199,255,0.16),transparent_40%)]" />
                    ) : null}

                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl shadow-inner ${
                            active
                              ? "border-[#d6c7ff]/50 bg-white/10"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          {item.flag}
                        </div>

                        <div>
                          <div className="text-[17px] font-semibold text-white">
                            {item.nativeLabel}
                          </div>

                          <div className="mt-1 text-[12px] font-medium uppercase tracking-[0.16em] text-[#7f879d]">
                            {item.label}
                          </div>

                          <div className="mt-2 text-[13px] leading-5 text-[#a7aec4]">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                          active
                            ? "border-[#d6c7ff] bg-[#d6c7ff] text-[#11121a]"
                            : "border-white/15 text-transparent group-hover:border-white/30"
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="rounded-full border border-white/15 bg-white/5 px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange(selected)}
                disabled={saving}
                className="rounded-full border border-[#d6c7ff]/40 bg-[#d6c7ff] px-8 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#11121a] shadow-[0_12px_35px_rgba(214,199,255,0.18)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {toast ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 rounded-2xl border border-[#d6c7ff]/30 bg-[#151724]/95 px-5 py-4 text-center text-sm font-semibold text-white shadow-[0_20px_70px_rgba(0,0,0,0.5)] backdrop-blur"
            >
              {toast}

              <div className="mt-1 text-xs font-medium text-[#a7aec4]">
                Redirecting to homepage...
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <MainFooter />
    </>
  );
}