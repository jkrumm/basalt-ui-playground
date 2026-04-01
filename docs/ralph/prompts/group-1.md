# Group 1: Bun Monorepo Foundation

## What You're Doing

Set up a clean Bun workspace with TypeScript 6, shared schemas, Makefile, and basic formatting/linting. This is the skeleton — everything else builds on it. Delete all existing source files and start fresh.

---

## Research & Exploration First

1. Read the existing `package.json`, `tsconfig.json`, `pnpm-workspace.yaml` to understand current structure
2. Read existing `packages/schemas/src/` files to understand schemas to port
3. Read existing `.gitignore` and `.env` / `.env.example`
4. Research: Bun workspace docs (bunfig.toml options, `workspace:*` protocol) via Context7 or Tavily
5. Research: TypeScript 6.0 tsconfig options — new flags, `--stableTypeOrdering` for TS7 prep
6. Research: Zod v4 API changes from v3 (standalone validators, new patterns)
7. Research: oxfmt latest CLI usage and config format (`.oxfmtrc` or similar)
8. Research: oxlint latest config format (`oxlint.json`, rule categories)
9. Read existing `scripts/setup-cbbi-db.sql` — keep as-is

---

## What to Implement

### 1. Clean the repo

Delete everything EXCEPT:
- `.git/` (version control)
- `.claude/` (worktree config)
- `CLAUDE.md` (project instructions — will be rewritten)
- `scripts/setup-cbbi-db.sql` (database setup)
- `docs/ralph/` (this RALPH loop)
- `docs/TDD-RALPH-HANDOFF.md` and `docs/TDD-DEVELOPER-REFERENCE.md`
- `.gitignore` (will be updated)

### 2. Root package.json

```json
{
  "name": "basalt-ui-playground",
  "private": true,
  "type": "module",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "...",
    "dev:web": "...",
    "dev:api": "...",
    "build": "...",
    "start": "...",
    "typecheck": "bun run --filter '*' typecheck",
    "fmt": "...",
    "lint": "...",
    "check": "..."
  }
}
```

Use `bun run --filter` for workspace-wide scripts. Research the exact Bun workspace script patterns.

### 3. bunfig.toml

Bun workspace configuration. Research what options are available and useful.

### 4. Root tsconfig.json

TypeScript 6.0, strict mode, ES2025 target, bundler module resolution, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`. Research `--stableTypeOrdering` flag.

### 5. packages/schemas/

Port from existing `packages/schemas/src/`:
- `user.ts` — user schema
- `user-preferences.ts` — user preferences schema
- `auth.ts` — auth-related schemas
- `index.ts` — barrel export

Update to Zod v4 API if needed. Add `package.json` with name `@cbbi/schemas`, `tsconfig.json` extending root.

### 6. Makefile

```makefile
.PHONY: dev start build check fmt lint typecheck test clean db-setup db-seed kill

dev: kill
	# Start both apps concurrently (placeholder until apps exist)

kill:
	# Kill processes on 7712/7713

check: fmt lint typecheck test

fmt:
	# oxfmt

lint:
	# oxlint (+ eslint once configured)

typecheck:
	bun run typecheck

test:
	# placeholder

db-setup:
	bun run db:setup

db-generate:
	bun run db:generate

db-seed:
	bun run db:seed

db-studio:
	bun run db:studio
```

### 7. scripts/kill-ports.sh

Kill processes on ports 7712 and 7713. Make executable.

### 8. Environment files

- `.env` — committable non-secret defaults (ports, local URLs, service names)
- `.env.example` — reference for all variables with placeholder values

### 9. .gitignore

Update to cover:
- `node_modules/`, `dist/`, `.env.local`, `*.local`
- `.ralph-tasks.json`, `.ralph-logs/`
- `.tanstack/`, `.content-collections/`, `.vite/`, `.output/`
- `drizzle/meta/` (Drizzle migration metadata)
- `bun.lock` is NOT ignored (Bun's lockfile should be committed)

### 10. oxlint.json + .oxfmtrc

Basic oxlint config with sensible rule categories enabled. Basic oxfmt config. Research the exact format for both.

### 11. Root CLAUDE.md

Rewrite with the target monorepo structure, Bun commands, port config, env strategy, and conventions. Keep it accurate for Group 1 state (no web/api apps yet).

---

## Validation

```bash
bun install                     # must succeed
bun run typecheck               # schemas must pass
bun run fmt                     # formatting check must work
bun run lint                    # lint check must work
```

---

## Commit

```
feat(workspace): initialize Bun monorepo with TS6, schemas, and quality tooling
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 1
```
