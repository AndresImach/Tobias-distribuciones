import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarTokenPedido } from "@/lib/pedido-token";
import type { CartItem } from "@/lib/types";

// Carrito en progreso atado al pedidoToken del botón CTA de WhatsApp. Se identifica por
// el número decodificado del token (no por el token crudo) para que sobreviva a que el
// bot reemita un link nuevo. Sin token, esta ruta no hace nada: el carrito sigue
// viviendo sólo en localStorage, como hasta ahora.

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const sesion = verificarTokenPedido(token);
  if (!sesion) return NextResponse.json({ items: null });

  const guardado = await prisma.cartSession.findUnique({ where: { numero: sesion.numero } });
  if (!guardado) return NextResponse.json({ items: null });

  let items: CartItem[];
  try {
    items = JSON.parse(guardado.items);
  } catch {
    return NextResponse.json({ items: null });
  }
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const sesion = verificarTokenPedido(body?.token);
  if (!sesion) return NextResponse.json({ error: "Token inválido o vencido" }, { status: 401 });

  const items: CartItem[] = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    // Carrito vaciado: no dejamos una fila vieja que reaparezca más adelante.
    await prisma.cartSession.deleteMany({ where: { numero: sesion.numero } });
    return NextResponse.json({ ok: true });
  }

  await prisma.cartSession.upsert({
    where: { numero: sesion.numero },
    create: { numero: sesion.numero, items: JSON.stringify(items) },
    update: { items: JSON.stringify(items) },
  });
  return NextResponse.json({ ok: true });
}
