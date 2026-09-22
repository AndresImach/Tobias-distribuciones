import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { createClient, type Client } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncProducts, type BorgestProducto } from "../src/lib/sync-products";

const schema = `CREATE TABLE BorgestProduct (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, barcode TEXT,
  price1 REAL NOT NULL, price2 REAL, price3 REAL, price4 REAL,
  stock INTEGER NOT NULL DEFAULT 0, estado TEXT NOT NULL, foto TEXT,
  syncedAt DATETIME NOT NULL
)`;
const product = (id: number): BorgestProducto => ({
  producto_id: id, producto_nombre: `Producto ${id}`,
  producto_precioventa1: 100.5, producto_estado: "A",
});
async function fixture(t: TestContext) {
  const dir = await mkdtemp(join(tmpdir(), "tobias-sync-test-"));
  const url = `file:${join(dir, "db.sqlite")}`;
  const db = createClient({ url });
  await db.execute(schema);
  t.after(async () => { db.close(); await rm(dir, { recursive: true, force: true }); });
  return { db, url };
}

test("batched inserts and updates preserve stock, nullable values and Prisma dates", async (t) => {
  const { db, url } = await fixture(t);
  const first = { ...product(1), producto_stock: 9, producto_precioventa2: 80,
    producto_precioventa3: 70, producto_precioventa4: 60,
    producto_foto: "foto", producto_codigobarras: "123" };
  assert.deepEqual(await syncProducts([first], db), { processed: 1, created: 1, updated: 0, errors: [] });
  await db.execute('CREATE TABLE CuratedProduct (id INTEGER PRIMARY KEY, borgestProductId INTEGER REFERENCES BorgestProduct(id) ON DELETE SET NULL)');
  await db.execute('INSERT INTO CuratedProduct VALUES (99, 1)');
  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  t.after(() => prisma.$disconnect());
  const before = await prisma.borgestProduct.findUniqueOrThrow({ where: { id: 1 } });
  assert.equal(before.stock, 9);
  assert.equal(before.price4, 60);
  assert.ok(before.syncedAt instanceof Date);
  assert.deepEqual(await syncProducts([{ ...product(1), producto_nombre: "Actualizado" }, product(2)], db),
    { processed: 2, created: 1, updated: 1, errors: [] });
  const after = await prisma.borgestProduct.findUniqueOrThrow({ where: { id: 1 } });
  assert.equal(after.name, "Actualizado");
  assert.equal((await db.execute('SELECT borgestProductId FROM CuratedProduct WHERE id = 99')).rows[0].borgestProductId, 1);
  assert.equal(after.stock, 9);
  assert.equal(after.price2, null);
  assert.equal(after.price3, null);
  assert.equal(after.price4, null);
  assert.equal(after.barcode, null);
  assert.equal(after.foto, null);
  assert.equal((await prisma.borgestProduct.findUniqueOrThrow({ where: { id: 2 } })).stock, 0);
  await syncProducts([{ ...product(1), producto_stock: 0 }], db);
  assert.equal((await prisma.borgestProduct.findUniqueOrThrow({ where: { id: 1 } })).stock, 0);
});

test("large uploads use bounded batches and preserve repeated-ID ordering and counters", async (t) => {
  const { db } = await fixture(t);
  let reads = 0;
  let batches = 0;
  const measured = {
    execute: (...args: Parameters<Client["execute"]>) => { reads++; return db.execute(...args); },
    batch: (...args: Parameters<Client["batch"]>) => { batches++; return db.batch(...args); },
  } as Client;
  const input = Array.from({ length: 250 }, (_, i) => product(i + 1));
  input.push({ ...product(1), producto_nombre: "Último valor", producto_stock: 4 });
  assert.deepEqual(await syncProducts(input, measured), { processed: 251, created: 251, updated: 0, errors: [] });
  assert.equal(reads, 3);
  assert.equal(batches, 3);
  assert.equal((await db.execute('SELECT count(*) AS n FROM BorgestProduct')).rows[0].n, 250);
  assert.equal((await db.execute('SELECT name FROM BorgestProduct WHERE id = 1')).rows[0].name, "Último valor");
});

test("failed row rolls back the batch then preserves partial success", async (t) => {
  const { db } = await fixture(t);
  await db.execute(`CREATE TRIGGER reject_bad BEFORE INSERT ON BorgestProduct
    WHEN NEW.id = 2 BEGIN SELECT RAISE(ABORT, 'test row rejected'); END`);
  const result = await syncProducts([product(1), product(2), product(3)], db);
  assert.equal(result.processed, 2);
  assert.equal(result.created, 2);
  assert.equal(result.updated, 0);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /producto_id=2:/);
  assert.deepEqual((await db.execute('SELECT id FROM BorgestProduct ORDER BY id')).rows.map((r) => r.id), [1, 3]);
});

test("HTTP libSQL sends 50 writes in one request", async () => {
  const requests: unknown[] = [];
  const db = createClient({ url: "https://sync-test.invalid", fetch: async (input: RequestInfo | URL) => {
    const body = await (input as Request).json();
    requests.push(body);
    return Response.json({ baton: null, base_url: null, results: body.requests.map((request: { type: string; batch?: { steps: unknown[] } }) => {
      const result = { cols: [], rows: [], affected_row_count: 0, last_insert_rowid: null };
      if (request.type === "execute") return { type: "ok", response: { type: "execute", result } };
      if (request.type === "batch") return { type: "ok", response: { type: "batch", result: {
        step_results: request.batch!.steps.map(() => result), step_errors: [],
      } } };
      return { type: "ok", response: { type: request.type } };
    }) });
  } });
  try {
    const result = await syncProducts(Array.from({ length: 50 }, (_, i) => product(i)), db);
    assert.equal(result.processed, 50);
    assert.equal(requests.length, 2, "one ID read + one HTTP write batch");
  } finally { db.close(); }
});

test("route keeps authentication, validation and response contract", async (t) => {
  const { db, url } = await fixture(t);
  const previousUrl = process.env.DATABASE_URL;
  const previousKey = process.env.SYNC_API_KEY;
  process.env.DATABASE_URL = url;
  process.env.SYNC_API_KEY = "test-sync-key";
  t.after(() => {
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SYNC_API_KEY;
    else process.env.SYNC_API_KEY = previousKey;
  });
  const { POST } = await import("../src/app/api/sync-productos/route");
  const request = (body: unknown, key = "test-sync-key") => new Request("https://example.test/api/sync-productos", {
    method: "POST", headers: { "x-api-key": key, "content-type": "application/json" }, body: JSON.stringify(body),
  });
  assert.equal((await POST(request([product(1)], "wrong"))).status, 401);
  assert.equal((await POST(request({ products: [] }))).status, 400);
  assert.equal((await POST(request([]))).status, 400);
  const response = await POST(request([product(1), { ...product(2), producto_stock: -1 }]));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.processed, 1);
  assert.equal(body.created, 1);
  assert.equal(body.updated, 0);
  assert.equal(body.errors.length, 1);
  assert.equal((await db.execute('SELECT count(*) AS n FROM BorgestProduct')).rows[0].n, 1);
});
