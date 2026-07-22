"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiBarChart2,
} from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { fetchAdminAnalytics } from "@/lib/services";

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
  });

  const statCards = [
    {
      label: "Total Revenue",
      value: data ? formatCurrency(data.totals.revenue) : "—",
      icon: FiDollarSign,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Orders",
      value: data?.totals.orders ?? "—",
      icon: FiShoppingBag,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Customers",
      value: data?.totals.customers ?? "—",
      icon: FiUsers,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Products",
      value: data?.totals.products ?? "—",
      icon: FiBox,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  const maxRevenue7d = Math.max(
    1,
    ...(data?.revenueSeries7d.map((d) => d.revenue) ?? [1])
  );
  const maxOrders7d = Math.max(
    1,
    ...(data?.ordersSeries7d.map((d) => d.orders) ?? [1])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary dark:text-white">
        Analytics
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Detailed store performance metrics
      </p>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {c.label}
              </span>
              <div className={`rounded-lg p-2 ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-24" />
            ) : (
              <p className={`mt-2 text-2xl font-bold ${c.color}`}>{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Additional stat row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FiClock className="h-4 w-4" />
            Pending Orders
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-xl font-bold text-warning">
              {data?.totals.pendingOrders ?? 0}
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FiAlertTriangle className="h-4 w-4" />
            Low Stock Items
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-xl font-bold text-danger">
              {data?.totals.lowStock ?? 0}
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FiTrendingUp className="h-4 w-4" />
            Avg. Order Value
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <p className="mt-1 text-xl font-bold text-secondary dark:text-white">
              {data ? formatCurrency(data.storePerformance.averageOrderValue) : "—"}
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FiBarChart2 className="h-4 w-4" />
            Conversion Rate
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-xl font-bold text-secondary dark:text-white">
              {data?.storePerformance.conversionRate ?? 0}%
            </p>
          )}
        </div>
      </div>

      {/* Revenue & Orders charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Revenue (last 7 days)
          </h2>
          <div className="mt-6 flex h-48 items-end gap-2">
            {(data?.revenueSeries7d ?? []).map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-green-500/60 transition-all"
                  style={{
                    height: `${Math.max(4, (d.revenue / maxRevenue7d) * 100)}%`,
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

        {/* Orders chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Orders (last 7 days)
          </h2>
          <div className="mt-6 flex h-48 items-end gap-2">
            {(data?.ordersSeries7d ?? []).map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-blue-500/60 transition-all"
                  style={{
                    height: `${Math.max(4, (d.orders / maxOrders7d) * 100)}%`,
                  }}
                  title={`${d.orders} orders`}
                />
                <span className="text-[10px] text-slate-400">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order status breakdown & Payment methods */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Order status counts */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Order Status Breakdown
          </h2>
          <div className="mt-4 space-y-3">
            {data &&
              Object.entries(data.orderStatusCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize text-slate-600 dark:text-slate-300">
                    {status}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, (count / Math.max(data.totals.orders, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right font-semibold text-secondary dark:text-white">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Payment Methods
          </h2>
          <div className="mt-4 space-y-3">
            {(data?.paymentMethodBreakdown ?? []).map((pm) => (
              <div
                key={pm.method}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="capitalize text-slate-600 dark:text-slate-300">
                    {pm.method || "Unknown"}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    ({pm.count} orders)
                  </span>
                </div>
                <span className="font-semibold text-secondary dark:text-white">
                  {formatCurrency(pm.revenue)}
                </span>
              </div>
            ))}
            {data && data.paymentMethodBreakdown.length === 0 && (
              <p className="text-sm text-slate-400">No payment data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Best selling categories & Store performance */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Best selling categories */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Best Selling Categories
          </h2>
          <div className="mt-4 space-y-3">
            {(data?.bestSellingCategories ?? []).map((cat, i) => (
              <div
                key={cat.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {cat.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-secondary dark:text-white">
                    {formatCurrency(cat.revenue)}
                  </p>
                  <p className="text-xs text-slate-400">{cat.orderCount} orders</p>
                </div>
              </div>
            ))}
            {data && data.bestSellingCategories.length === 0 && (
              <p className="text-sm text-slate-400">No data yet.</p>
            )}
          </div>
        </div>

        {/* Store performance */}
        <div className="card p-5">
          <h2 className="font-semibold text-secondary dark:text-white">
            Store Performance
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400">Conversion Rate</p>
              <p className="mt-1 text-lg font-bold text-secondary dark:text-white">
                {data?.storePerformance.conversionRate ?? 0}%
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400">Avg. Order Value</p>
              <p className="mt-1 text-lg font-bold text-secondary dark:text-white">
                {data ? formatCurrency(data.storePerformance.averageOrderValue) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400">Total Visitors</p>
              <p className="mt-1 text-lg font-bold text-secondary dark:text-white">
                {data?.storePerformance.totalVisitors ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400">Returning Customers</p>
              <p className="mt-1 text-lg font-bold text-secondary dark:text-white">
                {data?.storePerformance.returningCustomers ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card mt-6 p-5">
        <h2 className="font-semibold text-secondary dark:text-white">
          Recent Activity
        </h2>
        <div className="mt-4 space-y-3">
          {(data?.activityFeed ?? []).map((activity, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  {activity.type === "order_placed" ? (
                    <FiShoppingBag className="h-4 w-4 text-primary" />
                  ) : activity.type === "product_updated" ? (
                    <FiBox className="h-4 w-4 text-orange-500" />
                  ) : activity.type === "coupon_created" ? (
                    <FiDollarSign className="h-4 w-4 text-green-500" />
                  ) : activity.type === "customer_registered" ? (
                    <FiUsers className="h-4 w-4 text-purple-500" />
                  ) : (
                    <FiTrendingUp className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {activity.message}
                  </p>
                  <p className="text-xs text-slate-400">
                    {activity.timestamp ? formatDate(activity.timestamp) : ""}
                  </p>
                </div>
              </div>
              {activity.amount > 0 && (
                <span className="font-semibold text-secondary dark:text-white">
                  {formatCurrency(activity.amount)}
                </span>
              )}
            </div>
          ))}
          {data && data.activityFeed.length === 0 && (
            <p className="text-sm text-slate-400">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}

