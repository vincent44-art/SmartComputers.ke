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
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-secondary dark:text-white"
          >
            Smart<span className="text-primary">Computers</span>
            <span className="text-accent">.ke</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Kenya&apos;s premium destination for laptops, gaming gear, Apple
            products and accessories. Genuine products, fast delivery and secure
            M-Pesa checkout.
          </p>

          <div className="mt-6 grid gap-4">
            <div className="flex gap-3">
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


            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-sm font-semibold text-secondary dark:text-white">
                Shop location
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Rahimtulla Trust Building, Nairobi, Kenya
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d641.9272748224215!2d36.81895387755239!3d-1.2778891003080493!2m3!1f0!2f0!3f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d455bedc39%3A0xc82ecc0d6a95e269!2sRahimtulla%20Trust%20Building!5e0!3m2!1sen!2ske!4v1784138539327!5m2!1sen!2ske"
                  width="100%"
                  height="160"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
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
