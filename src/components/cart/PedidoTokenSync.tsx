"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

// Captura el ?pedido=token del link del botón CTA de WhatsApp (ChatNoa), lo persiste en
// el store del carrito, y trae el carrito guardado en el server para ese mismo cliente
// (identificado por el número codificado en el token, no por el navegador). Así el
// mismo link muestra el mismo carrito sin importar en qué dispositivo o navegador se
// abra — antes dependía sólo de localStorage, que es propio de cada navegador.
//
// Sin token, no cambia nada: el carrito sigue viviendo sólo en localStorage.
export default function PedidoTokenSync() {
  const setPedidoToken = useCartStore((state) => state.setPedidoToken);
  const hidratarDesdeServidor = useCartStore((state) => state.hidratarDesdeServidor);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("pedido");
    if (!token) return;
    setPedidoToken(token);

    fetch(`/api/cart?token=${encodeURIComponent(token)}`)
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((data) => {
        if (data?.items) hidratarDesdeServidor(data.items);
      })
      .catch(() => {
        // Sin carrito del server, seguimos con lo que ya haya en localStorage.
      });
  }, [setPedidoToken, hidratarDesdeServidor]);

  return null;
}
