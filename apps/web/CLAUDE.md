# apps/web — Frontend Configuration

## Stack

| Concern   | Choice              | Notes                                                          |
| --------- | ------------------- | -------------------------------------------------------------- |
| Framework | TanStack Start      | Vite 8 plugin (`@tanstack/react-start/plugin/vite`)            |
| Router    | TanStack Router     | File-based routing, `src/routes/`                              |
| Query     | TanStack Query      | Singleton `queryClient` in `src/lib/query-client.ts`           |
| State     | Jotai               | Shared store in `src/lib/jotai-store.ts`                       |
| UI        | Blueprint v6        | `bp6-` prefix CSS classes, Intent system                       |
| CSS       | Tailwind v4         | `@tailwindcss/vite` plugin, `@import "tailwindcss"` in app.css |
| Compiler  | React Compiler      | Babel preset via `@rolldown/plugin-babel` (separate pass)      |
| Content   | Content Collections | MDX with Shiki highlighting, 4 collections                     |
| RUM       | @hyperdx/browser    | Session replay, console/network capture, trace propagation     |
| Analytics | Umami               | RouteTracker + scroll depth + typed custom events              |

## Vite Config

```
plugins: [tsConfigPaths, tanstackStart, tailwindcss, contentCollections, viteReact, babel(reactCompiler)]
```

Key points:

- `@vitejs/plugin-react` v6 has no babel option — React Compiler runs as a separate `@rolldown/plugin-babel` pass
- `ssr.noExternal: ["@tanstack/router-core", "@tanstack/react-router"]` — fixes Vite 8 ESM/CJS mismatch
- Dev proxy: `/api` → `http://localhost:7713`

## File-Based Routing

Routes live in `src/routes/`. TanStack Router auto-generates `src/routeTree.gen.ts` on dev
server start. Do not edit `routeTree.gen.ts` manually — it is overwritten on each run.

Route conventions:

- `__root.tsx` — root layout (QueryClientProvider, Jotai Provider, HTML shell, HyperDX init)
- `index.tsx` — maps to `/`
- `_layout.tsx` — pathless layout (underscore prefix = no URL segment)
- `$param.tsx` — dynamic segment
- `_protected.tsx` — auth-guarded pathless layout (redirects to `/sign-in`)
- `_content.tsx` — content layout (sidebar, search)

### Router Entry

`router.tsx` exports `getRouter(): Awaitable<AnyRouter>` — resolved via `#tanstack-router-entry`
virtual module. `StartClient` takes zero props (router resolved internally).

## Auth Client

- `src/lib/auth-client.ts` — BetterAuth React client (`createAuthClient`)
- `src/lib/auth.functions.ts` — server functions for SSR session + theme cookie
- `getSessionFn` uses `getRequestHeader("cookie")` to forward session cookies for SSR auth
- Protected routes use `beforeLoad` for auth enforcement (no render-then-redirect flash)

## EdenTreaty Client

```ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@basalt-ui-playground/api";

const api = treaty<App>(typeof window === "undefined" ? "http://localhost:7713" : "");
```

Server-side uses full API URL; client-side uses empty string (same-origin via Vite proxy or
production reverse proxy).

## Jotai Patterns

```typescript
// Always use the shared store, not the default global store
import { store } from "~/lib/jotai-store";
import { useAtom } from "jotai";

const [value, setValue] = useAtom(myAtom, { store });
```

Atoms live in `src/atoms/`. ESLint rule restricts `jotai` imports to `**/atoms/**` directory
to enforce this convention.

## HyperDX Browser SDK

- `src/lib/hyperdx.ts` — `initHyperDX()` (module-level, guarded by `typeof window`)
- `identifyUser()` — called in `_protected.tsx` layout for authenticated users
- `tracePropagationTargets: [/\/api\//]` — injects `traceparent` on API calls
- `advancedNetworkCapture: true` — captures request/response bodies

## Content Pipeline

4 collections: blog, docs, guides, blocks. MDX compiled at build time with Shiki (Blueprint
dark theme), heading extraction, reading time. `content-collections.ts` is the single source
of truth.

Content routes: `_content/blog/*`, `_content/docs/*`, `_content/guides/*`, `_content/blocks/*`,
`_content/search`.

## CSS Import Order (app.css)

Blueprint must be imported before Tailwind so Tailwind utilities can override Blueprint:

```css
@import "@blueprintjs/core/lib/css/blueprint.css";
@import "@blueprintjs/icons/lib/css/blueprint-icons.css";
@import "tailwindcss";
```

## Production Server

`server.ts` uses `Bun.serve()`:

1. `/api/*` → reverse proxy to API server
2. Static files from `dist/client/` with cache headers (immutable for hashed assets)
3. SSR fallback via built TanStack Start handler

## Dev Server

```bash
bun run dev:web        # from root — starts web on :7712
# or
cd apps/web && bun run dev
```
