"use client";

import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-950/35"
      />
      <input
        type="text"
        placeholder="Buscar harinas, chocolates, esencias…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-full bg-white pl-11 pr-11 text-[15px] text-brand-950 shadow-sm ring-1 ring-brand-950/10 transition-shadow placeholder:text-brand-950/35 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-cream-100 p-1.5 text-brand-950/50 transition-colors hover:bg-cream-200 hover:text-brand-950"
          aria-label="Limpiar búsqueda"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
