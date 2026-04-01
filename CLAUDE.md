# cbbi-blueprint — Project Configuration

## Project Purpose

This is a **POC playground and greenfield boilerplate** — not a production application. Its goal
is to align and optimise frontend stack patterns (TanStack Start, Blueprint v6, Jotai, TanStack
Query, analytics, SSR/SSG, state architecture) so that individual apps built on top of it
start from a well-considered baseline.

**The CBBI dashboard content is the vehicle, not the destination.** Every architectural decision
should be made with "what would downstream apps need?" in mind, not "what does this dashboard need?".

---

## Monorepo Layout

```
basalt-ui-playground/
├── apps/
│   ├── web/                    # TanStack Start frontend (:7712)
│   │   ├── src/
│   │   │   ├── routes/         # File-based routing (TanStack Router)
│   │   │   ├── components/     # React components (layout, content, MDX, analytics)
│   │   │   ├── atoms/          # Jotai state (theme, preferences, UI)
│   │   │   ├── queries/        # TanStack Query definitions
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities (api client, auth, analytics, theme, hyperdx)
│   │   │   ├── content/        # MDX source (blog, docs, guides, blocks)
│   │   │   ├── styles/         # CSS modules
│   │   │   ├── client.tsx      # Client entry (hydrateRoot)
│   │   │   └── router.tsx      # Router config (getRouter export)
│   │   ├── server.ts           # Production SSR server (Bun.serve)
│   │   ├── vite.config.ts      # Vite 8 + TanStack Start plugin
│   │   ├── content-collections.ts
│   │   └── package.json
│   └── api/                    # Elysia API server (:7713)
│       ├── src/
│       │   ├── index.ts        # Entry: imports app, calls .listen()
│       │   ├── app.ts          # Elysia instance (exported type for EdenTreaty)
│       │   ├── auth.ts         # BetterAuth instance
│       │   ├── db.ts           # Drizzle v1 instance
│       │   ├── env.ts          # Zod v4 env validation
│       │   ├── telemetry.ts    # OpenTelemetry setup
│       │   ├── schema/         # Drizzle table definitions
│       │   ├── routes/         # Elysia route modules
│       │   ├── middleware/      # Auth middleware (derive + macro)
│       │   └── seed.ts         # Demo user seeding
│       ├── drizzle.config.ts
│       ├── drizzle/            # Migrations
│       └── package.json
├── packages/
│   └── schemas/                # Shared Zod v4 schemas (@cbbi/schemas)
│       └── src/
│           ├── auth.ts
│           ├── user.ts
│           ├── user-preferences.ts
│           └── index.ts
├── scripts/
│   ├── setup-cbbi-db.sql       # Postgres provisioning (run as superuser)
│   └── kill-ports.sh           # Kill 7712/7713
├── docs/
│   └── ralph/                  # RALPH loop state and learning notes
├── Makefile                    # Developer commands
├── bunfig.toml                 # Bun workspace config
├── tsconfig.json               # Root TypeScript config (extended by all packages)
├── eslint.config.ts            # ESLint flat config (TS-ESLint, Blueprint, Router, React Compiler)
├── oxlint.json                 # OxLint config
├── .oxfmtrc.json               # oxfmt formatter config
├── compose.yml                 # Docker Compose (web + api + postgres)
├── Dockerfile                  # Multi-stage build (web + api targets)
├── .env                        # Committed non-secret defaults
└── .env.example                # Full variable reference with placeholders
```

---

## Tech Stack

| Concern      | Choice                  | Version         |
| ------------ | ----------------------- | --------------- |
| Runtime      | Bun                     | >=1.3.x         |
| Language     | TypeScript              | 6.0.x           |
| Frontend     | TanStack Start          | >=1.167.x       |
| Router       | TanStack Router         | >=1.168.x       |
| Query        | TanStack Query          | >=5.96.x        |
| Build        | Vite                    | >=8.0.x         |
| UI           | Blueprint v6            | >=6.10.x        |
| State        | Jotai                   | >=2.19.x        |
| CSS          | Tailwind CSS            | >=4.2.x         |
| API          | Elysia                  | 1.4.x           |
| API Client   | @elysiajs/eden          | 1.4.x           |
| API Docs     | @elysiajs/openapi       | 1.4.x           |
| Auth         | better-auth             | >=1.5.x         |
| ORM          | drizzle-orm             | 1.0.0-beta.x    |
| DB Driver    | postgres                | 3.4.x           |
| Validation   | Zod                     | >=4.3.x         |
| Telemetry    | @elysiajs/opentelemetry | 1.4.x           |
| Frontend RUM | @hyperdx/browser        | >=0.22.x        |
| Lint         | oxlint + ESLint         | >=1.58.x / 10.x |
| Format       | oxfmt                   | >=0.43.x        |
| React        | React                   | >=19.2.x        |

---

## Port Configuration

| App                  | Port | Local alias                                |
| -------------------- | ---- | ------------------------------------------ |
| Web (TanStack Start) | 7712 | http://basalt-ui-playground.local:7712     |
| API (Elysia)         | 7713 | http://basalt-ui-playground-api.local:7713 |

