import { FiTruck, FiShield, FiPhone } from "react-icons/fi";

export function AnnouncementBar() {
  return (
    <div className="bg-secondary text-slate-100">
      <div className="container-page flex h-9 items-center justify-center gap-6 text-xs font-medium sm:justify-between">
        <p className="flex items-center gap-2">
          <FiTruck className="h-3.5 w-3.5 text-accent" />
          Free delivery on orders above KES 100,000
        </p>
        <p className="hidden items-center gap-2 sm:flex">
          <FiShield className="h-3.5 w-3.5 text-success" />
          Genuine products · 1-year warranty
        </p>
        <a href="tel:+254700000000" className="hidden items-center gap-2 sm:flex hover:text-white">
          <FiPhone className="h-3.5 w-3.5 text-accent" />
          +254 700 000 000
        </a>
      </div>
    </div>
  );
}
