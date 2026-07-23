"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { FiCheckCircle } from "react-icons/fi";

import { formatCurrency } from "@/lib/format";
import { fetchOrder } from "@/lib/services";
import { buildWhatsAppUrl, formatWhatsAppMoney, WHATSAPP_NUMBER_E164 } from "@/lib/whatsapp";


export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => fetchOrder(orderNumber),
  });

  if (isLoading) return <div className="container-page py-16" />;

  if (!order) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center py-16 text-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-white">
            Order not found
          </h1>
          <Link href="/" className="btn-primary mt-6">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page grid place-items-center py-12">
      <div className="w-full max-w-2xl">
        <div className="card p-8 text-center">
          <FiCheckCircle className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 text-2xl font-bold text-secondary dark:text-white">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Your order <span className="font-semibold text-primary">{order.orderNumber}</span> has
            been received. A confirmation has been sent to {order.email}.
          </p>
        </div>

        <div className="card mt-6 p-6">
          <h2 className="text-lg font-bold text-secondary dark:text-white">
            Order summary
          </h2>
          <div className="mt-4 space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <dl className="mt-5 space-y-2 border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
              <dd>{formatCurrency(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>-{formatCurrency(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Shipping</dt>
              <dd>{order.deliveryFee === 0 ? "Free" : formatCurrency(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">VAT</dt>
              <dd>{formatCurrency(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base dark:border-slate-800">
              <dt className="font-bold text-secondary dark:text-white">Total</dt>
              <dd className="font-bold text-primary">{formatCurrency(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Payment method:{" "}
            <span className="font-medium capitalize">{order.paymentMethod}</span> ·
            Status: <span className="font-medium capitalize">{order.status}</span>
          </p>
        </div>

        <div className="mt-6 flex flex-col items-stretch gap-3">
          <button
            type="button"
            className="btn-outline w-full"
            onClick={() => {
              const lines = [
                "Hello Smart Computers 👋",
                `I would like to ask about order ${order.orderNumber}.`,
                "",
                `Email: ${order.email}`,
                "",
                `Total: ${formatWhatsAppMoney(order.total)}`,
                "",
                "Thank you!",
              ];

              const url = buildWhatsAppUrl(lines.join("\n"), WHATSAPP_NUMBER_E164);
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            WhatsApp us about this order
          </button>

          <div className="flex justify-center gap-3">
            <Link href="/" className="btn-outline">
              Continue shopping
            </Link>
            <Link href="/account" className="btn-primary">
              View my orders
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
