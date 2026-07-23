"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

import {
  createOrder,
  clearCart,
  type CheckoutPayload,
} from "@/lib/services";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, refresh } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    customerName: user?.fullName ?? "",
    line1: "",
    city: "Nairobi",
    county: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const payload: CheckoutPayload = {
        email: form.email,
        phone: form.phone,
        customerName: form.customerName,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          recipient: form.customerName,
          phone: form.phone,
          line1: form.line1,
          city: form.city,
          county: form.county,
          country: "Kenya",
        },
        notes: form.notes,
      };
      const order = await createOrder(payload);
      await clearCart();
      await refresh();
      router.push(`/order/${order.orderNumber}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center py-16 text-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">
            Your cart is empty
          </h1>
<Link href="/" className="btn-primary mt-6">
            Shop now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={placeOrder} className="container-page py-10">
      <h1 className="text-3xl font-bold text-secondary dark:text-white">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="card p-6">
            <h2 className="text-lg font-bold text-secondary dark:text-white">
              Contact &amp; Shipping Details
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Please provide your details below. Your order will be reviewed by our team
              before any payment is requested.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                required
                type="text"
                placeholder="Full Name"
                className="input sm:col-span-2"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
              />
              <input
                required
                type="email"
                placeholder="Email Address"
                className="input"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <input
                required
                placeholder="Phone Number (07XXXXXXXX)"
                className="input"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <input
                required
                placeholder="Street Address"
                className="input sm:col-span-2"
                value={form.line1}
                onChange={(e) => update("line1", e.target.value)}
              />
              <input
                required
                placeholder="City / Town"
                className="input"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
              <input
                placeholder="County"
                className="input"
                value={form.county}
                onChange={(e) => update("county", e.target.value)}
              />
              <textarea
                placeholder="Order Notes (Optional)"
                className="input sm:col-span-2"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
            {!user && (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Checking out as a guest.{" "}
                <Link href="/login" className="font-semibold text-primary">
                  Sign in
                </Link>{" "}
                for faster checkout.
              </p>
            )}
          </section>

          <section className="card border-2 border-primary/20 bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-secondary dark:text-white">
                  No Payment Required Yet
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Your order will be reviewed by our team before payment instructions
                  are sent. You will receive an email with your order confirmation and
                  details on how to complete your purchase.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="card h-fit p-6">
          <h2 className="text-lg font-bold text-secondary dark:text-white">
            Order Summary
          </h2>
          <div className="mt-4 space-y-3">
            {cart.items.map((line) => (
              <div key={line.id} className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  {line.product?.name} x {line.quantity}
                  {line.variantData && Object.keys(line.variantData).length > 0 && (
                    <span className="ml-1 text-xs text-slate-400">
                      ({Object.values(line.variantData).filter(Boolean).join(", ")})
                    </span>
                  )}
                </span>
                <span className="font-medium">{formatCurrency(line.lineTotal)}</span>
              </div>
            ))}
          </div>

          <dl className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(cart.subtotal)}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <strong>Note:</strong> Delivery fees, taxes, and any discounts will be
              calculated by our team during the review process. You will receive a
              final invoice via email.
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <button type="submit" disabled={placing} className="btn-primary mt-6 w-full">
            {placing ? "Placing Order..." : "Place Order"}
          </button>

          <p className="mt-3 text-center text-xs text-slate-400">
            By placing this order, you agree to our{" "}
            <Link href="/terms" className="text-primary underline">
              Terms &amp; Conditions
            </Link>
          </p>
        </aside>
      </div>
    </form>
  );
}
