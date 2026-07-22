import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedBrandsMarquee } from "@/components/home/FeaturedBrandsMarquee";
import { FlashSaleBanner } from "@/components/home/FlashSaleBanner";
import { Hero } from "@/components/home/Hero";
import { MarqueeCategories } from "@/components/home/MarqueeCategories";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { Testimonials } from "@/components/home/Testimonials";
import { TrustBadges } from "@/components/home/TrustBadges";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fetchHomePage } from "@/lib/services";
import type { Category } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  // CurrencySelect stores the preference in localStorage; home page is a server
  // component so we can't read it directly here.
  // The runtime will fetch currency-aware data on the client-side listing
  // components; this keeps server rendering stable.

  const [homeData] = await Promise.all([
    fetchHomePage().catch((e) => {
      console.error("[HomePage] fetchHomePage failed:", e);
      return null;
    }),
  ]);

  const categories: Category[] = homeData?.categories ?? [];
  const featured = homeData?.featured ?? [];
  const bestSellers = homeData?.bestSellers ?? [];
  const flashSale = homeData?.flashSale ?? [];
  const latest = homeData?.latest ?? [];



  return (
    <>
      <Hero />

      <section className="container-page py-8">
        <TrustBadges />
      </section>

      <FeaturedBrandsMarquee />

      <section className="bg-[#F8F9FA] py-12">
        <div className="container-page">
          <SectionHeader
            title="Shop by category"
            subtitle="Find exactly what you need, faster"
          />
          <MarqueeCategories categories={categories} />
        </div>
      </section>

      <section className="container-page py-8">
        <SectionHeader title="Featured products" subtitle="Handpicked by our team" href="/search?featured=true" />
        <ProductCarousel products={featured} />
      </section>

      <section className="container-page py-8">
        <FlashSaleBanner />
        <div className="mt-8">
          <SectionHeader title="Flash sale deals" href="/deals" />
          <ProductCarousel products={flashSale.length ? flashSale : latest} />
        </div>
      </section>

      <section className="container-page py-8">
        <SectionHeader title="Best sellers" subtitle="Our most-loved products" href="/search?bestSeller=true" />
        <ProductCarousel products={bestSellers} />
      </section>

      <section className="container-page py-8">
        <SectionHeader title="Latest arrivals" subtitle="Fresh in stock" href="/search" />
        <ProductCarousel products={latest} />
      </section>

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
