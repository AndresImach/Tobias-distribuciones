import { prisma } from "@/lib/prisma";
import CatalogClient from "@/components/catalog/CatalogClient";
import CartButton from "@/components/cart/CartButton";
import { MapPin, Clock, Share2 } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: { where: { available: true } } } } },
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-green-600 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 font-bold text-lg shadow-sm">
              T
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Tobias Distribuciones</h1>
              <p className="text-green-100 text-xs">Distribuidora mayorista</p>
            </div>
          </div>
          <CartButton />
        </div>
      </header>

      {/* Store info banner */}
      <div className="bg-green-700 text-green-100 text-xs">
        <div className="max-w-4xl mx-auto px-4 py-2 flex gap-4 overflow-x-auto scrollbar-hide">
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock size={12} /> Lun–Sáb 8:00–18:00
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <MapPin size={12} /> Buenos Aires, Argentina
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Share2 size={12} /> @tobiasdistribuciones
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-5">
        <CatalogClient initialCategories={categories} />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        © {new Date().getFullYear()} Tobias Distribuciones
      </footer>
    </div>
  );
}
