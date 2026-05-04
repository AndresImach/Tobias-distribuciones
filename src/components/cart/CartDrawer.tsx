"use client";

import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";
import CheckoutModal from "./CheckoutModal";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isOpen) return null;

  const cartTotal = total();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeCart} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag size={20} className="text-green-500" />
            Tu pedido
            {itemCount() > 0 && (
              <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount()}
              </span>
            )}
          </h2>
          <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{product.name}</p>
                  <p className="text-green-600 font-semibold text-sm mt-0.5">
                    ${(product.price * quantity).toLocaleString("es-AR")}
                  </p>
                  <p className="text-xs text-gray-400">${product.price.toLocaleString("es-AR")} c/u</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(product.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t bg-white">
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-xl text-green-600">
                ${cartTotal.toLocaleString("es-AR")}
              </span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Confirmar pedido por WhatsApp
            </button>
          </div>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={() => { setShowCheckout(false); closeCart(); }}
        />
      )}
    </>
  );
}
