# Group 11: Demo Blocks + Architecture Docs

## What You're Doing

Create the documentation layer that makes this playground useful as a reference. Two distinct layers: (1) **Blocks** — live, interactive demos showing each pattern in a running UI context; (2) **Docs** — one architecture page and one auth/data flow page explaining the WHY behind decisions. Source code IS the implementation reference; docs explain concepts that can't be derived from reading code.

---

## Research & Exploration First

1. **Read `apps/web/src/routes/_content/blocks/`** — how existing blocks are structured (MDX? Route component? What frontmatter schema?)
2. **Read `apps/web/src/routes/_content/docs/`** — how existing docs pages are structured
3. **Read `apps/web/src/content/`** — where MDX files live, frontmatter structure
4. **Read `apps/web/vite.config.ts`** — how MDX and Shiki code highlighting are configured
5. **Read an existing block** (any file in blocks/) — understand the exact pattern used: does it render a live React component or just code? How are live demos embedded?
6. **Read an existing docs page** — the exact MDX structure, what frontmatter fields are required
7. **Research Blueprint v6 components** you'll use in demo components: `Card`, `Tag`, `Code`, `H3`

---

## What to Implement

### Docs Pages (2 pages)

#### `apps/web/src/content/docs/state-architecture.mdx`

Title: "State Architecture"

Content outline:
1. **The State Layer Decision Tree** — the visual decision guide (which layer for which state)
2. **Layer 1: URL State** — TanStack Router validateSearch + TypeBox. When to use, example from the blog tag filter
3. **Layer 2: Session State** — Jotai `atom()`. When to use, example with `searchOpenAtom`
4. **Layer 3: Persistent UI State** — Jotai `atomWithStorage()`. When to use, example with `viewModeAtom`
5. **Layer 4: Server State** — TanStack Query `useSuspenseQuery`. When to use, example from preferences
6. **Layer 5: Forms** — TanStack Form + TypeBox adapter. When to use `useState` inside a form vs `useAppForm`
7. **The Rule**: "Can I share a URL and reproduce this state?" decision guide
8. **What NOT to use**: brief notes on why Zustand/Redux/MobX aren't used here (React Compiler, atomic granularity)

Use Shiki code blocks to show real examples from the codebase. Link to source files where possible.

#### `apps/web/src/content/docs/auth-and-data-flow.mdx`

Title: "Auth & Data Flow"

Content outline:
1. **Architecture overview**: TanStack Start (port 3000) ↔ Elysia API (port 3001) relationship
2. **Auth flow**: sign-up → sign-in → session cookie → protected routes → sign-out
3. **The Eden Treaty pattern**: how `getApi()` works isomorphically (server = in-process, client = HTTP)
4. **Query factory pattern**: `queryOptions()` pattern, why no raw `useQuery`, the `const query = () => queryOptions(...)` idiom
5. **Server-sync preferences pattern**: the localStorage fallback → server override lifecycle
6. **TypeBox E2E**: how `packages/schemas/` schemas flow through Elysia validation → Eden Treaty types → frontend forms

Show a sequence diagram (using Mermaid — it's already configured in the MDX setup) for the auth flow and the isomorphic data flow.

### Blocks (3 blocks)

#### Block: "Client State Atoms"

A live demo block showing Jotai atoms in action. Create a React component that demonstrates:
- A toggle that changes `viewModeAtom` (shows persistence across re-renders)
- A button that opens a demo modal using a local atom (session-only)
- The Jotai DevTools link (show users how to open it)

Show the atom definitions in a code block. The live component uses real atoms from `~/atoms`.

#### Block: "Global Search & Hotkeys"

A demo block showing:
- A button that triggers `setSearchOpen(true)` — same as Cmd+K
- A code snippet showing the `useHotkeys` setup in `__root.tsx`
- A note: "Try pressing Cmd+K / Ctrl+K anywhere on this page"

#### Block: "Typesafe Forms"

A demo block with a real, working mini-form using `useAppForm` + `typeboxFormValidator`. Use a simple schema (name + email) just for the demo — not connected to any backend. Show:
- The TypeBox schema definition
- The `useAppForm` call
- Blueprint error states when fields are invalid
- How `typeboxValidator` bridges TypeBox → TanStack Form

Include the full form source in a code block using Shiki syntax highlighting.

### Update the blocks index

Add the three new blocks to the blocks index/listing page so they appear in navigation.

### Update the docs index

Add the two new docs pages to the docs navigation so they appear in the sidebar.

---

## Validation

```bash
cd apps/web && bun run typecheck
cd apps/web && bun run lint
cd apps/web && bun run build     # SSG prerender must complete without errors for docs/blocks
```

**Manual check**: navigate to `/docs/state-architecture` and `/docs/auth-and-data-flow` — pages render with correct MDX content and code highlighting. Navigate to the three new blocks — live demos work. Mermaid diagrams render.

---

## Commit

```
docs(blocks): add state architecture docs and pattern demo blocks
```

---

## Done

This is the final group. After appending learning notes:

1. Run `cd apps/web && bun run build` for a final clean build
2. Review `git log --oneline -15` — the commit history should tell the story of the architecture
3. Generate the RALPH report: `./scripts/ralph.sh --status`

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:

```
RALPH_TASK_COMPLETE: Group 11
```
