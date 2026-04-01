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

---

## Group 4: BetterAuth + Elysia Integration

### What was implemented

Added `better-auth@^1.5.6` to `apps/api`. Created `src/auth.ts` (BetterAuth instance with
Drizzle adapter, email/password auth, OpenAPI plugin, rate limiting). Created
`src/middleware/auth.ts` (auth middleware using `derive` + `macro` pattern). Created
`src/routes/user.ts` (protected `/user/me`, `/user/preferences` GET/PATCH). Mounted BetterAuth
in `app.ts` via `.all("/auth/*", ...)`. Fixed the `?schema=` Prisma param stripping in `db.ts`.
Updated `apps/api/CLAUDE.md` with corrected mount and middleware patterns.

### Deviations from prompt

- **`.mount()` abandoned in favour of `.all()`**: `app.mount("/path", handler)` does NOT respect
  Elysia's `prefix` scope — the path is absolute regardless of prefix. `.all("/auth/*", ...)` is
  prefix-aware and correctly resolves to `/api/auth/*`. CLAUDE.md had incorrect guidance.
- **No `resolve` in macro**: Elysia lifecycle runs `resolve` BEFORE `beforeHandle`. Using `resolve`
  to gate auth (with non-null assertions) caused 500s on unauthenticated requests. Fixed by using
  `derive` (nullable session) + `macro.beforeHandle` (401 gate). Handlers use `user!` / `userId!`.
- **`db.ts` URL stripping**: The existing `.env.local` from the previous pnpm repo contained
  `?schema=basalt_ui_playground` (Prisma-specific). postgres.js forwards unknown query params to
  PostgreSQL which rejects them. Stripped in `db.ts` with a regex.
- **Seed script left unchanged**: Already used `Bun.password.hash` with argon2id and correct
  `credential` provider pattern — no changes needed.

### Gotchas & surprises

- **Elysia `.mount()` ignores prefix**: Documented in several GitHub issues. `.all()` is the
  correct alternative when a prefix is in use. Research and CLAUDE.md were both wrong on this.
- **Elysia macro `resolve` vs `beforeHandle` lifecycle order**: `resolve` runs first (derives
  context), `beforeHandle` runs second (guards). Auth checks in `resolve` fail because the
  guard hasn't run yet. This is a common Elysia gotcha for auth macros.
