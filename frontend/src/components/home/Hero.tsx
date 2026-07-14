"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FiArrowRight, FiZap } from "react-icons/fi";

const stats = [
  { value: "12k+", label: "Happy customers" },
  { value: "500+", label: "Products" },
  { value: "24h", label: "Fast delivery" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="badge glass gap-2 text-primary"
          >
            <FiZap className="h-3.5 w-3.5" /> Flash sale live now
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-secondary dark:text-white sm:text-5xl lg:text-6xl"
          >
            Premium tech,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              delivered smart.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-300"
          >
            Shop the latest laptops, gaming rigs, Apple products and accessories.
            Genuine warranty, unbeatable prices and secure M-Pesa checkout.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/category/laptops" className="btn-primary">
              Shop laptops <FiArrowRight />
            </Link>
            <Link href="/deals" className="btn-outline">
              Today&apos;s deals
            </Link>
          </motion.div>

          <div className="mt-10 flex gap-8">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-secondary dark:text-white">
                  {s.value}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="card glow relative aspect-[4/3] overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80"
              alt="Premium laptop on a desk"
              className="h-full w-full object-cover"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass absolute -bottom-6 -left-6 rounded-2xl p-4 shadow-soft-lg"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">Starting from</p>
            <p className="text-xl font-bold text-primary">KES 68,000</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
