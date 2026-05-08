"use client";

import Image from "next/image";
import { X, ShoppingCart, Star, Plus, Minus } from "lucide-react";
import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  onClose: () => void;
};

export default function ProductModal({ product, onClose }: Props) {
  const { addItem, updateQuantity, items } = useCartStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-56 sm:h-64 bg-amber-50 shrink-0">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🥐</div>
          )}
          {product.featured && (
            <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <Star size={10} fill="currentColor" /> Destacado
            </span>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-3">
          <div>
            <p className="text-xs text-amber-500 font-medium mb-1">{product.category?.name}</p>
            <h2 className="text-lg font-bold text-gray-800 leading-snug">{product.name}</h2>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-2xl font-bold text-amber-700">
              {product.price ? `$${product.price.toLocaleString("es-AR")}` : "Consultar"}
            </span>

            {quantity === 0 ? (
              <button
                onClick={() => addItem(product)}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all"
              >
                <ShoppingCart size={15} /> Agregar
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl px-1">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center font-bold text-amber-700">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
