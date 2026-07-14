"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { fetchAdminOrders, updateAdminOrder } from "@/lib/services";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

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
        <button
          onClick={() => setFilter("")}
          className={`badge ${!filter ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800"}`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`badge capitalize ${filter === s ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={5}>
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
                  {o.orderNumber}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {formatDate(o.createdAt)}
                </td>
                <td className="px-4 py-3">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3 capitalize">
                  <span
                    className={
                      o.paymentStatus === "paid"
                        ? "badge bg-success/10 text-success"
                        : "badge bg-warning/10 text-warning"
                    }
                  >
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="input py-1.5 text-xs capitalize"
                    value={o.status}
                    onChange={(e) =>
                      mutation.mutate({ id: o.id, status: e.target.value })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
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
                  colSpan={5}
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
