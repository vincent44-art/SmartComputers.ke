
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiCreditCard, FiLock, FiSmartphone } from "react-icons/fi";
import { FaPaypal } from "react-icons/fa6";

import { apiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { buildWhatsAppUrl, formatWhatsAppMoney, WHATSAPP_NUMBER_E164 } from "@/lib/whatsapp";

import {
  createOrder,
  initiatePayment,
  validateCoupon,
  clearCart,
  type CheckoutPayload,
} from "@/lib/services";
import { useCartStore } from "@/store/useCartStore";

import { useAuthStore } from "@/store/useAuthStore";

const PAYMENT_METHODS = [
  { id: "mpesa", label: "M-Pesa", icon: FiSmartphone },
  { id: "stripe", label: "Card", icon: FiCreditCard },
  { id: "paypal", label: "PayPal", icon: FaPaypal },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, refresh } = useCartStore();
  const currency = useCurrencyStore((s) => s.currency);
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    recipient: user?.fullName ?? "",
    line1: "",
    city: "Nairobi",
    county: "",
    notes: "",
  });
  const [method, setMethod] = useState("mpesa");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const shipping = cart.subtotal >= 100000 ? 0 : 500;
  const taxable = Math.max(cart.subtotal - discount, 0);
  const tax = Math.round(taxable * 0.16);
  const total = taxable + shipping + tax;

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const applyCoupon = async () => {
    setCouponMsg("");
    try {
      const res = await validateCoupon(couponCode, cart.subtotal);
      setDiscount(res.discount);
                  {formatCurrency(res.discount, currency)}
    } catch (err) {
      setDiscount(0);
      setCouponMsg(apiErrorMessage(err));
    }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const payload: CheckoutPayload = {
        email: form.email,
        phone: form.phone,
        paymentMethod: method,
        couponCode: discount > 0 ? couponCode : undefined,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          recipient: form.recipient,
          phone: form.phone,
          line1: form.line1,
          city: form.city,
          county: form.county,
          country: "Kenya",
        },
        notes: form.notes,
      };
      const order = await createOrder(payload);
      await initiatePayment({
        orderNumber: order.orderNumber,
        method,
        phone: form.phone,
      });

      // Important: remove items from the cart so a full reload shows an empty cart.
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
              Contact & shipping
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input required type="email" placeholder="Email address" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <input required placeholder="Phone (07XXXXXXXX)" className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              <input required placeholder="Full name" className="input sm:col-span-2" value={form.recipient} onChange={(e) => update("recipient", e.target.value)} />
              <input required placeholder="Street address" className="input sm:col-span-2" value={form.line1} onChange={(e) => update("line1", e.target.value)} />
              <input required placeholder="City / Town" className="input" value={form.city} onChange={(e) => update("city", e.target.value)} />
              <input placeholder="County" className="input" value={form.county} onChange={(e) => update("county", e.target.value)} />
              <textarea placeholder="Order notes (optional)" className="input sm:col-span-2" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
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

          <section className="card p-6">
            <h2 className="text-lg font-bold text-secondary dark:text-white">
              Payment method
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition ${
                    method === m.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <m.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <FiLock className="h-3.5 w-3.5" /> Payments are encrypted and secure. In
              this demo, gateways run in simulation mode.
            </p>
          </section>
        </div>

        <aside className="card h-fit p-6">
          <h2 className="text-lg font-bold text-secondary dark:text-white">
            Order summary
          </h2>
          <div className="mt-4 space-y-3">
            {cart.items.map((line) => (
              <div key={line.id} className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  {line.product?.name} × {line.quantity}
                  {line.variantData && Object.keys(line.variantData).length > 0 && (
                    <span className="ml-1 text-xs text-slate-400">
                      ({Object.values(line.variantData).filter(Boolean).join(", ")})
                    </span>
                  )}
                </span>
                <span className="font-medium">{formatCurrency(line.lineTotal, currency)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <input
              placeholder="Coupon code"
              className="input"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button type="button" onClick={applyCoupon} className="btn-outline shrink-0">
              Apply
            </button>
          </div>
          {couponMsg && (
            <p className="mt-2 text-xs font-medium text-primary">{couponMsg}</p>
          )}

          <dl className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(cart.subtotal, currency)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>-{formatCurrency(discount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Shipping</dt>
              <dd className="font-medium">
                {shipping === 0 ? "Free" : formatCurrency(shipping)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">VAT (16%)</dt>
              <dd className="font-medium">{formatCurrency(tax, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base dark:border-slate-800">
              <dt className="font-bold text-secondary dark:text-white">Total</dt>
              <dd className="font-bold text-primary">{formatCurrency(total)}</dd>
            </div>
          </dl>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <button
            type="button"
            disabled={placing}
            className="btn-outline mt-6 w-full"
            onClick={() => {
              const itemsText = cart.items
                .map((i) => `• ${i.product?.name} x${i.quantity}`)
                .join("\n");

              const lines = [
                "Hello Smart Computers 👋",
                "I would like to place an order via WhatsApp:",
                itemsText,
                "",
                `Shipping to: ${form.recipient} — ${form.line1}, ${form.city}${form.county ? `, ${form.county}` : ""}`,
                `Phone: ${form.phone || "N/A"}`,
                "",
                `Total: ${formatWhatsAppMoney(total)}`,
                "",
                "Please confirm availability and proceed.",
              ];

              const url = buildWhatsAppUrl(lines.join("\n"), WHATSAPP_NUMBER_E164);
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            Order via WhatsApp
          </button>

          <button type="submit" disabled={placing} className="btn-primary mt-3 w-full">
            {placing ? "Placing order…" : `Pay ${formatCurrency(total)}`}
          </button>

        </aside>
      </div>
    </form>
  );
}
