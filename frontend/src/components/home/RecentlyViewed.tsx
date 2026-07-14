"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";

import { ProductCarousel } from "./ProductCarousel";

export function RecentlyViewed() {
  const products = useRecentlyViewedStore((s) => s.products);
  if (products.length === 0) return null;
  return (
    <section className="container-page py-8">
      <SectionHeader title="Recently viewed" />
      <ProductCarousel products={products} />
    </section>
  );
}
