import { create } from "zustand";

import {
  addCartItem,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/services";
import type { Cart } from "@/lib/types";

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
  refresh: async () => {
    set({ loading: true });
    try {
      const cart = await fetchCart();
      set({ cart });
    } catch {
      set({ cart: emptyCart });
    } finally {
      set({ loading: false });
    }
  },
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
