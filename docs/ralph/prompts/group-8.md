# Group 8: User Preferences Server-Sync Pattern

## What You're Doing

Implement the flagship pattern of this playground: server-authoritative user preferences that override localStorage defaults on login. Create a protected `/settings` page where authenticated users can view and change their preferences. These changes are saved to the Elysia backend and reflected everywhere in the app (theme, view mode, sort order). After this group, the full loop is demonstrated: anonymous user has localStorage preferences → user logs in → server preferences override local → user changes preferences → saved to server → all atoms update.

---

## Research & Exploration First

1. **Read `apps/web/src/atoms/preferences.atoms.ts`** and `ui.atoms.ts` — current atom structure from Group 3
2. **Read `apps/web/src/queries/preferences.queries.ts`** — the query factory from Group 6
3. **Read `apps/web/src/routes/_protected.tsx`** — the auth guard layout from Group 5
4. **Read `apps/web/src/routes/index.tsx`** — how `viewModeAtom` and `sortByAtom` are currently used
5. **Research TanStack Query `useSuspenseQuery` + route loader preloading**: the pattern where `loader: () => queryClient.ensureQueryData(query())` + component `useSuspenseQuery(query())` eliminates loading states
6. **Research `useMutation` from TanStack Query v5**: `onSuccess` invalidation pattern, optimistic updates
7. **Research Jotai `useSetAtom` vs `useAtom`**: when to use each, and how to trigger atom updates from a query result

---

## What to Implement

### 1. `apps/web/src/routes/_protected/settings.tsx`

The protected settings page. This route is automatically protected by the `/_protected.tsx` layout:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { userPreferencesQuery, updatePreferencesMutation } from '~/queries/preferences.queries'
import { queryClient } from '~/lib/query-client'
import { viewModeAtom, sortByAtom } from '~/atoms'
import { useAppForm } from '~/lib/form'
import { typeboxFormValidator } from '~/lib/validation'
import { PatchUserPreferencesSchema } from '@cbbi/schemas'
import type { UserPreferences } from '@cbbi/schemas'

export const Route = createFileRoute('/_protected/settings')({
  // Preload query in loader — component uses useSuspenseQuery (no loading state)
  loader: () => queryClient.ensureQueryData(userPreferencesQuery()),
  component: SettingsPage,
})

function SettingsPage() {
  const { data: serverPrefs } = useSuspenseQuery(userPreferencesQuery())
  const qc = useQueryClient()

  // Server-sync pattern: override localStorage atoms with server preferences once on load
  // This implements the "server-authoritative with localStorage fallback" pattern
  const setViewMode = useSetAtom(viewModeAtom)
  const setSortBy = useSetAtom(sortByAtom)

  useEffect(() => {
    // Only override if server has a non-default value
    // The check prevents overwriting the user's current session selection
    setViewMode(serverPrefs.viewMode)
    setSortBy(serverPrefs.sortBy)
    // Intentionally run only when serverPrefs changes (on login or manual refresh)
  }, [serverPrefs, setViewMode, setSortBy])

  const mutation = useMutation({
    ...updatePreferencesMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'preferences'] })
    },
  })

  const form = useAppForm({
    defaultValues: serverPrefs satisfies UserPreferences,
    validators: { onChange: typeboxFormValidator(PatchUserPreferencesSchema) },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <div>
      {/* Page title using Blueprint Heading/H2 */}
      {/* Theme selector using SelectField */}
      {/* View mode selector using SelectField */}
      {/* Sort by selector using SelectField */}
      {/* Save button using Blueprint Button */}
      {/* Success/error feedback using Blueprint Callout */}
    </div>
  )
}
```

Build out the actual JSX with proper Blueprint layout. Use Blueprint `H2` for the page title, `Section`/`Card` for grouping, `SelectField` from `useAppForm` for dropdowns, `Button` with `loading={mutation.isPending}` for save, and `Callout` for success/error feedback.

### 2. Sync `viewModeAtom` to `sortByAtom` from the home page view toggle

When the user changes view mode or sort order on the home page (`/`), these are already saved to localStorage via `atomWithStorage`. But now they should ALSO be saved to the server when the user is authenticated.

Add a watcher in `apps/web/src/routes/index.tsx` that saves atom changes to the server when authenticated:

```tsx
import { useSession } from '~/lib/auth-client'
import { useMutation } from '@tanstack/react-query'
import { updatePreferencesMutation } from '~/queries/preferences.queries'

function usePreferenceSyncer() {
  const { data: session } = useSession()
  const [viewMode] = useAtom(viewModeAtom)
  const [sortBy] = useAtom(sortByAtom)
  const mutation = useMutation(updatePreferencesMutation())

  // Sync to server when authenticated and state changes
  // Note: This fires on every render where viewMode/sortBy changes — debounce if needed
  useEffect(() => {
    if (!session) return
    mutation.mutate({ viewMode, sortBy })
  }, [viewMode, sortBy, session])  // mutation excluded intentionally (stable ref)
}
```

**Think carefully about this pattern** — should the home page automatically sync every atom change, or should the user explicitly save from the settings page only? Make a decision, document it in the code with a comment, and note it in RALPH_NOTES.md. The explicit settings page save is simpler and avoids excessive API calls.

### 3. Update auth nav to link to settings

In `__root.tsx`, update the user menu (from Group 5) so the "Settings" menu item navigates to `/_protected/settings`.

### 4. Add route to TanStack Router route tree

The `/_protected/settings.tsx` file will be auto-discovered by the TanStack Router CLI when the dev server is running. Verify the route appears in `routeTree.gen.ts` after creation.

---

## Validation

```bash
cd apps/web && bun run typecheck
cd apps/web && bun run lint

# Manual end-to-end test:
# 1. Start api: cd packages/api && bun run dev
# 2. Start web: cd apps/web && bun run dev
# 3. Verify /settings redirects to /sign-in when not logged in
# 4. Sign up + sign in
# 5. Navigate to /settings — verify current preferences loaded from server
# 6. Change theme/viewMode, save
# 7. Navigate to home — verify viewMode atom reflects saved preference
# 8. Sign out, sign back in — verify preferences persisted to server
```

---

## Commit

```
feat(prefs): add server-synced user preferences with settings page and atom override
```

---

## Done

Append learning notes. Note: the decision made about automatic vs explicit sync, any `useEffect` + atom interaction challenges, and how the server-override-once pattern worked in practice.

```
RALPH_TASK_COMPLETE: Group 8
```
