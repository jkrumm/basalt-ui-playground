import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.ts";
import { userPreferences } from "./schema.ts";
import { user, session, account, verification } from "./schema/auth-schema.ts";

// Strip Prisma-style ?schema= param — postgres.js rejects it as unknown
const url = new URL(env.DATABASE_URL);
url.searchParams.delete("schema");

const client = postgres(url.toString(), { onnotice: () => {} });

// drizzle v1 beta changed the API: drizzle({ client, ...config }) not drizzle(client, config)
export const db = drizzle({
  client,
  schema: { userPreferences, user, session, account, verification },
});
