# CBBI Blueprint — Bun Monorepo Reboot — RALPH Shared Context

You are implementing a **full rewrite** of the `basalt-ui-playground` monorepo. Read this fully before starting your group.

---

## What This Project Is

This is a **POC playground and greenfield boilerplate** — not a production application. Its goal is to align and optimise frontend stack patterns (TanStack Start, Blueprint v6, Jotai, TanStack Query, analytics, SSR/SSG, state architecture) so that individual apps built on top of it start from a well-considered baseline.

The existing code in this repo (pnpm + Hono direction) is the **reference implementation**. Read it to understand patterns, but build everything from scratch using Bun-native tooling and Elysia. The CBBI dashboard content is the vehicle, not the destination — every architectural decision should be made with "what would downstream apps need?" in mind.

A demo project at `/Users/johannes.krumm/Downloads/tanstack-start-elysia-better-auth-bun-main` shows Elysia + BetterAuth + EdenTreaty patterns (outdated versions but good architecture reference).

---

## Repository Layout (Target)

```
basalt-ui-playground/
├── apps/
│   ├── web/                    # TanStack Start frontend (:7712)
│   │   ├── src/
│   │   │   ├── routes/         # File-based routing
│   │   │   ├── components/     # React components
│   │   │   ├── atoms/          # Jotai state
│   │   │   ├── queries/        # TanStack Query definitions
│   │   │   ├── lib/            # Utilities (api client, auth, analytics, theme)
│   │   │   ├── content/        # MDX source (blog, docs, guides, blocks)
│   │   │   ├── styles/         # Global CSS (Blueprint + Tailwind)
│   │   │   ├── client.tsx      # Client entry (hydrateRoot)
│   │   │   └── router.tsx      # Router config
│   │   ├── server.ts           # Production SSR server
│   │   ├── vite.config.ts      # Vite 8 + TanStack Start plugin
│   │   ├── content-collections.ts
│   │   └── package.json
│   └── api/                    # Elysia API server (:7713)
│       ├── src/
│       │   ├── index.ts        # Elysia .listen() entry
│       │   ├── app.ts          # Main Elysia app (exported for EdenTreaty type)
│       │   ├── auth.ts         # BetterAuth instance
│       │   ├── db.ts           # Drizzle v1 instance
│       │   ├── env.ts          # Zod v4 env validation
│       │   ├── telemetry.ts    # OpenTelemetry setup
│       │   ├── schema/         # Drizzle table schemas
│       │   ├── routes/         # Elysia route modules
│       │   └── seed.ts         # Demo user seeding
│       ├── drizzle.config.ts
│       ├── drizzle/            # Migrations
│       └── package.json
├── packages/
│   └── schemas/                # Shared Zod v4 schemas
├── scripts/
│   ├── setup-cbbi-db.sql       # Postgres setup
│   └── kill-ports.sh           # Kill 7712/7713
├── Makefile                    # Developer commands
├── bunfig.toml                 # Bun workspace config
├── tsconfig.json               # Root TypeScript config
├── oxlint.json                 # OxLint config
├── eslint.config.ts            # ESLint flat config
└── CLAUDE.md                   # Root project instructions
```

---

## Tech Stack

| Concern | Choice | Target Version |
|-|-|-|
| Runtime | Bun | >=1.3.x |
| Language | TypeScript | 6.0.x |
| Frontend | TanStack Start | >=1.167.x |
| Router | TanStack Router | >=1.168.x |
| Query | TanStack Query | >=5.96.x |
| Build | Vite | >=8.0.x |
| UI | Blueprint v6 | >=6.10.x |
| State | Jotai | >=2.19.x |
| CSS | Tailwind CSS | >=4.2.x |
| API | Elysia | >=1.4.x |
| API Client | @elysiajs/eden | >=1.4.x |
| API Docs | @elysiajs/openapi | >=1.4.x |
| Auth | better-auth | >=1.5.x |
| ORM | drizzle-orm | 1.0.0-beta.x |
| ORM Kit | drizzle-kit | 1.0.0-beta.x |
| DB Driver | postgres | >=3.4.x |
| Validation | Zod | >=4.3.x |
| Telemetry | @elysiajs/opentelemetry | >=1.4.x |
| Observability | HyperDX ClickStack (self-hosted) | latest |
| Frontend RUM | @hyperdx/browser | >=0.22.x |
| Lint | oxlint | >=1.58.x |
| Format | oxfmt | >=0.43.x |
| React | React | >=19.2.x |

**Bleeding edge is intentional.** Prefer beta/RC versions over stable when they represent the future direction (e.g. Drizzle v1 beta over 0.45.x). Always check npm for the exact latest version before installing.

