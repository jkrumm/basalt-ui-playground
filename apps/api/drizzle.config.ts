import { readFileSync, existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't load .env.local — do it here
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    process.env[trimmed.slice(0, eq).trim()] ??= trimmed.slice(eq + 1).trim();
  }
}

// postgres.js rejects ?schema= (Prisma convention) — strip it
const url = new URL(process.env.DATABASE_URL!);
url.searchParams.delete("schema");

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/schema.ts", "./src/schema/auth-schema.ts"],
  out: "./drizzle",
  dbCredentials: { url: url.toString() },
  migrations: {
    table: "__drizzle_migrations",
    schema: "basalt_ui_playground",
  },
});
