"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { apiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminCoupons,
} from "@/lib/services";

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    amount: 0,
    discountType: "percent",
    minSubtotal: 0,
    description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: fetchAdminCoupons,
  });

  const createMutation = useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setForm({
        code: "",
        amount: 0,
        discountType: "percent",
        minSubtotal: 0,
        description: "",
      });
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary dark:text-white">
        Coupons
      </h1>

      <form
        className="card mt-4 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(form);
        }}
      >
        <input
          className="input uppercase"
          placeholder="CODE"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          required
        />
        <select
          className="input"
          value={form.discountType}
          onChange={(e) => setForm({ ...form, discountType: e.target.value })}
        >
          <option value="percent">Percent %</option>
          <option value="fixed">Fixed KES</option>
        </select>
        <input
          className="input"
          type="number"
          placeholder="Amount"
          value={form.amount || ""}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="Min subtotal"
          value={form.minSubtotal || ""}
          onChange={(e) =>
            setForm({ ...form, minSubtotal: Number(e.target.value) })
          }
        />
        <input
          className="input sm:col-span-2 lg:col-span-1"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {error && (
          <p className="text-sm text-danger sm:col-span-2 lg:col-span-3">
            {error}
          </p>
        )}
        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            <FiPlus className="h-4 w-4" /> Add coupon
          </button>
        </div>
      </form>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min subtotal</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-3" colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            )}
            {data?.map((c) => (
              <tr
                key={c.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="px-4 py-3 font-semibold text-secondary dark:text-white">
                  {c.code}
                </td>
                <td className="px-4 py-3">
                  {c.discountType === "percent"
                    ? `${c.amount}%`
                    : formatCurrency(c.amount)}
                </td>
                <td className="px-4 py-3">{formatCurrency(c.minSubtotal)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {c.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="btn-ghost p-2 text-danger"
                    aria-label="Delete"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
