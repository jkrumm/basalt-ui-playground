import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { Elysia } from "elysia";
import { z } from "zod";

import { auth } from "./auth.ts";
import { env } from "./env.ts";
import { marketRoutes } from "./routes/market.ts";
import { userRoutes } from "./routes/user.ts";
import { telemetryConfig } from "./telemetry.ts";

// Fetch BetterAuth's OpenAPI schema and rewrite paths to match the actual mount point.
// BetterAuth generates paths relative to its baseURL (e.g. /sign-in/email).
// The app prefix is /api and auth is mounted at /auth/*, so full path = /api/auth/sign-in/email.
// documentation.paths are merged as-is (no prefix applied), so we must include /api/auth.
// BetterAuth names its tag "Default" — rename to "Auth" for clarity in Scalar.
const rawAuthSchema = await auth.api.generateOpenAPISchema();
const authPaths = Object.fromEntries(
  Object.entries(rawAuthSchema.paths).map(([path, def]) => [
    `/api/auth${path}`,
    {
      ...def,
      ...Object.fromEntries(
        Object.entries(def).map(([method, op]) => [
          method,
          op && typeof op === "object" && "tags" in op
            ? { ...op, tags: (op.tags as string[]).map((t) => (t === "Default" ? "Auth" : t)) }
            : op,
        ]),
      ),
    },
  ]),
);
const authTags = rawAuthSchema.tags.map((t) => (t.name === "Default" ? { ...t, name: "Auth" } : t));

export const app = new Elysia({ prefix: "/api" })
  .use(
    opentelemetry({
      ...telemetryConfig,
      checkIfShouldTrace: (req) => !req.url.includes("/health"),
    }),
  )
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
          title: "Basalt UI Playground API",
          version: "1.0.0",
        },
        // Merge BetterAuth auth endpoints into the unified Scalar spec.
        // Cast needed: BetterAuth's internal OpenAPI types differ structurally from
        // @elysiajs/openapi's OpenAPI types but are compatible at runtime.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paths: authPaths as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        components: rawAuthSchema.components as any,
        tags: authTags,
      },
      // Zod v4 schemas need explicit JSON Schema serialization for Scalar docs
      mapJsonSchema: { zod: z.toJSONSchema },
      path: "/scalar",
    }),
  )
  // .mount() ignores the prefix scope; use .all() so prefix "/api" is applied normally.
  // Override the OTEL span name from the wildcard pattern (/api/auth/*) to the actual
  // auth endpoint path (e.g., POST /api/auth/sign-in/email) for readable traces.
  .all(
    "/auth/*",
    ({ request }) => {
      const span = trace.getActiveSpan();
      if (span) {
        const url = new URL(request.url);
        span.updateName(`${request.method} ${url.pathname}`);
        span.setAttribute("http.route", url.pathname);
      }
      return auth.handler(request);
    },
    { detail: { hide: true } },
  )
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .use(userRoutes)
  .use(marketRoutes)
  .onError(({ code, error }) => {
    if (code === "NOT_FOUND")
      return new Response(JSON.stringify({ error: "Not Found", status: 404 }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    // Elysia OTEL plugin sets status code but doesn't call recordException() in onError.
    // Record the exception manually so it appears as a span event in ClickStack.
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
    }
    console.error(`[${code}]`, error);
    return new Response(JSON.stringify({ error: "Internal Server Error", status: 500 }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  });

export type App = typeof app;
