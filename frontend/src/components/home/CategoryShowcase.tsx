import Link from "next/link";
import { FiBook, FiBriefcase, FiMonitor, FiPrinter, FiWifi } from "react-icons/fi";
import { FaApple, FaGamepad, FaKeyboard, FaLaptop } from "react-icons/fa6";
import type { IconType } from "react-icons";

import type { Category } from "@/lib/types";

const ICONS: Record<string, IconType> = {
  laptop: FaLaptop,
  gamepad: FaGamepad,
  apple: FaApple,
  monitor: FiMonitor,
  printer: FiPrinter,
  keyboard: FaKeyboard,
  wifi: FiWifi,
  briefcase: FiBriefcase,
  book: FiBook,
};

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {categories.map((c) => {
        const Icon = ICONS[c.icon ?? ""] ?? FaLaptop;
        return (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="card group flex flex-col items-center gap-3 p-5 text-center hover:border-primary hover:shadow-glow"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-secondary dark:text-slate-100">
              {c.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
