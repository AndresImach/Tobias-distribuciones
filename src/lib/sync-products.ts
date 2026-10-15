import { createClient, type Client, type InStatement } from "@libsql/client";

export type BorgestProducto = {
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

let client: Client | undefined;
function database() {
  return client ??= createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

function upsert(product: BorgestProducto, syncedAt: string): InStatement {
  return {
    sql: `INSERT INTO "BorgestProduct"
      (id, name, barcode, price1, price2, price3, price4, stock, estado, foto, syncedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, barcode = excluded.barcode,
        price1 = excluded.price1, price2 = excluded.price2,
        price3 = excluded.price3, price4 = excluded.price4,
        stock = CASE WHEN ? THEN excluded.stock ELSE "BorgestProduct".stock END,
        estado = excluded.estado, foto = excluded.foto, syncedAt = excluded.syncedAt`,
    args: [
      product.producto_id, product.producto_nombre,
      product.producto_codigobarras ?? null, product.producto_precioventa1,
      product.producto_precioventa2 ?? null, product.producto_precioventa3 ?? null,
      product.producto_precioventa4 ?? null, product.producto_stock ?? 0,
      product.producto_estado, product.producto_foto ?? null, syncedAt,
      product.producto_stock != null ? 1 : 0,
    ],
  };
}

type Stored = {
  name: unknown; barcode: unknown; price1: unknown; price2: unknown; price3: unknown;
  price4: unknown; stock: unknown; estado: unknown; foto: unknown;
};

// Turso bills every written row. Borgest sends the full catalog on every sync,
// so rewriting unchanged products (syncedAt always changes) burned through the
// rows-written quota. Only products that are new or actually differ are written.
function sameAsStored(p: BorgestProducto, row: Stored) {
  return row.name === p.producto_nombre &&
    row.barcode === (p.producto_codigobarras ?? null) &&
    Number(row.price1) === p.producto_precioventa1 &&
    (row.price2 == null ? null : Number(row.price2)) === (p.producto_precioventa2 ?? null) &&
    (row.price3 == null ? null : Number(row.price3)) === (p.producto_precioventa3 ?? null) &&
    (row.price4 == null ? null : Number(row.price4)) === (p.producto_precioventa4 ?? null) &&
    (p.producto_stock == null || Number(row.stock) === p.producto_stock) &&
    row.estado === p.producto_estado &&
    row.foto === (p.producto_foto ?? null);
}

function asStored(p: BorgestProducto, previous?: Stored): Stored {
  return {
    name: p.producto_nombre, barcode: p.producto_codigobarras ?? null,
    price1: p.producto_precioventa1, price2: p.producto_precioventa2 ?? null,
    price3: p.producto_precioventa3 ?? null, price4: p.producto_precioventa4 ?? null,
    stock: p.producto_stock ?? previous?.stock ?? 0,
    estado: p.producto_estado, foto: p.producto_foto ?? null,
  };
}

// The HTTP libSQL client sends an entire batch in one request. Prisma's
// per-product upserts generate multiple HTTP round trips for every product.
export async function syncProducts(products: BorgestProducto[], db = database()) {
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const errors: string[] = [];
  const syncedAt = new Date().toISOString().replace("Z", "+00:00");

  const existingIds = new Set<number>();
  const current = new Map<number, Stored>();
  // Read current rows before writing to skip unchanged products and preserve the
  // existing created/updated counters. Bound SQL parameters for large uploads.
  for (let start = 0; start < products.length; start += 100) {
    const chunk = products.slice(start, start + 100);
    const existing = await db.execute({
      sql: `SELECT id, name, barcode, price1, price2, price3, price4, stock, estado, foto
        FROM "BorgestProduct" WHERE id IN (${chunk.map(() => "?").join(",")})`,
      args: chunk.map((p) => p.producto_id),
    });
    existing.rows.forEach((row) => {
      existingIds.add(Number(row.id));
      current.set(Number(row.id), row as unknown as Stored);
    });
  }

  // Walk the upload in order so repeated IDs compare against the value the
  // previous occurrence will leave in the table.
  const pending: BorgestProducto[] = [];
  for (const p of products) {
    const row = current.get(p.producto_id);
    if (row && sameAsStored(p, row)) {
      unchanged++;
      continue;
    }
    current.set(p.producto_id, asStored(p, row));
    pending.push(p);
  }

  for (let start = 0; start < pending.length; start += 100) {
    const chunk = pending.slice(start, start + 100);
    const statements = chunk.map((p) => upsert(p, syncedAt));
    const count = (p: BorgestProducto) => {
      if (existingIds.has(p.producto_id)) updated++;
      else created++;
    };

    try {
      await db.batch(statements, "write");
      chunk.forEach(count);
    } catch {
      // A failed batch is rolled back. Retry individually to preserve the
      // endpoint's partial-success contract when a single row cannot be saved.
      for (let i = 0; i < chunk.length; i++) {
        try {
          await db.execute(statements[i]);
          count(chunk[i]);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`producto_id=${chunk[i].producto_id}: ${message}`);
        }
      }
    }
  }

  return { processed: created + updated + unchanged, created, updated, unchanged, errors };
}
