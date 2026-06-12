"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export default function CartButton() {
  const { openCart, itemCount } = useCartStore();
  const count = itemCount();

  return (
    <button
      onClick={openCart}
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-cream-50 shadow-sm transition-all hover:bg-brand-700 active:scale-95"
      aria-label="Ver pedido"
    >
      <ShoppingBag size={18} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
