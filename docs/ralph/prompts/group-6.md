# Group 6: TanStack Query + Eden Treaty Isomorphic Client

## What You're Doing

Install TanStack Query v5, set up the `QueryClient` and `QueryClientProvider`, create the Eden Treaty isomorphic client using `createIsomorphicFn`, and build the first query factory (`userPreferencesQuery`). After this group: the app has TanStack Query infrastructure; Eden Treaty provides fully-typed, isomorphic API calls to the Elysia backend; and `useSuspenseQuery(userPreferencesQuery())` is ready to use in any component.

---

## Research & Exploration First

1. **Read `apps/web/src/routes/__root.tsx`** — where to add `QueryClientProvider` and devtools
2. **Read `packages/api/src/index.ts`** — the `App` type export pattern
3. **Research TanStack Query v5** via Context7 (`/tanstack/query`): focus on `QueryClient` configuration, `QueryClientProvider`, `useSuspenseQuery`, `queryOptions`, `useMutation`, and React 19 compatibility
4. **Research Eden Treaty v2** via Context7 (search Elysia docs for Eden Treaty): `treaty()`, isomorphic pattern with `createIsomorphicFn`, the `{ data, error }` response shape, type inference from `App` type
5. **Research `createIsomorphicFn`** from TanStack Start: how server/client branches work, how the server branch can do in-process Elysia calls
6. **Check if `@cbbi/api` can be imported in `apps/web`**: the workspace dep was added in Group 1 but the import is type-only for Eden Treaty — verify this doesn't bundle Elysia into the frontend
7. **Research TanStack Query Devtools**: conditional dev-only rendering pattern

---

## What to Implement

### 1. Install dependencies in `apps/web`

```bash
cd apps/web && bun add @tanstack/react-query @elysiajs/eden
cd apps/web && bun add -d @tanstack/react-query-devtools
```

Check current stable versions of both packages before installing.

### 2. `apps/web/src/lib/query-client.ts`

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutes — data stays fresh
      gcTime: 1000 * 60 * 10,      // 10 minutes — cache retained
      retry: 1,                     // one retry on failure
      refetchOnWindowFocus: false,  // less aggressive for this app
    },
    mutations: {
      retry: 0,
    },
  },
})
```

Export a singleton — the same instance is used in the root layout and in route loaders.

### 3. `apps/web/src/lib/api.ts`

The isomorphic Eden Treaty client. Research the `createIsomorphicFn` API carefully — the goal is that server-side rendering uses direct in-process Elysia calls (no HTTP), while client-side navigation uses HTTP:

```ts
import { createIsomorphicFn } from '@tanstack/react-start'
import { treaty } from '@elysiajs/eden'
import type { App } from '@cbbi/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const getApi = createIsomorphicFn()
  .server(async () => {
    // Direct in-process call — imports the live Elysia app instance
    // This means no HTTP overhead during SSR
    const { app } = await import('@cbbi/api')
    return treaty(app).api
  })
  .client(() => treaty<App>(API_URL, { fetch: { credentials: 'include' } }).api)
```

**Key concern**: `import('@cbbi/api')` in the server branch imports the Elysia app. This must be a server-only import (never bundled to the client). Verify that TanStack Start / Vite tree-shakes this correctly. If there are bundling issues, use a virtual module or add the import to Vite's `optimizeDeps.exclude`. Document whatever workaround was needed in RALPH_NOTES.

### 4. Wire `QueryClientProvider` in `apps/web/src/routes/__root.tsx`

Add to the root layout JSX:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '~/lib/query-client'

// Wrap app content:
<QueryClientProvider client={queryClient}>
  {/* existing Provider/content */}
  {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
</QueryClientProvider>
```

Order matters: `QueryClientProvider` should wrap the full app including the Jotai `<Provider>` from Group 3, or vice versa — research if there's a recommended order. Both are independent, so either wrapping order is fine.

### 5. `apps/web/src/queries/preferences.queries.ts`

```ts
import { queryOptions } from '@tanstack/react-query'
import { getApi } from '~/lib/api'

export const userPreferencesQuery = () =>
  queryOptions({
    queryKey: ['user', 'preferences'] as const,
    queryFn: async () => {
      const { data, error } = await getApi().user.preferences.get()
      if (error) throw error.value
      return data!
    },
  })

export const updatePreferencesMutation = () => ({
  mutationKey: ['user', 'preferences', 'update'] as const,
  mutationFn: async (body: import('@cbbi/schemas').PatchUserPreferences) => {
    const { data, error } = await getApi().user.preferences.patch(body)
    if (error) throw error.value
    return data!
  },
})
```

Use `as const` on query keys for precise TypeScript type narrowing. Research the exact Eden Treaty call pattern (`getApi().user.preferences.get()`) — verify the path matches the Elysia route prefix structure defined in Group 4.

### 6. Export `queryClient` for use in route loaders

Route loaders (in TanStack Router) can prefetch queries using `queryClient.ensureQueryData()`. Document this pattern in a comment in `query-client.ts`:

```ts
// Usage in route loaders:
// loader: () => queryClient.ensureQueryData(userPreferencesQuery())
// Then in component: const { data } = useSuspenseQuery(userPreferencesQuery())
```

---

## Validation

```bash
cd apps/web && bun run typecheck   # no type errors — especially verify Eden Treaty types resolve
cd apps/web && bun run lint        # clean
cd apps/web && bun run build       # verify Elysia is NOT bundled into the client build
```

**Critical**: inspect the client build output — `packages/api` code should NOT appear in any client bundle chunk. Only types are used client-side; the actual Elysia import is server-only via `createIsomorphicFn`.

---

## Commit

```
feat(query): add TanStack Query v5 and Eden Treaty isomorphic client
```

---

## Done

Append learning notes. Note: how the isomorphic pattern was verified to not bundle server code, any Eden Treaty API differences from the sketch above, and how type inference from `App` type worked.

```
RALPH_TASK_COMPLETE: Group 6
```
