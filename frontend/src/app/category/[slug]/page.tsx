import type { Metadata } from "next";

import { ProductListing } from "@/components/product/ProductListing";

interface Props {
  params: Promise<{ slug: string }>;
}

function titleize(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = titleize(slug);
  return {
    title: name,
    description: `Shop ${name} at SmartComputers.ke — genuine products, fast delivery and M-Pesa checkout.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return <ProductListing title={titleize(slug)} baseQuery={{ category: slug }} />;
}
