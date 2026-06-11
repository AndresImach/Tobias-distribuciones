"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export default function MobileCartBar() {
  const { items, isOpen, openCart } = useCartStore();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  if (count === 0 || isOpen) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
      <button
        onClick={openCart}
        className="flex w-full animate-fade-up items-center justify-between rounded-full bg-brand-900 py-3.5 pl-5 pr-5 text-cream-50 shadow-xl shadow-brand-950/30 transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold">
          <ShoppingBag size={17} />
          Ver pedido
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold">{count}</span>
        </span>
        <span className="text-sm font-bold">${total.toLocaleString("es-AR")}</span>
      </button>
    </div>
  );
}
