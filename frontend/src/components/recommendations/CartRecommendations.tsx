"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode, Autoplay } from "swiper/modules";
import { FiX, FiChevronLeft, FiChevronRight, FiPackage } from "react-icons/fi";

import { RecommendationCard } from "./RecommendationCard";
import { fetchRecommendations } from "@/lib/services";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useCartStore } from "@/store/useCartStore";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Rating } from "@/components/ui/Rating";
import { formatCurrency } from "@/lib/format";
import type { Product, RecommendationItem } from "@/lib/types";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */
function Toast({
  message,
  visible,
  onClose,
}: {
  message: string;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 50, x: "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 rounded-2xl bg-secondary px-6 py-3.5 text-sm font-semibold text-white shadow-soft-lg dark:bg-slate-800"
        >
          <span>✓</span>
          <span>{message}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 grid h-6 w-6 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Close toast"
          >
            <FiX className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Grid                                                      */
/* ------------------------------------------------------------------ */
function RecommendationSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty / Fallback                                                   */
/* ------------------------------------------------------------------ */
function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700"
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">
        <FiPackage className="h-6 w-6 text-slate-400" />
      </div>
      <div>
        <p className="font-semibold text-secondary dark:text-white">
          No recommendations yet
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Add more items to your cart for personalised suggestions.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="btn-ghost rounded-xl px-4 py-2 text-sm"
      >
        Hide this section
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
interface CartRecommendationsProps {
  visible: boolean;
  onClose: () => void;
}

export function CartRecommendations({ visible, onClose }: CartRecommendationsProps) {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const currency = useCurrencyStore((s) => s.currency);
  const cartItemCount = useCartStore((s) => s.cart.itemCount);
  const prevCartCount = useRef(cartItemCount);
  const fetchedRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  }, []);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchRecommendations(currency);
      setItems(data.products);
      setIsFallback(data.fallback);
      fetchedRef.current = true;
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currency]);

  // Fetch on mount
  useEffect(() => {
    if (visible) {
      loadRecommendations();
    }
  }, [visible, loadRecommendations]);

  // Re-fetch when cart changes (items added/removed)
  useEffect(() => {
    if (
      fetchedRef.current &&
      cartItemCount !== prevCartCount.current &&
      visible
    ) {
      prevCartCount.current = cartItemCount;
      loadRecommendations();
    }
  }, [cartItemCount, visible, loadRecommendations]);

  // Quick View handler
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Compare handler
  const handleCompare = useCallback((product: Product) => {
    showToast(`${product.name} added to comparison`);
  }, [showToast]);

  if (!visible) return null;

  const sectionTitle = isFallback ? "Popular Products" : "You May Also Like";
  const sectionSubtitle = isFallback
    ? "Customers also bought"
    : "Products picked based on items in your cart";

  return (
    <>
      {/* Toast */}
      <Toast
        message={toastMsg}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <section className="mt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-secondary dark:text-white">
              {sectionTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {sectionSubtitle}
            </p>
          </div>

          {/* Desktop nav buttons */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              className="recommend-prev grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-700"
              aria-label="Previous"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="recommend-next grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-700"
              aria-label="Next"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <RecommendationSkeleton />
        ) : error ? (
          <EmptyState onClose={onClose} />
        ) : items.length === 0 ? (
          <EmptyState onClose={onClose} />
        ) : (
          <>
            {/* Mobile: Swiper Carousel */}
            <div className="block sm:hidden">
              <Swiper
                modules={[Navigation, FreeMode, Autoplay]}
                freeMode
                spaceBetween={12}
                slidesPerView={1.3}
                autoplay={false}
                className="!px-1 !py-2"
              >
                {items.map((rec, idx) => (
                  <SwiperSlide key={rec.product.id} className="h-auto">
                    <RecommendationCard
                      product={rec.product}
                      position={idx}
                      onQuickView={setQuickViewProduct}
                      onCompare={handleCompare}
                      onToast={showToast}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Desktop: Grid with custom navigation via Swiper */}
            <div className="hidden sm:block">
              <Swiper
                modules={[Navigation, FreeMode, Autoplay]}
                navigation={{
                  prevEl: ".recommend-prev",
                  nextEl: ".recommend-next",
                }}
                freeMode
                spaceBetween={16}
                slidesPerView={2}
                autoplay={false}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                  1280: { slidesPerView: 5 },
                }}
                className="!px-1 !py-2"
              >
                {items.map((rec, idx) => (
                  <SwiperSlide key={rec.product.id} className="h-auto">
                    <RecommendationCard
                      product={rec.product}
                      position={idx}
                      onQuickView={setQuickViewProduct}
                      onCompare={handleCompare}
                      onToast={showToast}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </>
        )}
      </section>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setQuickViewProduct(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-soft-lg dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800"
              >
                <FiX className="h-4 w-4" />
              </button>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-48">
                  {quickViewProduct.thumbnail && (
                    <Image
                      src={quickViewProduct.thumbnail}
                      alt={quickViewProduct.name}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  {quickViewProduct.brand && (
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                      {quickViewProduct.brand.name}
                    </span>
                  )}
                  <h3 className="mt-1 text-lg font-bold text-secondary dark:text-white">
                    {quickViewProduct.name}
                  </h3>
                  <Rating
                    value={quickViewProduct.ratingAvg}
                    count={quickViewProduct.ratingCount}
                    size="md"
                  />
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-secondary dark:text-white">
                      {formatCurrency(
                        quickViewProduct.price,
                        quickViewProduct.currency
                      )}
                    </span>
                    {quickViewProduct.compareAtPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(
                          quickViewProduct.compareAtPrice,
                          quickViewProduct.currency
                        )}
                      </span>
                    )}
                  </div>
                  {quickViewProduct.shortDescription && (
                    <p className="mt-2 text-sm text-slate-500 line-clamp-3">
                      {quickViewProduct.shortDescription}
                    </p>
                  )}
                  <div className="mt-auto flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={async () => {
                        const { add } = await import(
                          "@/store/useCartStore"
                        ).then((m) => m.useCartStore.getState());
                        await add(quickViewProduct.id, 1);
                        showToast(`${quickViewProduct.name} added to cart`);
                        setQuickViewProduct(null);
                      }}
                      className="btn-primary flex-1 rounded-xl py-2.5 text-sm"
                    >
                      Add to Cart
                    </button>
                    <Link
                      href={`/product/${quickViewProduct.slug}`}
                      className="btn-ghost flex-1 rounded-xl py-2.5 text-center text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}



