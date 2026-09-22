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

// The HTTP libSQL client sends an entire batch in one request. Prisma's
// per-product upserts generate multiple HTTP round trips for every product.
export async function syncProducts(products: BorgestProducto[], db = database()) {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  const syncedAt = new Date().toISOString().replace("Z", "+00:00");

  const existingIds = new Set<number>();
  // Read IDs before writing to preserve the existing created/updated counters,
  // including repeated IDs in one upload. Bound SQL parameters for large uploads.
  for (let start = 0; start < products.length; start += 100) {
    const chunk = products.slice(start, start + 100);
    const existing = await db.execute({
      sql: `SELECT id FROM "BorgestProduct" WHERE id IN (${chunk.map(() => "?").join(",")})`,
      args: chunk.map((p) => p.producto_id),
    });
    existing.rows.forEach((row) => existingIds.add(Number(row.id)));
  }

  for (let start = 0; start < products.length; start += 100) {
    const chunk = products.slice(start, start + 100);
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

  return { processed: created + updated, created, updated, errors };
}
