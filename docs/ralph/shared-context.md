# cbbi-blueprint — RALPH Shared Context

You are implementing a **best-practice, greenfield React 19 playground** that serves as the canonical reference for the optimal March 2026 frontend stack for scalable applications. Every group must research current library APIs before writing any code — treat all knowledge from training as potentially stale.

---

## What cbbi-blueprint Is

cbbi-blueprint is a TanStack Start (React 19 + SSR/SSG) application that displays Bitcoin cycle indicators, documentation, blog posts, and search. In this RALPH loop, it is being transformed into a reference implementation playground that demonstrates the optimal modern frontend architecture stack.

The application shows real UI patterns with real data — it is not a toy demo. Every pattern implemented here will be the foundation for the actual production application. Quality, typesafety, maintainability, and developer experience are all first-class concerns.

---

## Target Repository Layout (Post-Group 1)

```
cbbi-blueprint/
  package.json                    # workspace root — workspaces: ["apps/*", "packages/*"]
  bun.lock                        # managed by bun at workspace root
  .gitignore
  scripts/
    ralph.sh                      # RALPH runner
    ralph-reset.sh
  docs/ralph/                     # this RALPH loop
  apps/
    web/                          # TanStack Start frontend (moved from root in Group 1)
      package.json                # name: "@cbbi/web"
      vite.config.ts
      tsconfig.json
      index.html
      server.ts                   # Bun production server
      eslint.config.mjs
      .env.local                  # VITE_API_URL=http://localhost:3001 (gitignored)
      src/
        routes/                   # TanStack Router file-based routes
          __root.tsx              # root layout, Providers, DevTools
          index.tsx               # home dashboard
          _protected.tsx          # pathless auth guard layout
          _protected/
            settings.tsx          # user preferences page (added in Group 8)
          sign-in.tsx
          sign-up.tsx
          _content/               # MDX content routes (existing)
          table.tsx               # existing
          api/
            auth/
              $.ts                # BetterAuth catch-all handler
        components/               # shared UI components
        atoms/                    # ALL Jotai atoms — every atom lives here
          ui.atoms.ts             # searchOpenAtom, viewModeAtom, sortByAtom
          preferences.atoms.ts    # userPreferencesAtom (server-synced)
          index.ts                # barrel re-export
        lib/
          api.ts                  # Eden Treaty isomorphic client
          auth.ts                 # BetterAuth server config (server-only)
          auth-client.ts          # BetterAuth client config
          auth.functions.ts       # createServerFn wrappers for session
          query-client.ts         # TanStack Query QueryClient singleton
          validation.ts           # typeboxValidator adapter for TanStack Form
          form.ts                 # createFormHook with Blueprint field components
        queries/
          preferences.queries.ts  # userPreferencesQuery, patchPreferencesMutation
        context/                  # React context (kept minimal — prefer atoms)
  packages/
    schemas/                      # @cbbi/schemas — shared TypeBox schemas
      package.json
      src/
        user-preferences.ts
        auth.ts
        index.ts                  # re-exports everything
    api/                          # @cbbi/api — Elysia API backend
      package.json
      data/                       # SQLite database file (gitignored)
      src/
        index.ts                  # Elysia app + `export type App = typeof app`
        auth.ts                   # BetterAuth server config
        db.ts                     # Drizzle + better-sqlite3
        schema.ts                 # Drizzle table definitions
        routes/
          preferences.ts          # GET/PATCH /api/user/preferences
```

---

## Tech Stack — Final Decisions

| Layer | Library | Version | Rationale |
|-|-|-|-|
| Framework | TanStack Start | v1.x | SSR + file-routing + server functions |
| UI | Blueprint.js | v6 | project standard, controlled components |
| Client UI state | Jotai | v2 | atomic, external store, React Compiler safe |
| Server state | TanStack Query | v5 | Suspense-first, route-preloaded |
| Auth | BetterAuth | v1 | TanStack Start plugin, Elysia plugin |
| API backend | Elysia | v1 | TypeBox-native, Eden Treaty, Bun runtime |
| API client | Eden Treaty | v2 | zero codegen, TypeScript inference from App type |
| Shared schemas | TypeBox | v0.34+ | Elysia-native, existing codebase, E2E shared |
| Forms | TanStack Form | v1 | signals-based, controlled inputs, Compiler safe |
| URL state | TanStack Router validateSearch | v1 | existing pattern, correct, no migration |
| Hotkeys | @tanstack/react-hotkeys | v0.5+ | already installed |
| ORM | Drizzle ORM | latest | typesafe, Bun-compatible |
| SQLite | better-sqlite3 | latest | BetterAuth adapter, local POC |
| Package manager | Bun | latest | workspaces, performance |

