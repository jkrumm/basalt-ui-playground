# Group 2: Elysia API Server (Core)

## What You're Doing

Create a working Elysia API server with environment validation, health endpoint, CORS, and Scalar/OpenAPI docs. This establishes the API foundation that all subsequent groups build on.

---

## Research & Exploration First

1. Research: Elysia 1.4.x getting started — latest API, plugin system, `.listen()` pattern (Context7 or Tavily + WebFetch of elysiajs.com docs)
2. Research: @elysiajs/openapi setup (this replaced @elysiajs/swagger) — Scalar configuration
3. Research: @elysiajs/cors configuration options
4. Research: Elysia + Zod v4 integration — does Elysia 1.4.x support Zod natively or need `@elysiajs/zod` plugin? Can Zod schemas be used directly in route definitions?
5. Read existing `apps/api/` if any remnants exist from old codebase
6. Read the demo project `apps/api/` at `/Users/johannes.krumm/Downloads/tanstack-start-elysia-better-auth-bun-main` for Elysia patterns

---

## What to Implement

### 1. apps/api/package.json

Dependencies: `elysia`, `@elysiajs/openapi`, `@elysiajs/cors`, `zod` (v4). Name: `@cbbi/api`.

Export the app type: `"exports": { ".": "./src/app.ts" }` (or appropriate path for EdenTreaty type inference).

### 2. apps/api/tsconfig.json

Extend root tsconfig. Ensure it works with Bun runtime (Bun types).

### 3. src/env.ts — Zod v4 Environment Validation

```typescript
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:7712"),
  BETTER_AUTH_SECRET: z.string().min(32),
  ALLOWED_ORIGIN: z.string().url().default("http://localhost:7712"),
  PORT: z.coerce.number().default(7713),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().default("http://localhost:4318"),
  OTEL_SERVICE_NAME: z.string().default("cbbi-api"),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
```

Note: Verify `z.url()` vs `z.string().url()` in Zod v4 — the API may have changed.

### 4. src/app.ts — Main Elysia App

```typescript
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { env } from "./env.ts";

export const app = new Elysia({ prefix: "/api" })
  .use(cors({ origin: env.ALLOWED_ORIGIN, credentials: true }))
  .use(openapi({
    documentation: {
      info: { title: "CBBI API", version: "1.0.0" },
    },
    path: "/scalar",
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .onError(({ code, error }) => {
    // Global error handler
  });

export type App = typeof app;
```

**IMPORTANT:** Research whether Elysia's `prefix` on the root app affects `.mount()` paths (relevant for Group 4). The demo project uses NO prefix on root. If prefix causes double-pathing with `.mount("/api/auth")`, remove the prefix and use it on individual route groups instead.

### 5. src/index.ts — Server Entry

```typescript
import { app } from "./app.ts";
import { env } from "./env.ts";

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});
```

Use Elysia's `.listen()` method (not raw `Bun.serve()`).

### 6. Export App type for EdenTreaty

The `App` type must carry the full Elysia chain (all plugins, routes, return types). Verify this type is importable from `@cbbi/api` via Bun workspace protocol.

### 7. apps/api/CLAUDE.md

Write API-specific CLAUDE.md covering Elysia patterns, env validation, route structure.

### 8. Wire into root

- Update root `package.json` scripts: `dev:api` should run `bun run --cwd apps/api dev`
- Update Makefile `dev` target to start API
- Ensure `bun install` resolves the new workspace package

---

## Validation

```bash
bun install                                    # workspace resolves
bun run --cwd apps/api src/index.ts            # starts on 7713
curl http://localhost:7713/api/health           # returns { status: "ok" }
# Scalar UI accessible at http://localhost:7713/api/scalar (or /scalar depending on prefix)
bun run typecheck                              # all workspaces pass
```

Kill the server after validation.

---

## Commit

```
feat(api): initialize Elysia server with env validation, health, and Scalar docs
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 2
```
