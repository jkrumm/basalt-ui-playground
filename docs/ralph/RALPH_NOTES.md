# RALPH Notes — cbbi-blueprint

Learning notes appended by Claude after each group. These capture deviations, surprises, and gotchas for future groups and future sessions.

---

<!-- Groups append their notes below this line -->

## Group 1: Monorepo Restructure

### What was implemented
Restructured from a flat single-package app to a Bun workspaces monorepo. App moved to `apps/web/`, two package stubs created (`packages/schemas/`, `packages/api/`). All files moved with `git mv` to preserve history.

### Deviations from prompt
- Added `@blueprintjs/icons`, `shiki`, `hast-util-to-string`, `unified`, `unist-util-visit` as explicit direct dependencies in `apps/web/package.json`. These were transitive deps used via direct imports in source (`mdx-theme.ts`, `rehype-export-headings.ts`, component files). In a flat `node_modules` they were visible; in Bun workspaces only direct deps get symlinked.
- Used `@types/hast` (devDep) instead of the non-existent `hast@^3.x` standalone package — `hast` is a types-only concept whose declarations ship via `@types/hast`.
- `.stylelintrc.json` moved to `apps/web/` alongside the `stylelint` script.
- Fixed a pre-existing `style/quote-props` lint error in `src/routes/_content/guides/$slug.tsx` via `eslint --fix` to make lint pass for validation.

### Gotchas & surprises
- Bun workspaces only symlink **direct** dependencies into workspace-local `node_modules`. Transitive deps go into `node_modules/.bun/<pkg>@<version>/` which is NOT on TypeScript's standard resolution path. Any package directly `import`-ed in source code must be an explicit dependency even if it was previously available as a transitive dep in a flat layout.
- The root `node_modules` after `bun install` contains only `.bun/` and `.old_modules-<hash>/` — no top-level package directories. This is expected Bun workspace behavior.
- `hast` is NOT a standalone runtime package — its TypeScript types are provided by `@types/hast`. The import `import type { Element, Root } from 'hast'` requires `@types/hast` as a devDep.
- `bun install` output `Removed: 50` during workspace init is expected — Bun reorganizes previously flat deps into the `.bun` cache.

### Security notes
None.

### Future improvements
- Consider adding a root-level `typecheck` script that runs typecheck across all workspaces (not just `apps/web`) for a single pre-commit check.

---

## Group 2: Shared TypeBox Schemas Package

### What was implemented
Populated `packages/schemas/` with two schema files: `user-preferences.ts` (UserPreferences + PatchUserPreferences) and `auth.ts` (SignIn + SignUp). Both export TypeBox schemas and inferred TypeScript types. The index re-exports everything. `@cbbi/schemas` was already wired as a workspace dep in `apps/web/package.json` from Group 1.

### Deviations from prompt
- Skipped the temporary type-check import in `index.tsx` — the workspace dep was already declared and `bun run typecheck` in `apps/web` validates resolution directly. No need to add noise to source files.
- `name-asc` included in `sortBy` union per spec, even though the current app's HTMLSelect only has three options. This is intentional forward-compatibility for Group 8+ settings page.

### Gotchas & surprises
- No surprises. TypeBox 0.34.48 API matches the spec exactly. `Type.Partial`, `Type.Union`, `Type.Literal`, and `Type.Static` all work as documented. No context7 lookup needed — existing codebase already uses the same TypeBox version.
- The `packages/schemas` tsconfig uses `"moduleResolution": "bundler"` with `"allowImportingTsExtensions": true`, which means the `.ts` export in `package.json` (`"./src/index.ts"`) resolves correctly in the Bun workspace without a build step.

### Security notes
None.

### Future improvements
- When `packages/api` is populated (Group 4+), verify Elysia's `t` (TypeBox superset) can consume these plain TypeBox schemas without wrapping. Expected to work but worth a quick smoke test.

---

## Group 3: Jotai v2 State Layer

### What was implemented
Installed Jotai v2.19.0 and jotai-devtools v0.13.0. Created `src/atoms/` with three files: `ui.atoms.ts` (searchOpenAtom, viewModeAtom, sortByAtom), `preferences.atoms.ts` (serverPreferencesAtom), and `index.ts` barrel. Wired `<Provider>` and conditional `<DevTools />` into `__root.tsx`. Migrated `searchOpen` (root), `viewMode` and `sortBy` (index) from `useState` to atom reads.

### Deviations from prompt
- **ESLint `no-restricted-syntax` merging**: The prompt suggested adding a new flat config object for the Jotai naming rules. In ESLint flat config, a later config object with the same rule name OVERRIDES the earlier one — it does NOT merge. Adding a separate config would have silently dropped all existing Blueprint/icon restrictions. Instead, the new Jotai selectors were appended to the existing `no-restricted-syntax` array. Both rules now have `'error'` severity (consistent with the existing rules).
- **`sortBy` cast**: `atomWithStorage` with `UserPreferences['sortBy']` type requires an explicit `as UserPreferences['sortBy']` cast when assigning from `HTMLSelect`'s `e.target.value` (which is `string`). This is correct — the options in the JSX constrain valid values but TypeScript can't infer that from a DOM event.

### Gotchas & surprises
- jotai-devtools v0.13.0 emits a peer dependency warning for `react@^18` (we have React 19). Works correctly at runtime — the warning is a version range oversight in jotai-devtools' `peerDependencies`.
- Jotai's `useAtom` setter is stable across renders (same reference), but `react-hooks/exhaustive-deps` doesn't have a special case for it the way it does for React's own `useState` setter. This produces a pre-existing-style warning in `__root.tsx` (`setSearchOpen` missing from deps). Functionally correct to leave omitted — the effect's cleanup is the important part.
- CSS import for jotai-devtools must be a side-effect import (`import 'jotai-devtools/styles.css'`). The Vite Inline (`?inline`) pattern is also valid but unnecessary when CSS is bundled normally.

### Security notes
None.

### Future improvements
- The `react-hooks/exhaustive-deps` warning for `setSearchOpen` could be suppressed with a `useSetAtom` split (read and write atoms separately), but this is cosmetic — the behavior is identical.
- jotai-devtools `position` prop can be configured if the default overlaps with Blueprint UI elements.
