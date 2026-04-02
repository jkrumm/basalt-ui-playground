# basalt-ui-playground — Project Configuration

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
│   └── schemas/                # Shared Zod v4 schemas (@basalt-ui-playground/schemas)
│       └── src/
│           ├── auth.ts
│           ├── user.ts
│           ├── user-preferences.ts
│           └── index.ts
├── scripts/
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

- `apps/api/.env` — committed, all local dev values including DB credentials (no prod secrets)
- `apps/web/.env` — committed, `VITE_*` defaults and port
- `.env.example` — full reference with placeholder values (committed)
- Production: Doppler injects env vars at runtime — no `.env` files used

Bun reads `.env` from each app's directory when running via `--filter`.

---

## Developer Commands

```bash
make dev          # Kill ports, start web + api concurrently
make start        # Kill ports, build, then start production server
make build        # Build all workspaces
make check        # fmt + lint + lint:style + typecheck + test + build
make fmt          # oxfmt check (read-only)
make fmt-fix      # oxfmt write
make lint         # oxlint + eslint
make typecheck    # tsc --noEmit across all workspaces
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
{ "@basalt-ui-playground/schemas": "workspace:*" }
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
- **Server functions only for SSR request-context tasks** (cookies, headers): `getSessionFn`,
  `getThemeFn`. All data fetching goes through Elysia API routes + EdenTreaty.

### Query Dehydration/Hydration (manual — no `routerWithQueryClient`)

`@tanstack/react-router-with-query` is NOT used. It used `router.serverSsr.isDehydrated()` which
was removed in Router 1.168.x, causing all streamed queries to never hydrate client-side.

Manual dehydration in `router.tsx` instead:

```ts
dehydrate: () => dehydrateQueryClient(queryClient) as unknown as { [key: string]: NonNullable<unknown> },
hydrate: (d) => hydrateQueryClient(queryClient, d as unknown as ReturnType<typeof dehydrateQueryClient>),
```

The type assertions bridge `@tanstack/react-query` (`readonly unknown[]` keys) vs TanStack Start
(`readonly {}[]` keys) — a version mismatch, runtime types are fully compatible.

**Rules for route loaders:**

- **Always `await` every `prefetchQuery` / `ensureQueryData`** — never fire-and-forget.
  Fire-and-forget causes query state to be `"pending"` at dehydration time, which can result in
  hydration mismatches (React error #418) and empty client-side queries.
- `ensureQueryData` for critical data (throws on failure → `errorComponent`)
- `prefetchQuery` for optional data (swallows errors → `DataUnavailable` fallback in component)

**TanStack Start `$R` serializer caveat:**
Strings matching `YYYY-MM-DD` format (ISO date strings) are automatically converted to `new Date()`
objects in SSR streaming inline scripts. Avoid returning ISO date strings from API adapters —
use `toLocaleDateString()` or other non-ISO formats instead.

### Data Fetching Architecture

```
Browser/SSR → EdenTreaty → Elysia API → Adapters → External APIs
                                      → Drizzle → Postgres
```

- **API adapters** (`api/src/adapters/`): fetch external APIs via `tracedFetch`, transform to
  typed domain objects, cached with TTL to prevent upstream hammering
- **API routes** (`api/src/routes/market.ts`): expose adapter data as typed Elysia endpoints
- **Query definitions** (`web/src/queries/`): wrap EdenTreaty calls in TanStack Query `queryOptions()`
- **Route loaders**: SSR pre-fetch via `ensureQueryData`/`prefetchQuery` — all awaited in `Promise.all`
- **Polling**: `refetchInterval: 10_000` on Bitcoin price query — seamless SSR→client handoff

---

## Observability

Four-layer distributed tracing: Browser → SSR → API → DB. All traces exported via OTLP HTTP
to ClickStack (self-hosted HyperDX). Trace context propagated via W3C `traceparent` at every hop.

### Trace Chain

| Hop           | Mechanism                                            | Auto? |
| ------------- | ---------------------------------------------------- | ----- |
| Browser → API | HyperDX `tracePropagationTargets: [/\/api\//]`       | Yes   |
| Browser → SSR | HyperDX `tracePropagationTargets: [/\/_serverFn\//]` | Yes   |
| SSR → API     | EdenTreaty `headers()` with `propagation.inject()`   | Yes   |
| API routes    | `@elysiajs/opentelemetry` auto-instrumentation       | Yes   |
| API → DB      | `@kubiks/otel-drizzle` wraps Drizzle client          | Yes   |

### Key Patterns

- **Browser SDK**: `@hyperdx/browser` — self-initializing side-effect import in `client.tsx`
  (must be first import, before BetterAuth captures fetch)
- **SSR server**: `server.ts` extracts `traceparent`, creates SSR/ServerFn spans, resolves
  `/_serverFn/{hash}` to readable names from build manifest
- **EdenTreaty**: `api.ts` `headers()` auto-injects `traceparent` server-side — all SSR→API
  calls are traced without manual `propagation.inject()` per call
- **External fetches**: use `tracedFetch()` from `src/lib/traced-fetch.ts` instead of bare
  `fetch()` in server functions — creates CLIENT span + injects `traceparent`
- **Auth routes**: `.all("/auth/*")` handler overrides span name to actual path
  (e.g., `POST /api/auth/sign-in/email` instead of wildcard)
- **API errors**: manual `recordException()` in `onError` handler (Elysia plugin gap)
- **OTLP auth**: `OTLPTraceExporter` reads `OTEL_EXPORTER_OTLP_HEADERS` env var automatically
- **OTLP proxy**: browser SDK sends to same-origin, web server proxies `/v1/traces` + `/v1/logs`
  to collector `:4318` (avoids CORS)
- **Graceful shutdown**: both web and API flush pending spans on `SIGTERM`

### Adding New Traced Code

- API routes, DB queries, SSR server functions, EdenTreaty calls → **automatic**
- External API calls in server functions → use `tracedFetch()` (not bare `fetch()`)
- SPA navigations to static content pages → no SSR span (by design, client-side only)

### Self-Hosted ClickStack

Managed via `vps/compose.dev.yml`. Ingestion API Key required (ClickStack UI → Team Settings).

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_HEADERS=authorization=<ingestion-api-key>
VITE_HYPERDX_API_KEY=<ingestion-api-key>
VITE_HYPERDX_ENDPOINT=                                          # empty = same-origin proxy
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

Learnings and patterns go into MDX docs under `apps/web/src/content/docs/`. Rendered at `/docs`.

### Keeping docs current

When a library API, pattern, or architectural decision changes, update the relevant MDX doc
in the same commit as the code change. Key docs to keep current:

| File                                     | Update when                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `docs/design-decisions.mdx`              | A major technology is swapped, a pattern is reconsidered, or a trade-off changes |
| `docs/api-architecture.mdx`              | Elysia app structure, route modules, or auth middleware pattern changes          |
| `docs/auth-and-data-flow.mdx`            | Auth flow, session resolution, or EdenTreaty client usage changes                |
| `docs/observability.mdx`                 | OTel config, HyperDX SDK setup, or trace propagation pattern changes             |
| `docs/stack-overview.mdx`                | Package versions or tech stack choices change                                    |
| `docs/getting-started/installation.mdx`  | Prerequisites, setup steps, or available commands change                         |
| `docs/getting-started/configuration.mdx` | New env vars added, secrets strategy changes                                     |
