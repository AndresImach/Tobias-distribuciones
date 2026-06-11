"use client";

import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";
import CheckoutModal from "./CheckoutModal";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isOpen) return null;

  const cartTotal = total();

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-fade-in bg-brand-950/60 backdrop-blur-sm"
        onClick={closeCart}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md animate-slide-in-right flex-col bg-cream-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-950/5 bg-white px-5 py-4">
          <h2 className="flex items-center gap-2.5 font-display text-xl text-brand-950">
            Tu pedido
            {itemCount() > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-900 px-1.5 text-xs font-bold text-cream-50">
                {itemCount()}
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="rounded-full bg-cream-100 p-2 text-brand-950/60 transition-colors hover:bg-cream-200 hover:text-brand-950"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-brand-950/30">
                <ShoppingBag size={28} strokeWidth={1.5} />
              </div>
              <p className="mt-4 font-semibold text-brand-950">Tu pedido está vacío</p>
              <p className="mt-1 text-sm text-brand-950/45">
                Agregá productos del catálogo para armar tu pedido
              </p>
              <button
                onClick={closeCart}
                className="mt-5 rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-brand-700"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-brand-950/5"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl opacity-60">
                      {product.category?.emoji || "🧁"}
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-brand-950">
                      {product.name}
                    </p>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="shrink-0 text-brand-950/30 transition-colors hover:text-red-500"
                      aria-label={`Quitar ${product.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-brand-950/40">
                    ${product.price.toLocaleString("es-AR")} c/u
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-full bg-cream-100">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-brand-900 transition-colors hover:bg-cream-200"
                        aria-label="Quitar uno"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-brand-950">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-brand-900 transition-colors hover:bg-cream-200"
                        aria-label="Agregar uno"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-brand-900">
                      ${(product.price * quantity).toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-950/5 bg-white p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-brand-950/55">Total</span>
              <span className="text-2xl font-bold tracking-tight text-brand-900">
                ${cartTotal.toLocaleString("es-AR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-950/40">
              Coordinamos la entrega y el pago por WhatsApp
            </p>
            <button
              onClick={() => setShowCheckout(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-wa-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-wa-600/25 transition-all hover:bg-wa-700 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" />
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
