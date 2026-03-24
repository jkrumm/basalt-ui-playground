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
