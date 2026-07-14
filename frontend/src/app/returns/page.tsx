import { ContentPage, Section } from "@/components/content/ContentPage";

export const metadata = {
  title: "Returns & Warranty",
  description: "Our return policy and warranty coverage for SmartComputers.ke products.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <ContentPage
      title="Returns & Warranty"
      intro="Shop with confidence — every product is covered by a warranty and a fair returns policy."
    >
      <Section heading="14-day returns">
        <p>
          If you&apos;re not satisfied, you may return most items within 14 days
          of delivery for a refund or exchange, provided they are in original
          condition with all packaging and accessories.
        </p>
      </Section>
      <Section heading="Warranty">
        <p>
          All products carry a manufacturer warranty (typically 12 months unless
          otherwise stated on the product page). Warranty claims are handled
          quickly through our support team.
        </p>
      </Section>
      <Section heading="How to start a return">
        <ol className="list-decimal pl-6">
          <li>Contact our support team with your order number.</li>
          <li>We&apos;ll issue a return authorisation and instructions.</li>
          <li>Once received and inspected, your refund is processed within 5–7 days.</li>
        </ol>
      </Section>
    </ContentPage>
  );
}
