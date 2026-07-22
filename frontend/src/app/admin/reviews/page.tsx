"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FiSearch, FiStar } from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import { fetchAdminProducts } from "@/lib/services";

export default function AdminReviewsPage() {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products", ""],
    queryFn: () => fetchAdminProducts({}),
  });

  const loadReviews = async (productId: number) => {
    setSelectedProduct(productId);
    const p = products?.items.find((item) => item.id === productId);
    if (!p?.slug) return;
    setLoadingReviews(true);
    setError("");
    try {
      const { data } = await api.get(`/api/products/${p.slug}/reviews`);
      setReviews(data);
    } catch (err) {
      setError(apiErrorMessage(err));
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

const product =
    selectedProduct != null
      ? products?.items.find((p) => p.id === selectedProduct)
      : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary dark:text-white">
        Reviews
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Browse and manage product reviews
      </p>

      <input
        className="input mt-4 max-w-sm"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Product list sidebar */}
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={2}>
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))}
              {(products?.items ?? [])
                .filter(
                  (p) =>
                    !search ||
                    p.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => loadReviews(p.id)}
                    className={`cursor-pointer border-b border-slate-100 last:border-0 dark:border-slate-800 ${
                      selectedProduct === p.id
                        ? "bg-primary/5"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-secondary dark:text-white">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <FiStar className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {p.ratingAvg.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({p.ratingCount})
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && products?.items.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-400"
                    colSpan={2}
                  >
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reviews panel */}
        <div className="card p-5">
          {!selectedProduct && (
            <p className="py-12 text-center text-slate-400">
              Select a product to view its reviews
            </p>
          )}

          {selectedProduct && (
            <>
              <h2 className="font-semibold text-secondary dark:text-white">
                {product?.name ?? "Loading..."}
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </p>

              {loadingReviews && (
                <div className="mt-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              )}

              {error && <p className="mt-4 text-sm text-danger">{error}</p>}

              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {r.author?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary dark:text-white">
                            {r.author}
                          </p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FiStar
                                key={i}
                                className={`h-3 w-3 ${
                                  i < r.rating
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "text-slate-300 dark:text-slate-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString("en-KE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                    {r.title && (
                      <p className="mt-2 text-sm font-medium text-secondary dark:text-white">
                        {r.title}
                      </p>
                    )}
                    {r.body && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        {r.body}
                      </p>
                    )}
                  </div>
                ))}
                {!loadingReviews && reviews.length === 0 && (
                  <p className="text-center text-sm text-slate-400">
                    No reviews for this product yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

