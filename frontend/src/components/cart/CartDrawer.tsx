"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiX } from "react-icons/fi";

import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/useCartStore";

export function CartDrawer() {
  const { cart, drawerOpen, setDrawer, update, remove } = useCartStore();

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
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {cart.items.map((line) => (
                    <div key={line.id} className="flex gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {line.product?.thumbnail && (
                          <Image
                            src={line.product.thumbnail}
                            alt={line.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="line-clamp-2 text-sm font-semibold text-secondary dark:text-slate-100">
                          {line.product?.name}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {formatCurrency(line.lineTotal)}
                        </p>
                        <div className="mt-auto flex items-center gap-2">
                          <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => update(line.id, line.quantity - 1)}
                              className="grid h-7 w-7 place-items-center text-slate-500 hover:text-primary"
                              aria-label="Decrease quantity"
                            >
                              <FiMinus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => update(line.id, line.quantity + 1)}
                              className="grid h-7 w-7 place-items-center text-slate-500 hover:text-primary"
                              aria-label="Increase quantity"
                            >
                              <FiPlus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(line.id)}
                            className="grid h-7 w-7 place-items-center text-slate-400 hover:text-danger"
                            aria-label="Remove item"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <footer className="border-t border-slate-200 p-5 dark:border-slate-800">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                    <span className="text-lg font-bold text-secondary dark:text-white">
                      {formatCurrency(cart.subtotal)}
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
