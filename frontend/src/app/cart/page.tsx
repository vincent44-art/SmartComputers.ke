"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { useState } from "react";

import { formatCurrency } from "@/lib/format";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { buildWhatsAppUrl, formatWhatsAppMoney, WHATSAPP_NUMBER_E164 } from "@/lib/whatsapp";
import { useCartStore } from "@/store/useCartStore";
import { CartRecommendations } from "@/components/recommendations/CartRecommendations";


export default function CartPage() {
  const { cart, update, remove } = useCartStore();
  const [showRecommendations, setShowRecommendations] = useState(true);

  const currency = useCurrencyStore((s) => s.currency);


  if (cart.items.length === 0) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center py-16">
        <div className="text-center">
          <FiShoppingBag className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold text-secondary dark:text-white">
            Your cart is empty
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Discover premium tech and add your favourites.
          </p>
          <Link href="/" className="btn-primary mt-6">
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  // Avoid frontend currency calculations. Backend should provide converted
  // totals. Until backend payload includes shipping/tax/total, fall back to
  // displaying only backend-converted subtotal/line totals.
  const shipping = cart.subtotal >= 100000 ? 0 : 500;
  const tax = Math.round((cart.subtotal - 0) * 0.16);
  const total = cart.subtotal + shipping + tax;



  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-secondary dark:text-white">
        Shopping Cart
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.items.map((line) => (
            <div key={line.id} className="card flex gap-4 p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {line.product?.thumbnail && (
                  <Image
                    src={line.product.thumbnail}
                    alt={line.product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <Link
                  href={`/product/${line.product?.slug}`}
                  className="font-semibold text-secondary hover:text-primary dark:text-slate-100"
                >
                  {line.product?.name}
                </Link>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatCurrency(line.product?.price ?? 0)} each
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => update(line.id, line.quantity - 1)}
                      className="grid h-8 w-8 place-items-center text-slate-500 hover:text-primary"
                      aria-label="Decrease"
                    >
                      <FiMinus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => update(line.id, line.quantity + 1)}
                      className="grid h-8 w-8 place-items-center text-slate-500 hover:text-primary"
                      aria-label="Increase"
                    >
                      <FiPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-bold text-secondary dark:text-white">
                    {formatCurrency(line.lineTotal)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(line.id)}
                className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 hover:text-danger"
                aria-label="Remove"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="card h-fit p-6">
          <h2 className="text-lg font-bold text-secondary dark:text-white">
            Order summary
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(cart.subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Shipping</dt>
              <dd className="font-medium">
                {shipping === 0 ? "Free" : formatCurrency(shipping, currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">VAT (16%)</dt>
              <dd className="font-medium">{formatCurrency(tax, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base dark:border-slate-800">
              <dt className="font-bold text-secondary dark:text-white">Total</dt>
              <dd className="font-bold text-primary">{formatCurrency(total, currency)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              const itemsText = cart.items
                .map((i) => `• ${i.product?.name} x${i.quantity}`)
                .join("\n");

              const lines = [
                "Hello Smart Computers 👋",
                "I would like to order the following items:",
                itemsText,
                "",
                `Total: ${formatWhatsAppMoney(total)}`,
                "",
                "Please confirm availability and delivery details.",
              ];

              const url = buildWhatsAppUrl(lines.join("\n"), WHATSAPP_NUMBER_E164);
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            className="btn-outline mt-6 w-full"
          >
            Order via WhatsApp
          </button>

          <Link href="/checkout" className="btn-primary mt-3 w-full">
            Proceed to checkout
          </Link>

          <Link href="/" className="btn-ghost mt-3 w-full">
            Continue shopping
          </Link>

        </div>
      </div>

      {/* You May Also Like - Recommendation Section */}
      <CartRecommendations
        visible={showRecommendations}
        onClose={() => setShowRecommendations(false)}
      />
    </div>
  );
}
