"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  FiBox,
  FiGrid,
  FiHome,
  FiLogOut,
  FiShoppingBag,
  FiTag,
  FiUsers,
} from "react-icons/fi";

import { cn } from "@/lib/format";
import { useAuthStore } from "@/store/useAuthStore";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FiGrid },
  { href: "/admin/products", label: "Products", icon: FiBox },
  { href: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: FiUsers },
  { href: "/admin/coupons", label: "Coupons", icon: FiTag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, logout } = useAuthStore();

  useEffect(() => {
    if (hydrated && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || user.role !== "admin") {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-16">
        <p className="text-slate-500 dark:text-slate-400">
          Checking admin access…
        </p>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit lg:sticky lg:top-24">
        <div className="card p-4">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Admin
          </p>
          <nav className="mt-3 space-y-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-primary text-white"
                      : "text-secondary hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-secondary hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiHome className="h-4 w-4" /> Storefront
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10"
            >
              <FiLogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
