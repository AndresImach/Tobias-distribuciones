import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/lib/types";

// El bot le da 7 días de validez al token del CTA. Pasado ese plazo el webhook
// responde 401, así que ni lo mandamos: el carrito se persiste en localStorage y sin
// esto un token viejo se reenviaría en cada pedido para siempre.
const VENCIMIENTO_PEDIDO_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  // Token del botón CTA de WhatsApp de ChatNoa (query param ?pedido=), capturado por
  // PedidoTokenSync. Ata la confirmación del pedido a esa conversación de WhatsApp.
  // Es OPACO: se guarda y se reenvía tal cual, nunca se decodifica.
  pedidoToken: string | null;
  // Cuándo lo capturamos, para poder descartarlo cuando vence.
  pedidoTokenAt: number | null;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setPedidoToken: (token: string) => void;
  activePedidoToken: () => string | null;
  total: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      pedidoToken: null,
      pedidoTokenAt: null,

      setPedidoToken: (token) => set({ pedidoToken: token, pedidoTokenAt: Date.now() }),

      activePedidoToken: () => {
        const { pedidoToken, pedidoTokenAt } = get();
        if (!pedidoToken) return null;
        // Tokens guardados antes de que existiera pedidoTokenAt: los dejamos pasar en
        // vez de descartar un pedido en curso; el bot valida igual del otro lado.
        if (pedidoTokenAt == null) return pedidoToken;
        if (Date.now() - pedidoTokenAt > VENCIMIENTO_PEDIDO_TOKEN_MS) return null;
        return pedidoToken;
      },

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity: 1 }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
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
