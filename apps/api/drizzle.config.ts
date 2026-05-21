import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    // Loaded from .env.local (root or apps/api level) via Bun env resolution
    url: process.env["DATABASE_URL"]!,
  },
  // Keep the applied-migration journal in this app's own schema instead of the
  // default shared `drizzle` schema, so apps sharing the cluster don't collide
  // on one journal table.
  migrations: { schema: "basalt_ui_playground" },
});
