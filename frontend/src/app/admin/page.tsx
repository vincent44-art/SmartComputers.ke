"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FiBox,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { fetchAdminAnalytics } from "@/lib/services";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
  });

  const maxRevenue = Math.max(
    1,
    ...(data?.revenueSeries7d.map((d) => d.revenue) ?? [1])
  );

  const cards = [
    {
      label: "Revenue",
      value: data ? formatCurrency(data.totals.revenue) : "—",
      icon: FiDollarSign,
      color: "text-success",
    },
    {
      label: "Orders",
      value: data?.totals.orders ?? "—",
      icon: FiShoppingBag,
      color: "text-primary",
    },
    {
      label: "Customers",
      value: data?.totals.customers ?? "—",
      icon: FiUsers,
      color: "text-accent",
    },
    {
      label: "Products",
      value: data?.totals.products ?? "—",
      icon: FiBox,
      color: "text-warning",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary dark:text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Store performance at a glance
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {c.label}
              </span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-24" />
            ) : (
              <p className="mt-2 text-2xl font-bold text-secondary dark:text-white">
                {c.value}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Revenue (last 7 days)
          </h2>
          <div className="mt-6 flex h-48 items-end gap-2">
            {(data?.revenueSeries7d ?? []).map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-primary/80 transition-all"
                  style={{
                    height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%`,
                  }}
                  title={formatCurrency(d.revenue)}
                />
                <span className="text-[10px] text-slate-400">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Recent orders
          </h2>
          <div className="mt-4 space-y-3">
            {(data?.recentOrders ?? []).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0 dark:border-slate-800"
              >
                <div>
                  <p className="font-medium text-secondary dark:text-white">
                    {o.orderNumber}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(o.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-secondary dark:text-white">
                    {formatCurrency(o.total)}
                  </p>
                  <span className="text-xs capitalize text-slate-400">
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
            {data && data.recentOrders.length === 0 && (
              <p className="text-sm text-slate-400">No orders yet.</p>
            )}
          </div>
        </div>
      </div>

      {data && data.lowStockProducts.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Low stock alerts
          </h2>
          <div className="mt-4 space-y-2">
            {data.lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-secondary dark:text-slate-200">
                  {p.name}
                </span>
                <span className="badge bg-danger/10 text-danger">
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
