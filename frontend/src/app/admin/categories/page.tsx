"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import { fetchCategories } from "@/lib/services";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", icon: "", description: "" });
  const [error, setError] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { data } = await api.patch(`/api/admin/categories/${editing.id}`, form);
        return data;
      }
      const { data } = await api.post("/api/admin/categories", form);
      return data;
    },
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", icon: "", description: "" });
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/admin/categories/${id}`);
    },
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", icon: "", description: "" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      icon: cat.icon ?? "",
      description: cat.description ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const walk = (list: Category[]) => {
      for (const c of list) {
        result.push(c);
        if (c.children?.length) walk(c.children);
      }
    };
    walk(cats);
    return result;
  };

  const flatList = categories ? flattenCategories(categories) : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">
          Categories
        </h1>
        <button onClick={openCreate} className="btn-primary">
          <FiPlus className="h-4 w-4" /> Add category
        </button>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Icon</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
            {flatList.map((c) => (
              <tr
                key={c.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="px-4 py-3 font-medium text-secondary dark:text-white">
                  {c.name}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {c.icon ? (
                    <span className="text-lg">{c.icon}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {c.slug}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-500 dark:text-slate-300">
                  {c.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="btn-ghost p-2"
                      aria-label="Edit"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${c.name}"?`))
                          deleteMutation.mutate(c.id);
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
            {!isLoading && flatList.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-secondary dark:text-white">
              {editing ? "Edit category" : "New category"}
            </h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <input
                className="input"
                placeholder="Category name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Icon (emoji or class name)"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setError("");
                  }}
                  className="btn-ghost"
                >
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

