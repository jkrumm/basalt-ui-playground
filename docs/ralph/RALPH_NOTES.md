# RALPH Notes — cbbi-blueprint

Learning notes appended by Claude after each group. These capture deviations, surprises, and gotchas for future groups and future sessions.

---

<!-- Groups append their notes below this line -->

## Group 1: Monorepo Restructure

### What was implemented
Restructured from a flat single-package app to a Bun workspaces monorepo. App moved to `apps/web/`, two package stubs created (`packages/schemas/`, `packages/api/`). All files moved with `git mv` to preserve history.

### Deviations from prompt
- Added `@blueprintjs/icons`, `shiki`, `hast-util-to-string`, `unified`, `unist-util-visit` as explicit direct dependencies in `apps/web/package.json`. These were transitive deps used via direct imports in source (`mdx-theme.ts`, `rehype-export-headings.ts`, component files). In a flat `node_modules` they were visible; in Bun workspaces only direct deps get symlinked.
- Used `@types/hast` (devDep) instead of the non-existent `hast@^3.x` standalone package — `hast` is a types-only concept whose declarations ship via `@types/hast`.
- `.stylelintrc.json` moved to `apps/web/` alongside the `stylelint` script.
- Fixed a pre-existing `style/quote-props` lint error in `src/routes/_content/guides/$slug.tsx` via `eslint --fix` to make lint pass for validation.

### Gotchas & surprises
- Bun workspaces only symlink **direct** dependencies into workspace-local `node_modules`. Transitive deps go into `node_modules/.bun/<pkg>@<version>/` which is NOT on TypeScript's standard resolution path. Any package directly `import`-ed in source code must be an explicit dependency even if it was previously available as a transitive dep in a flat layout.
- The root `node_modules` after `bun install` contains only `.bun/` and `.old_modules-<hash>/` — no top-level package directories. This is expected Bun workspace behavior.
- `hast` is NOT a standalone runtime package — its TypeScript types are provided by `@types/hast`. The import `import type { Element, Root } from 'hast'` requires `@types/hast` as a devDep.
- `bun install` output `Removed: 50` during workspace init is expected — Bun reorganizes previously flat deps into the `.bun` cache.

### Security notes
None.

### Future improvements
- Consider adding a root-level `typecheck` script that runs typecheck across all workspaces (not just `apps/web`) for a single pre-commit check.

---

## Group 2: Shared TypeBox Schemas Package

### What was implemented
Populated `packages/schemas/` with two schema files: `user-preferences.ts` (UserPreferences + PatchUserPreferences) and `auth.ts` (SignIn + SignUp). Both export TypeBox schemas and inferred TypeScript types. The index re-exports everything. `@cbbi/schemas` was already wired as a workspace dep in `apps/web/package.json` from Group 1.

### Deviations from prompt
- Skipped the temporary type-check import in `index.tsx` — the workspace dep was already declared and `bun run typecheck` in `apps/web` validates resolution directly. No need to add noise to source files.
- `name-asc` included in `sortBy` union per spec, even though the current app's HTMLSelect only has three options. This is intentional forward-compatibility for Group 8+ settings page.

### Gotchas & surprises
- No surprises. TypeBox 0.34.48 API matches the spec exactly. `Type.Partial`, `Type.Union`, `Type.Literal`, and `Type.Static` all work as documented. No context7 lookup needed — existing codebase already uses the same TypeBox version.
- The `packages/schemas` tsconfig uses `"moduleResolution": "bundler"` with `"allowImportingTsExtensions": true`, which means the `.ts` export in `package.json` (`"./src/index.ts"`) resolves correctly in the Bun workspace without a build step.

### Security notes
None.

### Future improvements
- When `packages/api` is populated (Group 4+), verify Elysia's `t` (TypeBox superset) can consume these plain TypeBox schemas without wrapping. Expected to work but worth a quick smoke test.

---

## Group 3: Jotai v2 State Layer

