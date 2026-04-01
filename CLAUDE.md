# cbbi-blueprint — Project Configuration

## Project Purpose

This is a **POC playground and greenfield boilerplate** — not a production application. Its goal
is to align and optimise frontend stack patterns (TanStack Start, Blueprint v6, Jotai, TanStack
Query, analytics, SSR/SSG, state architecture) so that individual apps built on top of it
start from a well-considered baseline.

**The CBBI dashboard content is the vehicle, not the destination.** Every architectural decision
should be made with "what would downstream apps need?" in mind, not "what does this dashboard need?".

---

## Monorepo Layout (current state: Group 1 — skeleton only)

```
basalt-ui-playground/
├── apps/
│   ├── web/                    # TanStack Start frontend (:7712) — Group 2+
│   └── api/                    # Elysia API server (:7713) — Group 2+
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
├── oxlint.json                 # OxLint config
├── .oxfmtrc.json               # oxfmt formatter config
├── .env                        # Committed non-secret defaults
└── .env.example                # Full variable reference with placeholders
```

---

## Tech Stack

| Concern    | Choice                           | Version      |
| ---------- | -------------------------------- | ------------ |
| Runtime    | Bun                              | >=1.3.x      |
| Language   | TypeScript                       | 6.0.x        |
| Frontend   | TanStack Start                   | >=1.167.x    |
| API        | Elysia                           | >=1.4.x      |
| API Client | @elysiajs/eden                   | >=1.4.x      |
| Auth       | better-auth                      | >=1.5.x      |
| ORM        | drizzle-orm                      | 1.0.0-beta.x |
| DB         | PostgreSQL via `postgres` driver |              |
| Validation | Zod                              | >=4.3.x      |
| UI         | Blueprint v6                     | >=6.10.x     |
| State      | Jotai                            | >=2.19.x     |
| CSS        | Tailwind CSS                     | >=4.2.x      |
| Query      | TanStack Query                   | >=5.96.x     |
| Lint       | oxlint                           | >=1.58.x     |
| Format     | oxfmt                            | >=0.43.x     |

---

## Port Configuration

| App                  | Port | Local alias                                |
| -------------------- | ---- | ------------------------------------------ |
| Web (TanStack Start) | 7712 | http://basalt-ui-playground.local:7712     |
| API (Elysia)         | 7713 | http://basalt-ui-playground-api.local:7713 |

Ports are hardcoded as defaults; override via env.

---

## Environment Strategy

- `.env` — committed, non-secret defaults (ports, local URLs, OTEL endpoint)
- `.env.local` — gitignored, real secrets (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
- `.env.example` — full reference with placeholder values (committed)

---

## Developer Commands

```bash
make dev          # Kill ports, start web + api concurrently
make build        # Build all workspaces
make check        # fmt + lint + typecheck + test
make fmt          # oxfmt check (read-only)
make fmt-fix      # oxfmt write
make lint         # oxlint
make typecheck    # tsc --noEmit across all workspaces
make db-setup     # Run scripts/setup-cbbi-db.sql via psql
make db-generate  # drizzle-kit generate
make db-migrate   # drizzle-kit migrate
make db-seed      # Seed demo user
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
bun run lint        # oxlint .
bun run check       # fmt + lint + typecheck
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

### Zod v4 Validators

`z.email()` is now a standalone function (not `z.string().email()`):

```ts
z.email(); // Zod v4
z.url(); // Zod v4
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

## Documentation Convention

Learnings and patterns go into MDX docs under `apps/web/src/content/docs/` (once web app exists).
Rendered at `/docs`.
