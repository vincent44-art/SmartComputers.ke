"use client";

import Link from "next/link";
import { FiShoppingBag } from "react-icons/fi";
import { useState } from "react";

import { formatCurrency } from "@/lib/format";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { buildWhatsAppUrl, formatWhatsAppMoney, WHATSAPP_NUMBER_E164 } from "@/lib/whatsapp";
import { useCartStore } from "@/store/useCartStore";
import { CartRecommendations } from "@/components/recommendations/CartRecommendations";
import { CartItemCard } from "@/components/cart/CartItemCard";


export default function CartPage() {
  const { cart } = useCartStore();
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

  // Total equals subtotal — no shipping or VAT charges.
  const total = cart.subtotal;



  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-secondary dark:text-white">
        Shopping Cart
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.items.map((line) => (
            <CartItemCard key={line.id} line={line} />
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
