"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../../lib/i18n/I18nProvider";

export default function LanguagePage() {
  const router = useRouter();
  const { locale, setLocale } = useI18n();

  return (
    <div className="min-h-screen bg-[#050611] text-white px-4 py-10">
      <div className="mx-auto max-w-[520px] rounded-xl border border-[#22253a] bg-[#101223] p-6">
        <h1 className="text-xl font-semibold">Language / भाषा</h1>

        <div className="mt-5 grid gap-3">
          <button
            onClick={() => setLocale("en")}
            className={`rounded-xl border px-4 py-4 text-left ${
              locale === "en"
                ? "border-[#c9b9ff] bg-[#15182a]"
                : "border-[#23253a] bg-[#0c0e1c] hover:bg-[#12142a]"
            }`}
          >
            <div className="font-semibold">English</div>
            <div className="text-[12px] text-[#8b90ad]">Default</div>
          </button>

          <button
            onClick={() => setLocale("np")}
            className={`rounded-xl border px-4 py-4 text-left ${
              locale === "np"
                ? "border-[#c9b9ff] bg-[#15182a]"
                : "border-[#23253a] bg-[#0c0e1c] hover:bg-[#12142a]"
            }`}
          >
            <div className="font-semibold">नेपाली</div>
            <div className="text-[12px] text-[#8b90ad]">Nepali interface</div>
          </button>
        </div>

        <button
          onClick={() => router.back()}
          className="mt-6 rounded-full border border-[#23253a] px-6 py-2 text-sm hover:bg-white/10"
        >
          Back
        </button>
      </div>
    </div>
  );
}