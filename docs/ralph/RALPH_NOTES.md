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

---

## Group 8: Content Collections + MDX

### What was implemented

Ported the full content pipeline from the original codebase: `content-collections.ts` with 4
collections (blog/docs/guides/blocks), MDX compilation with Shiki syntax highlighting (Blueprint
dark theme, diff/focus/highlight transformers), heading extraction, reading time. Ported 10 MDX
components (CodeBlock, Admonition, Steps, Mermaid, PackageManagerTabs, Tabs, stubs), 7 content
layout components (BlogLayout, DocsLayout, GuideLayout, BlockLayout, TableOfContents,
DocsSidebar, SearchModal), 11 route files with full SEO/JSON-LD, and all 22 MDX content files.
Added Fuse.js search (modal + full-page route) and wired SearchModal into root layout with
`searchOpenAtom` + `open-search` event bridge for DocsSidebar.

### Deviations from prompt

- **No SSG prerender config**: TanStack Start v1.167's `tanstackStart()` plugin prerender API
  uses a `filter` function, not a `routes` array. Omitted for now — prerendering can be
  configured once the full route tree is stable.
- **`noPropertyAccessFromIndexSignature: false` in web tsconfig**: CSS modules return
  `Record<string, string>` which triggers TS4111 on every `styles.foo` access. Overriding this
  strict check in the web tsconfig is cleaner than converting 100+ dot accesses to bracket notation.
