"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export default function CartButton() {
  const { openCart, itemCount } = useCartStore();
  const count = itemCount();

  return (
    <button
      onClick={openCart}
      className="relative p-2 hover:bg-white/10 rounded-xl transition-colors"
      aria-label="Ver carrito"
    >
      <ShoppingCart size={24} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
