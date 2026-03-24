# Group 9: Cmd+K Global Search Wiring

## What You're Doing

Wire the `searchOpenAtom` from Group 3 to the global Cmd+K hotkey using `@tanstack/react-hotkeys` (already installed). The search modal/overlay should be openable from any page via Cmd+K (⌘K on Mac, Ctrl+K on Windows/Linux), closeable via Escape, and its open state managed entirely through the atom — no prop drilling. After this group, Cmd+K works globally on every route.

---

## Research & Exploration First

1. **Read `apps/web/src/routes/__root.tsx`** fully — find: where the search modal is currently rendered, how it's currently triggered (button click?), and what the existing search component looks like
2. **Read `apps/web/src/atoms/ui.atoms.ts`** — confirm `searchOpenAtom` exists
3. **Find the existing search component**: use Grep to find `searchOpen` or `SearchModal` or similar in `src/`
4. **Research `@tanstack/react-hotkeys`**: current API (the package is installed but may have changed from v0.5 to newer). Find: `useHotkeys` hook signature, the `mod` modifier for cross-platform Cmd/Ctrl, how to scope hotkeys globally vs component-locally
5. **Research Blueprint v6 Overlay/Dialog for search**: `Dialog`, `OverlaysProvider`, `Overlay2` — which is used for the existing search modal?
6. **Check if `OverlaysProvider` is already in the root layout** — Blueprint v6 requires it for portaled overlays

---

## What to Implement

### 1. Wire hotkey in `apps/web/src/routes/__root.tsx`

Add the global hotkey handler at the root layout level so it works on every route:

```tsx
import { useHotkeys } from '@tanstack/react-hotkeys'
import { useSetAtom } from 'jotai'
import { searchOpenAtom } from '~/atoms'

function RootLayout() {
  const setSearchOpen = useSetAtom(searchOpenAtom)

  // Global Cmd+K / Ctrl+K — opens search from anywhere
  useHotkeys([
    ['mod+k', (e) => {
      e.preventDefault()
      setSearchOpen(true)
    }],
  ])

  // ... rest of layout
}
```

Research the exact `useHotkeys` API — the array format, the `mod` key syntax, and whether `preventDefault` is called differently. `mod` maps to ⌘ on Mac and Ctrl on Windows/Linux.

### 2. Ensure the search modal reads from `searchOpenAtom`

Wherever the search modal component is defined (likely in `src/components/` or inline in `__root.tsx`), replace its `open` prop / internal state with `useAtom(searchOpenAtom)`:

```tsx
import { useAtom } from 'jotai'
import { searchOpenAtom } from '~/atoms'

function SearchModal() {
  const [open, setOpen] = useAtom(searchOpenAtom)

  return (
    <Dialog isOpen={open} onClose={() => setOpen(false)} /* ... */>
      {/* search content */}
    </Dialog>
  )
}
```

The existing search functionality (Fuse.js, results rendering) should remain unchanged. Only the open/close state management changes.

### 3. Verify `OverlaysProvider` is present

Blueprint v6 Dialog requires `<OverlaysProvider>` in the tree. Verify it's in `__root.tsx`. If not, add it:

```tsx
import { OverlaysProvider } from '@blueprintjs/core'

// Wrap app content with OverlaysProvider
<OverlaysProvider>
  {/* app content */}
</OverlaysProvider>
```

### 4. Expose search trigger from the nav bar

The nav bar should have a visible search button that also sets `searchOpenAtom = true`. Use `useSetAtom` (not `useAtom`) when you only need to write:

```tsx
import { useSetAtom } from 'jotai'
import { searchOpenAtom } from '~/atoms'

function SearchButton() {
  const setSearchOpen = useSetAtom(searchOpenAtom)
  return (
    <Button
      minimal
      icon={<MagnifyingGlass />}
      text="Search"
      onClick={() => setSearchOpen(true)}
      data-umami-event="search-opened"
    />
  )
}
```

The Umami `data-umami-event` attribute is the declarative tracking pattern — no `track()` call needed for this button.

---

## Validation

```bash
cd apps/web && bun run typecheck
cd apps/web && bun run lint

# Manual check:
# 1. Start dev server
# 2. Press Cmd+K (or Ctrl+K) — search modal opens
# 3. Press Escape — search modal closes
# 4. Click search button in nav — modal opens
# 5. Navigate to /blog, /docs, /table — hotkey works on all routes
```

---

## Commit

```
feat(search): wire Cmd+K global search via searchOpenAtom and @tanstack/react-hotkeys
```

---

## Done

Append learning notes. Note the exact `useHotkeys` API used and any Blueprint overlay setup required.

```
RALPH_TASK_COMPLETE: Group 9
```
