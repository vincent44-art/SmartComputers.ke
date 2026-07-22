"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";

import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/useCartStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import type { CartLine, ProductVariant } from "@/lib/types";
import { VariantSelector, AnimatedPrice } from "./VariantSelector";

interface CartItemCardProps {
  line: CartLine;
  compact?: boolean;
}

export function CartItemCard({ line, compact = false }: CartItemCardProps) {
  const { update, remove, changeVariant } = useCartStore();
  const currency = useCurrencyStore((s) => s.currency);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = useCallback(
    async (newQty: number) => {
      if (newQty < 1) {
        remove(line.id);
      } else {
        setIsUpdating(true);
        await update(line.id, newQty);
        setIsUpdating(false);
      }
    },
    [line.id, update, remove]
  );

  const handleVariantChange = useCallback(
    async (variant: ProductVariant) => {
      setIsUpdating(true);
      await changeVariant(line.id, variant.id);
      setIsUpdating(false);
    },
    [line.id, changeVariant]
  );

  // Use variant image if available, otherwise product thumbnail
  const imageUrl = line.variantImage || line.product?.thumbnail || null;
  const productName = line.product?.name ?? "Product";

  return (
    <motion.div
      layout
      className={`card flex gap-3 ${compact ? "p-3" : "p-4"}`}
    >
      {/* Product image */}
      <Link
        href={`/product/${line.product?.slug}`}
        className={`relative shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 ${
          compact ? "h-20 w-20" : "h-24 w-24"
        }`}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            sizes={compact ? "80px" : "96px"}
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Product name */}
        <Link
          href={`/product/${line.product?.slug}`}
          className={`font-semibold text-secondary hover:text-primary dark:text-slate-100 ${
            compact ? "text-sm" : ""
          }`}
        >
          {productName}
        </Link>

        {/* Variant attributes summary */}
        {line.variantData && Object.keys(line.variantData).length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {Object.entries(line.variantData).map(([key, val]) => (
              <span key={key}>
                <span className="font-medium capitalize">{key}:</span> {val}
              </span>
            ))}
          </div>
        )}

        {/* Variant selector */}
        {line.product && (
          <div className={`mt-1.5 ${compact ? "max-w-[240px]" : ""}`}>
            <VariantSelector
              productId={line.productId}
              currentAttrs={line.variantData}
              compact={compact}
              onVariantChange={handleVariantChange}
            />
          </div>
        )}

        {/* Quantity and price row */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleQuantityChange(line.quantity - 1)}
              disabled={isUpdating}
              className="grid h-7 w-7 place-items-center text-slate-500 hover:text-primary disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-sm font-semibold">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(line.quantity + 1)}
              disabled={isUpdating}
              className="grid h-7 w-7 place-items-center text-slate-500 hover:text-primary disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <AnimatedPrice
              price={line.lineTotal}
              currency={currency}
              className="text-sm font-bold text-secondary dark:text-white"
            />
            <button
              type="button"
              onClick={() => remove(line.id)}
              className="grid h-7 w-7 shrink-0 place-items-center text-slate-400 hover:text-danger"
              aria-label="Remove item"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

