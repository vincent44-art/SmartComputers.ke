"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiHeart, FiShoppingCart } from "react-icons/fi";

import { Rating } from "@/components/ui/Rating";
import { cn, formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";

export function ProductCard({ product }: { product: Product }) {
  const add = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.ids.includes(product.id));
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await add(product.id, 1);
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="group card flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          {product.thumbnail && (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          )}
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.discountPercent > 0 && (
            <span className="badge bg-danger text-white">
              -{product.discountPercent}%
            </span>
          )}
          {product.isBestSeller && (
            <span className="badge bg-secondary text-white">Best Seller</span>
          )}
          {product.isFlashSale && (
            <span className="badge bg-warning text-white">Flash Sale</span>
          )}
        </div>

        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={() => toggleWishlist(product.id)}
          className={cn(
            "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition",
            wishlisted
              ? "bg-danger text-white"
              : "bg-white/80 text-secondary hover:bg-white dark:bg-slate-900/80 dark:text-slate-100"
          )}
        >
          <FiHeart className={cn("h-4 w-4", wishlisted && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {product.brand.name}
          </span>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="mt-1 line-clamp-2 font-semibold text-secondary hover:text-primary dark:text-slate-100"
        >
          {product.name}
        </Link>

        {product.specsSummary.processor && (
          <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
            {[product.specsSummary.processor, product.specsSummary.ram, product.specsSummary.storage]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="mt-2">
          <Rating value={product.ratingAvg} count={product.ratingCount} />
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-lg font-bold text-secondary dark:text-white">
              {formatCurrency(product.price, product.currency)}
            </p>
            {product.compareAtPrice && (
              <p className="text-xs text-slate-400 line-through">
                {formatCurrency(product.compareAtPrice, product.currency)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !product.inStock}
            className="btn-primary h-10 w-10 rounded-full p-0"
            aria-label="Add to cart"
          >
            <FiShoppingCart className="h-4 w-4" />
          </button>
        </div>
        {!product.inStock && (
          <p className="mt-2 text-xs font-medium text-danger">Out of stock</p>
        )}
      </div>
    </motion.article>
  );
}
