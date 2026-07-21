import { create } from "zustand";

import {
  addCartItem,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/services";
import type { Cart } from "@/lib/types";
import { useCurrencyStore } from "./useCurrencyStore";

interface CartState {
  cart: Cart;
  loading: boolean;
  drawerOpen: boolean;
  refresh: () => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<void>;
  update: (itemId: number, quantity: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  setDrawer: (open: boolean) => void;
}


const emptyCart: Cart = { items: [], subtotal: 0, itemCount: 0 };

export const useCartStore = create<CartState>((set) => ({
  cart: emptyCart,
  loading: false,
  drawerOpen: false,
  setDrawer: (open) => set({ drawerOpen: open }),
  // Monotonic request id to avoid race conditions when currency changes quickly.
  refresh: (() => {
    let requestId = 0;
    return async () => {
      const myId = ++requestId;
      set({ loading: true });
      try {
        const currency = useCurrencyStore.getState().currency;
        const cart = await fetchCart(currency);
        // Only apply the newest response.
        if (myId === requestId) set({ cart });
      } catch {
        if (myId === requestId) set({ cart: emptyCart });
      } finally {
        if (myId === requestId) set({ loading: false });
      }
    };
  })(),
  // Convenience: set currency then force an immediate cart refresh.


  add: async (productId, quantity = 1) => {
    const cart = await addCartItem(productId, quantity);
    set({ cart, drawerOpen: true });
  },
  update: async (itemId, quantity) => {
    const cart = await updateCartItem(itemId, quantity);
    set({ cart });
  },
  remove: async (itemId) => {
    const cart = await removeCartItem(itemId);
    set({ cart });
  },
}));
