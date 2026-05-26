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
  const withoutComments = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutComments
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const repair = process.argv.includes("--repair");
  console.log(`→ Connected to ${DATABASE_URL!.replace(/\?.*$/, "")}${repair ? " (REPAIR MODE)" : ""}`);
  await client.execute(PRISMA_MIGRATIONS_DDL);

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const migrationNames = fs
    .readdirSync(migrationsDir)
    .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
    .sort();

  const applied = await client.execute("SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL");
  const appliedSet = new Set(applied.rows.map((r) => r.migration_name as string));

  let appliedCount = 0;
  let totalExecuted = 0;
  let totalSkipped = 0;
  for (const name of migrationNames) {
    const alreadyApplied = appliedSet.has(name);
    if (alreadyApplied && !repair) {
      console.log(`✓ ${name} (already applied)`);
      continue;
    }
    const sqlPath = path.join(migrationsDir, name, "migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    const statements = splitStatements(sql);
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");
    const id = crypto.randomUUID();

    console.log(`→ ${alreadyApplied ? "Re-checking" : "Applying"} ${name} (${statements.length} statements)`);
    let executed = 0;
    let skipped = 0;
    for (const stmt of statements) {
      try {
        await client.execute(stmt);
        executed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Idempotency: treat "already exists" / "duplicate column" as no-op.
        // This lets the script baseline a DB that already has the schema
        // (e.g., from prisma db push or a previous out-of-band setup).
        if (/already exists|duplicate column/i.test(msg)) {
          const head = stmt.replace(/\s+/g, " ").slice(0, 60);
          console.log(`  · skipped (already present): ${head}...`);
          skipped++;
        } else {
          throw err;
        }
      }
    }
    if (!alreadyApplied) {
      await client.execute({
        sql: `INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
        args: [id, checksum, name, executed],
      });
    }
    appliedCount++;
    totalExecuted += executed;
    totalSkipped += skipped;
    const summary = skipped > 0 ? `${executed} applied, ${skipped} skipped` : `${executed} applied`;
    console.log(`✓ ${name} (${summary})`);
  }

  if (repair) {
    console.log(`\nRepair complete. ${totalExecuted} statement(s) applied, ${totalSkipped} already present.`);
  } else {
    console.log(appliedCount === 0 ? "\nNo pending migrations." : `\n${appliedCount} migration(s) applied.`);
  }
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => client.close());
