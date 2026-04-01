# RALPH Notes — Bun Monorepo Reboot

Per-group learning notes. Each group appends its section after completion.

---

## Group 1: Bun Monorepo Foundation

### What was implemented

Initialized the Bun workspace with TypeScript 6.0, `@cbbi/schemas` package (Zod v4 schemas ported),
Makefile, kill-ports script, env files, oxlint + oxfmt tooling, and a rewritten root CLAUDE.md
reflecting the new stack.

### Deviations from prompt

- `bunfig.toml` kept minimal — Bun reads `workspaces` from `package.json`, the toml only needs
  `[install.cache]` for shared cache config. No `workspace = true` flag needed (it's implied by
  the `workspaces` array in package.json).
- `"type": "module"` removed from root `package.json` — oxfmt re-ordered the keys but kept it;
  field ordering is cosmetic.
- Both `fmt` and `lint` scripts are scoped to `packages/ apps/` rather than `.` — running either
  on `.` causes them to follow bun's install cache symlinks in `node_modules/` and report
  thousands of false positives. The `.oxlintignore` file was also added as a belt-and-suspenders
  measure for tools that discover files themselves.
- `--deny-warnings` added to `oxlint` invocation to fail CI on warnings (cleaner signal).
- `--stableTypeOrdering` not added to tsconfig — it's a TS7 diagnostic tool with 25% perf cost,
  not useful at this stage.

### Gotchas & surprises

- oxfmt and oxlint both follow bun's symlinked `node_modules/` into `~/.bun/install/cache/` when
  given `.` as the path. The fix is to scope the invocation to explicit source directories.
- `bun.lock` should be committed (not ignored) — the old `.gitignore` incorrectly ignored it.
  Fixed.
- oxfmt reformatted `CLAUDE.md` tables (padded columns) and `package.json` (added newlines,
  reordered `type` field after `workspaces`). These are cosmetic and correct.

### Security notes

- `.env` contains only non-secret defaults (ports, local URLs, `HYPERDX_API_KEY=dev`).
- All real secrets documented in `.env.example` with `<placeholder>` values — none committed.

### Tests added

None — no test infrastructure yet at this stage.

### Future improvements

- ESLint flat config (`eslint.config.ts`) deferred to a later group once web/API apps exist and
  framework-specific rules are needed (Blueprint, TanStack Router, React Compiler).
- `make dev` uses `&` backgrounding which doesn't cleanly propagate Ctrl+C. Consider `concurrently`
  or a Procfile approach in Group 2.
