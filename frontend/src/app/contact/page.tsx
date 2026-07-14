"use client";

import { useState } from "react";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  return (
    <div className="container-page max-w-5xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-secondary dark:text-white sm:text-4xl">
        Get in touch
      </h1>
      <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
        Questions about a product or your order? We&apos;re here to help.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="card flex items-center gap-4 p-5">
            <FiPhone className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-secondary dark:text-white">Call us</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                +254 700 000 000
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <FaWhatsapp className="h-6 w-6 text-success" />
            <div>
              <p className="font-semibold text-secondary dark:text-white">
                WhatsApp
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chat with us for instant support
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <FiMail className="h-6 w-6 text-accent" />
            <div>
              <p className="font-semibold text-secondary dark:text-white">Email</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                support@smartcomputers.ke
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <FiMapPin className="h-6 w-6 text-warning" />
            <div>
              <p className="font-semibold text-secondary dark:text-white">Visit</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nairobi, Kenya
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-lg font-semibold text-success">
                  Thanks for reaching out!
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  We&apos;ll get back to you within one business day.
                </p>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <input
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="input"
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <textarea
                className="input min-h-[140px]"
                placeholder="How can we help?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <button type="submit" className="btn-primary w-full">
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
