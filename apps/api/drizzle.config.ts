import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    // Loaded from .env.local (root or apps/api level) via Bun env resolution
    url: process.env["DATABASE_URL"]!,
  },
});
