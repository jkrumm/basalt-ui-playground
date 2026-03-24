# Group 2: Shared TypeBox Schemas Package

## What You're Doing

Populate `packages/schemas/` with all shared TypeBox schemas that will be used across both the frontend (`apps/web`) and backend (`packages/api`). This package is the single source of truth for all request/response data shapes shared between the two. After this group, `@cbbi/schemas` exports fully typed schemas and inferred TypeScript types.

---

## Research & Exploration First

1. **Read `packages/schemas/src/index.ts`** — it's a placeholder from Group 1
2. **Read `apps/web/src/routes/index.tsx`** — understand the existing `viewMode`/`sortBy` state to derive the UserPreferences shape
3. **Research TypeBox v0.34+ API**: use Context7 to query `@sinclair/typebox` for `Type.Union`, `Type.Literal`, `Type.Object`, `Type.Partial`, `Type.Static`, `Value.Default`, `Value.Check`, `Value.Errors`
4. **Check current TypeBox version**: `curl -s https://registry.npmjs.org/@sinclair/typebox/latest | python3 -c "import json,sys; print(json.load(sys.stdin)['version'])"`
5. **Verify Elysia TypeBox compatibility**: Elysia's `t` is a TypeBox superset — plain TypeBox schemas (no Elysia-specific types) work in both frontend and backend

---

## What to Implement

### 1. `packages/schemas/src/user-preferences.ts`

Define the UserPreferences shape. This type is stored in the database (Elysia side) and in localStorage (frontend side). Use the same `viewMode` and `sortBy` values that exist in the current app:

```ts
import { Type, type Static } from '@sinclair/typebox'

export const UserPreferencesSchema = Type.Object({
  theme: Type.Union(
    [Type.Literal('light'), Type.Literal('dark'), Type.Literal('system')],
    { default: 'system', description: 'UI color theme' }
  ),
  viewMode: Type.Union(
    [Type.Literal('grid'), Type.Literal('table')],
    { default: 'grid', description: 'Indicator display mode' }
  ),
  sortBy: Type.Union(
    [Type.Literal('default'), Type.Literal('value-asc'), Type.Literal('value-desc'), Type.Literal('name-asc')],
    { default: 'default', description: 'Indicator sort order' }
  ),
})

export const PatchUserPreferencesSchema = Type.Partial(UserPreferencesSchema)

export type UserPreferences = Static<typeof UserPreferencesSchema>
export type PatchUserPreferences = Static<typeof PatchUserPreferencesSchema>
```

**Important**: use `default` in TypeBox schemas — this enables `Value.Default()` on the frontend to hydrate missing fields. Keep the union members consistent with what the app actually uses.

### 2. `packages/schemas/src/auth.ts`

Schemas for sign-in and sign-up forms:

```ts
import { Type, type Static } from '@sinclair/typebox'

export const SignInSchema = Type.Object({
  email: Type.String({ format: 'email', minLength: 1 }),
  password: Type.String({ minLength: 8 }),
})

export const SignUpSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email', minLength: 1 }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
})

export type SignIn = Static<typeof SignInSchema>
export type SignUp = Static<typeof SignUpSchema>
```

### 3. `packages/schemas/src/index.ts`

Re-export everything:

```ts
export * from './user-preferences'
export * from './auth'
```

### 4. Verify `apps/web` can import from `@cbbi/schemas`

In `apps/web/package.json`, confirm `"@cbbi/schemas": "workspace:*"` is in dependencies (added in Group 1). Run `bun install` from workspace root to link it.

Add a brief test import in `apps/web/src/routes/index.tsx` or a new temp file to verify the import resolves — then remove it:

```ts
// Temporary type check — remove after verifying
import type { UserPreferences } from '@cbbi/schemas'
type _check = UserPreferences  // if this compiles, the package resolves
```

### 5. Verify `packages/api` can also import from `@cbbi/schemas`

`@cbbi/schemas` is already listed in `packages/api/package.json` dependencies (from Group 1). After `bun install`, the import should resolve.

---

## Validation

```bash
cd packages/schemas && bun run typecheck   # schemas package typechecks clean

# From workspace root
cd apps/web && bun run typecheck           # web app still passes with new workspace dep
```

---

## Commit

```
feat(schemas): add shared TypeBox schemas for user preferences and auth
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:

```
RALPH_TASK_COMPLETE: Group 2
```
