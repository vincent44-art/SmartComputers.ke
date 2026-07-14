"use client";

import { useSearchParams } from "next/navigation";

import { ProductListing } from "@/components/product/ProductListing";
import type { ProductQuery } from "@/lib/services";

export function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") ?? undefined;
  const brand = params.get("brand");
  const featured = params.get("featured") === "true";
  const bestSeller = params.get("bestSeller") === "true";

  const baseQuery: ProductQuery = {
    q,
    brand: brand ? [brand] : undefined,
    featured: featured || undefined,
    bestSeller: bestSeller || undefined,
  };

  const title = q ? `Results for “${q}”` : "All products";
  return <ProductListing title={title} baseQuery={baseQuery} />;
}
