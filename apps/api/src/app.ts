import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { env } from "./env.ts";

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
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .onError(({ code, error }) => {
    if (code === "NOT_FOUND") return new Response("Not Found", { status: 404 });
    console.error(`[${code}]`, error);
    return new Response("Internal Server Error", { status: 500 });
  });

export type App = typeof app;