---

## Critical Architecture Constraints

### React Compiler is Active — Must Not Be Broken

`babel-plugin-react-compiler` and `eslint-plugin-react-compiler: error` are configured. This means:

- **NEVER manually add `useMemo` or `useCallback`** — Compiler handles this; adding them causes ESLint errors
- **NEVER use `@preact/signals-react`** — hard incompatible with React Compiler
- **DO use `useAtom(atom)`** — Jotai external subscriptions are Compiler-safe by design
- **DO use `useSuspenseQuery(queryOptions())`** — TanStack Query Compiler-safe
- If the React Compiler lint rule fires on your code, it means your code violates Rules of React — fix the code, not the lint rule

### Jotai Atom Conventions (ESLint-enforced after Group 10)

- **ALL atoms defined in `apps/web/src/atoms/`** — never inline in components
- **`*Atom` suffix** on every atom variable: `viewModeAtom`, `searchOpenAtom`
- **Never `atomFamily`** — has an infinite re-render bug with React Compiler; use static atoms only
- **`atomWithStorage`** for any state that should survive page refresh
- **Plain `atom()`** for session-only transient state (modal open, etc.)

### State Layer Decision — Which Layer for New State?

```
"Can I share a URL and reproduce this state?" → YES → TanStack Router validateSearch (TypeBox)

"Does this cross component boundaries?"       → YES → Jotai atom()
"Should it survive page refresh?"             → YES → atomWithStorage()
                                              → NO  → plain atom()

"Is it purely local to one component?"        → useState (component-local ephemeral)

"Is it from the server / auth-gated?"         → TanStack Query useSuspenseQuery()
"Server preferences should override local?"   → Yes — one-time override on login (see below)
```

### The Server-Sync Override Pattern

When a user logs in, their server preferences override localStorage defaults exactly once:

```ts
// In settings component (after auth)
const { data: serverPrefs } = useSuspenseQuery(userPreferencesQuery())
const [viewMode, setViewMode] = useAtom(viewModeAtom)

// Override localStorage default with server value on first load
// Intentionally omit viewMode from deps — we only want to sync once per login
useEffect(() => {
  if (serverPrefs.viewMode && serverPrefs.viewMode !== viewMode) {
    setViewMode(serverPrefs.viewMode)
  }
}, [serverPrefs, setViewMode])
```

### TypeBox Adapter for TanStack Form

TypeBox does not implement Standard Schema. This adapter lives in `apps/web/src/lib/validation.ts`:

```ts
import { type TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

export function typeboxValidator<T extends TSchema>(schema: T) {
  return (value: unknown) => {
    const withDefaults = Value.Default(schema, structuredClone(value) ?? {})
    if (Value.Check(schema, withDefaults)) return undefined
    return [...Value.Errors(schema, withDefaults)]
      .map(e => `${e.path || 'value'}: ${e.message}`)
      .join('; ')
  }
}
```

### Eden Treaty Isomorphic Pattern

```ts
// apps/web/src/lib/api.ts
import { createIsomorphicFn } from '@tanstack/react-start'
import { treaty } from '@elysiajs/eden'
import type { App } from '@cbbi/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Server branch: direct in-process call — zero HTTP overhead during SSR
// Client branch: regular HTTP request to the running Elysia server
export const getApi = createIsomorphicFn()
  .server(async () => {
    // Dynamic import avoids bundling Elysia into the frontend
    const { app } = await import('@cbbi/api')
    return treaty(app).api
  })
  .client(() => treaty<App>(API_URL).api)
```

### Query Factory Pattern (no raw useQuery/useMutation)

