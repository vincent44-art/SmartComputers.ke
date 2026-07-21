const SYMBOLS: Record<string, string> = {
  KES: "KSh",
  USD: "$",
  TZS: "TSh",
  UGX: "USh",
};

export function formatCurrency(amount: number, currency = "KES"): string {
  const code = (currency || "KES").toUpperCase();
  const symbol = SYMBOLS[code] ?? code;
  const rounded = Math.round(Number(amount) || 0);

  // Keep formatting stable across browsers and enforce required symbols.
  // Note: we intentionally avoid Intl currency formatting because it
  // produces different symbols for KES/TZS/UGX.
  return `${symbol} ${rounded.toLocaleString("en-KE")}`;
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
