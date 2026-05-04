"use client";

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
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
  );
}