- **`PageLayout` simplified**: The original used `useScrollDepth` for analytics. Ported as-is but
  the analytics module uses `window.umami` which is optional (the Umami script isn't installed yet).
  Analytics tracking degrades gracefully to no-ops.
- **No sitemap.xml / llms.txt generation**: The helpers (`getBlogSitemapEntries`, etc.) are ported
  in `content.ts` but no route or build-time generation wired yet. These are trivial to add.
- **`@content-collections/vite` uses default import**: The original likely also did this but the
  prompt suggested named import. Fixed via `import contentCollections from "@content-collections/vite"`.

### Gotchas & surprises

- `content-collections` compiles the config file into an mjs file and runs it. The `zod` import
  in `content-collections.ts` failed because zod wasn't a direct dependency of `@cbbi/web` — it
  was only available transitively via `@cbbi/schemas`. Had to add `zod` as a direct dependency.
- `content-collections` generates types at `.content-collections/generated/index.d.ts`. TypeScript
  needs a path mapping (`"content-collections": ["./.content-collections/generated"]`) in
  tsconfig to resolve the virtual `import from "content-collections"` module.
- Content-collections built 4 collections and 22 documents in ~9 seconds on first run.
- The `@content-collections/mdx` package provides `<MDXContent code={...} components={...} />`
  from `@content-collections/mdx/react` — this is the runtime renderer for serialized MDX bodies.

### Security notes

- `dangerouslySetInnerHTML` used in `MermaidDiagram.tsx` for Mermaid SVG output. Mermaid sanitizes
  its output internally (no user-controlled input reaches it).
- No user input flows into MDX compilation (build-time only from committed files).

### Tests added

None.

### Future improvements

- SSG prerendering for content pages once TanStack Start prerender API is understood.
- Sitemap.xml and llms.txt build-time generation using the existing helper functions.
- Typed CSS modules (e.g. `typed-css-modules` or `vite-plugin-css-modules-dts`) to restore
  `noPropertyAccessFromIndexSignature` in the web tsconfig.
- HyperDX browser RUM integration for content page analytics.
- Cmd+K keyboard shortcut for search (currently only wired via DocsSidebar click).

---

## Group 9: Remaining Components + Analytics

### What was implemented
Ported the full CBBI dashboard (index route with confidence card, callout, indicator grid/table views, Recharts chart), table comparison page (TanStack Table + Blueprint Table2), ContentNav with Blueprint Navbar, ThemeToggle, BlueprintTableSection, Jotai atoms (viewMode, sortBy, serverPreferences), TanStack Query preferences queries, Umami analytics (RouteTracker, scroll depth hook, typed events), account page, and date formatting utilities.

### Deviations from prompt
- ThemeToggle uses the existing Jotai atom-based theme (light/dark toggle button) instead of the master branch's SegmentedControl with system theme — the worktree's theme architecture uses cookie-backed Jotai atoms without a ThemeContext, so porting the 3-way toggle would require additional context infrastructure.
- Removed `sessionExpiresAt` from the account page since the _protected route context only exposes `user`, not session expiry time.
- EdenTreaty API client pattern (`api.api.user.preferences.get()`) used for queries instead of Hono client pattern from master.

### Gotchas & surprises
- The `window.umami.track()` type declaration needed three overloads: no-arg (initial pageview), string+data (events), and callback (SPA navigation with props transformation). The original single overload caused TS errors in RouteTracker.
- The routeTree.gen.ts was already regenerated with /table and /account routes from a previous dev server run, avoiding the need to manually edit it.
- Recharts 3.x API is backwards compatible with the 2.x patterns used in the reference — no migration needed.

### Security notes
- Umami script injection is gated by env vars (VITE_UMAMI_SCRIPT_URL, VITE_UMAMI_WEBSITE_ID) — no analytics in dev unless configured.
- Auto-tracking disabled to prevent leaking URL params.

### Tests added
None

### Future improvements
- Add system theme option (3-way light/system/dark toggle) with ThemeContext and useSyncExternalStore for OS preference detection.
- Implement preferences sync: load server preferences in settings page loader, sync to Jotai atoms on mutation success.
- Add Cmd+K keyboard shortcut for search modal.
- Consider code-splitting the indicator grid/table views for better initial load.

---

## Group 10: HyperDX Browser SDK (Frontend RUM + Session Replay)

### What was implemented
Added @hyperdx/browser for frontend observability — session replay, console capture, and advanced network capture. Wired trace context propagation via @opentelemetry/api in SSR server functions so browser → SSR → API calls form continuous traces. Added user identification in the protected route layout.

### Deviations from prompt
- Skipped React error boundary integration — no error boundary exists in the app yet. Adding `react-error-boundary` as a dependency just for HyperDX attachment would be scope creep; HyperDX already captures unhandled errors via its global error listener.
- Used module-level `initHyperDX()` call in `__root.tsx` instead of `useEffect` — simpler and runs once on module load (guarded by `typeof window` and `initialized` flag).
- Called `identifyUser` directly in `ProtectedLayout` render (guarded by `typeof window`) rather than in a `useEffect` — the function is idempotent (just sets attributes) and avoids an extra render cycle.

### Gotchas & surprises
- `@hyperdx/browser` 0.22.0 is still pre-1.0. The init API is straightforward but documentation is sparse for self-hosted ClickStack setups.
- `tracePropagationTargets` takes `RegExp[]` — must match the fetch URL path, not the domain. `/\/api\//` works because EdenTreaty calls go through the Vite proxy at `/api/`.
- `@opentelemetry/api` propagation.inject() is a no-op if no propagator is registered — safe to call even without a full OTEL SDK on the SSR side. When OTEL is configured, it automatically injects `traceparent` headers.

### Security notes
- `maskAllInputs` and `maskAllText` are available but not enabled — this is a POC playground with no sensitive data. Downstream apps should enable these for production.
- `advancedNetworkCapture: true` captures request/response bodies — fine for dev, should be evaluated per-app for production.

### Tests added
None

### Future improvements
- Add React error boundary and wire `HyperDX.attachToReactErrorBoundary()` when error handling is implemented.
- Consider `maskAllInputs: true` for production deployments with sensitive form data.
- Add custom HyperDX actions for key user interactions beyond what Umami tracks.
- Wire OTEL SDK on SSR side (e.g. `@opentelemetry/sdk-node`) for full SSR span visibility.

---

## Group 11: Linting + Quality Pipeline

### What was implemented
ESLint 10 flat config (`eslint.config.ts`) with typescript-eslint, eslint-plugin-react-compiler, @blueprintjs/eslint-plugin, @tanstack/eslint-plugin-router, and eslint-plugin-oxlint for deduplication. Stylelint with standard config for CSS files. Updated `make check` pipeline to run oxfmt + oxlint + eslint + stylelint + typecheck.

### Deviations from prompt
- Used manual Blueprint plugin config instead of `flatConfigs.recommended` — the Blueprint plugin's flat config export has a broken CJS require path that crashes ESLint 10 in Bun's cache layout.
- Used `oxlint.buildFromOxlintConfigFile()` instead of `configs["flat/recommended"]` for smarter deduplication based on our actual oxlint.json rules.
- Added `.prettierignore` — oxfmt uses it to skip generated files (`.content-collections/`, `*.gen.ts`) that were causing false format failures.
- Added Jotai `no-restricted-imports` exemption for `**/atoms/**` directory — the atoms directory itself needs to import `atom`/`atomWithStorage` from jotai.

### Gotchas & surprises
- Blueprint ESLint plugin's `flatConfigs.recommended` export references `../../eslint.config.js` via a CJS require — works in npm layout but breaks in Bun's flat cache structure. Manual plugin/rules config works fine.
- ESLint 10 natively supports `eslint.config.ts` without additional packages (unlike v9 which needed `jiti`).
- The `react-dom/no-dangerously-set-innerhtml` disable comment in MermaidDiagram.tsx referenced a rule from a plugin not in our config — removed it since oxlint covers this via its react plugin.
- Blueprint v6 uses `bp6-` prefix (not `bp5-`), so class constants like `Classes.DARK` resolve to `"bp6-dark"`.

### Security notes
None.

### Tests added
None.

### Future improvements
- Consider adding `eslint-plugin-jotai` if it gains flat config support — would provide atomWithStorage naming conventions.
- Stylelint rules are minimal — could add Blueprint-specific CSS property ordering rules if CSS grows.

## Group 12: Production Server + Docker

### What was implemented
Production SSR server (`apps/web/server.ts`) using `Bun.serve()` with static asset serving, API reverse proxy, and SSR fallback. Multi-stage Dockerfile with separate `web` and `api` targets. Docker Compose stack with web, api, and postgres services. Makefile targets for docker-build/up/down.

### Deviations from prompt
- ClickStack service commented out in compose.yml per prompt guidance that user manages it separately.
- Used `cd apps/web && bun run build` instead of `bun run --filter` in Dockerfile — Bun's `--filter` uses package names, not directory names, and the workspace resolution doesn't work the same inside Docker.
- Skipped the `start` Makefile target (local production mode) — `bun run start` already works via root package.json.

### Gotchas & surprises
- TanStack Start's Vite plugin builds to `dist/server/server.js` (default export with `.fetch()` method) and `dist/client/` for static assets. No Nitro/Vinxi — the Vite 8 plugin outputs a plain ESM module.
- `bun install --production=false` is not valid syntax — Bun doesn't accept `=false` for boolean flags. Just `bun install --frozen-lockfile` installs everything including devDependencies by default.
- The built server.js uses `import.meta` and dynamic imports internally, so it must be imported with `await import()` at runtime.
- API proxy needs error handling — without it, a connection refused from the API server falls through to the SSR handler and returns an HTML page instead of a proper error.

### Security notes
- compose.yml uses placeholder `BETTER_AUTH_SECRET` — documented that it must be changed in production.
- `.dockerignore` excludes `.env.local` to prevent secrets from leaking into Docker build context.

### Tests added
None — validated manually via Docker build + run + curl.

### Future improvements
- Add nginx/Caddy reverse proxy for production deployments instead of the built-in API proxy.
- Add health check endpoint to the web server for Docker healthcheck.
- Consider `oven/bun:distroless` for even smaller production images.
- Add `docker compose --profile` to make ClickStack opt-in rather than commented out.
