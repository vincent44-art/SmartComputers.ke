import { ContentPage, Section } from "@/components/content/ContentPage";

export const metadata = {
  title: "Privacy Policy",
  description: "How SmartComputers.ke collects, uses and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro="Your privacy matters. This policy explains what data we collect and how we use it."
    >
      <Section heading="Information we collect">
        <p>
          We collect information you provide when creating an account, placing an
          order or contacting support — including your name, email, phone number
          and delivery address. We also collect limited technical data to improve
          our service.
        </p>
      </Section>
      <Section heading="How we use your data">
        <ul className="list-disc pl-6">
          <li>To process and deliver your orders</li>
          <li>To provide customer support</li>
          <li>To send order updates and, with consent, marketing</li>
          <li>To improve our website and prevent fraud</li>
        </ul>
      </Section>
      <Section heading="Data protection">
        <p>
          We use industry-standard security measures to protect your data. We
          never sell your personal information to third parties.
        </p>
      </Section>
      <Section heading="Your rights">
        <p>
          You may request access to, correction of, or deletion of your personal
          data at any time by contacting us.
        </p>
      </Section>
    </ContentPage>
  );
}
