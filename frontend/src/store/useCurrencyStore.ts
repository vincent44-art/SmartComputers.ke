import { create } from "zustand";

export type CurrencyCode =
  | "KES"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "UGX"
  | "TZS";

const STORAGE_KEY = "sc_currency";
const SUPPORTED: CurrencyCode[] = ["KES", "USD", "EUR", "GBP", "AED", "UGX", "TZS"];


function getInitialCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "KES";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored as CurrencyCode)) return stored as CurrencyCode;
  return "KES";
}

export const useCurrencyStore = create<{
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
}>((set) => ({
  currency: getInitialCurrency(),
  setCurrency: (currency) => {
    set({ currency });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, currency);

      // Persist also in a cookie so backend can optionally use it.
      // 7 days expiry.
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `sc_currency=${encodeURIComponent(
        currency
      )}; expires=${expires}; path=/; SameSite=Lax`;
    }
  },
}));


