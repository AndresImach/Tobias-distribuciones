import "dotenv/config";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

// Seeds (or updates) the admin user directly in the database pointed to by
// DATABASE_URL — typically Turso in production. Unlike `prisma/seed.ts`, this
// does NOT hardcode the local dev.db path, so it can target the live database.
//
// Usage (locally, with production credentials in your env or .env):
//   DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... \
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=your-strong-password \
//   npm run db:seed:admin

const DATABASE_URL = process.env.DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL ?? "admin@tobias.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "admin1234";

const client = createClient({ url: DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

async function main() {
  console.log(`→ Connected to ${DATABASE_URL!.replace(/\?.*$/, "")}`);
  const hashedPassword = await bcrypt.hash(password, 10);

  // Upsert without relying on Prisma so this works against a bare libSQL client.
  await client.execute({
    sql: `INSERT INTO "AdminUser" (email, password) VALUES (?, ?)
          ON CONFLICT(email) DO UPDATE SET password = excluded.password`,
    args: [email, hashedPassword],
  });

  console.log(`✓ Admin user ready: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log("  ⚠ Using default password 'admin1234' — set ADMIN_PASSWORD to override.");
  }
}

main()
  .catch((err) => {
    console.error("Admin seed failed:", err);
    process.exit(1);
  })
  .finally(() => client.close());
