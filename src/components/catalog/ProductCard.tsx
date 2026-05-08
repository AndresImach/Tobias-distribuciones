"use client";

import Image from "next/image";
import { ShoppingCart, Star, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, updateQuantity, items } = useCartStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-square bg-amber-50 overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🥐
          </div>
        )}
        {product.featured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" /> Destacado
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="text-xs text-amber-500 mb-1 font-medium">{product.category?.name}</p>
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-amber-700">
            {product.price ? `$${product.price.toLocaleString("es-AR")}` : "Consultar"}
          </span>

          {quantity === 0 ? (
            <button
              onClick={() => addItem(product)}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl p-2 transition-all"
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <ShoppingCart size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl px-1">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="w-7 h-7 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <Minus size={13} />
              </button>
              <span className="w-5 text-center text-sm font-bold text-amber-700">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="w-7 h-7 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
