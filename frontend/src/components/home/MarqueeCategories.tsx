"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimationControls, type Variants } from "framer-motion";
import {
  FiBook,
  FiBriefcase,
  FiMonitor,
  FiPrinter,
  FiWifi,
} from "react-icons/fi";
import { FaApple, FaGamepad, FaKeyboard, FaLaptop } from "react-icons/fa6";
import type { IconType } from "react-icons";

import type { Category } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Icons                                                             */
/* ------------------------------------------------------------------ */

const ICONS: Record<string, IconType> = {
  laptop: FaLaptop,
  gamepad: FaGamepad,
  apple: FaApple,
  monitor: FiMonitor,
  printer: FiPrinter,
  keyboard: FaKeyboard,
  wifi: FiWifi,
  briefcase: FiBriefcase,
  book: FiBook,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: "Laptops", slug: "laptops", icon: "laptop", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 2, name: "Desktop Computers", slug: "desktops", icon: "monitor", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 3, name: "Monitors", slug: "monitors", icon: "monitor", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 4, name: "Printers", slug: "printers", icon: "printer", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 5, name: "Networking", slug: "networking", icon: "wifi", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 6, name: "Gaming", slug: "gaming", icon: "gamepad", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 7, name: "Accessories", slug: "accessories", icon: "keyboard", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 8, name: "Storage", slug: "storage", icon: "briefcase", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 9, name: "CCTV", slug: "cctv", icon: "monitor", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 10, name: "Smartphones", slug: "smartphones", icon: "apple", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 11, name: "Tablets", slug: "tablets", icon: "book", description: null, imageUrl: null, parentId: null, isFeatured: true },
  { id: 12, name: "Software", slug: "software", icon: "briefcase", description: null, imageUrl: null, parentId: null, isFeatured: true },
];

/* ------------------------------------------------------------------ */
/*  Hook – prefers-reduced-motion                                     */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefers;
}

/* ------------------------------------------------------------------ */
/*  Category Card                                                     */
/* ------------------------------------------------------------------ */

const cardVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow:
      "0 4px 24px -8px rgba(15, 23, 42, 0.12)",
  },
  hover: {
    scale: 1.05,
    boxShadow:
      "0 0 0 1px rgba(37, 99, 235, 0.15), 0 20px 60px -16px rgba(37, 99, 235, 0.4)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

function CategoryCard({ category }: { category: Category }) {
  const Icon = ICONS[category.icon ?? ""] ?? FaLaptop;

  return (
    <Link href={`/category/${category.slug}`} className="block shrink-0">
      <motion.div
        className="group relative flex h-full w-[140px] flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-soft transition-colors sm:w-[160px]"
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        style={{ willChange: "transform, box-shadow" }}
      >
        {/* Circular icon container */}
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all duration-300 group-hover:from-primary group-hover:to-primary-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30">
          <Icon className="h-7 w-7" />
        </span>

        {/* Category name */}
        <span className="text-center text-sm font-semibold leading-tight text-secondary dark:text-slate-100">
          {category.name}
        </span>
      </motion.div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Marquee Component                                            */
/* ------------------------------------------------------------------ */

interface MarqueeCategoriesProps {
  categories?: Category[];
}

export function MarqueeCategories({ categories }: MarqueeCategoriesProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Use provided categories or fallback to defaults
  const items = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const doubled = [...items, ...items, ...items]; // Trip for extra seamless feel

  // Animation duration: 30s desktop, 40s mobile
  const duration = typeof window !== "undefined" && window.innerWidth < 640 ? 40 : 30;

  // Start / stop animation
  const startAnimation = useCallback(() => {
    if (prefersReducedMotion) return;
    controls.start({
      x: [0, -items.length * 160 - items.length * 12], // card width + gap
      transition: {
        repeat: Infinity,
        duration,
        ease: "linear",
        repeatType: "loop",
      },
    });
  }, [controls, items.length, duration, prefersReducedMotion]);

  const stopAnimation = useCallback(() => {
    controls.stop();
  }, [controls]);

  useEffect(() => {
    startAnimation();
    return () => stopAnimation();
  }, [startAnimation, stopAnimation]);

  // Pause / resume on hover
  const handleMouseEnter = () => {
    if (prefersReducedMotion) return;
    setIsPaused(true);
    controls.stop();
  };

  const handleMouseLeave = () => {
    if (prefersReducedMotion) return;
    setIsPaused(false);
    startAnimation();
  };

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[#F8F9FA] to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#F8F9FA] to-transparent" />

      {/* Scrollable container for touch devices */}
      <div
        ref={containerRef}
        className="hide-scrollbar overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {prefersReducedMotion ? (
          /* Static grid for reduced motion */
          <div className="flex gap-3 px-4">
            {items.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          /* Animated marquee */
          <motion.div
            className="flex w-max gap-3 px-4"
            animate={controls}
            style={{ willChange: "transform" }}
          >
            {doubled.map((category, idx) => (
              <CategoryCard key={`${category.id}-${idx}`} category={category} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

