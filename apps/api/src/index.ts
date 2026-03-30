import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";

const server = serve({ fetch: app.fetch, port: env.PORT }, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
