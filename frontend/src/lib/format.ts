const DECIMAL_CURRENCIES = new Set(["USD", "EUR", "GBP"]);

export function formatCurrency(amount: number, currency = "KES"): string {
  const code = (currency || "KES").toUpperCase();

  // Use Intl.NumberFormat for correct symbol placement, decimal precision,
  // and grouping. EUR/USD/GBP use 2 decimal places; KES/TZS/UGX/AED use 0.
  // This automatically picks the correct symbol for each currency code.
  const decimals = DECIMAL_CURRENCIES.has(code) ? 2 : 0;
  const locale = code === "EUR" ? "de-DE" : "en-KE";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      // Use narrowSymbol for USD ($) instead of (US$) and EUR (€) etc.
      currencyDisplay: "narrowSymbol",
    }).format(Number(amount) || 0);
  } catch {
    // Fallback for unsupported currency codes
    const rounded = Math.round(Number(amount) || 0);
    return `${code} ${rounded.toLocaleString("en-KE")}`;
  }
}


export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
