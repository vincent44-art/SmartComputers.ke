"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiHeart,
  FiMenu,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
} from "react-icons/fi";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { fetchCategories } from "@/lib/services";
import { cn } from "@/lib/format";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";

const PRIMARY_LINKS = [
  { label: "Laptops", href: "/category/laptops" },
  { label: "Gaming", href: "/category/gaming" },
  { label: "Apple", href: "/category/apple" },
  { label: "Monitors", href: "/category/monitors" },
  { label: "Accessories", href: "/category/accessories" },
  { label: "Deals", href: "/deals" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const itemCount = useCartStore((s) => s.cart.itemCount);
  const openCart = useCartStore((s) => s.setDrawer);
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const user = useAuthStore((s) => s.user);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition",
        scrolled
          ? "glass shadow-soft"
          : "border-b border-transparent bg-[var(--background)]"
      )}
    >
      <div className="container-page flex h-16 items-center gap-4">
        <button
          type="button"
          className="btn-ghost h-10 w-10 rounded-full p-0 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <FiMenu className="h-5 w-5" />
        </button>

        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight text-secondary dark:text-white sm:text-xl"
        >
          Smart<span className="text-primary">Computers</span>
          <span className="text-accent">.ke</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <button
            type="button"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
            onClick={() => setMegaOpen((v) => !v)}
            className="relative rounded-full px-3 py-2 text-sm font-medium text-secondary hover:text-primary dark:text-slate-200"
          >
            Categories
            <AnimatePresence>
              {megaOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.18 }}
                  className="glass absolute left-0 top-full mt-2 grid w-[560px] grid-cols-2 gap-1 rounded-2xl p-3 text-left shadow-soft-lg"
                >
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-secondary transition hover:bg-primary/10 hover:text-primary dark:text-slate-200"
                    >
                      {c.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-secondary hover:text-primary dark:text-slate-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden flex-1 max-w-md md:block">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search laptops, brands, specs…"
              className="input pl-10"
              aria-label="Search products"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          <Link
            href="/wishlist"
            className="btn-ghost relative h-10 w-10 rounded-full p-0"
            aria-label="Wishlist"
          >
            <FiHeart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => openCart(true)}
            className="btn-ghost relative h-10 w-10 rounded-full p-0"
            aria-label="Cart"
          >
            <FiShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
          <Link
            href={user ? "/account" : "/login"}
            className="btn-ghost h-10 rounded-full px-3"
            aria-label="Account"
          >
            <FiUser className="h-5 w-5" />
            <span className="hidden text-sm font-medium lg:inline">
              {user ? user.firstName || "Account" : "Login"}
            </span>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="h-full w-80 max-w-[85%] bg-white p-5 dark:bg-slate-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-secondary dark:text-white">Menu</span>
                <button
                  type="button"
                  className="btn-ghost h-9 w-9 rounded-full p-0"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitSearch} className="mt-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="input"
                />
              </form>
              <nav className="mt-4 flex flex-col">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-secondary hover:bg-primary/10 hover:text-primary dark:text-slate-200"
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
