"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { pareceNavegadorInApp } from "@/lib/navegador";
import type { OrderPayload, WhatsappContact } from "@/lib/types";

// "enviado": el bot confirmó que mandó el desglose por WhatsApp, no hay nada más que hacer.
// "manual": el pedido quedó guardado igual, pero el mensaje lo manda el cliente desde
// un botón en vez de abrírsele wa.me solo.
type Resultado =
  | { modo: "enviado" }
  | { modo: "manual"; orderId: number; whatsappUrl: string };

type Props = {
  contacts: WhatsappContact[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function CheckoutModal({ contacts, onClose, onSuccess }: Props) {
  const { items, total, clearCart, activePedidoToken } = useCartStore();
  const [name, setName] = useState("");
  const [selectedNumber, setSelectedNumber] = useState(contacts[0]?.number ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Señal confiable de que el cliente llegó desde el botón CTA del bot, o sea que ya
    // tiene una conversación de WhatsApp abierta con nosotros.
    const pedidoToken = activePedidoToken();

    const payload: OrderPayload = {
      customerName: name,
      phone: "",
      items,
      total: total(),
      whatsappNumber: selectedNumber,
      pedidoToken: pedidoToken ?? undefined,
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

      if (data.entregadoPorWhatsapp) {
        // El bot ya mandó el desglose directo por WhatsApp: mostramos la confirmación acá
        // en vez de abrir wa.me, que quedaría redundante con el mensaje que ya llegó.
        setResultado({ modo: "enviado" });
        return;
      }

      // Acá el bot no mandó el mensaje: o falló, o el pedido nunca vino del CTA. Solo
      // auto-abrimos wa.me si estamos razonablemente seguros de que es un navegador
      // común ajeno al bot; adentro de WhatsApp ese popup es redundante o directamente
      // no funciona. El pedido ya quedó guardado igual, así que no se pierde nada.
      if (pedidoToken || pareceNavegadorInApp()) {
        setResultado({ modo: "manual", orderId: data.order.id, whatsappUrl: data.whatsappUrl });
        return;
      }

      onSuccess();
      window.open(data.whatsappUrl, "_blank");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (resultado) {
    const manual = resultado.modo === "manual";
    return (
      <div className="fixed inset-0 z-60 flex animate-fade-in items-end justify-center sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm" onClick={onSuccess} />
        <div className="relative z-10 w-full max-w-md animate-sheet-up rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:animate-scale-in sm:rounded-3xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wa-100 text-wa-600">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="mt-4 font-display text-xl text-brand-950">
            {manual ? "¡Pedido confirmado!" : "¡Pedido enviado!"}
          </h3>
          <p className="mt-2 text-sm text-brand-950/60">
            {manual ? (
              <>
                Guardamos tu pedido{" "}
                <span className="font-semibold text-brand-950">#{resultado.orderId}</span>. Tocá el
                botón para mandárnoslo por WhatsApp.
              </>
            ) : (
              "Te mandamos el resumen de tu pedido por WhatsApp. Revisá la conversación ahí."
            )}
          </p>

          {manual && (
            // Se abre con un tap del cliente, no con un popup automático: así funciona
            // igual adentro del navegador in-app de WhatsApp, donde window.open no anda.
            <a
              href={resultado.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onSuccess}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-wa-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-wa-600/25 transition-all hover:bg-wa-700 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Mandarlo por WhatsApp
            </a>
          )}

          <button
            onClick={onSuccess}
            className={`w-full rounded-full py-3.5 text-sm font-semibold transition-colors ${
              manual
                ? "mt-2 text-brand-950/60 hover:bg-cream-100 hover:text-brand-950"
                : "mt-6 bg-brand-900 text-cream-50 hover:bg-brand-700"
            }`}
          >
            Listo
          </button>
        </div>
      </div>
    );
  }

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

          {contacts.length > 1 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-950">
                ¿A quién le enviás el pedido?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {contacts.map((contact) => {
                  const active = selectedNumber === contact.number;
                  return (
                    <button
                      type="button"
                      key={contact.number}
                      onClick={() => setSelectedNumber(contact.number)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-wa-100 text-wa-700 ring-2 ring-wa-500"
                          : "bg-white text-brand-950/70 ring-1 ring-brand-950/10 hover:ring-brand-400/60"
                      }`}
                    >
                      <WhatsAppIcon
                        className={`h-4 w-4 shrink-0 ${active ? "text-wa-600" : "text-brand-950/30"}`}
                      />
                      <span className="truncate">{contact.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
