# Group 3: Database + Drizzle v1 Beta

## What You're Doing

Add Drizzle v1 beta with Postgres, create the database schema (auth tables + user preferences), generate and apply migrations. This gives the API a working database layer.

---

## Research & Exploration First

1. Research: Drizzle v1 beta latest version on npm — check `drizzle-orm@beta` and `drizzle-kit@beta` tags
2. Research: Drizzle v1 beta API changes — the `drizzle({client, schema})` object form (NOT positional)
3. Research: `postgres` (postgres.js) latest version and connection API
4. Read existing `scripts/setup-cbbi-db.sql` to understand DB setup
5. Read existing schema files if any remain from old codebase for reference patterns
6. Research: `drizzle-kit` v1 beta generate/migrate CLI commands
7. Research: `pgSchema` usage for schema isolation in Drizzle v1

---

## What to Implement

### 1. Add Dependencies

Add to `apps/api/package.json`:
- `drizzle-orm` (v1 beta — use `@beta` tag)
- `drizzle-kit` (v1 beta — dev dep, use `@beta` tag)
- `postgres` (postgres.js driver)

### 2. src/db.ts — Drizzle v1 Instance

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.ts";
import { env } from "./env.ts";

const client = postgres(env.DATABASE_URL);

// CRITICAL: v1 beta uses object form, NOT positional
export const db = drizzle({ client, schema });
```

### 3. src/schema/auth-schema.ts — BetterAuth Tables

Use `pgSchema("basalt_ui_playground")` for schema isolation. Create the tables BetterAuth needs:
- `user` — id, name, email, emailVerified, image, createdAt, updatedAt
- `session` — id, expiresAt, token, ipAddress, userAgent, userId
- `account` — id, accountId, providerId, userId, accessToken, refreshToken, etc.
- `verification` — id, identifier, value, expiresAt, createdAt, updatedAt

Reference the existing schema files and BetterAuth docs for exact column requirements.

### 4. src/schema/user-preferences.ts — User Preferences Table

```typescript
export const userPreferences = dbSchema.table("user_preferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("dark"),
  // ... other preferences from existing schemas
});
```

### 5. src/schema/index.ts — Barrel Export

Export all tables from a single index file.

### 6. drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  // ... connection config
});
```

Research the exact drizzle-kit v1 beta config format — it may differ from v0.

### 7. Generate and Fix Migration

```bash
cd apps/api && bunx drizzle-kit generate
```

Then manually fix the initial migration SQL:
- Change `CREATE SCHEMA` to `CREATE SCHEMA IF NOT EXISTS`
- Verify all table creation statements

### 8. src/seed.ts — Demo User Seeding

Create a seed script that inserts a demo user: `demo@example.com` / `demo1234`. Use `Bun.password.hash()` for the password. This will be wired to `make db-seed`.

Note: The seed script needs BetterAuth's password hashing to match — use the same hasher that BetterAuth will use (Group 4). For now, use `Bun.password.hash()` with Argon2id and document that it must match BetterAuth's config.

### 9. Wire into Makefile

- `make db-setup` → `cd apps/api && bunx drizzle-kit migrate`
- `make db-generate` → `cd apps/api && bunx drizzle-kit generate`
- `make db-seed` → `cd apps/api && bun run src/seed.ts`
- `make db-studio` → `cd apps/api && bunx drizzle-kit studio`

### 10. Update scripts/setup-cbbi-db.sql

Ensure it creates the right database, user, and grants. The schema name is `basalt_ui_playground`. The script should:
- Create the database if not exists
- Create the user if not exists
- Grant necessary permissions (including `CREATE` on the database for drizzle-kit)

---

## Validation

```bash
# Assumes Postgres is running locally
psql -h localhost -U postgres -f scripts/setup-cbbi-db.sql
make db-setup                   # applies migration
bun run typecheck               # all workspaces pass
# Verify tables exist:
psql -h localhost -U cbbi -d cbbi -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'basalt_ui_playground';"
```

---

## Commit

```
feat(db): add Drizzle v1 beta schema, migrations, and seed script
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 3
```
