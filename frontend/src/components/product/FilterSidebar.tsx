"use client";

import { FiX } from "react-icons/fi";

import { formatCurrency } from "@/lib/format";
import type { Facets } from "@/lib/types";

export interface FilterState {
  brand: string[];
  ram: string[];
  storage: string[];
  condition: string[];
  maxPrice?: number;
  inStock: boolean;
}

function CheckGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="border-b border-slate-200 py-4 dark:border-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-secondary dark:text-white">
        {title}
      </h3>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="capitalize">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function FilterSidebar({
  facets,
  filters,
  onChange,
  onClear,
}: {
  facets: Facets;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}) {
  const toggle = (key: keyof FilterState, value: string) => {
    const list = filters[key] as string[];
    const next = list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <aside className="space-y-1">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-secondary dark:text-white">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary"
        >
          <FiX className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      <CheckGroup
        title="Brand"
        options={facets.brands.map((b) => b.slug)}
        selected={filters.brand}
        onToggle={(v) => toggle("brand", v)}
      />
      <CheckGroup
        title="RAM"
        options={facets.ram}
        selected={filters.ram}
        onToggle={(v) => toggle("ram", v)}
      />
      <CheckGroup
        title="Storage"
        options={facets.storage}
        selected={filters.storage}
        onToggle={(v) => toggle("storage", v)}
      />
      <CheckGroup
        title="Condition"
        options={facets.condition}
        selected={filters.condition}
        onToggle={(v) => toggle("condition", v)}
      />

      <div className="border-b border-slate-200 py-4 dark:border-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-secondary dark:text-white">
          Max price: {formatCurrency(filters.maxPrice ?? facets.priceRange.max)}
        </h3>
        <input
          type="range"
          min={facets.priceRange.min}
          max={facets.priceRange.max}
          value={filters.maxPrice ?? facets.priceRange.max}
          onChange={(e) =>
            onChange({ ...filters, maxPrice: Number(e.target.value) })
          }
          className="w-full accent-[#2563EB]"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 py-4 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={() => onChange({ ...filters, inStock: !filters.inStock })}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        In stock only
      </label>
    </aside>
  );
}
