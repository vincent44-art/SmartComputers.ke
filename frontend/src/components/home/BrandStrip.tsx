"use client";

import Link from "next/link";

import type { Brand } from "@/lib/types";

import { motion } from "framer-motion";

export function BrandStrip({ brands }: { brands: Brand[] }) {

  // Right-to-left moving marquee under the banner.
  // Uses CSS-free animation via framer-motion for consistent rendering.
  const items = brands.slice(0, 20);
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/50 p-2 dark:border-slate-800 dark:bg-slate-950/30">
      <motion.div
        className="flex w-max items-center gap-3 pr-3"
        animate={{ x: [0, -50] }}
        transition={{
          repeat: Infinity,
          duration: 22,
          ease: "linear",
        }}
      >
        {doubled.map((brand, idx) => (
          <Link
            key={`${brand.id}-${idx}`}
            href={`/search?brand=${brand.slug}`}
            className="card px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-secondary transition hover:border-primary hover:text-primary dark:text-slate-200"
          >
            {brand.name}
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

