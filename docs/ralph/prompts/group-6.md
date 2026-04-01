# Group 6: TanStack Start Frontend (Core Shell)

## What You're Doing

Create a working TanStack Start application with Vite 8, React 19, Blueprint v6, Tailwind v4, Jotai, and a dev proxy to the API. This is the frontend foundation — routing, styling, state management base.

---

## Research & Exploration First

1. Research: TanStack Start latest setup with Vite 8 — the Vinxi removal happened, find the new plugin system. Check `@tanstack/react-start` docs and changelog. The plugin import may be `@tanstack/start-vite-plugin`, `@tanstack/react-start/plugin/vite`, or another path.
2. Research: Vite 8 breaking changes from Vite 7 — new features, config changes
3. Research: React Compiler 1.0 babel plugin setup with Vite 8 + `@vitejs/plugin-react`. The current codebase uses `@rolldown/plugin-babel` as a SEPARATE pass. Check if Vite 8's React plugin handles the compiler correctly in a single pass or if the two-pass approach is still needed.
4. Research: Blueprint v6 CSS setup with Tailwind v4 — import order, CSS custom properties, coexistence
5. Research: Jotai with React Compiler — confirm `atomFamily` status, `createStore()` pattern
6. Research: TanStack Router latest file-based routing setup
7. Research: TanStack Query v5 `routerWithQueryClient` pattern
8. Read existing `apps/web/` source files for patterns to port (vite.config.ts, router.tsx, __root.tsx, styles)
9. Check if TanStack Start still needs SSR externals workarounds for `@tanstack/router-core` (was a Vite 7 issue)

---

## What to Implement

### 1. apps/web/package.json

Dependencies:
- `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`
- `react`, `react-dom` (19.x)
- `@blueprintjs/core`, `@blueprintjs/icons`, `@blueprintjs/select` (v6)
- `jotai`
- `tailwindcss` (v4)
- `vite` (v8)

Dev dependencies:
- `@vitejs/plugin-react`
- `babel-plugin-react-compiler` (1.0)
- `@tanstack/router-plugin` (for file-based route generation)
- `vite-tsconfig-paths`
- `@types/react`, `@types/react-dom`

Name: `@cbbi/web`.

### 2. apps/web/vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
// Research the exact TanStack Start Vite plugin import

export default defineConfig({
  plugins: [
    // TanStack Start plugin
    tsconfigPaths(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  server: {
    port: 7712,
    proxy: {
      "/api": {
        target: "http://localhost:7713",
        changeOrigin: true,
      },
    },
  },
});
```

**IMPORTANT:** Verify the React Compiler integration. If the two-pass Rolldown babel approach is still needed, implement it that way instead.

### 3. apps/web/tsconfig.json

Extend root. Add jsx: "react-jsx", path aliases (`~/*` → `./src/*`).

### 4. src/client.tsx — Client Entry

TanStack Start's client hydration entry point. Research the exact pattern for the latest version.

### 5. src/router.tsx — Router Config

```typescript
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { routeTree } from "./routeTree.gen.ts";
import { queryClient } from "./lib/query-client.ts";

export function createRouter() {
  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: "intent",
      context: { queryClient },
    }),
    queryClient,
  );
}
```

### 6. src/routes/__root.tsx — Root Layout

- QueryClientProvider
- Jotai Provider with shared store
- Theme context (dark/light, read from cookie for SSR)
- Blueprint CSS loaded
- HTML shell with meta tags

### 7. src/routes/index.tsx — Landing Page

Simple landing page with Blueprint components to verify the stack works. Use Blueprint Button, Card, etc. to confirm styling loads correctly.

### 8. src/styles/app.css — Global Styles

Blueprint v6 CSS + Tailwind v4 setup. Research the correct import order:
```css
/* Blueprint core CSS */
@import "@blueprintjs/core/lib/css/blueprint.css";
@import "@blueprintjs/icons/lib/css/blueprint-icons.css";
/* Tailwind */
@import "tailwindcss";
```

Ensure Blueprint and Tailwind don't conflict. Blueprint uses CSS custom properties — Tailwind v4 should coexist.

### 9. src/lib/query-client.ts

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 10. src/lib/jotai-store.ts

```typescript
import { createStore } from "jotai";
export const store = createStore();
```

### 11. apps/web/CLAUDE.md

Frontend-specific CLAUDE.md with TanStack Start patterns, Blueprint v6 usage, Jotai conventions, routing patterns.

### 12. Wire into root

- Update root scripts: `dev:web` runs the web app
- Update Makefile: `dev` starts both web and API concurrently
- `build` target builds the web app

---

## Validation

```bash
bun install
bun run dev:web &
# Wait for Vite to start
curl http://localhost:7712                     # Returns HTML
# Verify Blueprint CSS loads (check for .bp5- classes in HTML)
kill %1

bun run typecheck
```

---

## Commit

```
feat(web): initialize TanStack Start with Vite 8, Blueprint v6, and Tailwind v4
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 6
```
