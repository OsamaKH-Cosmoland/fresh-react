import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ar } from "@/locales/ar";
import { en } from "@/locales/en";

const AVAILABLE_LOCALES = ["en", "ar"] as const;
export type Locale = (typeof AVAILABLE_LOCALES)[number];

const LOCALE_STORAGE_KEY = "naturagloss_locale";
const DEFAULT_LOCALE: Locale = "en";
const RTL_LOCALES: Set<Locale> = new Set(["ar"]);

const dictionaries: Record<Locale, typeof en> = {
  en,
  ar,
};

type TranslationDictionary = typeof en;

type TranslationKey<T extends Record<string, any> = TranslationDictionary> = {
  [K in Extract<keyof T, string>]: T[K] extends string
    ? `${K}`
    : T[K] extends Record<string, any>
    ? `${K}` | `${K}.${TranslationKey<T[K]>}`
    : never;
}[Extract<keyof T, string>];

export type AppTranslationKey = TranslationKey;

const getTranslationValue = (
  dictionary: TranslationDictionary,
  key: AppTranslationKey
): string | undefined => {
  const segments = key.split(".");
  let current: string | Record<string, unknown> | undefined = dictionary;
  for (const segment of segments) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = current[segment] as typeof current;
  }
  return typeof current === "string" ? current : undefined;
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LOCALE;
    }
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && AVAILABLE_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
    return DEFAULT_LOCALE;
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState((prev) => (prev === next ? prev : next));
  }, []);

  const isRTL = RTL_LOCALES.has(locale);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [locale, isRTL]);

  const value = useMemo(
    () => ({ locale, setLocale, isRTL }),
    [locale, setLocale, isRTL]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

export function useTranslation() {
  const { locale, isRTL } = useLocale();
  const dictionary = dictionaries[locale] ?? dictionaries.en;
  const t = useCallback(
    (key: AppTranslationKey) => getTranslationValue(dictionary, key) ?? key,
    [dictionary, locale]
  );
  return { t, locale, isRTL };
}
