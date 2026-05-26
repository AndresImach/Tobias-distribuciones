import "dotenv/config";
import { createClient } from "@libsql/client";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DATABASE_URL = process.env.DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = createClient({ url: DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

const PRISMA_MIGRATIONS_DDL = `
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
  )
`;

function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

async function main() {
  console.log(`→ Connected to ${DATABASE_URL!.replace(/\?.*$/, "")}`);
  await client.execute(PRISMA_MIGRATIONS_DDL);

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const migrationNames = fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
    .sort();

  const applied = await client.execute("SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL");
  const appliedSet = new Set(applied.rows.map((r) => r.migration_name as string));

  let appliedCount = 0;
  for (const name of migrationNames) {
    if (appliedSet.has(name)) {
      console.log(`✓ ${name} (already applied)`);
      continue;
    }
    const sqlPath = path.join(migrationsDir, name, "migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    const statements = splitStatements(sql);
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");
    const id = crypto.randomUUID();

    console.log(`→ Applying ${name} (${statements.length} statements)`);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    await client.execute({
      sql: `INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      args: [id, checksum, name, statements.length],
    });
    appliedCount++;
    console.log(`✓ ${name} (applied)`);
  }

  console.log(appliedCount === 0 ? "\nNo pending migrations." : `\n${appliedCount} migration(s) applied.`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => client.close());
