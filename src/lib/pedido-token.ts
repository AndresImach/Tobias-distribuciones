import { createHmac, timingSafeEqual } from "node:crypto";

// Verificador del token del botón CTA de WhatsApp (ChatNoa). Es el mismo esquema que
// firma packages/bot-profiles/src/tobias/pedido-token.js del lado del bot: payload en
// base64url + HMAC-SHA256 en base64url, separados por un punto. Acá sólo verificamos —
// el token siempre lo firma el bot, nunca esta app.
export type SesionPedido = {
  numero: string;
  canal: string | null;
  exp: number;
};

function secreto(): string {
  const valor = String(process.env.TOBIAS_PEDIDO_SECRET || "").trim();
  if (valor.length < 32) {
    throw new Error("TOBIAS_PEDIDO_SECRET debe tener al menos 32 caracteres.");
  }
  return valor;
}

function firmar(payload: string): string {
  return createHmac("sha256", secreto()).update(payload).digest("base64url");
}

export function verificarTokenPedido(token: string | null | undefined): SesionPedido | null {
  const [payload, firma] = String(token || "").split(".");
  if (!payload || !firma) return null;
  let esperada: string;
  try {
    esperada = firmar(payload);
  } catch {
    return null;
  }
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const datos = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!datos.numero || !datos.exp || datos.exp < Date.now()) return null;
    return { numero: String(datos.numero), canal: datos.canal ?? null, exp: Number(datos.exp) };
  } catch {
    return null;
  }
}