### What was implemented
Installed Jotai v2.19.0 and jotai-devtools v0.13.0. Created `src/atoms/` with three files: `ui.atoms.ts` (searchOpenAtom, viewModeAtom, sortByAtom), `preferences.atoms.ts` (serverPreferencesAtom), and `index.ts` barrel. Wired `<Provider>` and conditional `<DevTools />` into `__root.tsx`. Migrated `searchOpen` (root), `viewMode` and `sortBy` (index) from `useState` to atom reads.

### Deviations from prompt
- **ESLint `no-restricted-syntax` merging**: The prompt suggested adding a new flat config object for the Jotai naming rules. In ESLint flat config, a later config object with the same rule name OVERRIDES the earlier one — it does NOT merge. Adding a separate config would have silently dropped all existing Blueprint/icon restrictions. Instead, the new Jotai selectors were appended to the existing `no-restricted-syntax` array. Both rules now have `'error'` severity (consistent with the existing rules).
- **`sortBy` cast**: `atomWithStorage` with `UserPreferences['sortBy']` type requires an explicit `as UserPreferences['sortBy']` cast when assigning from `HTMLSelect`'s `e.target.value` (which is `string`). This is correct — the options in the JSX constrain valid values but TypeScript can't infer that from a DOM event.

### Gotchas & surprises
- jotai-devtools v0.13.0 emits a peer dependency warning for `react@^18` (we have React 19). Works correctly at runtime — the warning is a version range oversight in jotai-devtools' `peerDependencies`.
- Jotai's `useAtom` setter is stable across renders (same reference), but `react-hooks/exhaustive-deps` doesn't have a special case for it the way it does for React's own `useState` setter. This produces a pre-existing-style warning in `__root.tsx` (`setSearchOpen` missing from deps). Functionally correct to leave omitted — the effect's cleanup is the important part.
- CSS import for jotai-devtools must be a side-effect import (`import 'jotai-devtools/styles.css'`). The Vite Inline (`?inline`) pattern is also valid but unnecessary when CSS is bundled normally.

### Security notes
None.

### Future improvements
- The `react-hooks/exhaustive-deps` warning for `setSearchOpen` could be suppressed with a `useSetAtom` split (read and write atoms separately), but this is cosmetic — the behavior is identical.
- jotai-devtools `position` prop can be configured if the default overlaps with Blueprint UI elements.

---

## Group 4: Elysia API Backend + BetterAuth Server

### What was implemented
Built the complete Elysia 1.4 API backend in `packages/api/`. Includes: `bun:sqlite` via `drizzle-orm/bun-sqlite` for the database, Drizzle ORM schema for `user_preferences`, BetterAuth v1 with Drizzle adapter for email/password auth, preferences GET/PATCH routes with partial upsert, and BetterAuth's macro pattern for session injection. All auth tables created via `drizzle-kit push`. `export type App` ready for Eden Treaty in `apps/web`.

### Deviations from prompt

