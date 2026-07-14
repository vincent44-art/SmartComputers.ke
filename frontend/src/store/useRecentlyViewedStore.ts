import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Product } from "@/lib/types";

interface RecentlyViewedState {
  products: Product[];
  add: (product: Product) => void;
}

const MAX_ITEMS = 8;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      products: [],
      add: (product) =>
        set((state) => {
          const filtered = state.products.filter((p) => p.id !== product.id);
          return { products: [product, ...filtered].slice(0, MAX_ITEMS) };
        }),
    }),
    { name: "sc-recently-viewed" }
  )
);
