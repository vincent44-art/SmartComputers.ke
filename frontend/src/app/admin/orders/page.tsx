"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  fetchAdminOrders,
  updateAdminOrder,
} from "@/lib/services";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "payment_received", label: "Payment Received" },
  { value: "processing", label: "Processing" },
  { value: "ready_for_dispatch", label: "Ready for Dispatch" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<string, string> = {
  pending_review: "bg-warning/10 text-warning",
  awaiting_payment: "bg-primary/10 text-primary",
  payment_received: "bg-success/10 text-success",
  processing: "bg-accent/10 text-accent",
  ready_for_dispatch: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  shipped: "bg-success/10 text-success",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
  rejected: "bg-danger/10 text-danger",
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => fetchAdminOrders({ status: filter || undefined }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateAdminOrder(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary dark:text-white">
        Orders
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`badge capitalize whitespace-nowrap ${
              filter === s.value
                ? "bg-primary text-white"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))}
            {data?.items.map((o) => (
              <tr
                key={o.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="px-4 py-3 font-medium text-secondary dark:text-white">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {o.customerName || o.email || "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {formatDate(o.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatCurrency(o.total)}
                </td>
                <td className="px-4 py-3 capitalize">
                  <span
                    className={`badge ${
                      o.paymentStatus === "paid"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {o.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge capitalize ${
                      STATUS_BADGE[o.status] ||
                      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {o.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <select
                    className="input py-1.5 text-xs capitalize"
                    value={o.status}
                    onChange={(e) =>
                      mutation.mutate({ id: o.id, status: e.target.value })
                    }
                  >
                    {STATUS_FILTERS.filter((s) => s.value).map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-400"
                  colSpan={7}
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

