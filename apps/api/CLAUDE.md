# API — Elysia Server Configuration

## Architecture

```
src/
├── env.ts          # Zod v4 env validation (parse-at-startup, fail fast)
├── app.ts          # Elysia instance with plugins and routes — NO .listen()
├── index.ts        # Entry: imports app, calls .listen()
├── auth.ts         # BetterAuth instance (email/password, Drizzle adapter, rate limiting)
├── db.ts           # Drizzle v1 beta instance + @kubiks/otel-drizzle instrumentation
├── telemetry.ts    # OpenTelemetry setup (OTLPTraceExporter + tracer)
├── lib/
│   └── traced-fetch.ts  # OTEL-instrumented fetch + TTL cache for external APIs
├── adapters/       # External API integrations (CBBI, CoinGecko, Fear & Greed)
│   ├── cbbi.ts          # colintalkscrypto.com — Bitcoin cycle indicators
│   ├── coingecko.ts     # CoinGecko — Bitcoin price and market data
│   └── fear-greed.ts    # Alternative.me — Fear & Greed Index
├── schema/         # Drizzle table definitions (auth tables + user_preferences)
├── routes/         # Elysia route modules
│   ├── user.ts          # User preferences (auth-guarded)
│   └── market.ts        # Market data endpoints (CBBI, Bitcoin, FNG)
├── middleware/      # Auth middleware (derive + macro pattern)
└── seed.ts         # Demo user seeding (argon2id hashed)
```

## Key Patterns

### Elysia Route Modules

Route modules are `Elysia` instances registered via `.use()`:

```ts
// src/routes/user.ts
import { Elysia } from "elysia";

export const userRoutes = new Elysia({ prefix: "/user" })
  .use(authMiddleware)
  .get("/me", ({ user }) => user, { auth: true });

// src/app.ts
app.use(userRoutes);
```

### App Type for EdenTreaty

The `App` type is exported from `app.ts` (not `index.ts`). Web app imports it:

```ts
import type { App } from "@basalt-ui-playground/api";
const api = treaty<App>("http://localhost:7713");
```

### BetterAuth Mount

`app.prefix` is `/api`. `.mount()` ignores the prefix scope, so use `.all()` instead:

```ts
// CORRECT — .all() respects prefix, resolves to /api/auth/*
app.all("/auth/*", ({ request }) => auth.handler(request));

// WRONG — .mount() ignores prefix
// app.mount("/auth", auth.handler);
```

### Auth Middleware Pattern

`derive` + `macro` — session fetched once per request, guard via `beforeHandle`:

```ts
// Elysia lifecycle: derive → beforeHandle → handler
// Use derive (nullable user) + beforeHandle gate (401 if null)

export const authMiddleware = new Elysia({ name: "auth" })
  .derive({ as: "scoped" }, async ({ request: { headers } }) => {
    const session = await auth.api.getSession({ headers });
    return { user: session?.user ?? null, userId: session?.user?.id ?? null };
  })
  .macro({
    auth(enabled: boolean) {
      if (!enabled) return {};
      return {
        beforeHandle: ({ user, set }) => {
          if (!user) {
            set.status = 401;
            return "Unauthorized";
          }
        },
      };
    },
  });
```

Handlers use `user!` / `userId!` — non-null assertion is safe because `beforeHandle` guarantees
non-null in the guarded scope.

### Env Validation

Env is validated at startup via `src/env.ts`. Missing required vars (DATABASE_URL,
BETTER_AUTH_SECRET) will throw immediately with a clear Zod error.

`PORT` defaults to 7713. `BETTER_AUTH_SECRET` enforced minimum 32 chars.

### Elysia + Zod

Elysia 1.4.x supports Standard Schema (Zod v4 is compliant). Use Zod schemas directly
in route body/query definitions:

```ts
import { z } from "zod";

const Body = z.object({ name: z.string() });
app.post("/", ({ body }) => body, { body: Body });
```

### Drizzle v1 Beta

```typescript
// CORRECT v1 beta API:
export const db = drizzle({ client, schema: { ...tables } });

// WRONG (old v0 — silently ignores client):
export const db = drizzle(client, { schema });
```

- pgSchema: `basalt_ui_playground` (isolated from public schema)
- Config files use `process.env["KEY"]` bracket notation (TS 6.0 strict, TS4111)
- `db.select()` for queries (no `defineRelations()` needed)
- Wrapped with `@kubiks/otel-drizzle` — all queries emit `drizzle.select/insert/update/delete`
  spans with `db.statement`, `db.operation`, `db.system` attributes

### OpenTelemetry

`@elysiajs/opentelemetry` wired as first plugin in `app.ts`. `serviceName` passed directly
to plugin config (NodeSDK handles resource creation internally). Health endpoint excluded
from tracing via `checkIfShouldTrace`.

`tracer` export available for manual spans in route handlers.

**Error recording:** The Elysia OTEL plugin doesn't call `recordException()` in its `onError`
path. The `onError` handler in `app.ts` adds this manually via `trace.getActiveSpan()` so
errors appear as span events in ClickStack.

**Auth header:** `OTLPTraceExporter` reads `OTEL_EXPORTER_OTLP_HEADERS` env var automatically.
No manual header parsing needed — just set the env var.

### External API Adapters

Adapters in `src/adapters/` fetch from external APIs using `tracedFetch` (OTEL spans)
and return typed domain objects. Each adapter has a `cached()` wrapper to avoid hammering
upstream services:

```ts
// src/adapters/coingecko.ts
import { cached, tracedFetch } from "../lib/traced-fetch.ts";

export const getBitcoinPrice = cached(30_000, async () => {
  const res = await tracedFetch("https://api.coingecko.com/api/v3/coins/bitcoin?...");
  // ... transform and return typed BitcoinPrice
});
```

Cache TTLs: CBBI (1h, daily data), Bitcoin price (30s, poll-friendly), Fear & Greed (1h, daily).

### Auth Route Span Names

`.all("/auth/*")` handler overrides the OTEL span name from the wildcard pattern to the
actual endpoint path (e.g., `POST /api/auth/sign-in/email`) via `trace.getActiveSpan().updateName()`.

## Plugin Order in app.ts

```
opentelemetry → cors → openapi → auth (.all) → health → userRoutes → marketRoutes → onError
```

## Scripts

| Command               | Effect                      |
| --------------------- | --------------------------- |
| `bun run dev`         | Watch mode (`--watch`)      |
| `bun run start`       | Production start            |
| `bun run typecheck`   | TypeScript check            |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate`  | Run migrations              |
| `bun run db:seed`     | Seed demo user              |
| `bun run db:studio`   | Drizzle Studio              |
