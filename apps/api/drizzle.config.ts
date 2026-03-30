import { defineConfig } from "drizzle-kit";
import { env } from "./src/env";

export default defineConfig({
  schema: ["./src/schema.ts", "./src/schema/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
});
