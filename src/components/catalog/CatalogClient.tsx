"use client";

import { useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import CategoryFilter from "./CategoryFilter";
import SearchBar from "./SearchBar";
import type { Product } from "@/lib/types";

type Category = {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  _count?: { products: number };
};

type Props = {
  initialCategories: Category[];
};

export default function CatalogClient({ initialCategories }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (search) params.set("search", search);

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, [selectedCategory, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchProducts, search]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    setSearch("");
  };

  const activeCategory = initialCategories.find((c) => c.slug === selectedCategory);
  const title = search
    ? `Resultados para “${search}”`
    : activeCategory
      ? activeCategory.name
      : "Todos los productos";

  return (
    <div>
      {/* Sticky toolbar: search + categories */}
      <div className="sticky top-16 z-20 -mx-4 space-y-3 bg-cream-50/95 px-4 pb-2 pt-4 backdrop-blur-md">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter
          categories={initialCategories}
          selected={selectedCategory}
          onSelect={handleCategorySelect}
        />
      </div>

      <div className="mt-4 sm:mt-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl text-brand-950 sm:text-2xl">
            {activeCategory?.emoji && !search ? `${activeCategory.emoji} ` : ""}
            {title}
          </h2>
          {!loading && (
            <span className="shrink-0 text-sm text-brand-950/45">
              {products.length} {products.length === 1 ? "producto" : "productos"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-brand-950/5">
                <div className="aspect-square animate-pulse bg-cream-100" />
                <div className="space-y-2 p-3.5">
                  <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-cream-100" />
                  <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-cream-100" />
                  <div className="h-5 w-1/2 animate-pulse rounded-full bg-cream-100" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-brand-950/5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-3xl">
              🔍
            </div>
            <p className="mt-4 font-semibold text-brand-950">No encontramos productos</p>
            <p className="mt-1 text-sm text-brand-950/50">
              {search
                ? `No hay resultados para “${search}”`
                : "No hay productos en esta categoría por ahora"}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
              }}
              className="mt-5 rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-brand-700"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div
            key={`${selectedCategory}-${search}`}
            className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
          >
            {products.map((product, i) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
              >
                <ProductCard product={product} onOpenModal={() => setModalProduct(product)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {modalProduct && (
        <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
      )}
    </div>
  );
}