---

## Port Configuration

| App | Port | Local Alias |
|-|-|-|
| Web (TanStack Start) | 7712 | http://basalt-ui-playground.local:7712 |
| API (Elysia) | 7713 | http://basalt-ui-playground-api.local:7713 |

Ports are sacred. Hardcode as defaults, configurable via env.

---

## Observability: HyperDX ClickStack (Self-Hosted)

HyperDX ClickStack runs locally. **No passwords or tokens needed** — self-hosted ClickStack doesn't validate API keys on OTel endpoints.

**Standard OpenTelemetry SDKs** (`@opentelemetry/*`, `@elysiajs/opentelemetry`) need only:
```bash
# Dev (app on host)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Prod (app on docker monitoring-net)
OTEL_EXPORTER_OTLP_ENDPOINT=http://clickstack:4318
```

**HyperDX-maintained SDKs** (`@hyperdx/browser`) that require `HYPERDX_API_KEY`: set to any non-empty string (e.g. `HYPERDX_API_KEY=dev`). It's not validated.

Do NOT start or configure HyperDX/ClickStack containers yourself — the user manages that separately. Just wire up the SDK/exporter config correctly.

---

## Validation Commands

**Primary (run after every group):**
```bash
bun run typecheck          # TypeScript check (all workspaces)
bun run build              # must compile/bundle clean (once web app exists)
```

**Linting (from Group 1 onward):**
```bash
bun run fmt                # oxfmt format check
bun run lint               # oxlint + eslint
```

**Full check:**
```bash
make check                 # fmt + lint + typecheck + test (all combined)
```

Not all commands work from Group 1. Use whatever is available at each group's stage. The group prompt will specify which validation to run.

---

## Research Before Implementing

**CRITICAL — your training data is stale (cutoff mid-2025). This is a bleeding-edge project.**

Always start each group by:
1. **Check npm** for the exact latest version of each package you're about to install
2. **Read official docs** for that version via Context7 MCP or Tavily Search + WebFetch
3. **Check for breaking changes** since the version in the existing codebase
4. **Explore the existing code** with Glob/Grep/Read to understand current patterns before rewriting
5. **Read the demo project** at `/Users/johannes.krumm/Downloads/tanstack-start-elysia-better-auth-bun-main` for Elysia/BetterAuth/EdenTreaty architecture reference (outdated versions)

The group prompt is direction, not prescription — use a better approach if you find one during research.

---

## Key Gotchas

### Drizzle v1 Beta
```typescript
// CORRECT v1 beta API:
export const db = drizzle({ client, schema: { ...tables } });

// WRONG (old v0 — silently ignores client):
export const db = drizzle(client, { schema });
```
- `db.query.table` requires `defineRelations()` — use `db.select()` for simple queries
- pgSchema isolation: `basalt_ui_playground` schema
- Initial migration needs `CREATE SCHEMA IF NOT EXISTS` (manual edit)

### Elysia Uses TypeBox, Not Zod
Elysia uses TypeBox (`t.Object()`) for route body/query validation by default, NOT Zod. The shared Zod schemas in `packages/schemas` are for types and client-side validation. For Elysia route validation, either use `@elysiajs/zod` plugin or TypeBox at the route level. Research the current best practice for Elysia + Zod v4.

### basalt-ui Is NOT Part of This Migration
The basalt-ui package (NPM-published component library) lives in a separate repo. Don't include it in the workspace.

### .ts Extensions in Imports
Bun requires `.ts` extensions in relative imports for TypeScript files. Always use `import { foo } from "./bar.ts"`.

---

## Learning Notes

After completing each group, **always append** to `docs/ralph/RALPH_NOTES.md`:

```markdown
## Group N: <title>

### What was implemented
<1–3 sentences>

### Deviations from prompt
<what you changed and why>

### Gotchas & surprises
<anything unexpected — library APIs, language quirks, tooling surprises>

### Security notes
<security-relevant decisions, if any>

### Tests added
<list of test files/functions added, or "None">

### Future improvements
<deferred work, tech debt, better approaches possible>
```

---

## Commit Format

Conventional commits, **no AI attribution** (no Co-Authored-By footer):
```
feat(<scope>): <description>
refactor(<scope>): <description>
fix(<scope>): <description>
```

Stage only modified files. Commit before signaling completion.

---

## Completion Signal

Output exactly one of these at the end, as the very last line of your response:

```
RALPH_TASK_COMPLETE: Group N
```

If you cannot proceed due to an unresolvable blocker:

```
RALPH_TASK_BLOCKED: Group N - <reason in one sentence>
```
