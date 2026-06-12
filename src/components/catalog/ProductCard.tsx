"use client";

import Image from "next/image";
import { Star, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  onOpenModal: () => void;
};

export default function ProductCard({ product, onOpenModal }: Props) {
  const { addItem, updateQuantity, items } = useCartStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  return (
    <div
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-950/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-950/10 hover:ring-brand-950/10"
      onClick={onOpenModal}
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-cream-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl opacity-60">
            {product.category?.emoji || "🧁"}
          </div>
        )}
        {product.featured && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-caramel-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            <Star size={10} fill="currentColor" /> Destacado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-caramel-600">
          {product.category?.name}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-brand-950">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-brand-950/45">{product.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          {product.price ? (
            <span className="text-lg font-bold tracking-tight text-brand-900">
              ${product.price.toLocaleString("es-AR")}
            </span>
          ) : (
            <span className="text-sm font-semibold text-brand-900/60">Consultar</span>
          )}

          {quantity === 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); addItem(product); }}
              className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-cream-50 shadow-sm transition-all hover:bg-brand-700 active:scale-90"
              aria-label={`Agregar ${product.name} al pedido`}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          ) : (
            <div
              className="ml-auto flex shrink-0 items-center rounded-full bg-brand-900 text-cream-50 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="flex h-9 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                aria-label="Quitar uno"
              >
                <Minus size={13} />
              </button>
              <span className="w-5 text-center text-sm font-bold">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="flex h-9 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                aria-label="Agregar uno"
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
