"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function CategoryFilter({ categories, selected, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  const pillClass = (active: boolean) =>
    `flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
      active
        ? "bg-brand-900 text-cream-50 shadow-md shadow-brand-900/20"
        : "bg-white text-brand-900/70 ring-1 ring-brand-950/10 hover:text-brand-900 hover:ring-brand-400/60"
    }`;

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        onClick={() => scroll(-1)}
        className={`hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-brand-900/60 shadow-sm ring-1 ring-brand-950/10 transition-opacity hover:text-brand-900 sm:flex ${canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!canScrollLeft}
        tabIndex={canScrollLeft ? 0 : -1}
      >
        <ChevronLeft size={16} />
      </button>

      <div ref={scrollRef} className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => onSelect("all")} className={pillClass(selected === "all")}>
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.slug)}
            className={pillClass(selected === cat.slug)}
          >
            {cat.emoji && <span>{cat.emoji}</span>}
            {cat.name}
            {cat._count && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  selected === cat.slug
                    ? "bg-white/15 text-cream-50"
                    : "bg-cream-100 text-brand-900/50"
                }`}
              >
                {cat._count.products}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => scroll(1)}
        className={`hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-brand-900/60 shadow-sm ring-1 ring-brand-950/10 transition-opacity hover:text-brand-900 sm:flex ${canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!canScrollRight}
        tabIndex={canScrollRight ? 0 : -1}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
