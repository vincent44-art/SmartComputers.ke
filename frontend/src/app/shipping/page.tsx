import { ContentPage, Section } from "@/components/content/ContentPage";

export const metadata = {
  title: "Shipping & Delivery",
  description: "Delivery options, timelines and costs for SmartComputers.ke orders.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <ContentPage
      title="Shipping & Delivery"
      intro="Fast, tracked delivery across Kenya with free shipping on large orders."
    >
      <Section heading="Delivery timelines">
        <ul className="list-disc pl-6">
          <li>Nairobi &amp; environs: same-day or next-day delivery</li>
          <li>Major towns: 1–2 business days</li>
          <li>Remote areas: 2–4 business days</li>
        </ul>
      </Section>
      <Section heading="Shipping costs">
        <p>
          A flat standard shipping fee of KES 500 applies to most orders. Orders
          above KES 100,000 qualify for <strong>free delivery</strong>. Exact
          costs are calculated at checkout based on your location.
        </p>
      </Section>
      <Section heading="Order tracking">
        <p>
          Once your order ships, you&apos;ll receive an email with tracking
          details. You can also track any order from your account dashboard.
        </p>
      </Section>
    </ContentPage>
  );
}