Ports are hardcoded as defaults; override via env.

---

## Environment Strategy

- `.env` — committed, non-secret defaults (ports, local URLs, OTEL endpoint, HyperDX RUM)
- `.env.local` — gitignored, real secrets (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
- `.env.example` — full reference with placeholder values (committed)

Required secrets in `.env.local`:

```bash
DATABASE_URL=postgresql://cbbi:cbbi@localhost:5432/cbbi
BETTER_AUTH_SECRET=<at-least-32-characters>
```

---

## Developer Commands

```bash
make dev          # Kill ports, start web + api concurrently
make start        # Start production server (after build)
make build        # Build all workspaces
make check        # fmt + lint + lint:style + typecheck + test
make fmt          # oxfmt check (read-only)
make fmt-fix      # oxfmt write
make lint         # oxlint + eslint
make typecheck    # tsc --noEmit across all workspaces
make db-setup     # Run scripts/setup-cbbi-db.sql via psql
make db-generate  # drizzle-kit generate
make db-migrate   # drizzle-kit migrate
make db-seed      # Seed demo user
make db-studio    # Drizzle Studio
make kill         # Kill processes on 7712 and 7713
make docker-build # Build Docker images (web + api)
make docker-up    # Start Docker Compose stack
make docker-down  # Stop Docker Compose stack
```

Root-level npm scripts mirror Make targets:

```bash
bun run typecheck   # tsc --noEmit across all workspaces
bun run fmt         # oxfmt --check .
bun run fmt:fix     # oxfmt .
bun run lint        # oxlint + eslint
bun run lint:style  # stylelint CSS files
bun run check       # fmt + lint + lint:style + typecheck
```

---

## Key Patterns

### TypeScript Imports

Bun requires `.ts` extensions in relative imports:

```ts
import { foo } from "./bar.ts";
```

### Shared Schemas

Internal packages use `workspace:*` protocol:

```json
{ "@cbbi/schemas": "workspace:*" }
```

### Drizzle v1 Beta API

```typescript
// CORRECT (v1 beta):
export const db = drizzle({ client, schema: { ...tables } });

// WRONG (old v0 pattern — silently ignores client):
export const db = drizzle(client, { schema });
```

- `db.query.table` requires `defineRelations()` — use `db.select()` for simple queries
- pgSchema isolation: `basalt_ui_playground` schema
- Config files use `process.env["KEY"]` bracket notation (TS 6.0 strict mode, TS4111)

### Elysia + BetterAuth

- Elysia `.mount()` ignores the `prefix` scope — use `.all("/auth/*", ...)` instead
- Auth middleware: `derive` (nullable session) + `macro.beforeHandle` (401 gate)
- Elysia 1.4.x supports Standard Schema natively — Zod v4 schemas work in route definitions

### Zod v4 Validators

`z.email()` is now a standalone function (not `z.string().email()`):

```ts
z.email(); // Zod v4
z.url(); // Zod v4
```

### TanStack Start

- `router.tsx` exports `getRouter()` (not `createRouter`) — resolved via virtual module
- `StartClient` takes zero props (router resolved internally)
- React Compiler via `@rolldown/plugin-babel` (separate pass from `@vitejs/plugin-react@6`)

---

## Observability

### Backend (API)

`@elysiajs/opentelemetry` sends traces to OTEL endpoint. `serviceName` passed directly to
plugin config (NodeSDK handles resource creation). Health endpoint excluded from tracing.

### Frontend (Web)

`@hyperdx/browser` for session replay, console capture, network capture. Trace context
propagation via `tracePropagationTargets: [/\/api\//]` links browser → SSR → API spans.

### Self-Hosted ClickStack

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318  # dev
OTEL_EXPORTER_OTLP_ENDPOINT=http://clickstack:4318 # docker
HYPERDX_API_KEY=dev                                  # any non-empty string
```

---

## Analytics (Umami)

### URL state vs custom events — the boundary

**If the state is in the URL → it's a pageview. No custom event needed.**
**If the state is ephemeral UI (not in URL) → custom event.**

### Event naming

**Format:** `snake_case`, Object-Action past tense.
**Always include `component`** as a property (not in the event name itself).

### URL state — TanStack Router search params

Use `z.object().safeParse()` for `validateSearch` — no adapter needed. `.default()` applies on parse:

```ts
validateSearch: (search: Record<string, unknown>): BlogSearch => {
  const result = BlogSearch.safeParse(search);
  return result.success ? result.data : { tag: "" };
},
```

**Never** use `useState` for filter state that belongs in the URL.

---

## Docker

Multi-stage `Dockerfile` with `web` and `api` targets. `compose.yml` includes web, api, and
postgres services. ClickStack is commented out (user manages it separately).

```bash
make docker-build   # Build images
make docker-up      # Start stack
make docker-down    # Stop stack
```

---

## Documentation Convention

Learnings and patterns go into MDX docs under `apps/web/src/content/docs/` (once web app exists).
Rendered at `/docs`.
