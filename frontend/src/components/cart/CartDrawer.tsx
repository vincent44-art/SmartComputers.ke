"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { FiShoppingBag, FiX } from "react-icons/fi";

import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/useCartStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { CartItemCard } from "./CartItemCard";

export function CartDrawer() {
  const { cart, drawerOpen, setDrawer } = useCartStore();
  const currency = useCurrencyStore((s) => s.currency);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setDrawer(false)}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-soft-lg dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-lg font-bold text-secondary dark:text-white">
                <FiShoppingBag className="h-5 w-5" /> Your Cart ({cart.itemCount})
              </h2>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="btn-ghost h-9 w-9 rounded-full p-0"
                aria-label="Close cart"
              >
                <FiX className="h-5 w-5" />
              </button>
            </header>

            {cart.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <FiShoppingBag className="h-12 w-12 text-slate-300" />
                <p className="text-slate-500 dark:text-slate-400">
                  Your cart is empty.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setDrawer(false)}
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {cart.items.map((line) => (
                    <CartItemCard key={line.id} line={line} compact />
                  ))}
                </div>

                <footer className="border-t border-slate-200 p-5 dark:border-slate-800">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                    <span className="text-lg font-bold text-secondary dark:text-white">
                      {formatCurrency(cart.subtotal, currency)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/cart"
                      onClick={() => setDrawer(false)}
                      className="btn-outline w-full"
                    >
                      View cart
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setDrawer(false)}
                      className="btn-primary w-full"
                    >
                      Checkout
                    </Link>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
