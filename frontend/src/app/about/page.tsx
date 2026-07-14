import { ContentPage, Section } from "@/components/content/ContentPage";

export const metadata = {
  title: "About Us",
  description:
    "SmartComputers.ke is Kenya's premium destination for laptops, gaming gear and Apple products.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About SmartComputers.ke"
      intro="We're on a mission to make premium technology accessible, affordable and reliable for everyone in Kenya."
    >
      <Section heading="Who we are">
        <p>
          SmartComputers.ke is a modern technology retailer specialising in
          laptops, desktops, gaming hardware, Apple products, monitors, printers
          and accessories. We combine a carefully curated catalogue of genuine
          products with fast nationwide delivery and secure M-Pesa checkout.
        </p>
      </Section>
      <Section heading="Why shop with us">
        <ul className="list-disc pl-6">
          <li>100% genuine products with manufacturer warranties</li>
          <li>Fast, reliable delivery across all 47 counties</li>
          <li>Secure payments via M-Pesa, card and PayPal</li>
          <li>Expert advice and after-sales support</li>
          <li>Competitive pricing and regular flash sales</li>
        </ul>
      </Section>
      <Section heading="Our promise">
        <p>
          Every device we sell is quality-checked before dispatch. If something
          isn&apos;t right, our friendly support team is here to make it right —
          quickly and hassle-free.
        </p>
      </Section>
    </ContentPage>
  );
}
