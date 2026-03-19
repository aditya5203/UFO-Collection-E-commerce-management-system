"use client";
import * as React from "react";
import { en } from "./en";
import { np } from "./np";

type Locale = "en" | "np";
const dict = { en, np } as const;

function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

const I18nContext = React.createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    const saved = localStorage.getItem("locale");
    setLocaleState(saved === "np" ? "np" : "en");
  }, []);

  const setLocale = (l: Locale) => {
    localStorage.setItem("locale", l);
    setLocaleState(l);
  };

  const t = (key: string) => {
    const value = getByPath(dict[locale], key);
    return typeof value === "string" ? value : key; // fallback: show key
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}