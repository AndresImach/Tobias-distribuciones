import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// El bot completa acá cómo quiere recibir el pedido el cliente, después de
// preguntárselo por WhatsApp. Es la vuelta del viaje que empieza cuando este mismo
// pedido se confirma y el catálogo le avisa al bot: aquel dice que hay un pedido,
// éste le termina de poner la entrega.
//
// El bearer prueba que quien llama es el bot. El pedido se identifica por id en la
// URL, no por un token del cliente: esta ruta no la toca nadie desde el navegador.
const METODOS = new Set(["envio", "retiro"]);
const PAGOS = new Set(["efectivo", "mercadopago"]);

function autorizado(request: Request) {
  const recibido = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const esperado = (process.env.TOBIAS_CATALOGO_API_TOKEN || "").trim();
  if (!esperado) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function texto(valor: unknown, maximo: number) {
  return typeof valor === "string" ? valor.trim().slice(0, maximo) : "";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const pedidoId = Number(id);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const metodo = texto(body?.metodo, 20);
  const sucursal = texto(body?.sucursal, 80);
  const direccion = texto(body?.direccion, 300);
  const pago = texto(body?.pago, 20);

  if (!METODOS.has(metodo)) {
    return NextResponse.json({ error: "metodo debe ser envio o retiro" }, { status: 400 });
  }
  if (metodo === "retiro" && !sucursal) {
    return NextResponse.json({ error: "Falta la sucursal de retiro" }, { status: 400 });
  }
  if (metodo === "envio" && !direccion) {
    return NextResponse.json({ error: "Falta la dirección de envío" }, { status: 400 });
  }
  if (pago && !PAGOS.has(pago)) {
    return NextResponse.json({ error: "pago debe ser efectivo o mercadopago" }, { status: 400 });
  }

  // El cliente puede cambiar de idea: elegir retiro y después envío. Cada elección
  // pisa la anterior y limpia la que no corresponde, para que el pedido no quede con
  // una sucursal y una dirección a la vez.
  try {
    const pedido = await prisma.order.update({
      where: { id: pedidoId },
      data: {
        deliveryMethod: metodo,
        pickupBranch: metodo === "retiro" ? sucursal : null,
        shippingAddress: metodo === "envio" ? direccion : null,
        paymentMethod: pago || null,
      },
    });
    return NextResponse.json({ ok: true, id: pedido.id });
  } catch {
    return NextResponse.json({ error: "No existe ese pedido" }, { status: 404 });
  }
}
