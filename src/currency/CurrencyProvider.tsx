import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BASE_CURRENCY, type SupportedCurrency } from "./currencyConfig";
import { isSupportedCurrency } from "./currencyUtils";

const STORAGE_KEY = "naturagloss_currency";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  setCurrency: (code: SupportedCurrency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const getStoredCurrency = (): SupportedCurrency => {
  if (typeof window === "undefined") return BASE_CURRENCY;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && isSupportedCurrency(stored)) {
    return stored;
  }
  const language = navigator.language?.toLowerCase() ?? "";
  if (language.includes("sv")) return "SEK";
  if (language.includes("de") || language.includes("fr") || language.includes("it")) {
    return "EUR";
  }
  return BASE_CURRENCY;
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => getStoredCurrency());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  const setCurrency = useCallback((code: SupportedCurrency) => {
    setCurrencyState(code);
  }, []);

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
    }),
    [currency, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
