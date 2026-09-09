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
    const params = new URLSearchParams(window.location.search);
    const token = params.get("pedido");
    if (!token) {
      setPedidoToken(null);
      return;
    }
    setPedidoToken(token);

    // "No, modificar pedido" manda ?restaurar=<id> junto al token: ese pedido ya está
    // confirmado (y su carrito en progreso, borrado), así que se reabre desde el
    // pedido guardado en vez de buscar un carrito activo que ya no existe.
    const restaurar = params.get("restaurar");
    const url = restaurar
      ? `/api/cart?token=${encodeURIComponent(token)}&restaurar=${encodeURIComponent(restaurar)}`
      : `/api/cart?token=${encodeURIComponent(token)}`;

    fetch(url)
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
