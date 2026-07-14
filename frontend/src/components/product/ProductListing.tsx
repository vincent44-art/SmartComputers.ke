"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FiGrid, FiList, FiSliders } from "react-icons/fi";

import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { fetchFacets, fetchProducts, type ProductQuery } from "@/lib/services";
import { cn } from "@/lib/format";

import { FilterSidebar, type FilterState } from "./FilterSidebar";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Most popular" },
];

const emptyFilters: FilterState = {
  brand: [],
  ram: [],
  storage: [],
  condition: [],
  maxPrice: undefined,
  inStock: false,
};

export function ProductListing({
  title,
  baseQuery = {},
}: {
  title: string;
  baseQuery?: ProductQuery;
}) {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const { data: facets } = useQuery({ queryKey: ["facets"], queryFn: fetchFacets });

  const query: ProductQuery = useMemo(
    () => ({
      ...baseQuery,
      brand: filters.brand.length ? filters.brand : baseQuery.brand,
      ram: filters.ram,
      storage: filters.storage,
      condition: filters.condition,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock || undefined,
      sort,
      page,
      perPage: 12,
    }),
    [baseQuery, filters, sort, page]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", query],
    queryFn: () => fetchProducts(query),
  });

  const products = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-secondary dark:text-white">
          {title}
        </h1>
        {meta && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {meta.total} products found
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className={cn("lg:block", showFilters ? "block" : "hidden")}>
          {facets && (
            <FilterSidebar
              facets={facets}
              filters={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
              onClear={() => {
                setFilters(emptyFilters);
                setPage(1);
              }}
            />
          )}
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="btn-outline lg:hidden"
            >
              <FiSliders className="h-4 w-4" /> Filters
            </button>
            <div className="ml-auto flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="input w-auto py-2"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="hidden items-center rounded-full border border-slate-200 p-1 dark:border-slate-700 sm:flex">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full",
                    view === "grid" ? "bg-primary text-white" : "text-slate-500"
                  )}
                  aria-label="Grid view"
                >
                  <FiGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full",
                    view === "list" ? "bg-primary text-white" : "text-slate-500"
                  )}
                  aria-label="List view"
                >
                  <FiList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <ProductGridSkeleton />
          ) : products.length === 0 ? (
            <div className="card grid place-items-center p-16 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                No products match your filters.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                view === "grid"
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3"
                  : "flex flex-col gap-4",
                isFetching && "opacity-70"
              )}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={!meta.hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="btn-outline"
              >
                Previous
              </button>
              <span className="px-4 text-sm text-slate-500 dark:text-slate-400">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="btn-outline"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
