import { BrandStrip } from "@/components/home/BrandStrip";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { FaqSection } from "@/components/home/FaqSection";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { Hero } from "@/components/home/Hero";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { Testimonials } from "@/components/home/Testimonials";
import { TrustBadges } from "@/components/home/TrustBadges";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fetchCategories, fetchProducts } from "@/lib/services";
import type { Brand, Category, Product } from "@/lib/types";

export const revalidate = 60;

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [categories, featured, bestSellers, flashSale, latest] = await Promise.all([
    safe<Category[]>(fetchCategories(), []),
    safe(fetchProducts({ featured: true, perPage: 8 }), { items: [], meta: {} as never }),
    safe(fetchProducts({ bestSeller: true, perPage: 8 }), { items: [], meta: {} as never }),
    safe(fetchProducts({ flashSale: true, perPage: 8 }), { items: [], meta: {} as never }),
    safe(fetchProducts({ sort: "newest", perPage: 8 }), { items: [], meta: {} as never }),
  ]);

  const brands: Brand[] = Array.from(
    new Map(
      // Take a larger set by combining multiple product queries.
      [...latest.items, ...featured.items, ...bestSellers.items]
        .map((p: Product) => p.brand)
        .filter((b): b is Brand => Boolean(b))
        .map((b) => [b.id, b])
    ).values()
  );


  return (
    <>
      <Hero />

      <section className="container-page py-8">
        <TrustBadges />
      </section>

      <section className="container-page py-8">
        <SectionHeader
          title="Shop by category"
          subtitle="Find exactly what you need, faster"
        />
        <CategoryShowcase categories={categories} />
      </section>

      <section className="container-page py-8">
        <SectionHeader title="Featured products" subtitle="Handpicked by our team" href="/search?featured=true" />
        <ProductCarousel products={featured.items} />
      </section>

      <section className="container-page py-8">
        <FlashSaleBanner />
        <div className="mt-8">
          <SectionHeader title="Flash sale deals" href="/deals" />
          <ProductCarousel products={flashSale.items.length ? flashSale.items : latest.items} />
        </div>
      </section>

      <section className="container-page py-8">
        <SectionHeader title="Best sellers" subtitle="Our most-loved products" href="/search?bestSeller=true" />
        <ProductCarousel products={bestSellers.items} />
      </section>

      <section className="container-page py-8">
        <SectionHeader title="Latest arrivals" subtitle="Fresh in stock" href="/search" />
        <ProductCarousel products={latest.items} />
      </section>

      {brands.length > 0 && (
        <section className="container-page py-8">
          <SectionHeader title="Featured brands" />
          {/* Shows more brands and moves them right-to-left under the banner */}
          <BrandStrip brands={brands} />
        </section>
      )}


      <RecentlyViewed />

      <section className="container-page py-12">
        <SectionHeader title="What our customers say" subtitle="Rated 4.9/5 by thousands of shoppers" />
        <Testimonials />
      </section>

      <section id="faq" className="container-page py-12">
        <SectionHeader title="Frequently asked questions" />
        <FaqSection />
      </section>
    </>
  );
}
