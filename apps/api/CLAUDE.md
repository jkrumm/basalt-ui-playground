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

BetterAuth mounts at `/auth` — **not** `/api/auth`. The app already has `prefix: "/api"`,
so the final path becomes `/api/auth/...`:

```ts
// CORRECT — resolves to /api/auth/...
app.mount("/auth", auth.handler);

// WRONG — would resolve to /api/api/auth/...
// app.mount("/api/auth", auth.handler);
```

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
