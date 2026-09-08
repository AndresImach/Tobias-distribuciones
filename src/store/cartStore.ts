import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/lib/types";

// Debounce del guardado en el server: evita un PUT por cada click de +/- cuando el
// cliente ajusta cantidades rápido. localStorage (vía persist) sigue guardando al
// instante en cada cambio; esto es sólo la copia server-side atada al pedidoToken.
const DEBOUNCE_MS = 500;
let guardadoPendiente: ReturnType<typeof setTimeout> | null = null;
// Último guardado sin confirmar todavía: si la pestaña se va a segundo plano o se
// cierra antes de que venza el debounce, lo mandamos de una para no perderlo — es
// exactamente lo que pasa cuando alguien agrega algo y al toque abre otro navegador
// para probar (el caso que motivó esto).
let ultimoPendiente: { token: string; items: CartItem[] } | null = null;

function enviarCarrito(token: string, items: CartItem[], keepalive: boolean) {
  fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, items }),
    keepalive,
  }).catch(() => {
    // Si falla, localStorage sigue teniendo el carrito en este navegador; no hay
    // nada más que hacer client-side, el próximo cambio reintenta el guardado.
  });
}

function guardarEnServidorDebounced(token: string, items: CartItem[]) {
  ultimoPendiente = { token, items };
  if (guardadoPendiente) clearTimeout(guardadoPendiente);
  guardadoPendiente = setTimeout(() => {
    ultimoPendiente = null;
    enviarCarrito(token, items, false);
  }, DEBOUNCE_MS);
}

function flushGuardadoPendiente() {
  if (!ultimoPendiente) return;
  if (guardadoPendiente) clearTimeout(guardadoPendiente);
  const { token, items } = ultimoPendiente;
  ultimoPendiente = null;
  // keepalive: la petición sigue en curso aunque la pestaña se descargue ya mismo.
  enviarCarrito(token, items, true);
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushGuardadoPendiente();
  });
  window.addEventListener("pagehide", flushGuardadoPendiente);
}

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  // Token del botón CTA de WhatsApp de ChatNoa (query param ?pedido=), capturado por
  // PedidoTokenSync. Ata la confirmación del pedido a esa conversación de WhatsApp, y
  // ahora también el guardado del carrito en progreso en el server.
  pedidoToken: string | null;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setPedidoToken: (token: string | null) => void;
  hidratarDesdeServidor: (items: CartItem[]) => void;
  total: () => number;
  itemCount: () => number;
};

function persistirYGuardar(get: () => CartStore, items: CartItem[]) {
  const token = get().pedidoToken;
  if (token) guardarEnServidorDebounced(token, items);
  return items;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      pedidoToken: null,

      setPedidoToken: (token) => set({ pedidoToken: token }),

      // Reemplaza el carrito local por el que vino del server para este pedidoToken.
      // No dispara un guardado: es una lectura, no un cambio del cliente.
      hidratarDesdeServidor: (items) => set({ items }),

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        const nuevos = existing
          ? items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          : [...items, { product, quantity: 1 }];
        set({ items: persistirYGuardar(get, nuevos) });
      },

      removeItem: (productId) => {
        const nuevos = get().items.filter((i) => i.product.id !== productId);
        set({ items: persistirYGuardar(get, nuevos) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const nuevos = get().items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        );
        set({ items: persistirYGuardar(get, nuevos) });
      },

      clearCart: () => set({ items: persistirYGuardar(get, []) }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      total: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: "tobias-cart" }
  )
);
