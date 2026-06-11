"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
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
    <div className="fixed inset-0 z-60 flex animate-fade-in items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-sheet-up rounded-t-3xl bg-white p-6 shadow-2xl sm:animate-scale-in sm:rounded-3xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-cream-100 p-2 text-brand-950/60 transition-colors hover:bg-cream-200 hover:text-brand-950"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        <div className="mb-5 flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-wa-100 text-wa-600">
            <WhatsAppIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl text-brand-950">Confirmar pedido</h3>
            <p className="text-sm text-brand-950/50">
              Se abrirá WhatsApp con el detalle de tu pedido
            </p>
          </div>
        </div>

        <div className="mb-5 max-h-48 space-y-1.5 overflow-y-auto rounded-2xl bg-cream-50 p-4 ring-1 ring-brand-950/5">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between gap-3 text-sm">
              <span className="text-brand-950/75">
                {quantity}× {product.name}
              </span>
              <span className="shrink-0 font-medium text-brand-950">
                ${(product.price * quantity).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-brand-950/10 pt-2 font-bold">
            <span className="text-brand-950">Total</span>
            <span className="text-brand-900">${total().toLocaleString("es-AR")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-950">Tu nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan García"
              className="h-12 w-full rounded-xl bg-white px-4 text-sm text-brand-950 ring-1 ring-brand-950/10 placeholder:text-brand-950/35 focus:outline-none focus:ring-2 focus:ring-wa-500"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-wa-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-wa-600/25 transition-all hover:bg-wa-700 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <WhatsAppIcon className="h-5 w-5" />
            )}
            Enviar pedido por WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
