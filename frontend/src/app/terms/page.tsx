import { ContentPage, Section } from "@/components/content/ContentPage";

export const metadata = {
  title: "Terms of Service",
  description: "The terms and conditions governing use of SmartComputers.ke.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      intro="Please read these terms carefully before using our website or placing an order."
    >
      <Section heading="Use of our website">
        <p>
          By accessing SmartComputers.ke you agree to use the site lawfully and
          not to misuse, disrupt or attempt to gain unauthorised access to any
          part of the service.
        </p>
      </Section>
      <Section heading="Orders & pricing">
        <p>
          All prices are in Kenyan Shillings (KES) and include applicable taxes.
          We reserve the right to correct pricing errors and to cancel orders in
          cases of suspected fraud or stock unavailability.
        </p>
      </Section>
      <Section heading="Payments">
        <p>
          We accept M-Pesa, card payments and PayPal. Orders are processed once
          payment is confirmed.
        </p>
      </Section>
      <Section heading="Limitation of liability">
        <p>
          SmartComputers.ke is not liable for indirect or consequential losses
          arising from the use of our products or website, to the extent
          permitted by law.
        </p>
      </Section>
    </ContentPage>
  );
}
