# API — Elysia Server Configuration

## Architecture

```
src/
├── env.ts          # Zod v4 env validation (parse-at-startup, fail fast)
├── app.ts          # Elysia instance with plugins and routes — NO .listen()
├── index.ts        # Entry: imports app, calls .listen()
├── auth.ts         # BetterAuth instance (Group 4)
├── db.ts           # Drizzle v1 instance (Group 3)
├── telemetry.ts    # OpenTelemetry setup (Group 3)
├── schema/         # Drizzle table definitions (Group 3)
├── routes/         # Elysia route modules (Group 5+)
└── seed.ts         # Demo user seeding (Group 3)
```

## Key Patterns

### Elysia Route Modules

Route modules are `Elysia` instances registered via `.use()`:

```ts
// src/routes/users.ts
import { Elysia } from "elysia";

export const users = new Elysia({ prefix: "/users" })
  .get("/", () => [...])
  .post("/", ({ body }) => ...);

// src/app.ts
import { users } from "./routes/users.ts";
app.use(users);
```

### App Type for EdenTreaty

The `App` type is exported from `app.ts` (not `index.ts`). Web app imports it:

```ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@cbbi/api";

const api = treaty<App>("http://localhost:7713");
```

### BetterAuth Mount (Group 4)

`prefix: "/api"` is **NOT applied** to `.mount()` — mount paths are absolute. BetterAuth's
default `basePath` is `/api/auth`, so the mount must use the full path:

```ts
// CORRECT — Elysia prefix does NOT apply to .mount(), so use the full path
app.mount("/api/auth", auth.handler);

// WRONG — prefix is not applied, so this would be at /auth/* only
// app.mount("/auth", auth.handler);
```

**Why `.all()` instead of `.mount()`**: `.all("/auth/*", ({ request }) => auth.handler(request))`
respects the prefix scope AND passes the full request URL to BetterAuth, matching its default
`basePath: "/api/auth"`.

### Auth Middleware Pattern (Group 4)

`derive` + `macro` — session fetched once per request, guard via `beforeHandle`:

```ts
// Elysia lifecycle: derive → beforeHandle → handler
// resolve runs before beforeHandle — do NOT use resolve for auth checks
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
          if (!user) { set.status = 401; return "Unauthorized"; }
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

`PORT` defaults to 7713 — set in `.env` as `API_PORT=7713` for the Makefile/scripts
(which pass it explicitly), but the API server reads `PORT` directly.

### Elysia + Zod

Elysia 1.4.x supports Standard Schema (Zod v4 is compliant). Use Zod schemas directly
in route body/query definitions:

```ts
import { z } from "zod";

const Body = z.object({ name: z.string() });
app.post("/", ({ body }) => body, { body: Body });
```

## Scripts

| Command               | Effect                      |
| --------------------- | --------------------------- |
| `bun run dev`         | Watch mode (`--watch`)      |
| `bun run typecheck`   | TypeScript check            |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate`  | Run migrations              |
| `bun run db:seed`     | Seed demo user              |
| `bun run db:studio`   | Drizzle Studio              |
