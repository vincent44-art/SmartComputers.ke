"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  FiAward,
  FiHeart,
  FiLogOut,
  FiMapPin,
  FiPackage,
  FiUser,
} from "react-icons/fi";

import { formatCurrency, formatDate } from "@/lib/format";
import { fetchOrders } from "@/lib/services";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";

export default function AccountPage() {
  const router = useRouter();
  const { user, hydrated, logout } = useAuthStore();
  const wishlistCount = useWishlistStore((s) => s.ids.length);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    enabled: Boolean(user),
  });

  if (!user) return <div className="container-page py-16" />;

  const stats = [
    { icon: FiPackage, label: "Orders", value: orders.length },
    { icon: FiHeart, label: "Wishlist", value: wishlistCount },
    { icon: FiAward, label: "Loyalty points", value: user.loyaltyPoints },
  ];

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FiUser className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-secondary dark:text-white">
              Hi, {user.firstName || "there"} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="btn-outline"
        >
          <FiLogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-secondary dark:text-white">
                {s.value}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-secondary dark:text-white">
          Order history
        </h2>
        {orders.length === 0 ? (
          <div className="card mt-4 grid place-items-center p-12 text-center">
            <FiPackage className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              You haven&apos;t placed any orders yet.
            </p>
            <Link href="/" className="btn-primary mt-4">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.orderNumber}`}
                className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:border-primary"
              >
                <div>
                  <p className="font-semibold text-secondary dark:text-white">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(order.createdAt)} · {order.itemCount} items
                  </p>
                </div>
                <span className="badge bg-primary/10 capitalize text-primary">
                  {order.status}
                </span>
                <p className="font-bold text-secondary dark:text-white">
                  {formatCurrency(order.total)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/wishlist" className="card flex items-center gap-4 p-6 hover:border-primary">
          <FiHeart className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold text-secondary dark:text-white">My wishlist</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {wishlistCount} saved items
            </p>
          </div>
        </Link>
        <div className="card flex items-center gap-4 p-6">
          <FiMapPin className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold text-secondary dark:text-white">
              Saved addresses
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage delivery addresses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
