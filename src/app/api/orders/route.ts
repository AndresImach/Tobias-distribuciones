import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWhatsappContacts } from "@/lib/whatsapp";
import type { CartItem, OrderPayload } from "@/lib/types";

// Server-to-server con el bot de ChatNoa: si el pedido vino del botón CTA de WhatsApp
// (pedidoToken presente), le avisamos para que mande el desglose directo por Cloud API
// en vez de depender de que el cliente abra wa.me a mano. Si falla o no está
// configurado, no rompe el pedido — sigue el flujo de wa.me de siempre.
async function notificarPedidoConfirmado({
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
  const base = process.env.CHATNOA_BOT_URL?.replace(/\/$/, "");
  const secret = process.env.CHATNOA_PEDIDO_WEBHOOK_TOKEN;
  if (!base || !secret) return false;
  try {
    const respuesta = await fetch(`${base}/api/pedido-confirmado`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({
        token: pedidoToken,
        orderId,
        total,
        items: items.map((i) => ({ nombre: i.product.name, cantidad: i.quantity, precio: i.product.price })),
      }),
      signal: AbortSignal.timeout(4500),
    });
    if (!respuesta.ok) {
      // Sin este log, un fallo acá (token vencido, protección de deployment, timeout)
      // es indistinguible de "no estaba configurado" — ya nos pasó una vez.
      console.error("notificarPedidoConfirmado: respuesta no OK", respuesta.status);
      return false;
    }
    const data = await respuesta.json().catch(() => ({}));
    return data?.enviado === true;
  } catch (error) {
    console.error("notificarPedidoConfirmado: excepción", error instanceof Error ? error.message : String(error));
    return false;
  }
}

export async function POST(request: Request) {
  const body: OrderPayload = await request.json();
  const { customerName, phone, items, total, whatsappNumber, pedidoToken } = body;

  if (!customerName || !items?.length) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      customerName,
      phone,
      items: JSON.stringify(items),
      total,
    },
  });

  const entregadoPorWhatsapp = pedidoToken
    ? await notificarPedidoConfirmado({ pedidoToken, orderId: order.id, items, total })
    : false;

  // Con pedidoToken el pedido ya vino de un chat puntual con el número del bot: si el
  // webhook automático no se entrega, wa.me tiene que volver a ESE número, no a
  // cualquiera de los contactos generales (esos son para el flujo sin sesión, cuando
  // no sabemos con quién venía hablando el cliente).
  const numeroBot = String(process.env.TOBIAS_BOT_WHATSAPP_NUMBER || "").trim();
  const contacts = getWhatsappContacts();
  const contact =
    pedidoToken && numeroBot
      ? { name: "Tobías", number: numeroBot }
      : contacts.find((c) => c.number === whatsappNumber) ?? contacts[0];
  const itemLines = items
    .map((i) => `• ${i.quantity}x ${i.product.name} - $${(i.product.price * i.quantity).toLocaleString("es-AR")}`)
    .join("\n");

  const message = encodeURIComponent(
    `¡Hola! Soy ${customerName} y quiero hacer un pedido:\n\n${itemLines}\n\n*Total: $${total.toLocaleString("es-AR")}*\n\nNúmero de pedido: #${order.id}`
  );

  const whatsappUrl = `https://wa.me/${contact?.number ?? ""}?text=${message}`;
  // Sin texto prellenado a propósito: cuando el bot ya mandó el desglose, este link es
  // sólo para volver a leerlo en el chat, no para mandar otro mensaje de pedido.
  const volverWhatsappUrl = numeroBot ? `https://wa.me/${numeroBot}` : null;

  return NextResponse.json({ order, whatsappUrl, volverWhatsappUrl, entregadoPorWhatsapp });
}

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
