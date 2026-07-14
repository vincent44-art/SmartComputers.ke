"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/format";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const current = images[active];

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      <div className="flex gap-3 sm:flex-col">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition dark:bg-slate-800",
              active === i ? "border-primary" : "border-transparent"
            )}
            aria-label={`View image ${i + 1}`}
          >
            <Image src={img.url} alt={img.alt ?? name} fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>

      <div
        className="relative aspect-square flex-1 overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
      >
        {current && (
          <Image
            src={current.url}
            alt={current.alt ?? name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-200",
              zoom ? "scale-150" : "scale-100"
            )}
            style={{ transformOrigin: origin }}
          />
        )}
      </div>
    </div>
  );
}
