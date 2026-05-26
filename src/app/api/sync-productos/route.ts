import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const SYNC_CATEGORY_SLUG = "sincronizados";

type BorgestProducto = {
  producto_id: number;
  producto_nombre: string;
  producto_codigobarras?: string | null;
  producto_precioventa1: number;
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
  return {
    ok: true,
    value: {
      producto_id: o.producto_id,
      producto_nombre: o.producto_nombre,
      producto_codigobarras: typeof o.producto_codigobarras === "string" ? o.producto_codigobarras : null,
      producto_precioventa1: o.producto_precioventa1,
      producto_estado: o.producto_estado,
      producto_foto: typeof o.producto_foto === "string" ? o.producto_foto : null,
    },
  };
}

async function getSyncCategoryId(): Promise<number> {
  const existing = await prisma.category.findUnique({ where: { slug: SYNC_CATEGORY_SLUG } });
  if (existing) return existing.id;
  const created = await prisma.category.create({
    data: { name: "Sincronizados", slug: SYNC_CATEGORY_SLUG, emoji: "📦", order: 999 },
  });
  return created.id;
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

  const syncCategoryId = await getSyncCategoryId();
  const existingIds = new Set(
    (
      await prisma.product.findMany({
        where: { externalId: { in: valid.map((p) => p.producto_id) } },
        select: { externalId: true },
      })
    ).map((p) => p.externalId),
  );

  let created = 0;
  let updated = 0;

  for (const p of valid) {
    const available = p.producto_estado.trim().toUpperCase() === "DISPONIBLE";
    const image = p.producto_foto ?? "";
    const barcode = p.producto_codigobarras ?? null;
    const isUpdate = existingIds.has(p.producto_id);

    try {
      await prisma.product.upsert({
        where: { externalId: p.producto_id },
        create: {
          externalId: p.producto_id,
          name: p.producto_nombre,
          price: p.producto_precioventa1,
          barcode,
          image,
          available,
          categoryId: syncCategoryId,
        },
        update: {
          name: p.producto_nombre,
          price: p.producto_precioventa1,
          barcode,
          image,
          available,
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
