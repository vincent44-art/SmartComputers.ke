import Link from "next/link";

import type { Brand } from "@/lib/types";

export function BrandStrip({ brands }: { brands: Brand[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          href={`/search?brand=${brand.slug}`}
          className="card px-6 py-4 text-center text-sm font-bold uppercase tracking-wide text-secondary transition hover:border-primary hover:text-primary dark:text-slate-200"
        >
          {brand.name}
        </Link>
      ))}
    </div>
  );
}
