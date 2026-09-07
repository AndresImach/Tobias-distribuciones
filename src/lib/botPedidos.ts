import type { CartItem } from "@/lib/types";

// Integración con el bot de WhatsApp (ChatNoa), que corre en otro deploy.
//
// Flujo: el bot manda al cliente un botón CTA con un link a esta web que incluye
// ?pedido=<token>. El token es OPACO — no lo decodificamos ni lo validamos acá, solo
// lo reenviamos tal cual. Cuando el pedido se confirma en esta web (que es la fuente
// de verdad), le avisamos al bot para que mande el desglose por WhatsApp.
//
// Esta web nunca es la que arma ni confirma pedidos por chat: eso lo hace siempre acá.

const RUTA_WEBHOOK = "/api/pedido-confirmado";
const TIMEOUT_MS = 4500;

type Config = { base: string; secret: string };

// El equipo del bot documenta estas variables como BOT_BASE_URL y
// TOBIAS_PEDIDO_WEBHOOK_TOKEN (este último tiene que ser el mismo valor exacto que
// el del .env del bot). Aceptamos además los nombres CHATNOA_* con los que ya quedó
// configurado el deploy actual, para no romperlo en el medio de un rename.
function getConfig(): Config | null {
  const base = (process.env.BOT_BASE_URL ?? process.env.CHATNOA_BOT_URL)
    ?.trim()
    .replace(/\/+$/, "");
  const secret = (
    process.env.TOBIAS_PEDIDO_WEBHOOK_TOKEN ?? process.env.CHATNOA_PEDIDO_WEBHOOK_TOKEN
  )?.trim();
  if (!base || !secret) return null;
  return { base, secret };
}

async function leerError(respuesta: Response): Promise<string> {
  const cuerpo = await respuesta.text().catch(() => "");
  return cuerpo.slice(0, 300);
}

/**
 * Avisa al bot que el pedido quedó confirmado, para que le mande el desglose al
 * cliente por WhatsApp. Server-to-server: el secreto nunca sale al browser.
 *
 * Devuelve true solo si el bot confirma que mandó el mensaje. Nunca lanza: si algo
 * falla se loggea y se devuelve false, porque el pedido YA está persistido en esta
 * web y no se revierte por un problema de mensajería. Sin reintentos a propósito.
 */
export async function notificarPedidoConfirmado({
  pedidoToken,
  orderId,
  items,
  total,
}: {
  pedidoToken: string;
  orderId: number;
  items: CartItem[];
  total: number;
}): Promise<boolean> {
  const config = getConfig();
  if (!config) {
    // Llegó un pedido con token del bot pero el deploy no tiene las variables: es un
    // error de configuración, no un caso normal. Por eso se loggea.
    console.error(
      `[bot] pedido #${orderId} vino con token del CTA de WhatsApp pero faltan BOT_BASE_URL y/o TOBIAS_PEDIDO_WEBHOOK_TOKEN; no se avisó al bot`
    );
    return false;
  }

  try {
    const respuesta = await fetch(`${config.base}${RUTA_WEBHOOK}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.secret}`,
      },
      body: JSON.stringify({
        // El token viaja intacto, tal como llegó en ?pedido=.
        token: pedidoToken,
        orderId,
        total,
        // `precio` es el precio UNITARIO: el bot hace precio * cantidad para el desglose.
        items: items.map((i) => ({
          nombre: i.product.name,
          cantidad: i.quantity,
          precio: i.product.price,
        })),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!respuesta.ok) {
      const detalle = await leerError(respuesta);
      // 401 = bearer mal configurado, o token de pedido inválido/vencido (el bot les
      // da 7 días). 502 = el bot no pudo mandar el WhatsApp (ej. Meta caído).
      console.error(
        `[bot] pedido #${orderId}: el webhook respondió ${respuesta.status}${detalle ? ` — ${detalle}` : ""}`
      );
      return false;
    }

    const data = await respuesta.json().catch(() => null);
    if (data?.enviado !== true) {
      console.error(`[bot] pedido #${orderId}: el webhook respondió 200 sin enviado:true`);
      return false;
    }
    return true;
  } catch (error) {
    const vencioTimeout = error instanceof Error && error.name === "TimeoutError";
    console.error(
      `[bot] pedido #${orderId}: no se pudo avisar al bot${vencioTimeout ? ` (timeout de ${TIMEOUT_MS}ms)` : ""}`,
      error
    );
    return false;
  }
}
