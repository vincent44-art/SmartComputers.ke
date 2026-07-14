"use client";

import { useState } from "react";
import { FiSend } from "react-icons/fi";

import { subscribeNewsletter } from "@/lib/services";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="text-center sm:text-left">
        <h3 className="text-lg font-bold text-secondary dark:text-white">
          Join the SmartComputers newsletter
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Exclusive deals, flash sales and new arrivals — straight to your inbox.
        </p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email.includes("@")) return;
          try {
            await subscribeNewsletter(email);
          } catch {
            /* non-blocking: still confirm to the user */
          }
          setSubscribed(true);
        }}
        className="flex w-full max-w-md items-center gap-2"
      >
        {subscribed ? (
          <p className="text-sm font-semibold text-success">
            Thanks for subscribing! 🎉
          </p>
        ) : (
          <>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="input"
              aria-label="Email address"
            />
            <button type="submit" className="btn-primary shrink-0">
              <FiSend className="h-4 w-4" /> Subscribe
            </button>
          </>
        )}
      </form>
    </div>
  );
}
