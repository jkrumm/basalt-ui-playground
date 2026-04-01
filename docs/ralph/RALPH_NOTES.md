# RALPH Notes — Bun Monorepo Reboot

Per-group learning notes. Each group appends its section after completion.

---

## Group 1: Bun Monorepo Foundation

### What was implemented

Initialized the Bun workspace with TypeScript 6.0, `@cbbi/schemas` package (Zod v4 schemas ported),
Makefile, kill-ports script, env files, oxlint + oxfmt tooling, and a rewritten root CLAUDE.md
reflecting the new stack.

### Deviations from prompt

- `bunfig.toml` kept minimal — Bun reads `workspaces` from `package.json`, the toml only needs
  `[install.cache]` for shared cache config. No `workspace = true` flag needed (it's implied by
  the `workspaces` array in package.json).
- `"type": "module"` removed from root `package.json` — oxfmt re-ordered the keys but kept it;
  field ordering is cosmetic.
- Both `fmt` and `lint` scripts are scoped to `packages/ apps/` rather than `.` — running either
  on `.` causes them to follow bun's install cache symlinks in `node_modules/` and report
  thousands of false positives. The `.oxlintignore` file was also added as a belt-and-suspenders
  measure for tools that discover files themselves.
- `--deny-warnings` added to `oxlint` invocation to fail CI on warnings (cleaner signal).
- `--stableTypeOrdering` not added to tsconfig — it's a TS7 diagnostic tool with 25% perf cost,
  not useful at this stage.

### Gotchas & surprises

- oxfmt and oxlint both follow bun's symlinked `node_modules/` into `~/.bun/install/cache/` when
  given `.` as the path. The fix is to scope the invocation to explicit source directories.
- `bun.lock` should be committed (not ignored) — the old `.gitignore` incorrectly ignored it.
  Fixed.
- oxfmt reformatted `CLAUDE.md` tables (padded columns) and `package.json` (added newlines,
  reordered `type` field after `workspaces`). These are cosmetic and correct.

### Security notes

- `.env` contains only non-secret defaults (ports, local URLs, `HYPERDX_API_KEY=dev`).
- All real secrets documented in `.env.example` with `<placeholder>` values — none committed.

### Tests added

None — no test infrastructure yet at this stage.

### Future improvements

- ESLint flat config (`eslint.config.ts`) deferred to a later group once web/API apps exist and
  framework-specific rules are needed (Blueprint, TanStack Router, React Compiler).
- `make dev` uses `&` backgrounding which doesn't cleanly propagate Ctrl+C. Consider `concurrently`
  or a Procfile approach in Group 2.

---

## Group 2: Elysia API Server (Core)

### What was implemented

Created `apps/api` with Elysia 1.4.28, `@elysiajs/cors` 1.4.1, `@elysiajs/openapi` 1.4.14,
Zod v4 env validation, health endpoint at `/api/health`, and Scalar docs at `/api/scalar`.
Split into `app.ts` (Elysia instance, no listen) and `index.ts` (entry with `.listen()`).

### Deviations from prompt

- `DATABASE_URL` uses `z.string().min(1)` instead of `z.string().url()` — `postgresql://` is not
  a valid HTTP URL and Zod v4's URL validator would reject it.
- `BETTER_AUTH_URL` default set to `http://localhost:7713` (API port) not `http://localhost:7712`
  (web port). In BetterAuth, `baseURL` points to the auth server itself (the API), not the client.
  The prompt had a likely typo.
- `@types/bun` package is installed but the tsconfig `types` entry uses `"bun"` (not `"bun-types"`).
  The package name under `@types/` determines the tsconfig key.
- `package.json` devDependencies: `bun-types` swapped for `@types/bun` (current standard).
- `onError` handler returns typed `Response` objects rather than raw strings, for consistent status codes.

### Gotchas & surprises

- `@elysiajs/swagger` is deprecated (last published 7 months ago). `@elysiajs/openapi` is the
  current package — confirmed on npm.
- `@types/bun` is the current package (not `bun-types`). tsconfig `types` entry is `"bun"`.
- Elysia 1.4.x supports Standard Schema natively — Zod v4 schemas work in route definitions
  without any plugin.
- oxfmt reformatted CLAUDE.md table columns (padded cell widths). This is cosmetic.

### Security notes

- CORS is scoped to `ALLOWED_ORIGIN` (defaults to web app URL). `credentials: true` enables
  cookie-based session sharing with BetterAuth.
- `BETTER_AUTH_SECRET` minimum 32 chars enforced at startup via Zod.
- No secrets in committed files.

### Tests added

None — no test infrastructure yet.

### Future improvements

- Add `concurrently` to `make dev` for clean Ctrl+C propagation (deferred from Group 1).
- BetterAuth mounts in Group 4 must use `.mount("/auth", ...)` not `.mount("/api/auth", ...)` —
  the app already has `prefix: "/api"`, so double prefix would break auth routes.
- `OTEL_SERVICE_NAME` in `.env` is `basalt-ui-playground-api` but env schema defaults to
  `cbbi-api`. The `.env` value wins at runtime — consistent.

---

## Group 3: Database + Drizzle v1 Beta

### What was implemented

Added Drizzle ORM v1.0.0-beta.20, drizzle-kit v1.0.0-beta.20, and postgres.js 3.4.8.
Created the `basalt_ui_playground` schema with BetterAuth tables (user, session, account,
verification) and user_preferences, all isolated in a named `pgSchema`. Generated the initial
migration, wired `db.ts`, and wrote an idempotent seed script for the demo user.

### Deviations from prompt

- `drizzle.config.ts` uses `process.env["DATABASE_URL"]` (bracket notation) instead of
  `process.env.DATABASE_URL` — TypeScript 6.0 in strict mode raises TS4111 for dot-notation
  access on index signatures. Bracket notation is the correct fix.
- `setup-cbbi-db.sql` kept structurally unchanged — `GRANT ALL PRIVILEGES ON DATABASE` already
  includes `CREATE`, which is what drizzle-kit needs to create the `basalt_ui_playground` schema.
  Added an inline comment to document this.
- Makefile and root `package.json` db scripts were already correctly wired from Group 2 planning —
  no changes needed.

### Gotchas & surprises

- drizzle-kit v1 beta generates `CREATE SCHEMA` without `IF NOT EXISTS` — manually patched to
  `CREATE SCHEMA IF NOT EXISTS` so the migration is re-runnable without errors.
- `process.env.DATABASE_URL` triggers TS4111 with TypeScript 6.0's strict index signature checks.
  Use `process.env["DATABASE_URL"]` in config files that TypeScript type-checks.
- drizzle-kit v1 beta config format is identical to v0.45.x — `dialect`, `schema`, `out`,
  `dbCredentials.url` all unchanged. No breaking changes.

### Security notes

- `setup-cbbi-db.sql` uses local-only credentials (`cbbi`/`cbbi`) — intentionally weak for
  local dev. Prod would use Doppler-managed secrets.
- Seed script hashes demo password with Argon2id (65536 memory, 2 time cost) — must match
  BetterAuth's hasher config when wired in Group 4.
- No secrets committed — DATABASE_URL must be in `.env.local`.

### Tests added

None.

### Future improvements

- Seed script directly inserts into auth tables. In Group 4, once BetterAuth is wired, prefer
  seeding via BetterAuth's admin API to ensure password hashing params stay in sync.
- `db.query.table` syntax (with `defineRelations()`) deferred — using `db.select()` is simpler
  for now and avoids the v1 beta relations API surface.
