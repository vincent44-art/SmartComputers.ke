"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiCheck,
  FiHeart,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiShare2,
  FiShield,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";

import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ReviewSection } from "@/components/product/ReviewSection";
import { Rating } from "@/components/ui/Rating";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn, formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/useCartStore";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import { useWishlistStore } from "@/store/useWishlistStore";

const TABS = ["Description", "Specifications", "Reviews"] as const;

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.ids.includes(product.id));
  const addRecent = useRecentlyViewedStore((s) => s.add);

  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    addRecent(product);
  }, [product, addRecent]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await add(product.id, quantity);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await add(product.id, quantity);
    router.push("/checkout");
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-primary">Home</Link>
        {product.category && (
          <>
            {" / "}
            <Link href={`/category/${product.category.slug}`} className="hover:text-primary">
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-secondary dark:text-slate-200">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images ?? []} name={product.name} />

        <div>
          {product.brand && (
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">
              {product.brand.name}
            </span>
          )}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary dark:text-white">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-4">
            <Rating value={product.ratingAvg} count={product.ratingCount} size="md" />
            <span className="text-sm text-slate-400">SKU: {product.sku}</span>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-3xl font-extrabold text-secondary dark:text-white">
              {formatCurrency(product.price, product.currency)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  {formatCurrency(product.compareAtPrice, product.currency)}
                </span>
                <span className="badge bg-danger/10 text-danger">
                  Save {product.discountPercent}%
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-slate-600 dark:text-slate-300">
            {product.shortDescription}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm">
            {product.inStock ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <FiCheck /> In stock ({product.stock} available)
              </span>
            ) : (
              <span className="font-medium text-danger">Out of stock</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="grid h-11 w-11 place-items-center text-slate-500 hover:text-primary"
                aria-label="Decrease quantity"
              >
                <FiMinus />
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="grid h-11 w-11 place-items-center text-slate-500 hover:text-primary"
                aria-label="Increase quantity"
              >
                <FiPlus />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !product.inStock}
              className="btn-primary flex-1 sm:flex-none"
            >
              <FiShoppingCart /> Add to cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="btn-secondary flex-1 sm:flex-none"
            >
              Buy now
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={cn("btn-outline h-11 w-11 rounded-full p-0", wishlisted && "text-danger")}
              aria-label="Add to wishlist"
            >
              <FiHeart className={cn("h-5 w-5", wishlisted && "fill-current")} />
            </button>
            <button
              type="button"
              onClick={share}
              className="btn-outline h-11 w-11 rounded-full p-0"
              aria-label="Share product"
            >
              <FiShare2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: FiTruck, title: "Fast delivery", desc: "24h in Nairobi" },
              { icon: FiShield, title: "Warranty", desc: product.warranty ?? "1 year" },
              { icon: FiRefreshCw, title: "Returns", desc: "7-day policy" },
            ].map((f) => (
              <div key={f.title} className="card flex items-center gap-3 p-4">
                <f.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-secondary dark:text-white">
                    {f.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-14">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "relative px-4 py-3 text-sm font-semibold transition",
                tab === t
                  ? "text-primary"
                  : "text-slate-500 hover:text-secondary dark:hover:text-slate-200"
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="py-8">
          {tab === "Description" && (
            <div className="prose max-w-none text-slate-600 dark:text-slate-300">
              <p>{product.description}</p>
            </div>
          )}
          {tab === "Specifications" && (
            <div className="max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.specs ?? {})
                    .filter(([, v]) => v)
                    .map(([key, value], i) => (
                      <tr
                        key={key}
                        className={i % 2 === 0 ? "bg-slate-50 dark:bg-slate-900" : ""}
                      >
                        <td className="w-1/3 px-4 py-3 font-medium text-secondary dark:text-slate-200">
                          {key}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {value}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "Reviews" && (
            <ReviewSection slug={product.slug} initialReviews={product.reviews ?? []} />
          )}
        </div>
      </div>

      {product.related && product.related.length > 0 && (
        <div className="mt-12">
          <SectionHeader title="Related products" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
