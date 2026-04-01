# Group 13: Final Polish + Documentation

## What You're Doing

Final validation of everything, fix any remaining issues, update all CLAUDE.md files to reflect the actual implementation, and write developer documentation as MDX pages in the docs collection.

---

## Research & Exploration First

1. Read all three CLAUDE.md files (root, apps/web, apps/api) and compare against actual implementation
2. Read `docs/ralph/RALPH_NOTES.md` to understand gotchas discovered during implementation
3. Run `make check` and fix any issues
4. Read the current state of all route files to verify everything is wired correctly

---

## What to Implement

### 1. Full Validation Pass

Run each validation scenario, killing ports between each:

**Dev mode:**
```bash
make kill
make dev
# Wait for both apps to start
curl http://localhost:7712                    # Landing page renders
curl http://localhost:7713/api/health         # API health check
# Test auth flow through Vite proxy
make kill
```

**Production mode (local):**
```bash
make kill
bun run build
make start
curl http://localhost:7712                    # SSR renders
curl http://localhost:7713/api/health         # API works
make kill
```

**Docker mode:**
```bash
make docker-build
make docker-up
sleep 15
curl http://localhost:7712                    # Web in Docker
curl http://localhost:7713/api/health         # API in Docker
make docker-down
```

Fix any issues discovered during validation.

### 2. Auth Flow Verification

```bash
make dev &

# Seed demo user
make db-seed

# Sign in
curl -c cookies.txt -X POST http://localhost:7712/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}'

# Access protected route
curl -b cookies.txt http://localhost:7712/settings

# Sign out
curl -b cookies.txt -X POST http://localhost:7712/api/auth/sign-out

rm cookies.txt
make kill
```

### 3. Content Pipeline Verification

```bash
bun run build
# Verify prerendered HTML exists for:
# - /blog (listing)
# - /docs (listing)
# - Individual blog posts
# - Individual doc pages
```

### 4. Quality Pipeline

```bash
make check                                    # Must pass completely
# fmt + lint + typecheck + test
```

### 5. Update CLAUDE.md Files

#### Root CLAUDE.md
- Verify monorepo structure matches reality
- Update Makefile commands if any changed
- Add any new conventions discovered
- Document env var strategy as implemented
- Document port configuration

#### apps/web/CLAUDE.md
- TanStack Start setup as actually implemented (plugin import, config)
- React Compiler integration (single-pass vs two-pass)
- Blueprint v6 + Tailwind v4 CSS setup
- Routing patterns (file-based, protected, content)
- EdenTreaty client usage
- Jotai conventions
- HyperDX browser SDK setup
- Analytics conventions

#### apps/api/CLAUDE.md
- Elysia app structure as actually implemented
- Auth middleware pattern (macro API as discovered)
- Drizzle v1 beta patterns (correct API)
- Route module pattern
- OTEL setup
- Env validation

### 6. Write Developer Documentation (MDX)

Create MDX pages in `apps/web/src/content/docs/`:

#### docs/stack-overview.mdx
- Tech stack table with actual versions used
- Architecture diagram (text-based)
- Key design decisions and rationale

#### docs/getting-started.mdx
- Prerequisites (Bun, Postgres, etc.)
- Quick start guide (`bun install`, DB setup, `make dev`)
- Demo user credentials
- Port configuration

#### docs/api-architecture.mdx
- Elysia app structure
- Route modules pattern
- Auth middleware macro
- EdenTreaty type export

#### docs/auth-patterns.mdx
- BetterAuth integration
- SSR session resolution
- Protected routes
- Auth client usage

#### docs/observability.mdx
- OTEL backend setup
- HyperDX browser SDK
- Trace linking (browser → SSR → API)
- ClickStack self-hosted setup

### 7. Clean Git History

Review recent commits. If there are any trivial fix commits from RALPH groups, note them but don't rebase (the user will handle that with `/git-cleanup` before PR).

---

## Validation

Everything must pass:

```bash
make check                     # fmt + lint + typecheck + test — all green
make dev                       # both apps start
make kill
bun run build                  # build succeeds
make docker-build              # Docker image builds
```

---

## Commit

```
docs: finalize CLAUDE.md files and developer documentation
```

---

## Done

Append final learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 13
```
