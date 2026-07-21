"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Brand Names                                                        */
/* ------------------------------------------------------------------ */

const BRAND_NAMES = [
  "Apple",
  "Dell",
  "HP",
  "Lenovo",
  "ASUS",
  "Acer",
  "MSI",
  "Samsung",
  "LG",
  "Canon",
  "Epson",
  "Logitech",
  "TP-Link",
  "Ubiquiti",
  "Intel",
  "AMD",
  "NVIDIA",
  "Microsoft",
  "Kingston",
  "SanDisk",
  "Seagate",
  "Western Digital",
  "Sony",
  "JBL",
  "Cisco",
  "Xiaomi",
  "Huawei",
  "ViewSonic",
  "Brother",
  "Toshiba",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
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

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return mobile;
}

/* ------------------------------------------------------------------ */
/*  Brand Chip (Premium Pill)                                          */
/* ------------------------------------------------------------------ */

function BrandChip({ name }: { name: string }) {
  return (
    <Link
      href={`/search?brand=${slugify(name)}`}
      className="inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-[15px] font-bold tracking-wide text-secondary shadow-soft transition-all duration-300 hover:scale-[1.08] hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-white hover:shadow-[0_0_0_1px_rgba(37,99,235,0.15),0_20px_60px_-16px_rgba(37,99,235,0.4)]"
      style={{ letterSpacing: "0.5px" }}
    >
      {name}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function FeaturedBrandsMarquee() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [isPaused, setIsPaused] = useState(false);

  // Duplicated so CSS translateX(-50%) loops seamlessly
  const doubled = [...BRAND_NAMES, ...BRAND_NAMES];

  // 30s desktop, 40s mobile (within 25–35s range for desktop)
  const duration = isMobile ? 40 : 30;

  return (
    <section className="bg-[#F8F9FA] py-16">
      <div className="container-page mb-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-secondary sm:text-3xl">
            Featured Brands
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Shop products from the world&rsquo;s leading technology brands.
          </p>
        </div>
      </div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left edge fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#F8F9FA] to-transparent" />
        {/* Right edge fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#F8F9FA] to-transparent" />

        {/* Touch-scrollable wrapper */}
        <div
          className="hide-scrollbar overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {prefersReducedMotion ? (
            /* ── Static grid for reduced motion ── */
            <div className="flex gap-4 px-8">
              {BRAND_NAMES.map((name) => (
                <BrandChip key={name} name={name} />
              ))}
            </div>
          ) : (
            /* ── CSS-powered marquee for 60fps ── */
            <div
              className="flex w-max gap-4 px-8 animate-marquee"
              style={
                {
                  "--marquee-duration": `${duration}s`,
                  animationPlayState: isPaused ? "paused" : "running",
                } as React.CSSProperties
              }
            >
              {doubled.map((name, idx) => (
                <BrandChip key={`${name}-${idx}`} name={name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

