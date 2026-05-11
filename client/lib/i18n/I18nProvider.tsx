"use client";

import * as React from "react";
import { en } from "./en";
import { np } from "./np";

type Locale = "en" | "np";

const LANGUAGE_STORAGE_KEY = "ufo_locale";

const dict = { en, np } as const;

function getByPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }

      return undefined;
    }, obj);
}

const I18nContext = React.createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    setLocaleState(saved === "np" ? "np" : "en");
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, l);
    setLocaleState(l);

    window.dispatchEvent(
      new CustomEvent("ufo_locale_changed", {
        detail: { locale: l },
      })
    );
  }, []);

  const t = React.useCallback(
    (key: string) => {
      const value = getByPath(dict[locale], key);
      return typeof value === "string" ? value : key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);

  if (!ctx) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return ctx;
}