# API — Elysia Server Configuration

## Architecture

```
src/
├── env.ts          # Zod v4 env validation (parse-at-startup, fail fast)
├── app.ts          # Elysia instance with plugins and routes — NO .listen()
├── index.ts        # Entry: imports app, calls .listen()
├── auth.ts         # BetterAuth instance (email/password, Drizzle adapter, rate limiting)
├── db.ts           # Drizzle v1 beta instance (pgSchema: basalt_ui_playground)
├── telemetry.ts    # OpenTelemetry setup (OTLPTraceExporter + tracer)
├── schema/         # Drizzle table definitions (auth tables + user_preferences)
├── routes/         # Elysia route modules (user.ts)
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
import type { App } from "@cbbi/api";
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

### OpenTelemetry

`@elysiajs/opentelemetry` wired as first plugin in `app.ts`. `serviceName` passed directly
to plugin config (NodeSDK handles resource creation internally). Health endpoint excluded
from tracing via `checkIfShouldTrace`.

`tracer` export available for manual spans in route handlers.

## Plugin Order in app.ts

```
opentelemetry → cors → openapi → auth (.all) → health → routes → onError
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
