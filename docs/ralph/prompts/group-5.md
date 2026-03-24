# Group 5: BetterAuth Client + Auth Pages

## What You're Doing

Wire BetterAuth into the TanStack Start frontend. This includes: the `authClient` pointing to the Elysia backend, sign-in and sign-up pages using Blueprint components, a `/_protected.tsx` pathless layout that guards authenticated routes, auth-aware navigation in the root layout, and server functions for session access. After this group, users can register, sign in, sign out, and protected routes redirect unauthenticated users to `/sign-in`.

---

## Research & Exploration First

1. **Read `apps/web/src/routes/__root.tsx`** — existing root layout, nav structure, current context providers
2. **Read `apps/web/src/routes/index.tsx`** — understand the home route structure
3. **Read `packages/api/src/auth.ts`** — the server-side BetterAuth config to know what plugins are active
4. **Research BetterAuth client + TanStack Start** via Context7 (`/better-auth/better-auth`): focus on `createAuthClient`, `useSession()`, `signIn.email()`, `signUp.email()`, `signOut()`, and how to access session in TanStack Start `createServerFn`
5. **Research TanStack Router pathless layout routes**: how `/_protected.tsx` works with `beforeLoad`, `redirect()`, and `useRouteContext()` to pass the user down
6. **Research TanStack Start `createServerFn`**: how `getRequestHeaders()` works for forwarding cookies to the Elysia BetterAuth endpoint
7. **Verify CORS with credentials**: test that `authClient.signIn.email()` from localhost:3000 correctly sends cookies to localhost:3001. The Elysia CORS config should have `credentials: true` and `origin: 'http://localhost:3000'`

---

## What to Implement

### 1. Install BetterAuth client in `apps/web`

```bash
cd apps/web && bun add better-auth
```

Only the client-side code is needed in `apps/web` — the server is in `packages/api`.

### 2. `apps/web/src/lib/auth-client.ts`

```ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
})

// Re-export typed hooks for convenience
export const { useSession, signIn, signUp, signOut } = authClient
```

Research the exact `better-auth/react` export API — it may be `better-auth/client` with a React plugin. Check the BetterAuth docs.

### 3. `apps/web/src/lib/auth.functions.ts`

Server functions for session access in TanStack Start route loaders:

```ts
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  // Forward cookies from the incoming request to the BetterAuth API on Elysia
  const response = await fetch(
    `${process.env.API_URL ?? 'http://localhost:3001'}/api/auth/get-session`,
    { headers: { cookie: headers.cookie ?? '' } }
  )
  if (!response.ok) return null
  return response.json() as Promise<{ user: { id: string; name: string; email: string } } | null>
})
```

**Note**: Research whether BetterAuth's client library (`authClient.getSession()`) can be called from server functions by forwarding headers, or if a direct fetch is cleaner. Use whichever approach BetterAuth's TanStack Start docs recommend.

### 4. `apps/web/src/routes/_protected.tsx`

Pathless layout route that protects all nested routes:

```tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getSessionFn } from '~/lib/auth.functions'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn()
    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
    return { user: session.user }
  },
  component: () => <Outlet />,
})
```

### 5. `apps/web/src/routes/sign-in.tsx`

Sign-in page using Blueprint components. Keep it simple — Blueprint `Card`, `FormGroup`, `InputGroup`, `Button`. The form state can use simple `useState` here since it is component-local (a form does not need global atoms). Wire the submit to `authClient.signIn.email()`:

```tsx
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '~/lib/auth-client'
import { Type } from '@sinclair/typebox'

// Keep sign-in route simple — validateSearch for redirect param
export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/',
  }),
  component: SignInPage,
})

function SignInPage() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await authClient.signIn.email({ email, password })
    if (result.error) {
      setError(result.error.message ?? 'Sign in failed')
    } else {
      navigate({ to: redirect })
    }
    setLoading(false)
  }

  return (
    // Blueprint Card layout with FormGroup + InputGroup + Button
    // Use Blueprint's Intent.DANGER for error display
    <form onSubmit={handleSubmit}>
      {/* Blueprint form components here */}
    </form>
  )
}
```

Use appropriate Blueprint v6 components: `Card`, `FormGroup`, `InputGroup` (type="email", type="password"), `Button` (type="submit", loading prop), `Callout` (intent="danger") for errors.

### 6. `apps/web/src/routes/sign-up.tsx`

Similar structure to sign-in but with name field and using `authClient.signUp.email()`. After successful sign-up, redirect to `/sign-in` or directly to home.

### 7. Update `apps/web/src/routes/__root.tsx` — auth-aware navigation

Add a user menu to the root layout navigation using `authClient.useSession()`:

```tsx
import { useSession } from '~/lib/auth-client'

function NavUserMenu() {
  const { data: session, isPending } = useSession()

  if (isPending) return <Spinner size={16} />
  if (!session) return <Button minimal text="Sign in" icon={<LogIn />} onClick={() => navigate({ to: '/sign-in' })} />

  return (
    <Popover content={
      <Menu>
        <MenuItem text="Settings" icon={<Settings />} onClick={() => navigate({ to: '/settings' })} />
        <MenuDivider />
        <MenuItem text="Sign out" icon={<LogOut />} intent="danger" onClick={() => authClient.signOut()} />
      </Menu>
    }>
      <Button minimal text={session.user.name} icon={<User />} rightIcon={<ChevronDown />} />
    </Popover>
  )
}
```

Use Blueprint Popover, Menu, MenuItem. Use Tabler icons for the icon props (put in `leftElement`, not `leftIcon` — per ESLint rule).

---

## Validation

```bash
cd apps/web && bun run typecheck   # no type errors
cd apps/web && bun run lint        # no lint errors

# Start both servers and test manually:
# Terminal 1: cd packages/api && bun run dev
# Terminal 2: cd apps/web && bun run dev
# Then verify: sign-up creates a user, sign-in works, protected redirect works
```

---

## Commit

```
feat(auth): add BetterAuth client, sign-in/sign-up pages, and protected route layout
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`. Note: how cookie cross-origin worked (or didn't), which BetterAuth client API was used, any CORS surprises.

```
RALPH_TASK_COMPLETE: Group 5
```
