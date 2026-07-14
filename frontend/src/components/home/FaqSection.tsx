"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const FAQS = [
  {
    q: "Do your products come with a warranty?",
    a: "Yes. Every product ships with a minimum 1-year manufacturer warranty, and we handle claims locally for a hassle-free experience.",
  },
  {
    q: "How fast is delivery?",
    a: "Orders within Nairobi are typically delivered within 24 hours. Countrywide delivery takes 1–3 business days via trusted couriers.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept M-Pesa, Visa, Mastercard and PayPal. All payments are processed securely with bank-grade encryption.",
  },
  {
    q: "Can I return a product?",
    a: "Absolutely. We offer a 7-day return window on unopened items and a fair returns policy on defective products.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQS.map((faq, i) => (
        <div key={faq.q} className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 p-5 text-left"
          >
            <span className="font-semibold text-secondary dark:text-white">
              {faq.q}
            </span>
            <FiChevronDown
              className={`h-5 w-5 shrink-0 text-primary transition ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300">
                  {faq.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
