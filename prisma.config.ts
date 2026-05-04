import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.TURSO_AUTH_TOKEN
  ? `${process.env.DATABASE_URL}?authToken=${process.env.TURSO_AUTH_TOKEN}`
  : process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
