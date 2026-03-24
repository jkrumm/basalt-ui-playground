# Group 1: Monorepo Restructure

## What You're Doing

Transform the current single-package app at the repo root into a Bun workspaces monorepo. The app moves to `apps/web/`, two new package stubs are created (`packages/schemas/` and `packages/api/`), and the root becomes a workspace coordinator. After this group, `cd apps/web && bun run dev` must work identically to before.

This group is purely structural — no new dependencies, no new features. Focus entirely on correctness of the restructure.

---

## Research & Exploration First

1. **Read every config file at root** before touching anything: `vite.config.ts`, `tsconfig.json`, `package.json`, `eslint.config.mjs`, `server.ts` — understand every path reference
2. **List all files at root**: understand what moves vs stays
3. **Research Bun workspaces**: https://bun.sh/docs/install/workspaces — understand how `workspace:*` protocol works, how `bun install` resolves workspace packages, and how `node_modules` hoisting works
4. **Check TanStack Router CLI config**: in `vite.config.ts`, find where `routeTree.gen.ts` output path is configured — this must be correct after the move
5. **Check TanStack Start config**: find `tsr` config, `output` paths, any absolute vs relative path issues

---

## What to Implement

### 1. Create the new directory structure

```bash
mkdir -p apps/web packages/schemas/src packages/api/src
```

### 2. Move app files to `apps/web/`

Move these files/dirs from root → `apps/web/`:
- `src/` → `apps/web/src/`
- `public/` → `apps/web/public/` (if it exists)
- `vite.config.ts` → `apps/web/vite.config.ts`
- `tsconfig.json` → `apps/web/tsconfig.json`
- `index.html` → `apps/web/index.html` (if present)
- `server.ts` → `apps/web/server.ts`
- `eslint.config.mjs` → `apps/web/eslint.config.mjs`

Do NOT move: `bun.lock`, `.gitignore`, `CLAUDE.md`, `cqueue.md`, `cnotes.md`, `queue.md`, `scripts/`, `docs/`

### 3. Create `apps/web/package.json`

Rename the existing root `package.json` to `apps/web/package.json`. Change:
- `"name": "cbbi-blueprint"` → `"name": "@cbbi/web"`
- Update script paths if any reference `./src/` directly
- Add workspace dependencies (for later groups):
  ```json
  "@cbbi/schemas": "workspace:*",
  "@cbbi/api": "workspace:*"
  ```
- Keep all existing dependencies as-is

### 4. Create root `package.json`

Minimal workspace root — does NOT contain the app's dependencies:

```json
{
  "name": "cbbi-blueprint",
  "private": true,
  "type": "module",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "cd apps/web && bun run dev",
    "build": "cd apps/web && bun run build",
    "typecheck": "cd apps/web && bun run typecheck",
    "lint": "cd apps/web && bun run lint",
    "pre": "cd apps/web && bun run pre",
    "dev:api": "cd packages/api && bun run dev"
  }
}
```

### 5. Create `packages/schemas/package.json`

```json
{
  "name": "@cbbi/schemas",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@sinclair/typebox": "^0.34.48"
  },
  "devDependencies": {
    "typescript": "6.0.1-rc"
  }
}
```

Create `packages/schemas/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Create `packages/schemas/src/index.ts` (placeholder):
```ts
// Schemas will be added in Group 2
export {}
```

### 6. Create `packages/api/package.json`

```json
{
  "name": "@cbbi/api",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@cbbi/schemas": "workspace:*"
  },
  "devDependencies": {
    "typescript": "6.0.1-rc",
    "@types/node": "^22.0.0"
  }
}
```

Create `packages/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Create `packages/api/src/index.ts` (placeholder):
```ts
// Elysia app will be added in Group 4
export {}
```

### 7. Update path references in moved files

In `apps/web/tsconfig.json`: paths `"~/*": ["./src/*"]` should still work (relative to apps/web/).

In `apps/web/vite.config.ts`: verify all plugin paths and output dirs are correct. The TanStack Router `generatedRouteTree` output path should point to `./src/routeTree.gen.ts` relative to `apps/web/`.

In `apps/web/server.ts`: update the import path for the built server bundle — it may reference `./dist/server/server.js` which should still be correct relative to `apps/web/`.

### 8. Update `.gitignore`

Add at the bottom:
```
# RALPH
.ralph-tasks.json
.ralph-logs/

# Workspace packages
packages/api/data/
packages/api/node_modules/

# Web app
apps/web/dist/
apps/web/.vite/
apps/web/.output/
apps/web/.tanstack/
apps/web/node_modules/

# Environment
apps/web/.env.local
.env.local
```

### 9. Run `bun install` at workspace root

```bash
bun install
```

This regenerates `bun.lock` to include all workspace packages. Verify no errors.

### 10. Create `apps/web/.env.local`

```
VITE_API_URL=http://localhost:3001
```

---

## Validation

```bash
# From workspace root
bun install                           # must resolve all workspaces cleanly

# Verify the web app
cd apps/web && bun run typecheck      # must pass
cd apps/web && bun run lint           # must pass

# Verify the packages resolve (no code yet, just structure)
cd packages/schemas && bun run typecheck   # must pass
```

**Also verify manually**: the TanStack Router CLI should generate `apps/web/src/routeTree.gen.ts` correctly. If it doesn't, check the `tsr` configuration in `apps/web/vite.config.ts`.

---

## Commit

```
feat(monorepo): restructure to bun workspaces with apps/web and packages stubs
```

Stage ALL modified and new files. Verify `git status` looks correct before committing.

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:

```
RALPH_TASK_COMPLETE: Group 1
```
