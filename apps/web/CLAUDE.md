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

## Data Fetching Pattern

**Prefer Elysia API routes + EdenTreaty over TanStack Start server functions.**

Server functions (`createServerFn`) are only for SSR-specific tasks that need the request
context (cookies, headers): `getSessionFn` (auth), `getThemeFn` (theme cookie).

All other data fetching goes through Elysia API routes, consumed via EdenTreaty:

```ts
// Route loader — SSR pre-fetch
export const Route = createFileRoute("/")({
  loader: async () => {
    const { data, error } = await api.api.market.cbbi.dashboard.get();
    if (error) throw new Error(String(error));
    return data;
  },
});

// Component — TanStack Query with SSR initial data + optional polling
function Dashboard() {
  const loaderData = Route.useLoaderData();
  const { data } = useQuery({
    ...cbbiDashboardQuery(),
    initialData: loaderData,
    refetchInterval: 10_000, // for polling (e.g., Bitcoin price)
  });
}
```

Query definitions live in `src/queries/`. They wrap EdenTreaty calls in `queryOptions()`.

## Auth Client

- `src/lib/auth-client.ts` — BetterAuth React client (`createAuthClient`)
- `src/lib/auth.functions.ts` — server functions for SSR session + theme cookie
- `getSessionFn` uses `getRequestHeader("cookie")` to forward session cookies for SSR auth
- Protected routes use `beforeLoad` for auth enforcement (no render-then-redirect flash)

## EdenTreaty Client

```ts
import { treaty } from "@elysiajs/eden";
import { context, propagation } from "@opentelemetry/api";
import type { App } from "@basalt-ui-playground/api";

const api = treaty<App>(getBaseUrl(), {
  fetch: { credentials: "include" },
  headers() {
    if (typeof window !== "undefined") return {};
    const headers: Record<string, string> = {};
    propagation.inject(context.active(), headers);
    return headers;
  },
});
```

Server-side uses full API URL + auto-injects `traceparent` for trace propagation.
Client-side uses empty string (same-origin) — HyperDX handles `traceparent` injection.

## Jotai Patterns

```typescript
// Always use the shared store, not the default global store
import { store } from "~/lib/jotai-store";
import { useAtom } from "jotai";

const [value, setValue] = useAtom(myAtom, { store });
```

Atoms live in `src/atoms/`. ESLint rule restricts `jotai` imports to `**/atoms/**` directory
to enforce this convention.

## Observability

### Browser — HyperDX SDK

- `src/lib/hyperdx.ts` — self-initializing side-effect module (guarded by `typeof window`)
- Must be first import in `client.tsx` (before BetterAuth captures fetch)
- `identifyUser()` — called in `_protected.tsx` layout for authenticated users
- `tracePropagationTargets: [/\/api\//, /\/_serverFn\//]` — injects `traceparent` on API and
  server function calls
- `advancedNetworkCapture: true` — captures request/response bodies
- Sends to same-origin (web server proxies `/v1/traces` + `/v1/logs` to OTLP collector)

### SSR — Production Server Tracing

- `telemetry.ts` — NodeSDK with BatchSpanProcessor + OTLPTraceExporter (init before all imports)
- `server.ts` — creates SSR/ServerFn spans with OTEL HTTP semantic conventions
- Server function names resolved from build manifest (`/_serverFn/{hash}` → `getCBBIData`)
- Graceful shutdown via `SIGTERM` handler flushes pending spans
- OTLP auth header read automatically from `OTEL_EXPORTER_OTLP_HEADERS` env var

### EdenTreaty Trace Propagation

`api.ts` `headers()` auto-injects `traceparent` on all server-side calls. No manual
`propagation.inject()` needed per server function — just use the `api` client.

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
