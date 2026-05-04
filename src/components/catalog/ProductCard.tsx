"use client";

import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
            📦
          </div>
        )}
        {product.featured && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" /> Destacado
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="text-xs text-gray-400 mb-1">{product.category?.name}</p>
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-green-600">
            ${product.price.toLocaleString("es-AR")}
          </span>
          <button
            onClick={() => addItem(product)}
            className="bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-xl p-2 transition-all"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
