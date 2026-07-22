"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiArrowRight } from "react-icons/fi";

import { HERO_IMAGE_URLS } from "@/components/home/heroImages";
import { fetchHeroBanners } from "@/lib/services";
import type { HeroBanner } from "@/lib/types";

interface MobileHeroLayoutProps {
  imageSrc: string;
  badge: string | null;
  title: string;
  subtitle: string | null;
  primaryText: string | null;
  primaryUrl: string | null;
  secondaryText: string | null;
  secondaryUrl: string | null;
}

interface DesktopSplitContentProps extends MobileHeroLayoutProps {
  layout: "left" | "center" | "right";
  slideFromRight: boolean;
}

interface HeroSlideProps {
  banner: HeroBanner | undefined;
  isActive: boolean;
}

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } };
const fadeInUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } } };
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } };
const slideInRight = { hidden: { opacity: 0, x: 80 }, show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } } };

function MobileHeroLayout({ imageSrc, badge, title, subtitle, primaryText, primaryUrl, secondaryText, secondaryUrl }: MobileHeroLayoutProps) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden lg:hidden">
      <img src={imageSrc} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
          {badge && <span className="mb-2 inline-block rounded-full bg-white/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md ring-1 ring-white/20">{badge}</span>}
          <h2 className="text-[32px] font-black leading-tight text-white sm:text-[36px]">{title}</h2>
          {subtitle && <p className="mx-auto max-w-xs text-[16px] leading-relaxed text-white/80 sm:text-[18px]">{subtitle}</p>}
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {primaryText && <Link href={primaryUrl || "/"} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-lg transition active:scale-[0.97] sm:w-auto">{primaryText}</Link>}
            {secondaryText && <Link href={secondaryUrl || "/"} className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 px-8 py-3 text-sm font-semibold text-white transition active:scale-[0.97] sm:w-auto">{secondaryText}</Link>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DesktopSplitContent({ badge, title, subtitle, primaryText, primaryUrl, secondaryText, secondaryUrl, imageSrc, layout, slideFromRight }: DesktopSplitContentProps) {
  const imgVariants = slideFromRight ? slideInRight : fadeIn;
  const lc: Record<string, string> = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" };
  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-[550px] w-[550px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>
      <div className="container-page relative z-10 grid min-h-[calc(100vh-80px)] grid-cols-2 items-center gap-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className={"flex flex-col justify-center " + (lc[layout] || "items-start text-left")}>
          {badge && <motion.div variants={fadeInUp} className={layout === "center" ? "mx-auto" : ""}><span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-indigo-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary ring-1 ring-primary/20 backdrop-blur-xl"><span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />{badge}</span></motion.div>}
          <motion.h2 variants={fadeInUp} className={"mt-6 text-6xl font-black leading-[1.05] tracking-tight xl:text-[68px] " + (layout === "center" ? "mx-auto" : "")}><span className="text-secondary">{title}</span></motion.h2>
          {subtitle && <motion.p variants={fadeInUp} className={"mt-4 max-w-md text-lg leading-relaxed text-slate-500 xl:text-xl " + (layout === "center" ? "mx-auto" : "")}>{subtitle}</motion.p>}
          <motion.div variants={fadeInUp} className={"mt-8 flex flex-wrap items-center gap-4 " + (layout === "center" ? "justify-center " : "") + (layout === "right" ? "justify-end" : "")}>
            {primaryText && <Link href={primaryUrl || "/"} className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97]">{primaryText}<FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>}
            {secondaryText && <Link href={secondaryUrl || "/"} className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/60 px-7 py-3.5 text-sm font-semibold text-secondary backdrop-blur-sm transition hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97]">{secondaryText}</Link>}
          </motion.div>
        </motion.div>
        <motion.div variants={imgVariants} initial="hidden" animate="show" className="relative flex items-center justify-center">
          <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/20 via-indigo-500/15 to-purple-500/20 blur-2xl" />
          <div className="group relative w-full max-w-lg animate-float">
            <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-br from-primary/20 via-indigo-500/15 to-purple-500/20 opacity-60 blur-sm transition duration-500 group-hover:opacity-100" />
            <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/70 p-3 shadow-soft-lg backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
              <img src={imageSrc} alt={title} className="h-auto w-full rounded-[16px] object-cover transition duration-700 group-hover:scale-[1.02]" />
              <div className="pointer-events-none absolute inset-0 rounded-[16px] bg-gradient-to-t from-white/30 via-transparent to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DefaultHero() {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      <MobileHeroLayout imageSrc={HERO_IMAGE_URLS.macbook} badge="Next-Gen Computers" title="Tech That Empowers Everyday" subtitle="Premium-grade devices, engineered for speed and designed for presence. From laptops to audio — built to elevate everyday work and play." primaryText="Shop Now" primaryUrl="/category/laptops" secondaryText="Explore Collection" secondaryUrl="/search" />
      <div className="hidden lg:block">
        <DesktopSplitContent badge="Next-Gen Computers" title="Tech That Empowers Everyday" subtitle="Premium-grade devices, engineered for speed and designed for presence. From laptops to audio — built to elevate everyday work and play." primaryText="Shop Now" primaryUrl="/category/laptops" secondaryText="Explore Collection" secondaryUrl="/search" imageSrc={HERO_IMAGE_URLS.macbook} layout="left" slideFromRight={true} />
      </div>
    </section>
  );
}

function HeroSlide({ banner, isActive }: HeroSlideProps) {
  if (!banner) return null;
  const imageSrc = banner.desktopImage || HERO_IMAGE_URLS.macbook;
  const slideRt = banner.animation === "slideRight" || banner.animation === "fade" || banner.animation === "none";
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div key={banner.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
          <div className="lg:hidden"><MobileHeroLayout imageSrc={imageSrc} badge={banner.badge} title={banner.title} subtitle={banner.subtitle} primaryText={banner.primaryText} primaryUrl={banner.primaryUrl} secondaryText={banner.secondaryText} secondaryUrl={banner.secondaryUrl} /></div>
          <div className="hidden lg:block"><DesktopSplitContent badge={banner.badge} title={banner.title} subtitle={banner.subtitle} primaryText={banner.primaryText} primaryUrl={banner.primaryUrl} secondaryText={banner.secondaryText} secondaryUrl={banner.secondaryUrl} imageSrc={imageSrc} layout={banner.layout} slideFromRight={slideRt} /></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Hero() {
  const { data: banners, isLoading } = useQuery({ queryKey: ["hero-banners"], queryFn: fetchHeroBanners, refetchOnMount: true, refetchOnWindowFocus: true });
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeBanners = banners ?? [];

  const goTo = useCallback((index: number) => {
    if (activeBanners.length === 0) return;
    const total = activeBanners.length;
    setCurrentIndex(((index % total) + total) % total);
  }, [activeBanners.length]);

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const duration = 5000 + Math.random() * 2000;
    intervalRef.current = setInterval(goNext, duration);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeBanners.length, goNext]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const hTS = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const hTM = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const hTE = () => { const d = touchStartX.current - touchEndX.current; if (Math.abs(d) > 50) { if (d > 0) goNext(); else goPrev(); } };

  // Show static default hero while API data is loading or when there are no banners
  if (isLoading || activeBanners.length === 0) {
    return <DefaultHero />;
  }

  const currentBanner = activeBanners[currentIndex];

  return (
    <section className="relative isolate overflow-hidden bg-white" onTouchStart={hTS} onTouchMove={hTM} onTouchEnd={hTE}>
      <div className="relative w-full"><HeroSlide banner={currentBanner} isActive={true} /></div>
      {activeBanners.length > 1 && <>
        <button onClick={goPrev} className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200/80 bg-white/70 p-3 text-slate-700 shadow-soft backdrop-blur-md transition hover:bg-white hover:shadow-glow active:scale-[0.95]" aria-label="Previous slide"><FiChevronLeft className="h-5 w-5" /></button>
        <button onClick={goNext} className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200/80 bg-white/70 p-3 text-slate-700 shadow-soft backdrop-blur-md transition hover:bg-white hover:shadow-glow active:scale-[0.95]" aria-label="Next slide"><FiChevronRight className="h-5 w-5" /></button>
      </>}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {activeBanners.map((_, i) => <button key={i} onClick={() => goTo(i)} className={"h-2.5 rounded-full transition-all " + (i === currentIndex ? "w-8 bg-primary" : "w-2.5 bg-slate-300 hover:bg-slate-400")} aria-label={"Go to slide " + (i + 1)} />)}
        </div>
      )}
    </section>
  );
}
