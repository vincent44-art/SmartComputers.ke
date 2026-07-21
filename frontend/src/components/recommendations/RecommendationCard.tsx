"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiHeart,
  FiEye,
  FiShoppingCart,
  FiZap,
  FiTruck,
  FiBarChart2,
} from "react-icons/fi";

import { cn, formatCurrency } from "@/lib/format";
import { Rating } from "@/components/ui/Rating";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { trackRecommendationAdded, trackRecommendationClick } from "@/lib/services";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  position: number;
  onQuickView?: (product: Product) => void;
  onCompare?: (product: Product) => void;
  onToast?: (message: string) => void;
}

export function RecommendationCard({
  product,
  position,
  onQuickView,
  onCompare,
  onToast,
}: Props) {
  const add = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.ids.includes(product.id));
  const [adding, setAdding] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const discount = product.discountPercent;
  const isFreeShipping = product.price >= 100000;
  const savings = product.compareAtPrice
    ? product.compareAtPrice - product.price
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || !product.inStock) return;
    setAdding(true);
    try {
      await add(product.id, 1);
      trackRecommendationAdded(product.id, position).catch(() => {});
      onToast?.(`${product.name} added to cart`);
    } catch {
      onToast?.("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleClick = () => {
    trackRecommendationClick(product.id, position).catch(() => {});
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || !product.inStock) return;
    setAdding(true);
    try {
      await add(product.id, 1);
      trackRecommendationAdded(product.id, position).catch(() => {});
      window.location.href = "/checkout";
    } catch {
      onToast?.("Failed to add to cart");
      setAdding(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -8,
        transition: { duration: 0.25, ease: "easeOut" },
      }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft transition-shadow duration-250 hover:shadow-soft-lg dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Image Container */}
      <Link
        href={`/product/${product.slug}`}
        onClick={handleClick}
        className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800"
      >
        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {discount > 0 && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="badge bg-danger text-white shadow-sm"
            >
              -{discount}%
            </motion.span>
          )}
          {product.isBestSeller && (
            <span className="badge bg-secondary text-white shadow-sm">
              ⭐ Best Seller
            </span>
          )}
          {product.isFlashSale && (
            <span className="badge bg-warning text-white shadow-sm">
              ⚡ Flash Sale
            </span>
          )}
        </div>

        {/* Top-right badges */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
          {product.ratingAvg >= 4.5 && product.ratingCount >= 10 && (
            <span className="badge bg-accent/90 text-white shadow-sm backdrop-blur-sm">
              🔥 Trending
            </span>
          )}
          {isFreeShipping && (
            <span className="badge bg-success/90 text-white shadow-sm backdrop-blur-sm">
              🚚 Free Delivery
            </span>
          )}
          {savings > 0 && (
            <span className="badge bg-primary/90 text-white shadow-sm backdrop-blur-sm">
              💰 Save {formatCurrency(savings, product.currency)}
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <motion.button
          type="button"
          aria-label="Add to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: showActions || wishlisted ? 1 : 0,
            y: showActions || wishlisted ? 0 : -10,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute right-3 bottom-3 z-20 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition-colors",
            wishlisted
              ? "bg-danger text-white"
              : "bg-white/80 text-secondary hover:bg-white dark:bg-slate-900/80 dark:text-slate-100"
          )}
        >
          <FiHeart
            className={cn("h-4 w-4", wishlisted && "fill-current")}
          />
        </motion.button>

        {/* Image */}
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        {product.thumbnail && (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className={cn(
              "object-cover transition-all duration-500 group-hover:scale-110",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        )}

        {/* Quick view overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showActions ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-semibold text-secondary shadow-lg backdrop-blur-sm transition hover:bg-white dark:bg-slate-900/90 dark:text-slate-100"
          >
            <FiEye className="h-4 w-4" /> Quick View
          </motion.button>
        </motion.div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {product.brand.name}
          </span>
        )}

        <Link
          href={`/product/${product.slug}`}
          onClick={handleClick}
          className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-secondary transition-colors hover:text-primary dark:text-slate-100"
        >
          {product.name}
        </Link>

        <div className="mt-2">
          <Rating value={product.ratingAvg} count={product.ratingCount} size="sm" />
        </div>

        {/* Stock status */}
        <p
          className={cn(
            "mt-1.5 text-[11px] font-medium",
            product.inStock
              ? "text-success"
              : "text-danger"
          )}
        >
          {product.inStock
            ? product.stock <= 5
              ? `Only ${product.stock} left`
              : "In Stock"
            : "Out of Stock"}
        </p>

        {/* Price */}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-secondary dark:text-white">
              {formatCurrency(product.price, product.currency)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(product.compareAtPrice, product.currency)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: showActions ? 1 : 1,
            y: 0,
          }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="mt-3 flex flex-col gap-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding || !product.inStock}
              className={cn(
                "relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-250",
                adding
                  ? "bg-primary/70 text-white"
                  : product.inStock
                    ? "bg-primary text-white hover:bg-primary-700 active:scale-[0.98] shadow-glow"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800"
              )}
            >
              {/* Ripple effect placeholder */}
              <motion.span
                key={adding ? "loading" : "idle"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5"
              >
                <FiShoppingCart className="h-3.5 w-3.5" />
                {adding ? "Adding..." : "Add to Cart"}
              </motion.span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={adding || !product.inStock}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold text-white transition-all duration-250 hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiZap className="h-3.5 w-3.5" />
              Buy Now
            </button>
          </div>

          {/* Compare button */}
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: showActions ? 1 : 0.6 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCompare?.(product);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-medium text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-700"
          >
            <FiBarChart2 className="h-3 w-3" />
            Compare
          </motion.button>
        </motion.div>
      </div>
    </motion.article>
  );
}

