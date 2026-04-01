import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.ts";
import * as schema from "./schema/index.ts";

const client = postgres(env.DATABASE_URL);

// v1 beta: object form with named client key — NOT positional drizzle(client, {schema})
export const db = drizzle({ client, schema });
