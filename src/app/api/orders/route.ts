import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderPayload } from "@/lib/types";

export async function POST(request: Request) {
  const body: OrderPayload = await request.json();
  const { customerName, phone, items, total } = body;

  if (!customerName || !phone || !items?.length) {
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

  const whatsappNumber = process.env.WHATSAPP_NUMBER ?? "";
  const itemLines = items
    .map((i) => `• ${i.quantity}x ${i.product.name} - $${(i.product.price * i.quantity).toLocaleString("es-AR")}`)
    .join("\n");

  const message = encodeURIComponent(
    `¡Hola! Soy ${customerName} y quiero hacer un pedido:\n\n${itemLines}\n\n*Total: $${total.toLocaleString("es-AR")}*\n\nNúmero de pedido: #${order.id}`
  );

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return NextResponse.json({ order, whatsappUrl });
}

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
