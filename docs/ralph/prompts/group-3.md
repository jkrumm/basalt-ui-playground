# Group 3: Jotai v2 State Layer

## What You're Doing

Install Jotai v2, create the `src/atoms/` directory as the centralized atom store, wire the Jotai `<Provider>` into the app root, and migrate existing scattered `useState` calls that belong in global atoms. After this group: `searchOpen`, `viewMode`, and `sortBy` are Jotai atoms; the app has Jotai DevTools in dev mode; and ESLint enforces the `*Atom` naming convention.

---

## Research & Exploration First

1. **Read `apps/web/src/routes/__root.tsx`** fully — understand the root layout, existing context providers, and where `searchOpen` state lives
2. **Read `apps/web/src/routes/index.tsx`** — find `viewMode` and `sortBy` useState calls
3. **Research Jotai v2**: use Context7 to query `/pmndrs/jotai` for: `atom`, `atomWithStorage`, `useAtom`, `useAtomValue`, `useSetAtom`, `Provider`, React 19 compatibility, React Compiler compatibility
4. **Research jotai-devtools**: check current version and how to conditionally render in dev mode
5. **Check Jotai + React Compiler notes**: search for known issues with `atomFamily` (we avoid it) and confirm plain `atom()` is compiler-safe
6. **Read `apps/web/eslint.config.mjs`** — understand the existing ESLint structure before adding rules

---

## What to Implement

### 1. Install Jotai

```bash
cd apps/web && bun add jotai jotai-devtools
```

Research the exact current stable version before installing. Jotai v2 is the target (the v1→v2 API changed significantly — ensure v2 API is used throughout).

### 2. `apps/web/src/atoms/ui.atoms.ts`

```ts
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { UserPreferences } from '@cbbi/schemas'

// Session-only atoms — cleared on page close
export const searchOpenAtom = atom<boolean>(false)

// Persistent atoms — survive page refresh via localStorage
// Type is scoped to the relevant preference field to keep atoms independent
export const viewModeAtom = atomWithStorage<UserPreferences['viewMode']>(
  'cbbi-view-mode',
  'grid'
)

export const sortByAtom = atomWithStorage<UserPreferences['sortBy']>(
  'cbbi-sort-by',
  'default'
)
```

Note: `atomWithStorage` uses `localStorage` by default in the browser. The key strings use a `cbbi-` prefix to avoid collisions.

### 3. `apps/web/src/atoms/preferences.atoms.ts`

A writable atom for the full user preferences object — this will be populated by TanStack Query in Group 8 when the user is authenticated:

```ts
import { atom } from 'jotai'
import type { UserPreferences } from '@cbbi/schemas'

// Null when unauthenticated, populated from server after login (Group 8)
export const serverPreferencesAtom = atom<UserPreferences | null>(null)
```

### 4. `apps/web/src/atoms/index.ts`

```ts
export * from './ui.atoms'
export * from './preferences.atoms'
```

### 5. Wire `<Provider>` and DevTools in `apps/web/src/routes/__root.tsx`

Wrap the app with Jotai's `<Provider>`. In dev mode only, add the DevTools:

```tsx
import { Provider } from 'jotai'
import { DevTools } from 'jotai-devtools'
import 'jotai-devtools/styles.css'

// In the root component JSX:
<Provider>
  {import.meta.env.DEV && <DevTools />}
  {/* existing app content */}
</Provider>
```

Research the exact jotai-devtools v2 API — the import path and component name may differ from above. Check Context7 or jotai-devtools README.

### 6. Migrate `searchOpen` from `useState` to `useAtom`

In `__root.tsx`, replace:
```tsx
const [searchOpen, setSearchOpen] = useState(false)
```

With:
```tsx
import { useAtom } from 'jotai'
import { searchOpenAtom } from '~/atoms'

const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom)
```

Remove the `useState` import if it's no longer needed after all migrations in this file.

### 7. Migrate `viewMode` and `sortBy` in `apps/web/src/routes/index.tsx`

Replace the existing `useState` declarations for `viewMode` and `sortBy` with atom reads:

```tsx
import { useAtom } from 'jotai'
import { viewModeAtom, sortByAtom } from '~/atoms'

const [viewMode, setViewMode] = useAtom(viewModeAtom)
const [sortBy, setSortBy] = useAtom(sortByAtom)
```

The behavior should be identical from the user's perspective — except now the values persist across page refreshes.

### 8. Add ESLint rule for `*Atom` naming convention

In `apps/web/eslint.config.mjs`, add a flat config object after the existing rules:

```js
// Enforce Jotai atom naming convention
{
  rules: {
    'no-restricted-syntax': [
      'warn',
      // Warn when atom() result is not named with *Atom suffix
      {
        selector: "VariableDeclarator[init.type='CallExpression'][init.callee.name=/^atom/]:not([id.name=/.+Atom$/])",
        message: "Jotai atoms must use the *Atom naming convention (e.g., viewModeAtom, not viewMode).",
      },
      // Warn on atomFamily — broken with React Compiler
      {
        selector: "CallExpression[callee.name='atomFamily']",
        message: "atomFamily is broken with React Compiler. Use static atoms instead.",
      },
    ],
  },
},
```

---

## Validation

```bash
cd apps/web && bun run typecheck   # no new type errors
cd apps/web && bun run lint        # no new lint errors; new no-restricted-syntax rule active

# Behavioral check: start dev server and verify:
# - viewMode and sortBy persist after page refresh (check localStorage in DevTools)
# - Jotai DevTools panel visible in development
```

---

## Commit

```
feat(atoms): add Jotai v2 state layer with persistent atoms and dev tools
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:

```
RALPH_TASK_COMPLETE: Group 3
```
