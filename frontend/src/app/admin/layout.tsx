"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  FiBarChart2,
  FiBox,
  FiChevronDown,
  FiGrid,
  FiHome,
  FiImage,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTruck,
  FiUsers,
  FiX,
  FiBell,
  FiLayers,
  FiTrendingUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/format";
import { api } from "@/lib/api";
import { fetchAdminPendingOrderCount } from "@/lib/services";
import { useAuthStore } from "@/store/useAuthStore";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FiGrid },
  { href: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: FiUsers },
  { href: "/admin/products", label: "Products", icon: FiBox },
  { href: "/admin/hero-banners", label: "Hero Banners", icon: FiImage },
  { href: "/admin/categories", label: "Categories", icon: FiLayers },
  { href: "/admin/coupons", label: "Coupons", icon: FiTag },
  { href: "/", label: "Storefront", icon: FiHome },
  { href: "/admin/reviews", label: "Reviews", icon: FiStar },
  { href: "/admin/inventory", label: "Inventory", icon: FiTruck },
  { href: "/admin/analytics", label: "Analytics", icon: FiTrendingUp },
  { href: "/admin/settings", label: "Settings", icon: FiSettings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, logout } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch pending order count
  const fetchPendingCount = useCallback(async () => {
    try {
      const { count } = await fetchAdminPendingOrderCount();
      setPendingCount(count);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  useEffect(() => {
    if (!hydrated) return;

    const verify = async () => {
      try {
        await api.get("/api/auth/me");
      } catch (err) {
        try {
          localStorage.removeItem("sc_access_token");
          localStorage.removeItem("sc_session_id");
        } catch {
          // ignore
        }
        logout();
        router.replace("/login");
        return;
      }

      if (!user || user.role !== "admin") {
        router.replace("/login");
      }
    };

    void verify();
  }, [hydrated, user, router, logout]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!hydrated || !user || user.role !== "admin") {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-16">
        <p className="text-slate-500 dark:text-slate-400">
          Checking admin access…
        </p>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-glow">
          <FiBox className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-secondary dark:text-white">SmartComputers</p>
          <p className="text-[10px] font-medium text-slate-400">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-secondary dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              )}
            >
              <item.icon className={cn("h-4 w-4 transition", active ? "text-white" : "text-slate-400 group-hover:text-secondary dark:group-hover:text-slate-200")} />
              {item.label}
              {item.href === "/admin/orders" && pendingCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger/20 px-1.5 text-[10px] font-bold text-danger">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-200 px-3 py-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/10"
        >
          <FiLogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-soft-lg dark:bg-slate-900 lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        {sidebarContent}
      </aside>

      {/* Main area */}
      <div className="lg:pl-64">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-secondary dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
            >
              <FiMenu className="h-5 w-5" />
            </button>

            {/* Search bar */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders, customers, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-secondary outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Notification bell with real pending count */}
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-secondary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <FiBell className="h-4 w-4" />
                {pendingCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </button>

              {/* Admin profile dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden text-sm font-medium text-secondary sm:block dark:text-white">
                    {user.firstName || "Admin"}
                  </span>
                  <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft-lg dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                        <p className="text-sm font-medium text-secondary dark:text-white">
                          {user.fullName || "Admin"}
                        </p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <Link
                          href="/"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <FiHome className="h-4 w-4" />
                          View Storefront
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <FiSettings className="h-4 w-4" />
                          Account Settings
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                            router.push("/");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-danger transition hover:bg-danger/10"
                        >
                          <FiLogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
