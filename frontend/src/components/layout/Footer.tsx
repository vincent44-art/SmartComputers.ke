import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaWhatsapp,
} from "react-icons/fa6";

import { NewsletterForm } from "./NewsletterForm";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "Laptops", href: "/category/laptops" },
      { label: "Gaming", href: "/category/gaming" },
      { label: "Apple", href: "/category/apple" },
      { label: "Monitors", href: "/category/monitors" },
      { label: "Accessories", href: "/category/accessories" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Shipping & Delivery", href: "/shipping" },
      { label: "Returns & Warranty", href: "/returns" },
      { label: "FAQ", href: "/#faq" },
      { label: "Track Order", href: "/account/orders" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-secondary dark:text-white">
            Smart<span className="text-primary">Computers</span>
            <span className="text-accent">.ke</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Kenya&apos;s premium destination for laptops, gaming gear, Apple
            products and accessories. Genuine products, fast delivery and secure
            M-Pesa checkout.
          </p>
          <div className="mt-6 flex gap-3">
            {[FaFacebookF, FaXTwitter, FaInstagram, FaWhatsapp].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-secondary transition hover:bg-primary hover:text-white dark:bg-slate-800 dark:text-slate-200"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary dark:text-white">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="container-page py-8">
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-500 dark:text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} SmartComputers.ke. All rights reserved.</p>
          <p>We accept M-Pesa · Visa · Mastercard · PayPal</p>
        </div>
      </div>
    </footer>
  );
}
