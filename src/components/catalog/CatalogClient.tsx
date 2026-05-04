"use client";

import { useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";
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

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter
        categories={initialCategories}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
      />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <span className="text-5xl mb-3">🔍</span>
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm mt-1">
            {search ? `No hay productos para "${search}"` : "No hay productos en esta categoría"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
