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

type TileProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
};

function Tile({ label, active, onClick, icon }: TileProps) {
  return (
    <button onClick={onClick} className="flex w-18 shrink-0 flex-col items-center gap-1.5">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${
          active
            ? "bg-brand-900 shadow-md shadow-brand-900/25"
            : "bg-white ring-1 ring-brand-950/10"
        }`}
      >
        {icon}
      </span>
      <span
        className={`line-clamp-2 w-full text-center text-[11px] leading-tight ${
          active ? "font-semibold text-brand-900" : "font-medium text-brand-950/55"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export default function CategoryTiles({ categories, selected, onSelect }: Props) {
  return (
    <div className="-mx-4 flex items-start gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
      <Tile
        label="Todos"
        active={selected === "all"}
        onClick={() => onSelect("all")}
        icon={
          <LayoutGrid
            size={22}
            className={selected === "all" ? "text-cream-50" : "text-brand-900/70"}
          />
        }
      />
      {categories.map((cat) => (
        <Tile
          key={cat.id}
          label={cat.name}
          active={selected === cat.slug}
          onClick={() => onSelect(cat.slug)}
          icon={<span className="text-2xl">{cat.emoji || "🧁"}</span>}
        />
      ))}
    </div>
  );
}