- **better-auth + Drizzle v1 beta**: No official support (GitHub issue #6766 open). The Drizzle
  adapter likely uses `db.query.*` relational queries internally. For the basic email/password
  flow tested here, it worked (simple inserts/selects), but more complex auth operations may fail.
  Known runtime risk — documented for future groups.
- **`?schema=` Prisma parameter in DATABASE_URL**: Must be stripped before passing to postgres.js.
  The `.env.local` from the previous project setup included it. Fixed in `db.ts`.

### Security notes

- Auth CORS: `credentials: true` already on global CORS — sessions work via cookie.
- `BETTER_AUTH_SECRET` enforced at startup (minimum 32 chars via Zod).
- Rate limiting: 10 req/min global, 5 req/min for `/sign-in/email`.
- `trustedOrigins` scoped to `ALLOWED_ORIGIN` env var.

### Tests added

None — no test infrastructure yet.

### Future improvements

- Seed via BetterAuth's admin API once it stabilises for Drizzle v1.
- Replace `user!` / `userId!` assertions with proper type narrowing if Elysia's macro types
  improve to narrow context after `beforeHandle` guards.
- Investigate better-auth Drizzle v1 compatibility: track issue #6766 for official support or
  the PR preview package at `pkg.pr.new/better-auth/@better-auth/drizzle-adapter@6913`.
- The `port 3001 in use` error on server start (from a conflicting process in the main repo)
  — the worktree's `.env.local` must use `PORT=7713`. Document in project setup.

---

## Group 5: OpenTelemetry (API Layer)

### What was implemented

Added `@elysiajs/opentelemetry` 1.4.10, `@opentelemetry/api` 1.9.1, and
`@opentelemetry/exporter-trace-otlp-proto` 0.214.0 to `apps/api`. Created `src/telemetry.ts`
with `OTLPTraceExporter` and exported `telemetryConfig` and a `tracer` for manual spans.
Wired `opentelemetry()` plugin into `app.ts` first (before all routes) with a `checkIfShouldTrace`
that skips `/health`. Added SIGTERM handler to `index.ts` to flush the exporter on shutdown.

### Deviations from prompt

- **`Resource` + `ATTR_SERVICE_NAME` dropped**: `@opentelemetry/resources` 2.6.1 exports
  `Resource` as a type-only export — `new Resource(...)` fails TypeScript with `verbatimModuleSyntax`
  enabled. Instead, `serviceName` is passed directly to the `opentelemetry()` plugin config, which
  forwards it to NodeSDK's `serviceName` option. NodeSDK handles resource creation internally.
  `@opentelemetry/resources` and `@opentelemetry/semantic-conventions` were not installed.
- **No explicit `BatchSpanProcessor`**: `traceExporter` is passed directly to the plugin;
  NodeSDK wraps it in a `BatchSpanProcessor` internally. Avoids importing `sdk-trace-base` directly.
- **No `AsyncLocalStorageContextManager` override**: NodeSDK 0.200+ uses `AsyncLocalStorageContextManager`
  by default. No override was needed in testing — API started cleanly.

### Gotchas & surprises

- `@opentelemetry/resources` 2.x exports `Resource` as `export type { Resource }` in its index —
  this is a class but the ESM declaration uses type-only re-export. With `verbatimModuleSyntax: true`,
  TypeScript treats it as type-only and rejects `new Resource(...)`. The NodeSDK `serviceName`
  shortcut is simpler anyway.
- Connection errors to `localhost:4318` (ClickStack not running) appear in stderr at startup but
  do NOT crash the API. The `BatchSpanProcessor` swallows export errors by design.
- `PORT` env var in the worktree `.env.local` is set to 3001 (leftover from main repo). The API
  started on 3001 but port was in use. Confirmed clean startup on 7799 explicitly.

### Security notes

No security-sensitive decisions. OTEL spans carry request URLs — `checkIfShouldTrace` excludes
`/health` to avoid noise. Auth spans may include user context in future via `tracer` hooks.

### Tests added

None.

### Future improvements

- Add userId as span attribute on authenticated requests via the `authMiddleware` derive hook
  using `tracer.startActiveSpan` or `context.with(trace.setSpan(...))`.
- The `tracer` export in `telemetry.ts` is available for manual spans in route handlers; no
  handlers use it yet.

## Group 6: TanStack Start Frontend (Core Shell)

### What was implemented

`apps/web/` from scratch with TanStack Start 1.167.x, Vite 8, Blueprint v6, Tailwind v4, Jotai,
and TanStack Query. Includes vite.config.ts, router.tsx, client.tsx, root layout, index route,
app.css, query-client.ts, jotai-store.ts, and a stub routeTree.gen.ts for initial typecheck.

### Deviations from prompt

- **`getRouter` instead of `createRouter`**: TanStack Start v1.167+ no longer passes the router
  as a prop to `StartClient`. Instead, `router.tsx` must export `getRouter()` which is resolved
  via the virtual module `#tanstack-router-entry`. The `StartClient` component calls `hydrateStart()`
  internally, which imports `getRouter` from the virtual module. The prop-based API was removed.
- **No `routerWithQueryClient`**: Skipped — the reference implementation uses `QueryClientProvider`
  directly in the root layout, which is simpler and equally valid for the initial shell. The
  `@tanstack/react-router-with-query` pattern can be added when SSR dehydration/hydration is needed.
- **React Compiler via `@rolldown/plugin-babel`**: `@vitejs/plugin-react@6` no longer has a babel
  option. React Compiler runs as a separate pass using `@rolldown/plugin-babel` with
  `reactCompilerPreset` exported from `@vitejs/plugin-react@6`.

### Gotchas & surprises

- `StartClient` in `@tanstack/react-start-client@1.166.25` takes **zero props**. The older
  `StartClient({ router })` prop pattern is gone. The router is resolved via virtual modules that
  the TanStack Start Vite plugin sets up — `#tanstack-router-entry` resolves to `router.tsx`.
- The `router.tsx` entry file must export `getRouter(): Awaitable<AnyRouter>` — declared in
  `@tanstack/start-client-core`'s `RouterEntry` interface. This replaces the old `createRouter`
  export convention.
- `@vitejs/plugin-react@6` exports `reactCompilerPreset` as a named export alongside the default
  React plugin. It returns a Rolldown babel preset for use with `@rolldown/plugin-babel`.
- Tailwind v4 needs `@tailwindcss/vite` as a Vite plugin (not PostCSS) for optimal integration.
  Blueprint CSS must be imported before Tailwind in app.css to allow Tailwind utilities to override.

### Security notes

No security-sensitive decisions. Dev proxy `/api → localhost:7713` is dev-only (Vite server).

### Tests added

None.

### Future improvements

- Add dark mode via Blueprint's `bp6-dark` class on body with SSR-safe cookie persistence
  (as in the reference implementation using a server function + `loader`).
- Add `@tanstack/react-query-devtools` and `jotai-devtools` for development.
- Add `@tanstack/react-router-devtools` for route debugging.
- Add font preloading for Geist Variable + JetBrains Mono.
- The stub `routeTree.gen.ts` will be regenerated by TanStack Router on first `vite dev` run.

---

## Group 7: EdenTreaty + Auth Client

### What was implemented

Added `@elysiajs/eden` (EdenTreaty) and `better-auth` to `apps/web`. Created `src/lib/api.ts`
(treaty client with SSR/client base URL split), `src/lib/auth-client.ts` (BetterAuth React
client), `src/lib/auth.functions.ts` (server functions for SSR session + theme), and
`src/atoms/theme.ts` (Jotai atom with cookie storage). Added sign-in/sign-up routes, a
`_protected` pathless layout with auth guard, a settings page, and nav with sign-in/out + theme
toggle in the root layout. Manually updated `routeTree.gen.ts` for the new routes.

### Deviations from prompt

- **`getWebRequest()` replaced with `getRequestHeader()`**: Research confirmed that `getWebRequest()`
  from `@tanstack/react-start/server` was removed in recent versions. The new API exposes
  purpose-specific helpers: `getRequestHeader(name)`, `getCookie(name)`, etc. Used
  `getRequestHeader("cookie")` to forward session cookies from the browser request to BetterAuth.
- **`@elysiajs/eden` version**: Prompt specified `^1.4.28` but the package's latest is `1.4.9`
  (eden and elysia use independent versioning). Used `^1.4.9`.
- **No `@cbbi/api` in web `package.json` for the type import**: `@cbbi/api` was added as a dev
  dependency (`workspace:*`) so the `import type { App }` in `api.ts` resolves correctly across
  the workspace boundary.
- **SSR theme via `beforeLoad` (not a loader)**: Used `beforeLoad` in root route with a client-side
  short-circuit (`typeof window !== "undefined" → return undefined`) to avoid network calls on
  client navigation while still reading the cookie on SSR. The atom handles client-side theme.
- **No zod import in `sign-in.tsx`**: Zod is not in web's dependencies. Used inline type narrowing
  for `validateSearch` instead of a zod schema.

### Gotchas & surprises

- `routeTree.gen.ts` has `@ts-nocheck` at the top, meaning TypeScript suppresses errors within the
  file but the `declare module "@tanstack/react-router"` augmentation still affects the type system.
  Manually updating this file for new routes is necessary when typecheck runs without starting the
  dev server (which would regenerate it automatically).
- `authClient.useSession()` returns `{ data: undefined, isPending: true }` during SSR — React
  hooks run during SSR in React 19 but effects don't. The nav shows nothing during the loading
  state (both server and client start with `isPending: true`), avoiding hydration mismatches.
- `useAtom(atom, { store })` in components that are ancestors of `<Provider store={store}>` works
  correctly because the store instance is a shared singleton — the hook bypasses the Provider
  context and goes directly to the store.
- `process.env["KEY"]` bracket notation required in TypeScript 6 strict mode (TS4111 error for
  dot notation on index signatures in config/env files).

### Security notes

- `getSessionFn` forwards the raw cookie header to BetterAuth — this correctly passes the
  `better-auth.session_token` httpOnly cookie for server-side auth verification.
- Protected routes use `beforeLoad` (runs before component render) for auth enforcement — there is
  no render-then-redirect flash.
- `authClient.signOut()` is called server-side-aware — BetterAuth invalidates the session token.

### Tests added

None.

### Future improvements

- Validate that `getRequestHeader("cookie")` is correctly forwarded when `getSessionFn` is called
  from a client-side navigation (not just initial SSR). TanStack Start's RPC layer should forward
  browser cookies automatically to the server function handler.
- SSR theme has a potential flash for non-default themes: the atom's `getItem` returns the
  `initialValue` ("dark") during SSR (since `document` is undefined), then reads the real cookie
  on client. If user has "light" cookie, there's a one-frame flash on first load. Proper fix: use
  an inline `<script>` tag to apply the theme class before React hydration.
- `api.ts` EdenTreaty client: `treaty<App>("")` for same-origin hasn't been validated at runtime.
  If Eden doesn't handle empty-string domains, switching to `window.location.origin` would fix it.
- Add TanStack Query `queryClient.prefetchQuery` in root `beforeLoad` for session caching to avoid
  duplicate session fetches (protected route + nav on first load).