**`bun:sqlite` instead of `better-sqlite3`:** The prompt listed `better-sqlite3` as the preferred option with a note to check if `bun:sqlite` is supported. In practice, `better-sqlite3` **does not work in Bun at all** — it uses native C++ addons that Bun cannot load (Bun issue #4290). Switched to `import { Database } from 'bun:sqlite'` with `drizzle-orm/bun-sqlite`. BetterAuth's drizzle adapter is driver-agnostic (only uses the Drizzle ORM interface) and works fine with the `bun-sqlite` driver.

**BetterAuth migration approach:** The RALPH prompt assumed `bunx @better-auth/cli migrate` would work. It does NOT for the Drizzle adapter — CLI outputs: "The migrate command only works with the built-in Kysely adapter. For Drizzle, run `@better-auth/cli generate` to create the schema, then use Drizzle's migrate or push." Correct workflow:
1. `bunx @better-auth/cli generate --config src/auth.ts --output src/schema/auth-schema.ts`
2. `drizzle-kit push` (applies both auth schema + user_preferences)

`drizzle-kit push` uses its own SQLite driver internally, so it doesn't need `better-sqlite3`.

**`db:setup` script:** Changed from `bun x auth@latest migrate` to `drizzle-kit push`. The `db:generate` script handles re-generating auth schema if BetterAuth plugins change.

**`user_preferences` table:** Created with raw SQL `CREATE TABLE IF NOT EXISTS` at startup in `db.ts` (idempotent, ensures table exists without requiring a `db:setup` run). The `drizzle-kit push` also creates it, but the runtime SQL is a safety fallback.

**BetterAuth schema passed to adapter:** The prompt showed `drizzleAdapter(db, { provider: 'sqlite' })` without passing schema. In practice, passing `schema: authSchema` is required for the adapter to locate the generated table definitions correctly.

### Gotchas & surprises

- **`better-sqlite3` is completely unsupported in Bun.** Do not install it for Bun projects. Use `bun:sqlite` (built-in) via `drizzle-orm/bun-sqlite`.
- **`bun-types` required for `bun:sqlite`** in TypeScript projects. Must add `"types": ["bun-types"]` to `tsconfig.json` or TypeScript cannot find the `bun:sqlite` module declaration.
- **BetterAuth CLI `migrate` vs `generate`:** `migrate` only works with Kysely (direct DB) adapter. Drizzle adapter requires the generate → drizzle-kit workflow.
- **BetterAuth baseURL warning:** Without `baseURL` in the auth config, BetterAuth logs a warning on every request. Set `baseURL: 'http://localhost:3001'` in the auth config to suppress it.
- **Elysia macro `resolve` syntax:** The correct BetterAuth + Elysia macro pattern uses `{ auth: { async resolve({ status, request: { headers } }) { ... } } }` — the `auth` key maps to a route option `{ auth: true }`. Elysia infers context types including the resolved `{ user, session }` via TypeScript generics.
- **`@better-auth/cli generate` requires the output directory to exist.** The output path `src/schema/auth-schema.ts` requires `src/schema/` to be created first (`mkdir -p src/schema`).
- **Drizzle `bun-sqlite` queries are synchronous** under the hood but the Drizzle ORM wraps results to be awaitable. Use `await` as normal.

### Security notes
- `trustedOrigins: ['http://localhost:3000']` restricts CORS for BetterAuth. Production should use the actual domain.
- CORS `credentials: true` is required for cross-origin cookie-based auth in local dev (Elysia at 3001, web at 3000).
- Auth tables store hashed passwords via BetterAuth's built-in email/password provider — no plain-text credentials.

### Future improvements
- Add `BETTER_AUTH_SECRET` env var (required for production — BetterAuth generates a random secret if not set, breaking sessions across restarts).
- Consider switching from cross-origin cookies (localhost:3001) to same-origin by mounting the Elysia API under the TanStack Start server (via a proxy or TanStack Start's `createAPIHandler`). This avoids `credentials: include` complexity.
- Drizzle relations between `userPreferences` and `user` (foreign key + `references(() => user.id)`) deferred — add when Group 8 (settings sync) is built.

---

## Group 5: BetterAuth Client + Auth Pages

### What was implemented
BetterAuth client wired in `apps/web` with `auth-client.ts` (from `better-auth/react`), server function `getSessionFn` in `auth.functions.ts` using direct auth import, `_protected.tsx` pathless layout route with `beforeLoad` redirect, sign-in and sign-up pages using Blueprint components, and `NavUserMenu` component in ContentNav.

### Deviations from prompt

**Direct auth import via `@cbbi/api/auth` subpath export** — instead of HTTP fetch in the server function, `auth.api.getSession({ headers })` is called directly (zero HTTP overhead during SSR). Added `"./auth": "./src/auth.ts"` to `packages/api/package.json` exports to expose just the auth config without pulling in `app.listen()`.

**`bun-types` added to `apps/web`** — importing `@cbbi/api/auth` transitively pulls in `packages/api/src/db.ts` which uses `bun:sqlite`. TypeScript in `apps/web` can't resolve `bun:sqlite` without `bun-types`. Added `bun-types` as devDep + to `tsconfig.json` types. This is appropriate since TanStack Start server functions run in Bun.

**TypeBox Optional for redirect search param** — `validateSearch` in `sign-in.tsx` uses `Type.Optional(Type.String())` so `/sign-in` links don't require `search={{ redirect }}`. Plain function `validateSearch` returning `{ redirect: string }` would make the param required in all TanStack Router Link and navigate calls.

**`window.location.assign(redirect)` for post-login navigation** — TanStack Router's `navigate({ to: ... })` is strongly typed to registered route paths. For a dynamic redirect string (e.g. `/settings`), there's no clean typed escape hatch. `window.location.assign` does a full-page redirect which also ensures session state is fresh after `router.invalidate()`.

**routeTree.gen.ts manually updated** — `bunx tsr generate` runs in check-mode (exit code 1 = outdated, but doesn't write). Route tree was manually updated following the established pattern for `_content` layout route.

### Gotchas & surprises

- **`tsr generate` check-mode**: The CLI detects outdated route trees and exits with code 1 but does NOT write the updated file — manual update or running `vite dev` is needed to trigger auto-generation.
- **`better-auth/react` import path**: The React-specific client is at `better-auth/react` (not `better-auth/client` with a React plugin). Exports `createAuthClient` which returns `useSession`, `signIn`, `signUp`, `signOut` directly.
- **`validateSearch` return type determines TanStack Router param requiredness**: Any non-optional field in the returned type becomes required in all Link and navigate calls to that route.

### Security notes
- Post-login redirect uses `window.location.assign(redirect)` where `redirect` comes from a URL search param set by `_protected.tsx`. In production, this should validate the redirect URL is same-origin to prevent open redirect attacks.

### Future improvements
- Validate redirect param is same-origin before `window.location.assign(redirect)`.
- Settings link in NavUserMenu (Group 8 will add the settings page).
- Consider same-origin BetterAuth setup to eliminate `credentials: include` CORS complexity in production.

---

## Group 6: TanStack Query v5 + Eden Treaty Isomorphic Client

### What was implemented
Installed `@tanstack/react-query@5.95.2`, `@elysiajs/eden@1.4.8`, and `@tanstack/react-query-devtools@5.95.2`. Created `query-client.ts` singleton, `api.ts` with `createIsomorphicFn` server/client split, wired `QueryClientProvider` + `ReactQueryDevtools` into `__root.tsx`, and created `queries/preferences.queries.ts` with `userPreferencesQuery` and `updatePreferencesMutation` factory functions. Also fixed two pre-existing build failures from Group 5.

### Deviations from prompt

**`await getApi()` in query factories** — The server branch of `createIsomorphicFn` is `async` (requires dynamic import to get the Elysia app instance), making `getApi()` return `Promise<ApiClient>` on the server. The client branch returns `ApiClient` synchronously. Rather than forcing both to async, the query factories use `const api = await getApi()` — since `await nonPromise === nonPromise`, this works transparently on both branches without changing the `getApi` signature.

**Elysia not in client bundle — verified by inspection** — `grep -r "elysia" dist/client/ --include="*.js"` returned no matches. The dynamic import inside the `.server()` branch of `createIsomorphicFn` is tree-shaken from the client bundle by TanStack Start's Vite plugin. Only the Eden Treaty HTTP client code (using `treaty<App>(url)`) appears in client chunks.

**Fixed pre-existing build failure from Group 5 (route conflict)** — `_protected.tsx` had no corresponding `_protected/` directory. TanStack Router's build-time route generator treats a pathless layout with no child files as a regular route at `/`, causing a conflict with `index.tsx`. Fixed by creating `apps/web/src/routes/_protected/settings.tsx` as a stub (Group 8 will flesh it out).

**Fixed pre-existing prerender failure from Group 5 (wrong slug format in guide prerequisites)** — `backtesting-cbbi-strategies.mdx` and `reading-cbbi-indicators.mdx` had `prerequisites: ["Understanding the CBBI Score"]` (human-readable title), but `GuideLayout.tsx` passes these directly as route slugs (`<Link params={{ slug: prereq }}>`). The prerender crawled the link, found 404, and failed. Fixed by changing prerequisites to use the slug format: `"understanding-cbbi-score"`, `"reading-cbbi-indicators"`.

### Gotchas & surprises

- **`createIsomorphicFn` async server branch**: If the server branch needs a dynamic import, it's async and returns a Promise. Callers must `await` the result. `await` on a non-Promise is a no-op, so using `await getApi()` everywhere is safe for both branches without any runtime penalty on the client.
- **`treaty<App>(url)` vs `treaty(app)` types**: Both produce structurally identical types since `App = typeof app`. TypeScript and Eden Treaty infer route paths correctly from either form — the former for HTTP clients, the latter for direct in-process calls.
- **`_protected.tsx` pathless layout requires a `_protected/` directory**: Without at least one child route file in `_protected/`, the TanStack Router generator cannot infer that it's a pathless layout and falls back to treating it as a route at `/`. The `_content.tsx` layout works because it has a `_content/` directory with children.
- **Guide prerequisites must use slug format, not title**: The `GuideLayout.tsx` prerequisite renderer passes the value directly as a URL slug param. Frontmatter `prerequisites` arrays must contain file slugs (e.g., `understanding-cbbi-score`), not human-readable titles.

### Security notes
None beyond existing CORS + credentials pattern.

### Future improvements
- Group 8 will implement the full settings page at `_protected/settings.tsx`.
- Add a `loader` to `_protected/settings.tsx` that prefetches `userPreferencesQuery` via `queryClient.ensureQueryData()`.
- `auth.functions-CepVPkMd.js` server chunk is 1.2 MB (includes Elysia + BetterAuth). Consider lazy-loading or splitting the auth server function to reduce cold start time.

---

## Group 7: TanStack Form v1 + Blueprint Integration

### What was implemented
Installed `@tanstack/react-form@1.28.5`, created a TypeBox → TanStack Form adapter (`validation.ts`), and a `createFormHook`-based form infrastructure (`form.tsx`) with pre-wired Blueprint `TextField`, `SelectField`, and `CheckboxField` field components. Upgraded `sign-in.tsx` and `sign-up.tsx` from raw `useState` forms to `useAppForm` with TypeBox schema validation.

### Deviations from prompt

- **`form.AppField` not `form.Field`**: The `createFormHook` pattern exposes `form.AppField` (not `form.Field`) for rendering field components registered via `fieldComponents`. The prompt sketched `form.Field` — the actual API is `form.AppField`.
- **`useState` for auth errors**: The prompt suggested `form.setErrorMap({ onSubmit: errorString })`, but TanStack Form infers `errorMap.onSubmit` type from the validator's return type. Since `typeboxFormValidator` returns `{ fields: Record<string, string> } | undefined`, a plain string is not assignable. Auth errors (wrong credentials) are server-side, not field validation — `useState` is the correct separation.
- **TypeBox does not implement Standard Schema**: Verified for `@sinclair/typebox@0.34.48` — no `standard-schema` export in the package map. Adapter is needed.

### Gotchas & surprises

- **`react-refresh/only-export-components` on non-exported components**: ESLint's React Refresh rule fires on component function definitions (PascalCase) in files that also export non-component values — even if those components are not exported. `form.tsx` intentionally mixes internal field components with `createFormHook` outputs. Fixed with a file-level `/* eslint-disable */` block comment.
- **`eslint-disable-next-line` vs `/* eslint-disable */`**: Line-level disable comments placed at the wrong position report as "Unused directive" while the actual errors still fire. File-level block comments are required when the suppressed pattern spans the whole file.
- **`selectField` generic constraint delimiter**: `{ value: T; label: string }` (semicolons) triggers `style/member-delimiter-style` from `@antfu/eslint-config` which prefers commas in inline type literals. Changed to `{ value: T, label: string }`.
- **`typeboxFormValidator` return format**: TanStack Form form-level validators that map errors to specific fields must return `{ fields: Record<string, string> }`. Field names in TypeBox error paths use `/fieldName` format — the leading slash must be stripped.

### Security notes
None.

### Future improvements
- Add `typeboxValidator` (field-level) usage examples for cases where per-field schema validation is needed instead of whole-form validation.
- Consider exporting field components if they're needed outside the form hook (e.g., for standalone Blueprint integration).

---

## Group 8: User Preferences Server-Sync Pattern

### What was implemented
Created `apps/web/src/routes/_protected/settings.tsx` — a protected settings page that loads user preferences via `useSuspenseQuery`, applies them to localStorage atoms on mount, and saves changes to the Elysia backend via `useMutation`. Updated `ContentNav.tsx` to add a "Settings" menu item under the user menu.

### Deviations from prompt

**No auto-sync from the home page.** The prompt suggested a `usePreferenceSyncer` hook that fires a mutation on every atom change on the home page. This was rejected: it would call the API on every viewMode/sortBy toggle without a debounce, creating excessive network traffic. The explicit save from the settings page is the correct UX pattern — users set their preferences once, not continuously. Documented with inline comment.

**No route loader preload.** The prompt specified `loader: () => queryClient.ensureQueryData(userPreferencesQuery())`. This was omitted because `getApi`'s server branch creates a direct in-process Elysia call without forwarding request cookies (the `treaty(app)` call has no auth headers). The authenticated preferences query would return 401 during SSR. `useSuspenseQuery` runs client-side after hydration where `credentials: 'include'` sends the auth cookie correctly. A Suspense boundary wraps the form component, showing a Spinner during the brief client-side fetch.

**Navigation uses `/settings` not `/_protected/settings`.** `_protected` is a pathless layout route — it has no URL segment. The actual full path is `/settings`. TanStack Router's `to:` parameter takes the path, not the route ID. The TypeScript compiler caught this immediately.

### Gotchas & surprises
- **Route tree was already regenerated.** The `_protected/settings.tsx` stub from an earlier group had already caused the TanStack Router Vite plugin to regenerate `routeTree.gen.ts` with the route included. Running `bunx tsr generate` from the workspace root produced confusing output and exit code 1 — this is normal for the `tsr` CLI when run outside the router's configured root (the Vite plugin handles generation during `vite dev`/`vite build`).
- **`onSuccess` data is `UserPreferences` not `PatchUserPreferences`.** The `patchPreferences` Elysia route returns the full saved record. The `onSuccess` callback can therefore directly call `setViewMode(data.viewMode)` and `setSortBy(data.sortBy)` without null checks — the returned data is always a complete object.
- **`mutation.error` is typed as `unknown`.** TanStack Query v5 defaults to `unknown` for error types unless explicitly typed at the QueryClient level. The `mutation.error instanceof Error` guard is required before accessing `.message`.

### Security notes
None. Settings page is fully protected by `_protected.tsx` beforeLoad which redirects unauthenticated users to `/sign-in`.

### Future improvements
- Move the server-authoritative atom override to a global auth observer so it fires immediately on login, not only when the user visits `/settings`.
- Theme saved to server but not synced back to the cookie-based SSR system. A future improvement would call `setThemeFn` after a theme save to keep the cookie in sync.
- Add debounced auto-save for viewMode/sortBy atom changes as a background optimization (fire and forget, no loading state needed).
