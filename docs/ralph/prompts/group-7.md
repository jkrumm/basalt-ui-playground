# Group 7: EdenTreaty + Auth Client

## What You're Doing

Wire up the type-safe API client (EdenTreaty), frontend auth flow (sign in/up/out pages), protected route layout, and SSR session resolution. This is the E2E green checkpoint — after this group, the full auth round-trip must work.

---

## Research & Exploration First

1. Research: EdenTreaty latest API — is it `treaty` from `@elysiajs/eden` or `edenTreaty`? The API may have changed in v2.
2. Research: Does EdenTreaty type inference work across Bun workspace boundaries? Test that `import type { App } from "@cbbi/api"` gives real route autocomplete, not `any`.
3. Research: better-auth React client latest API — `createAuthClient` from `better-auth/react`
4. Research: TanStack Start `createServerFn` latest patterns for SSR data loading
5. Research: TanStack Start `createIsomorphicFn` — does it still exist? With Elysia as a separate process, SSR always uses HTTP (no in-process trick needed).
6. Read existing auth client, server functions, and protected route patterns from current codebase
7. Read the demo project's frontend auth setup

---

## What to Implement

### 1. Add Dependencies

Add `@elysiajs/eden` to `apps/web/package.json`.

### 2. src/lib/api.ts — EdenTreaty Client

```typescript
import { treaty } from "@elysiajs/eden";
import type { App } from "@cbbi/api";

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_URL ?? "http://localhost:7713";
  }
  return ""; // Same-origin — Vite proxy in dev, reverse proxy in prod
}

export const api = treaty<App>(getBaseUrl(), {
  fetch: { credentials: "include" },
});
```

**VERIFY:** That the `App` type carries full route information across the workspace boundary. If autocomplete doesn't work, may need to export the type differently from `@cbbi/api`.

### 3. src/lib/auth-client.ts — BetterAuth React Client

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // No baseURL needed — same-origin via proxy
});
```

### 4. src/lib/auth.functions.ts — SSR Session Resolution

```typescript
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  const response = await fetch(
    `${process.env.API_INTERNAL_URL ?? "http://localhost:7713"}/api/auth/get-session`,
    {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    }
  );
  if (!response.ok) return null;
  return response.json();
});
```

### 5. src/routes/sign-in.tsx — Sign In Page

Blueprint-styled sign in form with email/password. Use `authClient.signIn.email()` on submit. Redirect to `/` on success. Show error messages on failure.

### 6. src/routes/sign-up.tsx — Sign Up Page

Blueprint-styled sign up form. Use `authClient.signUp.email()`. Redirect after success.

### 7. src/routes/_protected.tsx — Protected Layout

```typescript
export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn();
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
    return { user: session.user };
  },
  component: () => <Outlet />,
});
```

### 8. src/routes/_protected/settings.tsx — Settings Page

Simple settings page that displays user info from the route context. Proves the protected route works.

### 9. Navigation Updates

Add sign in/out buttons to the root layout. Show user name when authenticated. Sign out redirects to `/`.

### 10. Theme Persistence (Cookie-Based)

Implement theme toggle (dark/light) that persists via cookie so SSR renders the correct theme. Use Jotai atom backed by cookie storage.

---

## Validation — E2E Green Checkpoint

This is a critical checkpoint. Validate the full auth round-trip:

```bash
# Start both apps
make dev &
# Wait for both to start

# 1. Seed demo user (if not already done)
make db-seed

# 2. Visit http://localhost:7712 — landing page renders
curl http://localhost:7712

# 3. Sign in as demo user via API (through Vite proxy)
curl -c cookies.txt -X POST http://localhost:7712/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}'

# 4. Access protected route with session cookie
curl -b cookies.txt http://localhost:7712/settings
# Should NOT redirect to sign-in

# 5. Access protected API route
curl -b cookies.txt http://localhost:7712/api/user/me
# Should return user object

# Clean up
rm cookies.txt
make kill

bun run typecheck
```

---

## Commit

```
feat(web): add EdenTreaty client, auth flow, and protected routes
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 7
```
