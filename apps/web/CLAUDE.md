# apps/web — Frontend Configuration

## Stack

| Concern   | Choice          | Notes                                                          |
| --------- | --------------- | -------------------------------------------------------------- |
| Framework | TanStack Start  | Vite 8 plugin (`@tanstack/react-start/plugin/vite`)            |
| Router    | TanStack Router | File-based routing, `src/routes/`                              |
| Query     | TanStack Query  | Singleton `queryClient` in `src/lib/query-client.ts`           |
| State     | Jotai           | Shared store in `src/lib/jotai-store.ts`                       |
| UI        | Blueprint v6    | `bp6-` prefix CSS classes, Intent system                       |
| CSS       | Tailwind v4     | `@tailwindcss/vite` plugin, `@import "tailwindcss"` in app.css |
| Compiler  | React Compiler  | Babel preset via `@rolldown/plugin-babel` (separate pass)      |

## Vite Config Notes

- `@tanstack/react-start/plugin/vite` — TanStack Start plugin (replaces Vinxi-era app.config.ts)
- `@vitejs/plugin-react` v6 — no babel option; React Compiler runs as a separate babel pass
- `@rolldown/plugin-babel` + `reactCompilerPreset` — React Compiler integration
- SSR externals: `noExternal: ["@tanstack/router-core", "@tanstack/react-router"]` — fixes Vite 8
  ESM/CJS mismatch for these packages
- API proxy: `/api` → `http://localhost:7713`

## File-Based Routing

Routes live in `src/routes/`. TanStack Router auto-generates `src/routeTree.gen.ts` on dev
server start. Do not edit `routeTree.gen.ts` manually — it is overwritten on each run.

Route conventions:

- `__root.tsx` — root layout (QueryClientProvider, Jotai Provider, HTML shell)
- `index.tsx` — maps to `/`
- `_layout.tsx` — pathless layout (underscore prefix = no URL segment)
- `$param.tsx` — dynamic segment

## Blueprint v6 Patterns

```tsx
import { Button, Card, H1, Intent, Tag } from "@blueprintjs/core";

// Intent system for semantic color
<Button intent={Intent.PRIMARY}>Save</Button>
<Tag intent={Intent.SUCCESS} minimal>Active</Tag>

// Dark mode: add `bp6-dark` class to <body>
// Blueprint uses CSS custom properties — no JS theme toggling needed for basics
```

## Jotai Patterns

```typescript
// Always use the shared store, not the default global store
import { store } from "~/lib/jotai-store";
import { useAtom } from "jotai";

const [value, setValue] = useAtom(myAtom, { store });
```

## CSS Import Order (app.css)

Blueprint must be imported before Tailwind so Tailwind utilities can override Blueprint:

```css
@import "@blueprintjs/core/lib/css/blueprint.css";
@import "@blueprintjs/icons/lib/css/blueprint-icons.css";
@import "tailwindcss";
```

## Dev Server

```bash
bun run dev:web        # from root — starts web on :7712
# or
cd apps/web && bun run dev
```
