"use client";

import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format";
import { fetchAdminCustomers } from "@/lib/services";

export default function AdminCustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => fetchAdminCustomers(),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary dark:text-white">
        Customers
      </h1>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Joined</th>
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
            {data?.items.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="px-4 py-3 font-medium text-secondary dark:text-white">
                  {u.fullName || "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {u.email}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {u.phone ?? "—"}
                </td>
                <td className="px-4 py-3">{u.loyaltyPoints}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                  {formatDate(u.createdAt)}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
