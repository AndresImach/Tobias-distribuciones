"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

// Captura el ?pedido=token del link del botón CTA de WhatsApp (ChatNoa) y lo persiste
// en el store del carrito para mandarlo al confirmar el pedido. Sin este token, el
// checkout sigue funcionando igual que hoy (abre wa.me).
export default function PedidoTokenSync() {
  const setPedidoToken = useCartStore((state) => state.setPedidoToken);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("pedido");
    if (token) setPedidoToken(token);
  }, [setPedidoToken]);

  return null;
}
