"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo } from "react";
import { FiChevronDown } from "react-icons/fi";

import { fetchProductVariants } from "@/lib/services";
import type { ProductVariant, VariantAttributes } from "@/lib/types";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatCurrency } from "@/lib/format";

/** Extract unique options for each attribute across all variants. */
function extractOptions(
  variants: ProductVariant[],
  currentAttrs: VariantAttributes
): {
  attributeKeys: string[];
  optionsByKey: Record<string, { value: string; variant: ProductVariant | null; inStock: boolean }[]>;
} {
  const keys = new Set<string>();
  variants.forEach((v) => {
    if (v.attributes) Object.keys(v.attributes).forEach((k) => keys.add(k));
  });
  const attributeKeys = Array.from(keys).sort();

  const optionsByKey: Record<string, { value: string; variant: ProductVariant | null; inStock: boolean }[]> = {};

  for (const key of attributeKeys) {
    const seen = new Set<string>();
    const opts: { value: string; variant: ProductVariant | null; inStock: boolean }[] = [];

    for (const v of variants) {
      const val = v.attributes?.[key];
      if (!val || seen.has(val)) continue;
      seen.add(val);

      // Determine if this attribute value leads to an in-stock variant
      // by checking if any variant with this attribute value is in stock
      const inStock = variants.some(
        (vv) => vv.attributes?.[key] === val && vv.inStock
      );

      // Find the exact variant matching current selection + this value
      const exactMatch = variants.find((vv) => {
        if (vv.attributes?.[key] !== val) return false;
        return Object.entries(currentAttrs).every(([ak, av]) => {
          if (ak === key) return true; // skip the one we're changing
          return vv.attributes?.[ak] === av;
        });
      });

      opts.push({
        value: val,
        variant: exactMatch ?? null,
        inStock: inStock || (exactMatch?.inStock ?? false),
      });
    }

    // Sort: in-stock first, then alphabetically
    opts.sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      return a.value.localeCompare(b.value);
    });

    optionsByKey[key] = opts;
  }

  return { attributeKeys, optionsByKey };
}

interface VariantSelectorProps {
  productId: number;
  currentAttrs: VariantAttributes;
  compact?: boolean;
  onVariantChange: (variant: ProductVariant) => void;
}

export function VariantSelector({
  productId,
  currentAttrs,
  compact = false,
  onVariantChange,
}: VariantSelectorProps) {
  const currency = useCurrencyStore((s) => s.currency);

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["product-variants", productId, currency],
    queryFn: () => fetchProductVariants(productId, currency),
    staleTime: 30_000,
  });

  const handleAttributeChange = useCallback(
    (attrKey: string, value: string) => {
      // Build the desired attribute combination
      const desired = { ...currentAttrs, [attrKey]: value };

      // Find the matching variant
      const match = variants.find((v) => {
        return (
          v.attributes &&
          Object.entries(desired).every(
            ([k, v2]) => v.attributes[k] === v2
          )
        );
      });

      if (match && match.inStock) {
        onVariantChange(match);
      }
    },
    [currentAttrs, variants, onVariantChange]
  );

  const { attributeKeys, optionsByKey } = useMemo(
    () => extractOptions(variants, currentAttrs),
    [variants, currentAttrs]
  );

  // Color swatch colors (map color names to tailwind/hex)
  const colorMap: Record<string, string> = {
    silver: "#C0C0C0",
    black: "#000000",
    "space black": "#1C1C1E",
    "space gray": "#4A4A4A",
    midnight: "#1E293B",
    starlight: "#F5F5DC",
    graphite: "#36454F",
    blue: "#3B82F6",
    gray: "#6B7280",
    white: "#FFFFFF",
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-8 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="h-8 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (variants.length === 0) return null;

  const attrLabels: Record<string, string> = {
    ram: "RAM",
    storage: "Storage",
    processor: "Processor",
    color: "Color",
  };

  return (
    <div className={`space-y-2 ${compact ? "text-xs" : "text-sm"}`}>
      {attributeKeys.map((key) => {
        const options = optionsByKey[key] ?? [];
        const currentValue = currentAttrs[key] ?? "";
        const label = attrLabels[key] ?? key.charAt(0).toUpperCase() + key.slice(1);

        // Color attribute uses pill/swatch UI, others use dropdowns
        const isColor = key === "color";

        return (
          <div key={key} className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </label>

            {isColor ? (
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => {
                  const isSelected = currentValue === opt.value;
                  const swatchColor = colorMap[opt.value.toLowerCase()] ?? "#CBD5E1";

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!opt.inStock}
                      onClick={() => handleAttributeChange(key, opt.value)}
                      title={`${opt.value}${!opt.inStock ? " (Out of Stock)" : ""}`}
                      className={`
                        relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium
                        transition-all duration-150
                        ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                        }
                        ${!opt.inStock ? "cursor-not-allowed opacity-40 line-through" : "cursor-pointer"}
                      `}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: swatchColor }}
                      />
                      {opt.value}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={currentValue}
                  onChange={(e) => handleAttributeChange(key, e.target.value)}
                  className={`
                    w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm
                    font-medium text-secondary transition-all
                    focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                    dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100
                    ${compact ? "text-xs py-1.5" : ""}
                  `}
                >
                  {options.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={!opt.inStock}
                    >
                      {opt.value}
                      {!opt.inStock ? " (Out of Stock)" : ""}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Animated price display that smoothly transitions between values */
export function AnimatedPrice({
  price,
  currency,
  className = "",
}: {
  price: number;
  currency: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={price}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-block"
        >
          {formatCurrency(price, currency)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

