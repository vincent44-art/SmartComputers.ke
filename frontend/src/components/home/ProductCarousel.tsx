"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";

import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

export function ProductCarousel({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <Swiper
      modules={[Navigation, FreeMode]}
      navigation
      freeMode
      spaceBetween={16}
      slidesPerView={1.2}
      breakpoints={{
        640: { slidesPerView: 2.2 },
        768: { slidesPerView: 3.2 },
        1024: { slidesPerView: 4 },
      }}
      className="!px-1 !py-2"
    >
      {products.map((product) => (
        <SwiperSlide key={product.id} className="h-auto">
          <ProductCard product={product} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
