"use client";

import { useQuery } from "@tanstack/react-query";
import { FiAlertTriangle, FiPackage, FiRefreshCw } from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/format";
import { fetchAdminAnalytics, fetchAdminProducts } from "@/lib/services";

export default function AdminInventoryPage() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
  });

  const { data: allProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products", ""],
    queryFn: () => fetchAdminProducts({}),
  });

  const isLoading = analyticsLoading || productsLoading;

  const lowStockProducts = analytics?.lowStockProducts ?? [];
  const outOfStockProducts = analytics?.outOfStockProducts ?? [];
  const recentlyAdded = analytics?.recentlyAddedProducts ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary dark:text-white">
        Inventory
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Stock levels and product availability
      </p>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FiPackage className="h-4 w-4 text-primary" />
            Total Products
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-xl font-bold text-secondary dark:text-white">
              {analytics?.totals.products ?? 0}
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FiAlertTriangle className="h-4 w-4 text-warning" />
            Low Stock (&le;5)
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-xl font-bold text-warning">
              {analytics?.totals.lowStock ?? 0}
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FiRefreshCw className="h-4 w-4 text-danger" />
            Out of Stock
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-xl font-bold text-danger">
              {outOfStockProducts.length}
            </p>
          )}
        </div>
      </div>

      {/* Low stock products */}
      <div className="card mt-6 p-5">
        <h2 className="font-semibold text-secondary dark:text-white">
          Low Stock Products
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-secondary dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock === 0
                          ? "badge bg-danger/10 text-danger"
                          : "badge bg-warning/10 text-warning"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.stock === 0 ? (
                      <span className="badge bg-danger/10 text-danger">
                        Out of stock
                      </span>
                    ) : p.stock <= 2 ? (
                      <span className="badge bg-danger/10 text-danger">
                        Critical
                      </span>
                    ) : (
                      <span className="badge bg-warning/10 text-warning">
                        Low
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {lowStockProducts.length === 0 && !isLoading && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-400"
                    colSpan={4}
                  >
                    No low-stock products.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Out of stock products */}
      <div className="card mt-4 p-5">
        <h2 className="font-semibold text-secondary dark:text-white">
          Out of Stock Products
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Category</th>
              </tr>
            </thead>
            <tbody>
              {outOfStockProducts.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-secondary dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-danger/10 text-danger">0</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                    {p.category?.name ?? "—"}
                  </td>
                </tr>
              ))}
              {outOfStockProducts.length === 0 && !isLoading && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-400"
                    colSpan={4}
                  >
                    All products are in stock!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently added products */}
      <div className="card mt-4 p-5">
        <h2 className="font-semibold text-secondary dark:text-white">
          Recently Added Products
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Category</th>
              </tr>
            </thead>
            <tbody>
              {recentlyAdded.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-secondary dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                    {p.category?.name ?? "—"}
                  </td>
                </tr>
              ))}
              {recentlyAdded.length === 0 && !isLoading && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-400"
                    colSpan={4}
                  >
                    No products added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

