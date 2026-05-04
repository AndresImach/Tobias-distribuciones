"use client";

import { useState } from "react";
import { X, MessageCircle, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import type { OrderPayload } from "@/lib/types";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function CheckoutModal({ onClose, onSuccess }: Props) {
  const { items, total, clearCart } = useCartStore();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload: OrderPayload = {
      customerName: name,
      phone: "",
      items,
      total: total(),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear el pedido");
        return;
      }

      clearCart();
      onSuccess();
      window.open(data.whatsappUrl, "_blank");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
            <MessageCircle size={24} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Confirmar pedido</h3>
            <p className="text-gray-500 text-sm">Se abrirá WhatsApp con tu pedido listo</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {quantity}x {product.name}
              </span>
              <span className="font-medium">${(product.price * quantity).toLocaleString("es-AR")}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-amber-600">${total().toLocaleString("es-AR")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan García"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <MessageCircle size={18} />
            )}
            Enviar pedido por WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
