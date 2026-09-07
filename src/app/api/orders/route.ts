import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWhatsappContacts } from "@/lib/whatsapp";
import { notificarPedidoConfirmado } from "@/lib/botPedidos";
import type { OrderPayload } from "@/lib/types";

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

  const contacts = getWhatsappContacts();
  const contact = contacts.find((c) => c.number === whatsappNumber) ?? contacts[0];
  const itemLines = items
    .map((i) => `• ${i.quantity}x ${i.product.name} - $${(i.product.price * i.quantity).toLocaleString("es-AR")}`)
    .join("\n");

  const message = encodeURIComponent(
    `¡Hola! Soy ${customerName} y quiero hacer un pedido:\n\n${itemLines}\n\n*Total: $${total.toLocaleString("es-AR")}*\n\nNúmero de pedido: #${order.id}`
  );

  const whatsappUrl = `https://wa.me/${contact?.number ?? ""}?text=${message}`;

  return NextResponse.json({ order, whatsappUrl, entregadoPorWhatsapp });
}

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