```ts
// apps/web/src/queries/preferences.queries.ts
import { queryOptions } from '@tanstack/react-query'
import { getApi } from '~/lib/api'

export const userPreferencesQuery = () => queryOptions({
  queryKey: ['user', 'preferences'],
  queryFn: async () => {
    const { data, error } = await getApi().user.preferences.get()
    if (error) throw error.value
    return data!
  },
})
```

---

## Auth Architecture

BetterAuth v1 runs on the **Elysia backend** (packages/api) — not on TanStack Start. This is the split-backend pattern:

- Elysia mounts `auth.handler` → handles all `/api/auth/*` requests
- `authClient.baseURL` in apps/web points to `http://localhost:3001`
- Session cookies are set by Elysia on the Elysia domain (localhost:3001)
- With `credentials: 'include'`, cookies are sent cross-origin in local dev
- TanStack Start `createServerFn` forwards cookies to Elysia for session validation
- `/_protected.tsx` pathless layout route guards all protected TanStack Router routes

**If the split-backend cookie complexity is too brittle for local dev:** Fallback to BetterAuth on TanStack Start (using `tanstackStartCookies()` plugin). Research BetterAuth docs for the current recommended approach and choose the more stable option. Document your choice in RALPH_NOTES.md.

---

## Validation Commands

**Run these after every group before committing:**

```bash
# From workspace root — after Group 1:
cd apps/web && bun run typecheck
cd apps/web && bun run lint

# After Group 4+, also:
cd packages/api && bun run typecheck

# Full build check (run before final commit each group):
cd apps/web && bun run build
```

**Note:** `bun run pre` in `apps/web/` runs typecheck + lint + stylelint together.

---

## Research-First Mandate

Before writing ANY code for a library:

1. **Resolve the Context7 library ID**: use `mcp__context7__resolve-library-id` with the package name
2. **Query docs**: use `mcp__context7__query-docs` with the resolved ID and relevant topic
3. **Check current stable version**: `curl -s https://registry.npmjs.org/<package>/latest | python3 -c "import json,sys; print(json.load(sys.stdin)['version'])"`
4. Read existing code patterns in the repo before introducing new ones

**The group prompt is direction, not prescription.** If you research and find a better, simpler, or more idiomatic approach than what the prompt describes — use it and document your deviation in RALPH_NOTES.md.

---

## ESLint Config Note

The ESLint config file lives at `apps/web/eslint.config.mjs` (post-Group 1). It uses `@antfu/eslint-config` as the base. When adding rules:
- Add new flat config objects as additional array entries after the `antfu(...)` call
- Never destructure or modify the `antfu(...)` base call itself
- Test new rules with `cd apps/web && bun run lint` before committing

---

## Commit Format

Conventional commits. NO AI attribution (no Co-Authored-By footer):

```
feat(monorepo): restructure to bun workspaces with apps/web
feat(schemas): add shared TypeBox schemas package
feat(atoms): add Jotai v2 state layer with atomWithStorage
feat(api): add Elysia backend with BetterAuth and preferences routes
feat(auth): add sign-in, sign-up, and protected route layout
feat(query): add TanStack Query and Eden Treaty isomorphic client
feat(forms): add TanStack Form v1 with Blueprint field components
feat(prefs): add server-synced user preferences pattern
feat(search): wire Cmd+K global search via Jotai atom + hotkeys
chore(eslint): add state pattern enforcement rules
docs(blocks): add architecture demo blocks and state docs page
```

---

## Learning Notes — Append After Each Group

Append to `docs/ralph/RALPH_NOTES.md` after completing your group:

```markdown
## Group N: <Title>

### What was implemented
<1–3 sentences>

### Deviations from prompt
<what you changed and why — be specific>

### Gotchas & surprises
<library API differences, version quirks, unexpected behavior>

### Security notes
<any security-relevant decisions>

### Future improvements
<deferred work, tech debt, better approaches for later>
```

---

## Completion Signal

The VERY LAST LINE of your response must be one of:

```
RALPH_TASK_COMPLETE: Group N
```

```
RALPH_TASK_BLOCKED: Group N - <one sentence explaining the blocker>
```
