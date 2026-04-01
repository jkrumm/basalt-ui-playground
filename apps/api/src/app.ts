import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { auth } from "./auth.ts";
import { env } from "./env.ts";
import { userRoutes } from "./routes/user.ts";

export const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: env.ALLOWED_ORIGIN,
      credentials: true,
    }),
  )
  .use(
    openapi({
      documentation: {
        info: {
          title: "CBBI API",
          version: "1.0.0",
        },
      },
      path: "/scalar",
    }),
  )
  // .mount() ignores the prefix scope; use .all() so prefix "/api" is applied normally
  .all("/auth/*", ({ request }) => auth.handler(request))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .use(userRoutes)
  .onError(({ code, error }) => {
    if (code === "NOT_FOUND") return new Response("Not Found", { status: 404 });
    console.error(`[${code}]`, error);
    return new Response("Internal Server Error", { status: 500 });
  });

export type App = typeof app;
