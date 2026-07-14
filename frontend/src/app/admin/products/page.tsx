"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { apiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  fetchCategories,
  updateAdminProduct,
  type AdminProductInput,
} from "@/lib/services";
import type { Product } from "@/lib/types";

const EMPTY: AdminProductInput = {
  name: "",
  price: 0,
  stock: 0,
  categoryId: 0,
  shortDescription: "",
  condition: "new",
};

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<AdminProductInput | null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: () => fetchAdminProducts({ q: search || undefined }),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-analytics"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminProductInput) => {
      if (editing) return updateAdminProduct(editing.id, payload);
      return createAdminProduct(payload);
    },
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, categoryId: categories?.[0]?.id ?? 0 });
    setError("");
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.stock,
      categoryId: p.category?.id ?? categories?.[0]?.id ?? 0,
      shortDescription: p.shortDescription ?? "",
      condition: p.condition,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isFlashSale: p.isFlashSale,
    });
    setError("");
  };

  const closeForm = () => {
    setForm(null);
    setEditing(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">
          Products
        </h1>
        <button onClick={openCreate} className="btn-primary">
          <FiPlus className="h-4 w-4" /> Add product
        </button>
      </div>

      <input
        className="input mt-4 max-w-sm"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3" colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))}
            {data?.items.map((p) => (
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
                      p.stock <= 5
                        ? "badge bg-danger/10 text-danger"
                        : "text-slate-500 dark:text-slate-300"
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {p.category?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="btn-ghost p-2"
                      aria-label="Edit"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${p.name}?`))
                          deleteMutation.mutate(p.id);
                      }}
                      className="btn-ghost p-2 text-danger"
                      aria-label="Delete"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-secondary dark:text-white">
              {editing ? "Edit product" : "New product"}
            </h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (form) saveMutation.mutate(form);
              }}
            >
              <input
                className="input"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <textarea
                className="input"
                placeholder="Short description"
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  type="number"
                  placeholder="Price"
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  required
                />
                <input
                  className="input"
                  type="number"
                  placeholder="Compare-at price"
                  value={form.compareAtPrice ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      compareAtPrice: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                />
                <input
                  className="input"
                  type="number"
                  placeholder="Stock"
                  value={form.stock ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, stock: Number(e.target.value) })
                  }
                />
                <select
                  className="input"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: Number(e.target.value) })
                  }
                >
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isFeatured ?? false}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked })
                    }
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller ?? false}
                    onChange={(e) =>
                      setForm({ ...form, isBestSeller: e.target.checked })
                    }
                  />
                  Best seller
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isFlashSale ?? false}
                    onChange={(e) =>
                      setForm({ ...form, isFlashSale: e.target.checked })
                    }
                  />
                  Flash sale
                </label>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="btn-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary"
                >
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
