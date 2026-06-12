"use client";

import { LayoutGrid } from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  _count?: { products: number };
};

type Props = {
  categories: Category[];
  selected: string;
  onSelect: (slug: string) => void;
};

export default function CategorySidebar({ categories, selected, onSelect }: Props) {
  const itemClass = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-brand-900 text-cream-50 shadow-sm"
        : "text-brand-950/70 hover:bg-cream-100 hover:text-brand-950"
    }`;

  const iconClass = (active: boolean) =>
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${
      active ? "bg-white/10" : "bg-cream-100"
    }`;

  return (
    <nav className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-brand-950/5">
      <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-950/40">
        Categorías
      </p>
      <ul className="space-y-1">
        <li>
          <button onClick={() => onSelect("all")} className={itemClass(selected === "all")}>
            <span className={iconClass(selected === "all")}>
              <LayoutGrid size={15} />
            </span>
            <span className="flex-1 truncate text-left">Todos los productos</span>
          </button>
        </li>
        {categories.map((cat) => {
          const active = selected === cat.slug;
          return (
            <li key={cat.id}>
              <button onClick={() => onSelect(cat.slug)} className={itemClass(active)}>
                <span className={iconClass(active)}>{cat.emoji || "🧁"}</span>
                <span className="flex-1 truncate text-left">{cat.name}</span>
                {cat._count && (
                  <span
                    className={`text-xs font-semibold ${
                      active ? "text-cream-50/70" : "text-brand-950/35"
                    }`}
                  >
                    {cat._count.products}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
