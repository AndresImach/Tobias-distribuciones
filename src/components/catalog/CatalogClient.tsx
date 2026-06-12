"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Star, ChevronDown } from "lucide-react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import CategorySidebar from "./CategorySidebar";
import CategoryTiles from "./CategoryTiles";
import SearchBar from "./SearchBar";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
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
  waHref?: string | null;
};

type Sort = "relevance" | "price-asc" | "price-desc" | "name";

export default function CatalogClient({ initialCategories, waHref }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");
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

  const sortedProducts = useMemo(() => {
    const arr = [...products];
    switch (sort) {
      case "price-asc":
        arr.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
        break;
      case "price-desc":
        arr.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "name":
        arr.sort((a, b) => a.name.localeCompare(b.name, "es"));
        break;
    }
    return arr;
  }, [products, sort]);

  const featured = useMemo(() => products.filter((p) => p.featured), [products]);
  const showFeatured = selectedCategory === "all" && !search && !loading && featured.length > 0;

  const activeCategory = initialCategories.find((c) => c.slug === selectedCategory);
  const title = search
    ? `Resultados para “${search}”`
    : activeCategory
      ? `${activeCategory.emoji ? `${activeCategory.emoji} ` : ""}${activeCategory.name}`
      : "Todos los productos";

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:pt-8">
      {/* Desktop sidebar */}
      <aside className="hidden space-y-5 lg:block">
        <CategorySidebar
          categories={initialCategories}
          selected={selectedCategory}
          onSelect={handleCategorySelect}
        />
        {waHref && (
          <div className="rounded-2xl bg-brand-950 p-5">
            <p className="font-display text-lg text-cream-50">¿No encontrás algo?</p>
            <p className="mt-1.5 text-xs leading-relaxed text-cream-50/60">
              Escribinos y te ayudamos a armar tu pedido a medida.
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-wa-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-wa-700"
            >
              <WhatsAppIcon className="h-4 w-4" /> Consultar por WhatsApp
            </a>
          </div>
        )}
      </aside>

      <div>
        {/* Search: sticky on mobile, static in column on desktop */}
        <div className="sticky top-16 z-20 -mx-4 bg-cream-50/95 px-4 pb-3 pt-4 backdrop-blur-md lg:static lg:m-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Mobile category tiles */}
        <div className="mt-3 lg:hidden">
          <CategoryTiles
            categories={initialCategories}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </div>

        {/* Featured carousel */}
        {showFeatured && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Star size={16} className="text-caramel-500" fill="currentColor" />
              <h3 className="font-display text-lg text-brand-950">Destacados</h3>
            </div>
            <div className="-mx-4 flex snap-x items-stretch gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide lg:mx-0 lg:px-0">
              {featured.map((product) => (
                <div key={product.id} className="w-40 shrink-0 snap-start sm:w-44">
                  <ProductCard product={product} onOpenModal={() => setModalProduct(product)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grid header: title + count + sort */}
        <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h2 className="font-display text-xl text-brand-950 sm:text-2xl">{title}</h2>
            {!loading && (
              <span className="text-sm text-brand-950/45">{sortedProducts.length}</span>
            )}
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 cursor-pointer appearance-none rounded-full bg-white pl-4 pr-9 text-sm font-medium text-brand-950/75 ring-1 ring-brand-950/10 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Ordenar productos"
            >
              <option value="relevance">Destacados primero</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name">A–Z</option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-950/40"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
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
        ) : sortedProducts.length === 0 ? (
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
            key={`${selectedCategory}-${search}-${sort}`}
            className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4"
          >
            {sortedProducts.map((product, i) => (
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
