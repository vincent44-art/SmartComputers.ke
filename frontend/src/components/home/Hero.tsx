"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import React, { useEffect } from "react";
import { HERO_IMAGE_URLS } from "./heroImages";


function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type FloatProps = {
  delay: number;
  duration: number;
  yBase?: number;
};

function FloatWrap({ delay, duration, yBase = 0, children }: React.PropsWithChildren<FloatProps>) {
  return (
    <motion.div
      style={{ y: yBase }}
      initial={{ y: 0 }}
      animate={{ y: [0, -10, 0, 10, 0] }}
      transition={{
        delay,
        duration,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {children}
    </motion.div>
  );
}

function ProductFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "relative rounded-3xl bg-gradient-to-b from-white/85 to-white/35 ring-1 ring-black/5 backdrop-blur-xl " +
        className
      }
    >
      {children}
    </div>
  );
}

export function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.6 });

  const laptopTX = useTransform(sx, (v) => v * 0.8);
  const laptopTY = useTransform(sy, (v) => v * 0.55);

  const phoneTX = useTransform(sx, (v) => v * 2.4);
  const phoneTY = useTransform(sy, (v) => v * 1.5);

  const watchTX = useTransform(sx, (v) => v * 1.7);
  const watchTY = useTransform(sy, (v) => v * 1.1);

  const bgTX = useTransform(sx, (v) => v * 0.5);
  const bgTY = useTransform(sy, (v) => v * 0.35);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = (e.clientX / w - 0.5) * 2; // -1..1
      const y = (e.clientY / h - 0.5) * 2; // -1..1
      mx.set(clamp(x, -1, 1));
      my.set(clamp(y, -1, 1));
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <section className="relative isolate overflow-hidden bg-white" style={{ height: "100vh" }}>
      {/* Background */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ translateX: bgTX, translateY: bgTY }}
      >
        <div className="absolute left-[-8%] top-[-20%] h-[520px] w-[520px] rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute right-[-12%] top-[-10%] h-[480px] w-[480px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(124,58,237,0.18)_0%,rgba(255,255,255,0)_55%),radial-gradient(60%_40%_at_10%_30%,rgba(99,102,241,0.12)_0%,rgba(255,255,255,0)_60%)]" />

        {/* tiny particles */}
        <div className="absolute inset-0 opacity-70">
          {Array.from({ length: 26 }).map((_, i) => {
            const left = (i * 37) % 100;
            const top = (i * 19) % 100;
            const size = 1 + (i % 3);
            const delay = (i % 7) * 0.25;
            return (
              <motion.span
                key={i}
                className="absolute rounded-full bg-purple-400/60"
                style={{ left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px` }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0.05, 0.35, 0.1], y: [0, -6, 0] }}
                transition={{ duration: 6 + (i % 4), delay, ease: "easeInOut", repeat: Infinity }}
              />
            );
          })}
        </div>

        {/* subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,rgba(99,102,241,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.35)_1px,transparent_1px)] [background-size:72px_72px]" />

        {/* translucent blobs behind products */}
        <div className="absolute left-[28%] top-[55%] h-[220px] w-[220px] rounded-full bg-purple-500/15 blur-2xl" />
        <div className="absolute left-[58%] top-[40%] h-[200px] w-[200px] rounded-full bg-indigo-500/12 blur-2xl" />
      </motion.div>

      <div className="container-page relative z-10 h-full">
        <div className="grid h-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left 40% */}
          <div className="lg:col-span-5">
            <div className="max-w-xl">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary ring-1 ring-primary/15 backdrop-blur-xl">
                  <span className="text-base">⚡</span>
                  NEXT-GEN COMPUTERS
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.7, ease: "easeOut" }}
                className="mt-8 text-[72px] font-black leading-[0.95] tracking-tight text-secondary lg:text-[84px]"
              >
                TECH THAT
                <br />
                <span className="block">
                  <span className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
                    EMPOWERS
                  </span>
                </span>
                <br />
                EVERYDAY
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.6 }}
                className="mt-6 text-lg leading-relaxed text-slate-600 lg:text-xl"
              >
                Premium-grade devices, engineered for speed and designed for presence. From laptops to audio—built to
                elevate everyday work and play.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.6 }}
                className="mt-10 flex flex-col gap-4 sm:flex-row"
              >
                <Link href="/category/laptops" className="btn-primary inline-flex">
                  Shop Now
                </Link>
                <Link href="/search" className="btn-outline inline-flex">
                  Explore Collection
                </Link>
              </motion.div>

              {/* Micro hover animation cards (very subtle) */}
              <div className="mt-10 hidden items-center gap-6 sm:flex">
                <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-soft ring-1 ring-black/5 backdrop-blur-xl">
                  <div className="text-sm font-semibold text-secondary">Fast dispatch</div>
                  <div className="text-xs text-slate-500">Up to 24h</div>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-soft ring-1 ring-black/5 backdrop-blur-xl">
                  <div className="text-sm font-semibold text-secondary">Genuine warranty</div>
                  <div className="text-xs text-slate-500">Verified products</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 60% */}
          <div className="lg:col-span-7">
            <div className="relative h-[560px] w-full max-w-2xl lg:h-[640px] lg:max-w-3xl">
              {/* Background lighting reflection */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-10 -top-10 h-[220px] w-[220px] rounded-full bg-white/55 blur-3xl opacity-50" />
              </div>

              {/* suspended stage */}
              <div className="absolute inset-0">
                {/* laptop */}
                <motion.div
                  style={{ translateX: laptopTX, translateY: laptopTY }}
                  className="absolute left-[16%] top-[20%]"
                >
                  <FloatWrap delay={0.2} duration={8.5}>
                    {/* Soft shadow */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                      className="absolute left-1/2 top-full h-10 w-[360px] -translate-x-1/2 -translate-y-2 rounded-full bg-black/10 blur-3xl"
                    />

                    <div
                      className="relative"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: "rotateX(8deg) rotateY(-20deg) rotateZ(-4deg)",
                      }}
                    >
                      {/* base */}
                      <ProductFrame className="h-[74px] w-[420px] rounded-3xl px-6 py-4 shadow-soft-lg" >
                        <div className="flex h-full items-center justify-between">
                          <div className="h-2 w-20 rounded-full bg-gradient-to-r from-purple-500/40 via-indigo-500/40 to-fuchsia-500/30 blur-[0.5px]" />
                          <div className="h-3 w-10 rounded-lg bg-black/5" />
                        </div>
                      </ProductFrame>

                      {/* screen */}
                      <div
                        className="absolute left-0 top-[-150px] w-[420px] rounded-[28px] ring-1 ring-black/5 shadow-soft-lg"
                        style={{
                          transform: "translateZ(40px) rotateX(-10deg) rotateY(0deg) rotateZ(0deg)",
                        }}
                      >
                        <motion.div
                          className="h-[170px] w-full rounded-[28px] bg-gradient-to-br from-slate-50/90 via-white/80 to-indigo-50/40 backdrop-blur-xl overflow-hidden"
                          style={{
                            transformOrigin: "left bottom",
                            transform: "rotateX(110deg)",
                          }}
                        >
                          {/* screen content */}
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="relative h-[170px] w-full">
                              <img
                                src={HERO_IMAGE_URLS.macbook}
                                alt="MacBook Pro"
                                className="h-full w-full object-cover opacity-95"
                                draggable={false}
                              />
                            </div>
                          </div>
                        </motion.div>
                        <div className="absolute bottom-[-2px] left-1/2 h-[24px] w-[330px] -translate-x-1/2 rounded-full bg-black/5 blur-2xl opacity-70" />
                      </div>

                      {/* bezels */}
                      <div className="pointer-events-none absolute left-7 top-[-26px] h-[12px] w-[190px] rounded-full bg-black/5 opacity-60" />
                    </div>
                  </FloatWrap>
                </motion.div>

                {/* headphones (using real headset photo as the hero placeholder) */}
                <motion.div className="absolute left-[26%] top-[6%]" style={{ translateX: laptopTX, translateY: laptopTY }}>
                  <FloatWrap delay={1.0} duration={9.2}>
                    <motion.div className="absolute left-1/2 top-full h-7 w-[240px] -translate-x-1/2 -translate-y-2 rounded-full bg-black/10 blur-3xl" />
                    <div className="relative h-[180px] w-[360px]">
                      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-purple-500/10 via-transparent to-indigo-500/10" />
                      <img
                        src={HERO_IMAGE_URLS.headset}
                        alt="Gaming Headset"
                        className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-contain opacity-95"
                        draggable={false}
                      />
                    </div>
                  </FloatWrap>
                </motion.div>



              </div>
            </div>


            {/* Parallax hint overlay (very subtle) */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[30%] top-[18%] h-[240px] w-[240px] rounded-full bg-purple-500/10 blur-3xl" />
            </div>
          </div>
        </div>

        {/* Mobile stacking (ensure no overlap) */}
        <div className="mt-10 lg:hidden">
          {/* Keep composition present below; browser already stacks due to grid-cols-1 */}
        </div>
      </div>

      {/* Ensure buttons have premium glow on hover via motion */}
      <style jsx global>{`
        .btn-primary, .btn-outline {
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after, .btn-outline::after {
          content: "";
          position: absolute;
          inset: -2px;
          background: radial-gradient(120px 60px at 30% 20%, rgba(168,85,247,0.28), rgba(59,130,246,0) 60%),
                      radial-gradient(140px 70px at 70% 30%, rgba(236,72,153,0.22), rgba(59,130,246,0) 62%);
          opacity: 0;
          transition: opacity 220ms ease;
          pointer-events: none;
        }
        .btn-primary:hover::after, .btn-outline:hover::after {
          opacity: 1;
        }
      `}</style>
    </section>
  );
}

