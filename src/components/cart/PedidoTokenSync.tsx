"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

// Captura el ?pedido=token del link del botón CTA de WhatsApp (ChatNoa), lo persiste en
// el store del carrito, y trae el carrito guardado en el server para ese mismo cliente
// (identificado por el número codificado en el token, no por el navegador). Así el
// mismo link muestra el mismo carrito sin importar en qué dispositivo o navegador se
// abra — antes dependía sólo de localStorage, que es propio de cada navegador.
//
// Sin token en la URL, se limpia el que hubiera quedado guardado de una visita
// anterior en este mismo navegador — si no, una entrada directa (sin link de
// WhatsApp) hereda por error el modo "sesión" de la última vez que sí vino de ahí.
export default function PedidoTokenSync() {
  const setPedidoToken = useCartStore((state) => state.setPedidoToken);
  const hidratarDesdeServidor = useCartStore((state) => state.hidratarDesdeServidor);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("pedido");
    if (!token) {
      setPedidoToken(null);
      return;
    }
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
