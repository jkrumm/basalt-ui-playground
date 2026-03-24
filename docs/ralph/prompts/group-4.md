# Group 4: Elysia API Backend + BetterAuth Server

## What You're Doing

Build the complete Elysia backend in `packages/api/`. This includes: Drizzle ORM + SQLite database schema, BetterAuth v1 server configuration with email/password auth, user preferences CRUD routes, and the main Elysia app that exports `type App` for Eden Treaty. After this group, `bun run dev:api` starts the backend at port 3001 with fully working auth and preferences endpoints.

---

## Research & Exploration First

1. **Read `packages/api/src/index.ts`** — placeholder from Group 1
2. **Read `packages/schemas/src/index.ts`** — the UserPreferences schema you'll use for route validation
3. **Research Elysia v1 current API** via Context7 (`/elysiajs/elysia`): focus on `new Elysia()`, `t` (TypeBox integration), `.mount()`, `.macro()`, `.resolve()`, CORS plugin, Eden Treaty type export pattern (`export type App = typeof app`)
4. **Research BetterAuth v1 + Elysia** via Context7 (`/better-auth/better-auth`): Elysia integration, SQLite adapter, email+password setup, session validation via `auth.api.getSession()`
5. **Research Drizzle ORM + better-sqlite3**: table schema definition, select/insert/update patterns with Bun
6. **Check current stable versions**:
   ```bash
   for pkg in elysia @elysiajs/cors better-auth better-sqlite3 drizzle-orm; do
     echo "$pkg: $(curl -s https://registry.npmjs.org/$pkg/latest | python3 -c "import json,sys; print(json.load(sys.stdin)['version'])")"
   done
   ```
7. **Verify `bun:sqlite` vs `better-sqlite3`**: BetterAuth has a `better-sqlite3` adapter. Check if BetterAuth also supports `bun:sqlite` directly (it may by March 2026). Use whichever is officially supported.

---

## What to Implement

### 1. Install dependencies in `packages/api`

```bash
cd packages/api && bun add elysia @elysiajs/cors @elysiajs/eden better-auth drizzle-orm
cd packages/api && bun add -d drizzle-kit better-sqlite3 @types/better-sqlite3
```

If `bun:sqlite` has an official BetterAuth adapter, prefer it over `better-sqlite3` (native Bun module, no compilation).

### 2. `packages/api/src/db.ts`

Drizzle ORM instance using SQLite:

```ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// Database file stored in packages/api/data/ (gitignored)
const sqlite = new Database('./data/cbbi.db')
export const db = drizzle(sqlite, { schema })
```

Ensure the `data/` directory is created on startup (or handle it in initialization).

### 3. `packages/api/src/schema.ts`

Drizzle table schema for user preferences. BetterAuth manages its own tables (`user`, `session`, `account`, `verification`) — you only need the app-specific table:

```ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id').primaryKey(),
  theme: text('theme', { enum: ['light', 'dark', 'system'] }).default('system').notNull(),
  viewMode: text('view_mode', { enum: ['grid', 'table'] }).default('grid').notNull(),
  sortBy: text('sort_by', { enum: ['default', 'value-asc', 'value-desc', 'name-asc'] }).default('default').notNull(),
})
```

### 4. `packages/api/src/auth.ts`

BetterAuth server configuration. Research the exact Elysia integration pattern from BetterAuth docs:

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  // No tanstackStartCookies() here — this is the Elysia server, not TanStack Start
  trustedOrigins: ['http://localhost:3000'],
})
```

**Important**: Research whether BetterAuth's Drizzle adapter handles its own table creation (users, sessions) or if you need to run migrations. Check the BetterAuth CLI: `bunx @better-auth/cli generate` and `bunx @better-auth/cli migrate`.

### 5. `packages/api/src/routes/preferences.ts`

GET and PATCH endpoints using the shared TypeBox schema from `@cbbi/schemas`:

```ts
import { Elysia } from 'elysia'
import { UserPreferencesSchema, PatchUserPreferencesSchema } from '@cbbi/schemas'
import { db } from '../db'
import { userPreferences } from '../schema'
import { eq } from 'drizzle-orm'

export const preferencesRouter = new Elysia({ prefix: '/user/preferences' })
  .get('/', async ({ userId }: { userId: string }) => {
    const existing = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    })
    // Return existing prefs or defaults
    return existing ?? {
      theme: 'system' as const,
      viewMode: 'grid' as const,
      sortBy: 'default' as const,
    }
  }, { response: UserPreferencesSchema })
  .patch('/', async ({ body, userId }: { body: unknown, userId: string }) => {
    // Upsert user preferences
    const existing = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    })
    if (existing) {
      await db.update(userPreferences).set(body as object).where(eq(userPreferences.userId, userId))
    } else {
      await db.insert(userPreferences).values({ userId, ...(body as object) })
    }
    const updated = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) })
    return updated!
  }, { body: PatchUserPreferencesSchema, response: UserPreferencesSchema })
```

**Note**: The `userId` injection needs to come from the auth middleware/macro. Research the correct Elysia pattern for injecting the validated session's `userId` into route handlers.

### 6. `packages/api/src/index.ts`

Main Elysia application:

```ts
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from './auth'
import { preferencesRouter } from './routes/preferences'
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'

// Ensure data directory exists
mkdirSync('./data', { recursive: true })

// Auth middleware macro — validates session and injects userId
const authMacro = (app: Elysia) =>
  app.macro({
    requireAuth: (enabled: boolean) => ({
      resolve: async ({ cookie, error }: { cookie: Record<string, { value: string }>, error: (code: number, msg: string) => unknown }) => {
        if (!enabled) return {}
        const session = await auth.api.getSession({
          headers: new Headers({ cookie: Object.entries(cookie).map(([k, v]) => `${k}=${v.value}`).join('; ') }),
        })
        if (!session) return error(401, 'Unauthorized')
        return { userId: session.user.id }
      },
    }),
  })

export const app = new Elysia()
  .use(cors({
    origin: 'http://localhost:3000',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }))
  // Mount BetterAuth handler — handles /api/auth/*
  .mount(auth.handler)
  .use(authMacro)
  .group('/api', app => app
    .use(preferencesRouter)
  )

export type App = typeof app

app.listen(3001, () => {
  console.log('API server running at http://localhost:3001')
})
```

**Research the correct Elysia macro/resolve pattern for session injection.** The above is a sketch — the exact API may differ. Check Elysia v1 docs for the `macro` + `resolve` pattern for authentication middleware.

### 7. Add `data/` to gitignore

Add `packages/api/data/` to the root `.gitignore`.

### 8. Run BetterAuth migrations

After the server is set up, run the BetterAuth CLI to create auth tables in the SQLite database:

```bash
cd packages/api && bunx @better-auth/cli generate
cd packages/api && bunx @better-auth/cli migrate
```

Or check if BetterAuth auto-migrates on startup with the `autoMigrate` option.

---

## Validation

```bash
cd packages/api && bun run typecheck   # must pass

# Start the API and verify endpoints respond:
cd packages/api && bun run dev &
sleep 2

# Auth endpoints should be reachable:
curl -s http://localhost:3001/api/auth/get-session   # returns null (not logged in)

# Kill background process after check
kill %1 2>/dev/null || true
```

---

## Commit

```
feat(api): add Elysia backend with BetterAuth, Drizzle SQLite, and preferences routes
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`. Include notes on: which SQLite driver was used, how BetterAuth migrations were handled, and the exact Elysia session injection pattern used.

```
RALPH_TASK_COMPLETE: Group 4
```
