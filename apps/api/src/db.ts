import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.ts";
import * as schema from "./schema/index.ts";

// Strip Prisma-specific ?schema= param — postgres.js forwards unknown params to
// the server which rejects them. The schema is handled via pgSchema() in table defs.
const dbUrl = env.DATABASE_URL.replace(/([?&])schema=[^&]*/g, "$1").replace(/[?&]$/, "");
const client = postgres(dbUrl);

// v1 beta: object form with named client key — NOT positional drizzle(client, {schema})
export const db = drizzle({ client, schema });
