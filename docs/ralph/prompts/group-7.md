# Group 7: TanStack Form v1 + Blueprint Integration

## What You're Doing

Install TanStack Form v1, create the `typeboxValidator` adapter (TypeBox → TanStack Form), and build reusable Blueprint-wired form field components using `createFormHook`. After this group: every form in the app can use `useAppForm()` with a TypeBox schema and pre-wired Blueprint `InputGroup`, `FormGroup`, `Checkbox`, and `Select` field components — with zero per-form Blueprint wiring boilerplate.

---

## Research & Exploration First

1. **Read `apps/web/src/routes/sign-in.tsx`** and `sign-up.tsx` — the existing forms that can be upgraded in this group
2. **Research TanStack Form v1** via Context7 (`/tanstack/form`): focus on `useForm`, `createFormHook`, `form.Field`, `field.state.value`, `field.handleChange`, `field.handleBlur`, `field.state.meta.errors`, `form.handleSubmit`
3. **Research `createFormHook`**: this is the key API that lets you create custom, project-specific form and field components. Understand how to bind Blueprint components to it
4. **Research TypeBox Standard Schema status**: TypeBox does NOT implement Standard Schema as of March 2026. Verify this is still true by checking `@sinclair/typebox` changelog. If it now implements Standard Schema, skip the adapter and use `validators: { onChange: Schema }` directly
5. **Read `packages/schemas/src/auth.ts`** — `SignInSchema` and `SignUpSchema` that the sign-in/sign-up forms will validate against
6. **Research Blueprint v6 controlled components**: `InputGroup` (value, onChange, intent), `FormGroup` (helperText, intent, label), `Checkbox` (checked, onChange), `HTMLSelect` (value, onChange)
7. **Check current TanStack Form version**: `curl -s https://registry.npmjs.org/@tanstack/react-form/latest | python3 -c "import json,sys; print(json.load(sys.stdin)['version'])"`

---

## What to Implement

### 1. Install TanStack Form in `apps/web`

```bash
cd apps/web && bun add @tanstack/react-form
```

### 2. `apps/web/src/lib/validation.ts`

TypeBox adapter for TanStack Form field validators. This is the bridge between the two:

```ts
import { type TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

/**
 * Creates a TanStack Form field validator from a TypeBox schema.
 * TypeBox does not implement Standard Schema, so this adapter bridges the gap.
 *
 * Usage:
 *   form.Field({ validators: { onChange: typeboxValidator(Type.String({ minLength: 1 })) } })
 */
export function typeboxValidator<T extends TSchema>(schema: T) {
  return ({ value }: { value: unknown }) => {
    const withDefaults = Value.Default(schema, structuredClone(value) ?? '')
    if (Value.Check(schema, withDefaults)) return undefined
    return [...Value.Errors(schema, withDefaults)]
      .map(e => e.message)
      .join('; ')
  }
}

/**
 * Creates a whole-form validator from a TypeBox object schema.
 * Use this in useForm({ validators: { onChange: typeboxFormValidator(Schema) } })
 */
export function typeboxFormValidator<T extends TSchema>(schema: T) {
  return ({ value }: { value: unknown }) => {
    const withDefaults = Value.Default(schema, structuredClone(value) ?? {})
    if (Value.Check(schema, withDefaults)) return undefined
    const errors = [...Value.Errors(schema, withDefaults)]
    // Return field-level errors for TanStack Form to map to fields
    return errors.reduce((acc, err) => {
      const field = err.path.replace(/^\//, '') || 'root'
      acc[field] = err.message
      return acc
    }, {} as Record<string, string>)
  }
}
```

### 3. `apps/web/src/lib/form.ts`

Use `createFormHook` to create a project-specific form hook with pre-wired Blueprint field components:

```ts
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
// Blueprint imports
import { FormGroup, InputGroup, Checkbox, HTMLSelect } from '@blueprintjs/core'
import type { Intent } from '@blueprintjs/core'

// Create the form contexts — required by createFormHook
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

// TextField: Blueprint InputGroup wired to a TanStack Form field
function TextField({
  label,
  type = 'text',
  placeholder,
  helperText,
}: {
  label: string
  type?: React.InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
  helperText?: string
}) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0
  const intent: Intent = hasError ? 'danger' : 'none'

  return (
    <FormGroup
      label={label}
      intent={intent}
      helperText={hasError ? field.state.meta.errors.join('; ') : helperText}
    >
      <InputGroup
        type={type}
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        intent={intent}
        placeholder={placeholder}
      />
    </FormGroup>
  )
}

// SelectField: Blueprint HTMLSelect wired to a form field
function SelectField<T extends string>({
  label,
  options,
}: {
  label: string
  options: { value: T; label: string }[]
}) {
  const field = useFieldContext<T>()

  return (
    <FormGroup label={label}>
      <HTMLSelect
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value as T)}
        onBlur={field.handleBlur}
        options={options}
      />
    </FormGroup>
  )
}

// CheckboxField: Blueprint Checkbox wired to a form field
function CheckboxField({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  return (
    <Checkbox
      label={label}
      checked={field.state.value}
      onChange={e => field.handleChange(e.target.checked)}
    />
  )
}

// The project-level form hook — use this instead of raw useForm everywhere
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    SelectField,
    CheckboxField,
  },
  formComponents: {},
})
```

**Research `createFormHook` carefully** — the API sketch above is based on the TanStack Form v1 docs but may differ. Check the exact signature for `createFormHookContexts` and `createFormHook`, especially how field components receive the field API.

### 4. Upgrade sign-in and sign-up pages to use `useAppForm`

Replace the raw `useState` form handling in `apps/web/src/routes/sign-in.tsx` and `sign-up.tsx` with `useAppForm` + `typeboxFormValidator`:

```tsx
import { useAppForm } from '~/lib/form'
import { typeboxFormValidator } from '~/lib/validation'
import { SignInSchema } from '@cbbi/schemas'

function SignInPage() {
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: typeboxFormValidator(SignInSchema) },
    onSubmit: async ({ value }) => {
      const result = await authClient.signIn.email(value)
      // handle result
    },
  })

  return (
    <form onSubmit={e => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field name="email">
        {(field) => <field.TextField label="Email" type="email" />}
      </form.Field>
      <form.Field name="password">
        {(field) => <field.TextField label="Password" type="password" />}
      </form.Field>
      <Button type="submit" loading={form.state.isSubmitting} intent="primary" text="Sign in" />
    </form>
  )
}
```

Adjust the API to match what TanStack Form v1 actually exposes. The goal is: zero raw Blueprint/state wiring in the form component body — all of that lives in `form.ts`.

---

## Validation

```bash
cd apps/web && bun run typecheck   # no type errors — form field types must infer correctly
cd apps/web && bun run lint        # clean — no useMemo/useCallback (Compiler handles it)
```

**Manual check**: try submitting the sign-in form with invalid data — Blueprint error states (red intent) should appear. Try with valid data — no errors.

---

## Commit

```
feat(forms): add TanStack Form v1 with TypeBox adapter and Blueprint field components
```

---

## Done

Append learning notes. Note: the actual `createFormHook` API found in docs, whether `typeboxFormValidator` worked for field-level error mapping, and any TanStack Form + React Compiler compatibility notes.

```
RALPH_TASK_COMPLETE: Group 7
```
