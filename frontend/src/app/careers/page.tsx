import { ContentPage, Section } from "@/components/content/ContentPage";

export const metadata = {
  title: "Careers",
  description: "Join the SmartComputers.ke team and help shape the future of tech retail in Kenya.",
  alternates: { canonical: "/careers" },
};

const OPENINGS = [
  {
    role: "Frontend Engineer",
    type: "Full-time · Nairobi / Remote",
    desc: "Build delightful, high-performance storefront experiences with Next.js and React.",
  },
  {
    role: "Customer Success Associate",
    type: "Full-time · Nairobi",
    desc: "Delight customers before, during and after every purchase.",
  },
  {
    role: "Warehouse & Logistics Lead",
    type: "Full-time · Nairobi",
    desc: "Own fulfilment operations and ensure fast, accurate deliveries.",
  },
];

export default function CareersPage() {
  return (
    <ContentPage
      title="Careers"
      intro="We're a fast-growing team obsessed with great products and great service. Come build with us."
    >
      <Section heading="Open positions">
        <div className="not-prose mt-2 space-y-4">
          {OPENINGS.map((job) => (
            <div key={job.role} className="card p-5">
              <h3 className="font-bold text-secondary dark:text-white">
                {job.role}
              </h3>
              <p className="text-sm text-primary">{job.type}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {job.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>
      <Section heading="How to apply">
        <p>
          Send your CV and a short note about why you&apos;d be a great fit to{" "}
          <a href="mailto:careers@smartcomputers.ke" className="text-primary">
            careers@smartcomputers.ke
          </a>
          .
        </p>
      </Section>
    </ContentPage>
  );
}
