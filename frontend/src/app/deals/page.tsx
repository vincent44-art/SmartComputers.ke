import { ProductListing } from "@/components/product/ProductListing";

export const metadata = {
  title: "Today's Deals",
  description:
    "Grab the best deals on laptops, gaming gear and accessories at SmartComputers.ke.",
  alternates: { canonical: "/deals" },
};

export default function DealsPage() {
  return <ProductListing title="Today's Deals" baseQuery={{ flashSale: true }} />;
}
