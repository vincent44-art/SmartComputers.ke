"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { FiHeart } from "react-icons/fi";

import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { fetchProducts } from "@/lib/services";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useWishlistStore } from "@/store/useWishlistStore";


export default function WishlistPage() {
  const ids = useWishlistStore((s) => s.ids);

  // Wishlist stores ids client-side; fetch a broad page and filter by id.
  const results = useQueries({
    queries: [
      {
        queryKey: ["wishlist-products"],
        queryFn: () => fetchProducts({ perPage: 60, currency: useCurrencyStore.getState().currency }),

        enabled: ids.length > 0,
      },
    ],
  });

  const all = results[0]?.data?.items ?? [];
  const loading = results[0]?.isLoading;
  const products = all.filter((p) => ids.includes(p.id));

  if (ids.length === 0) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center py-16 text-center">
        <div>
          <FiHeart className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold text-secondary dark:text-white">
            Your wishlist is empty
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Save products you love to find them here later.
          </p>
          <Link href="/" className="btn-primary mt-6">
            Explore products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-secondary dark:text-white">
        My Wishlist
      </h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: ids.length }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
    </div>
  );
}
