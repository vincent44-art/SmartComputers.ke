import { FiCreditCard, FiHeadphones, FiRefreshCw, FiTruck } from "react-icons/fi";

const BADGES = [
  { icon: FiTruck, title: "Fast delivery", desc: "24h within Nairobi" },
  { icon: FiRefreshCw, title: "Easy returns", desc: "7-day return policy" },
  { icon: FiCreditCard, title: "Secure payment", desc: "M-Pesa, card & PayPal" },
  { icon: FiHeadphones, title: "Expert support", desc: "Mon–Sat, 8am–6pm" },
];

export function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {BADGES.map((b) => (
        <div key={b.title} className="card flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <b.icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-secondary dark:text-white">{b.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
