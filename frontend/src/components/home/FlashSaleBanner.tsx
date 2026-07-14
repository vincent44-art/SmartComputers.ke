"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState(() => target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRemaining(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const clamped = Math.max(remaining, 0);
  return {
    hours: Math.floor(clamped / 3.6e6),
    minutes: Math.floor((clamped % 3.6e6) / 6e4),
    seconds: Math.floor((clamped % 6e4) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function FlashSaleBanner() {
  const [target] = useState(() => new Date(Date.now() + 1000 * 60 * 60 * 8));
  const { hours, minutes, seconds } = useCountdown(target);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-8 text-white sm:p-12">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <span className="badge bg-white/20 text-white">⚡ Limited time</span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Flash Sale — up to 25% off
          </h2>
          <p className="mt-2 max-w-md text-white/90">
            Grab premium laptops and accessories at their best prices. Hurry, the
            deals end soon!
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-white/90">
            <FiClock /> Ends in
          </div>
          <div className="flex gap-2">
            {[
              { v: hours, l: "Hrs" },
              { v: minutes, l: "Min" },
              { v: seconds, l: "Sec" },
            ].map((t) => (
              <div
                key={t.l}
                className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur"
              >
                <span className="text-2xl font-bold">{pad(t.v)}</span>
                <span className="text-[10px] uppercase text-white/80">{t.l}</span>
              </div>
            ))}
          </div>
          <Link href="/deals" className="btn bg-white text-primary hover:bg-slate-100">
            Shop the sale
          </Link>
        </div>
      </div>
    </div>
  );
}
