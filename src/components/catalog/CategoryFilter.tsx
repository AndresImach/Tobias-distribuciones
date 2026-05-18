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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={() => scroll(-1)}
        className={`flex-shrink-0 w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!canScrollLeft}
      >
        <ChevronLeft size={15} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1"
      >
        <button
          onClick={() => onSelect("all")}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === "all"
              ? "bg-green-500 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-green-300"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.slug)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              selected === cat.slug
                ? "bg-green-500 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-green-300"
            }`}
          >
            {cat.emoji && <span>{cat.emoji}</span>}
            {cat.name}
            {cat._count && (
              <span className={`text-xs rounded-full px-1.5 ${selected === cat.slug ? "bg-green-400" : "bg-gray-100 text-gray-500"}`}>
                {cat._count.products}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => scroll(1)}
        className={`flex-shrink-0 w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!canScrollRight}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
