import { instrumentDrizzleClient } from "@kubiks/otel-drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.ts";
import * as schema from "./schema/index.ts";

// Strip Prisma-specific ?schema= param — postgres.js forwards unknown params to
// the server which rejects them. The schema is handled via pgSchema() in table defs.
const dbUrl = env.DATABASE_URL.replace(/([?&])schema=[^&]*/g, "$1").replace(/[?&]$/, "");
const client = postgres(dbUrl);

// v1 beta: object form with named client key — NOT positional drizzle(client, {schema})
const rawDb = drizzle({ client, schema });

// Wraps all Drizzle operations (select/insert/update/delete) with OTEL spans.
// Spans include db.statement, db.operation, db.system per OTEL DB semantic conventions.
export const db = instrumentDrizzleClient(rawDb, {
  dbSystem: "postgresql",
  dbName: "basalt_ui_playground",
  captureQueryText: true,
});
