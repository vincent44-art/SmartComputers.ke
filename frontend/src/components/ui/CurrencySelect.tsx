"use client";

import { useEffect, useMemo, useState } from "react";

import { useCurrencyStore, type CurrencyCode } from "@/store/useCurrencyStore";
import { useCartStore } from "@/store/useCartStore";


const OPTIONS: Array<{ code: CurrencyCode; label: string }> = [
  { code: "KES", label: "KSh" },
  { code: "USD", label: "$" },
  { code: "UGX", label: "USh" },
  { code: "TZS", label: "TSh" },
];




export function CurrencySelect() {
  const { currency, setCurrency } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);
  const [updating, setUpdating] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);


  // Avoid hydration mismatch if localStorage preference is applied.
  const value = useMemo(() => currency, [currency]);


  if (!mounted) {
    return (
      <div className="h-9 rounded-full border border-slate-200 bg-white/60 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400" />
    );
  }


  return (
    <label className="flex items-center gap-2">

      <span className="sr-only">Currency</span>
      <select
        value={value}
        disabled={updating}
        onChange={(e) => {

          const next = e.target.value as CurrencyCode;
          if (next === currency) return;

          // Persist selection (localStorage + cookie) via store.
          // Then hard reload so the entire shopping session (cart/checkout/orders)
          // consistently uses a single active currency.

          setUpdating(true);
          setCurrency(next);

          // Required flow: save selection -> reload -> refetch converted prices.
          window.location.reload();

        }}





        className="h-9 rounded-full border border-slate-200 bg-white/60 px-3 text-sm font-medium text-secondary outline-none transition focus:border-primary/50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
        aria-label="Select currency"
      >
        {OPTIONS.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}


