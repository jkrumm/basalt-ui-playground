# Group 4: BetterAuth + Elysia Integration

## What You're Doing

Wire BetterAuth into the Elysia API with the `.mount()` pattern, create an auth middleware macro for protected routes, implement user routes (me, preferences), and make the seed script work with BetterAuth's password hashing.

---

## Research & Exploration First

1. Research: better-auth latest version on npm and Elysia integration docs (better-auth.com)
2. Research: Elysia `.mount()` pattern — how does it interact with the app's `prefix`? Does `app.mount("/api/auth", handler)` with `prefix: "/api"` result in `/api/api/auth`? The demo project uses NO prefix on root Elysia.
3. Research: Elysia macro system for auth guards — the macro API changed between 1.0 and 1.4. Read the exact API for the installed version.
4. Research: better-auth Drizzle adapter — verify compatibility with Drizzle v1 beta
5. Research: better-auth OpenAPI plugin setup
6. Read the demo project's auth setup at `/Users/johannes.krumm/Downloads/tanstack-start-elysia-better-auth-bun-main`
7. Read the existing `apps/api/src/auth.ts` and middleware from the current codebase for pattern reference

---

## What to Implement

### 1. Add Dependencies

Add `better-auth` to `apps/api/package.json`.

### 2. src/auth.ts — BetterAuth Instance

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { db } from "./db.ts";
import { env } from "./env.ts";
import * as schema from "./schema/index.ts";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.ALLOWED_ORIGIN],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (pw) => Bun.password.hash(pw),
      verify: ({ password, hash }) => Bun.password.verify(password, hash),
    },
  },
  plugins: [openAPI()],
  rateLimit: {
    window: 60,
    max: 10,
    customRules: { "/sign-in/email": { window: 60, max: 5 } },
  },
});
```

### 3. Mount Auth in app.ts

**CRITICAL:** Research the prefix + mount path interaction first. The safe approach:
- If prefix is `/api`: mount at `/auth` (results in `/api/auth/*`)
- If no prefix: mount at `/api/auth`

Test that `curl http://localhost:7713/api/auth/ok` returns a response from BetterAuth.

### 4. src/middleware/auth.ts — Auth Middleware Macro

```typescript
import { Elysia } from "elysia";
import { auth } from "../auth.ts";

export const authMiddleware = new Elysia({ name: "auth" })
  .macro({
    auth: {
      async resolve({ headers, error }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return error(401, "Unauthorized");
        return { user: session.user, userId: session.user.id };
      },
    },
  });
```

**VERIFY:** The macro API shape for Elysia 1.4.x. The resolve function signature may differ.

Usage pattern: `.use(authMiddleware).guard({ auth: true })`

### 5. src/routes/user.ts — User Routes (Protected)

```typescript
export const userRoutes = new Elysia({ prefix: "/user" })
  .use(authMiddleware)
  .guard({ auth: true })
  .get("/me", ({ user }) => user)
  .get("/preferences", async ({ userId }) => {
    // fetch from DB
  })
  .patch("/preferences", async ({ userId, body }) => {
    // update in DB
  });
```

For body validation on PATCH, use TypeBox (`t.Object()`) or `@elysiajs/zod` — research which works best.

### 6. Update src/seed.ts

Ensure the seed script uses the same password hashing as BetterAuth (`Bun.password.hash`). Create a complete user record that BetterAuth expects (user + account rows).

### 7. Wire into app.ts

Add `userRoutes` to the main app chain: `.use(userRoutes)`.

### 8. Update CORS

Scope CORS to routes that need it (user routes + auth), or keep it global if simpler. Ensure `credentials: true` is set for cookie-based auth.

---

## Validation

```bash
# Start the API
bun run --cwd apps/api src/index.ts &

# Seed the demo user
make db-seed

# Test auth flow
curl -X POST http://localhost:7713/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}'
# Should return session token/cookie

# Test protected route (with cookie from sign-in)
curl http://localhost:7713/api/user/me -H "Cookie: <session-cookie>"
# Should return user object

# Kill server
kill %1

bun run typecheck
```

---

## Commit

```
feat(auth): integrate BetterAuth with Elysia mount, auth macro, and user routes
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 4
```
