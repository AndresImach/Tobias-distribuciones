import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

type BorgestProducto = {
  producto_id: number;
  producto_nombre: string;
  producto_codigobarras?: string | null;
  producto_precioventa1: number;
  producto_precioventa2?: number | null;
  producto_precioventa3?: number | null;
  producto_precioventa4?: number | null;
  producto_stock?: number | null;
  producto_estado: string;
  producto_foto?: string | null;
};

function isAuthorized(provided: string | null): boolean {
  const expected = process.env.SYNC_API_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function validateItem(item: unknown, index: number): { ok: true; value: BorgestProducto } | { ok: false; error: string } {
  if (typeof item !== "object" || item === null) {
    return { ok: false, error: `item ${index}: must be an object` };
  }
  const o = item as Record<string, unknown>;
  if (typeof o.producto_id !== "number" || !Number.isInteger(o.producto_id)) {
    return { ok: false, error: `item ${index}: producto_id must be an integer` };
  }
  if (typeof o.producto_nombre !== "string" || o.producto_nombre.trim() === "") {
    return { ok: false, error: `item ${index} (id=${o.producto_id}): producto_nombre is required` };
  }
  if (typeof o.producto_precioventa1 !== "number" || !Number.isFinite(o.producto_precioventa1)) {
    return { ok: false, error: `item ${index} (id=${o.producto_id}): producto_precioventa1 must be a number` };
  }
  if (typeof o.producto_estado !== "string") {
    return { ok: false, error: `item ${index} (id=${o.producto_id}): producto_estado must be a string` };
  }

  const optionalPrice = (key: "producto_precioventa2" | "producto_precioventa3" | "producto_precioventa4") => {
    const v = o[key];
    if (v === undefined || v === null) return { ok: true, value: null } as const;
    if (typeof v === "number" && Number.isFinite(v)) return { ok: true, value: v } as const;
    return { ok: false, error: `item ${index} (id=${o.producto_id}): ${key} must be a number or null` } as const;
  };
  const p2 = optionalPrice("producto_precioventa2");
  if (!p2.ok) return { ok: false, error: p2.error };
  const p3 = optionalPrice("producto_precioventa3");
  if (!p3.ok) return { ok: false, error: p3.error };
  const p4 = optionalPrice("producto_precioventa4");
  if (!p4.ok) return { ok: false, error: p4.error };

  let stock: number | null = null;
  if (o.producto_stock !== undefined && o.producto_stock !== null) {
    if (typeof o.producto_stock !== "number" || !Number.isFinite(o.producto_stock) || !Number.isInteger(o.producto_stock) || o.producto_stock < 0) {
      return { ok: false, error: `item ${index} (id=${o.producto_id}): producto_stock must be a non-negative integer` };
    }
    stock = o.producto_stock;
  }

  return {
    ok: true,
    value: {
      producto_id: o.producto_id,
      producto_nombre: o.producto_nombre,
      producto_codigobarras: typeof o.producto_codigobarras === "string" ? o.producto_codigobarras : null,
      producto_precioventa1: o.producto_precioventa1,
      producto_precioventa2: p2.value,
      producto_precioventa3: p3.value,
      producto_precioventa4: p4.value,
      producto_stock: stock,
      producto_estado: o.producto_estado,
      producto_foto: typeof o.producto_foto === "string" ? o.producto_foto : null,
    },
  };
}

export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("x-api-key"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(payload)) {
    return NextResponse.json({ error: "body must be a JSON array of products" }, { status: 400 });
  }

  const errors: string[] = [];
  const valid: BorgestProducto[] = [];
  payload.forEach((item, i) => {
    const result = validateItem(item, i);
    if (result.ok) valid.push(result.value);
    else errors.push(result.error);
  });

  if (valid.length === 0) {
    return NextResponse.json({ processed: 0, created: 0, updated: 0, errors }, { status: 400 });
  }

  const existingIds = new Set(
    (
      await prisma.borgestProduct.findMany({
        where: { id: { in: valid.map((p) => p.producto_id) } },
        select: { id: true },
      })
    ).map((p) => p.id),
  );

  let created = 0;
  let updated = 0;

  for (const p of valid) {
    const isUpdate = existingIds.has(p.producto_id);
    try {
      await prisma.borgestProduct.upsert({
        where: { id: p.producto_id },
        create: {
          id: p.producto_id,
          name: p.producto_nombre,
          barcode: p.producto_codigobarras,
          price1: p.producto_precioventa1,
          price2: p.producto_precioventa2,
          price3: p.producto_precioventa3,
          price4: p.producto_precioventa4,
          stock: p.producto_stock ?? 0,
          estado: p.producto_estado,
          foto: p.producto_foto,
        },
        update: {
          name: p.producto_nombre,
          barcode: p.producto_codigobarras,
          price1: p.producto_precioventa1,
          price2: p.producto_precioventa2,
          price3: p.producto_precioventa3,
          price4: p.producto_precioventa4,
          ...(p.producto_stock !== null ? { stock: p.producto_stock } : {}),
          estado: p.producto_estado,
          foto: p.producto_foto,
        },
      });
      if (isUpdate) updated++;
      else created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`producto_id=${p.producto_id}: ${msg}`);
    }
  }

  return NextResponse.json({
    processed: created + updated,
    created,
    updated,
    errors,
  });
}
