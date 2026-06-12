"use client";

import Image from "next/image";
import { X, Star, Plus, Minus, ShoppingBag } from "lucide-react";
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
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-brand-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full animate-sheet-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:animate-scale-in sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-60 shrink-0 bg-cream-100 sm:h-72">
          <div className="absolute left-1/2 top-2.5 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-white/80 sm:hidden" />
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-8xl opacity-60">
              {product.category?.emoji || "🧁"}
            </div>
          )}
          {product.featured && (
            <span className="absolute left-3.5 top-3.5 flex items-center gap-1 rounded-full bg-caramel-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              <Star size={10} fill="currentColor" /> Destacado
            </span>
          )}
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 rounded-full bg-white/90 p-2 text-brand-950/70 shadow backdrop-blur transition-colors hover:bg-white hover:text-brand-950"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 overflow-y-auto p-5 sm:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-caramel-600">
              {product.category?.name}
            </p>
            <h2 className="mt-1 font-display text-2xl leading-snug text-brand-950">
              {product.name}
            </h2>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-brand-950/55">{product.description}</p>
          )}

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-brand-950/5 pt-4">
            {product.price ? (
              <span className="text-2xl font-bold tracking-tight text-brand-900">
                ${product.price.toLocaleString("es-AR")}
              </span>
            ) : (
              <span className="text-lg font-semibold text-brand-900/60">Consultar</span>
            )}

            {quantity === 0 ? (
              <button
                onClick={() => addItem(product)}
                className="ml-auto flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-cream-50 shadow-md shadow-brand-900/20 transition-all hover:bg-brand-700 active:scale-95"
              >
                <ShoppingBag size={16} /> Agregar al pedido
              </button>
            ) : (
              <div className="ml-auto flex items-center rounded-full bg-brand-900 text-cream-50 shadow-md shadow-brand-900/20">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="flex h-11 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  aria-label="Quitar uno"
                >
                  <Minus size={15} />
                </button>
                <span className="w-6 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="flex h-11 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  aria-label="Agregar uno"
                >
                  <Plus size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
